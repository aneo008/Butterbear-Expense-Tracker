// Web implementation of the data layer. Metro resolves this over queries.ts on
// web. It keeps everything in memory and persists to localStorage on every
// mutation — no SQLite/WASM, so it works on static hosts like GitHub Pages.
import { Category, DEFAULT_CATEGORIES } from '../constants/categories';
import { todayISO, addDaysISO } from '../lib/date';
import { coinsForLog, dailyCap, chestFor, WELCOME_GRANT } from '../lib/streak';
import {
  Expense,
  GameState,
  CategoryBreakdownRow,
  BudgetRow,
  Allocation,
  AllocationGroup,
  SalaryRow,
  IncomeEvent,
  IncomeOverride,
  AllocationHistoryRow,
  GameStateFull,
  Snapshot,
  DevPatch,
} from './types';
import { Slot, EquippedMap } from '../constants/storeItems';

export type { Expense, GameState, CategoryBreakdownRow, BudgetRow, Allocation, AllocationGroup, SalaryRow, IncomeEvent, IncomeOverride, AllocationHistoryRow, GameStateFull, Snapshot } from './types';

const STORAGE_KEY = 'butter.db.v1';

type DB = {
  expenses: Expense[];
  categories: Category[];
  game_state: GameStateFull;
  budget: BudgetRow;
  allocations: Allocation[];
  allocation_groups: AllocationGroup[];
  salary_history: SalaryRow[];
  income_events: IncomeEvent[];
  income_overrides: IncomeOverride[];
  allocation_history: AllocationHistoryRow[];
  app_meta: Record<string, string>;
};

function defaultGameState(): GameStateFull {
  return {
    streak_count: 0,
    last_log_date: null,
    longest_streak: 0,
    total_entries: 0,
    coins: WELCOME_GRANT,
    coins_earned_today: 0,
    claimed_chests: '[]',
    owned_items: '[]',
    equipped_items: '{}',
    story_progress: 0,
  };
}

function freshDB(): DB {
  return {
    expenses: [],
    categories: DEFAULT_CATEGORIES.map(c => ({ ...c })),
    game_state: defaultGameState(),
    budget: { monthly_budget: null, currency: 'SGD' },
    allocations: [],
    allocation_groups: [],
    salary_history: [],
    income_events: [],
    income_overrides: [],
    allocation_history: [],
    app_meta: {},
  };
}

let db: DB = freshDB();

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

function persist(): void {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full / unavailable — keep working from memory.
  }
}

/** Called by database.web.ts initDatabase(). Loads existing data or seeds. */
export function initWebStore(): void {
  if (!hasStorage()) {
    db = freshDB();
    return;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    db = freshDB();
    persist();
    return;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<DB>;
    // Spread `parsed` FIRST so any field this build doesn't know about (written
    // by a newer version of the app that ran against this same localStorage
    // key) survives verbatim — a stale-cached bundle can then ignore it, but
    // crucially can no longer ERASE it on the next persist(). Only the fields
    // below need defaulting/normalization; everything else passes through.
    db = {
      ...(parsed as DB),
      expenses: parsed.expenses ?? [],
      categories: parsed.categories && parsed.categories.length
        ? parsed.categories
        : DEFAULT_CATEGORIES.map(c => ({ ...c })),
      game_state: { ...defaultGameState(), ...(parsed.game_state ?? {}) },
      budget: parsed.budget ?? { monthly_budget: null, currency: 'SGD' },
      allocations: (parsed.allocations ?? []).map(normalizeAllocation),
      allocation_groups: parsed.allocation_groups ?? [],
      salary_history: parsed.salary_history ?? [],
      income_events: parsed.income_events ?? [],
      income_overrides: parsed.income_overrides ?? [],
      allocation_history: parsed.allocation_history ?? [],
      app_meta: parsed.app_meta ?? {},
    };
  } catch {
    db = freshDB();
    persist();
  }
}

// ---- helpers ----

function byNewest(a: Expense, b: Expense): number {
  if (a.spent_at !== b.spent_at) return a.spent_at < b.spent_at ? 1 : -1;
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
  return 0;
}

function clone<T>(rows: T[]): T[] {
  return rows.map(r => ({ ...r }));
}

// ---- expenses ----

export function insertExpense(expense: Omit<Expense, 'created_at'>): void {
  db.expenses.push({ ...expense, note: expense.note ?? null, created_at: new Date().toISOString() });
  persist();
}

export function updateExpense(
  id: string,
  fields: { amount: number; category_id: string; note: string | null; spent_at: string }
): void {
  const e = db.expenses.find(x => x.id === id);
  if (e) {
    e.amount = fields.amount;
    e.category_id = fields.category_id;
    e.note = fields.note ?? null;
    e.spent_at = fields.spent_at;
    persist();
  }
}

export function deleteExpense(id: string): void {
  db.expenses = db.expenses.filter(e => e.id !== id);
  persist();
}

export function getRecentExpenses(limit = 30): Expense[] {
  return clone([...db.expenses].sort(byNewest).slice(0, limit));
}

export function getAllExpenses(): Expense[] {
  return clone([...db.expenses].sort(byNewest));
}

export function getTodayTotal(): number {
  const today = todayISO();
  return db.expenses.filter(e => e.spent_at === today).reduce((s, e) => s + e.amount, 0);
}

export function getEarliestExpenseMonth(): string | null {
  if (db.expenses.length === 0) return null;
  let min = db.expenses[0].spent_at;
  for (const e of db.expenses) if (e.spent_at < min) min = e.spent_at;
  return min.slice(0, 7);
}

export function getExpensesByCategoryForMonth(categoryId: string, month: string): Expense[] {
  return clone(
    db.expenses
      .filter(e => e.category_id === categoryId && e.spent_at.slice(0, 7) === month)
      .sort(byNewest)
  );
}

export function getMonthlyTotals(start: string, end: string): { month: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const e of db.expenses) {
    const m = e.spent_at.slice(0, 7);
    if (m < start || m > end) continue;
    totals.set(m, (totals.get(m) ?? 0) + e.amount);
  }
  return Array.from(totals.entries()).map(([month, total]) => ({ month, total }));
}

export function getMonthBreakdown(month: string): CategoryBreakdownRow[] {
  const totals = new Map<string, { total: number; count: number }>();
  for (const e of db.expenses) {
    if (e.spent_at.slice(0, 7) !== month) continue;
    const cur = totals.get(e.category_id) ?? { total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    totals.set(e.category_id, cur);
  }
  return Array.from(totals.entries())
    .map(([category_id, v]) => ({ category_id, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total);
}

// ---- categories ----

export function getAllCategories(): Category[] {
  const cutoff = addDaysISO(todayISO(), -30);
  const uses = new Map<string, number>();
  for (const e of db.expenses) {
    if (e.spent_at >= cutoff) uses.set(e.category_id, (uses.get(e.category_id) ?? 0) + 1);
  }
  return clone(
    [...db.categories].sort((a, b) => {
      const ua = uses.get(a.id) ?? 0;
      const ub = uses.get(b.id) ?? 0;
      if (ub !== ua) return ub - ua;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
  );
}

export function addCategory(fields: { name: string; icon: string; color: string }): Category {
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const maxOrder = db.categories.reduce((m, c) => Math.max(m, c.sort_order ?? 0), 0);
  const cat: Category = { id, name: fields.name, icon: fields.icon, color: fields.color, is_custom: 1, sort_order: maxOrder + 1 };
  db.categories.push(cat);
  persist();
  return { ...cat };
}

// ---- game state ----

export function getGameState(): GameState {
  const g = db.game_state;
  return {
    streak_count: g.streak_count,
    last_log_date: g.last_log_date,
    longest_streak: g.longest_streak,
    total_entries: g.total_entries,
    coins: g.coins,
    coins_earned_today: g.coins_earned_today,
    claimed_chests: g.claimed_chests ?? '[]',
  };
}

export function updateGameStateAfterLog(): void {
  const today = todayISO();
  const gs = db.game_state;

  let newStreak = gs.streak_count;
  let newLongest = gs.longest_streak;
  let coinsEarnedToday = gs.coins_earned_today;

  const isFirstLogToday = gs.last_log_date !== today;
  if (isFirstLogToday) {
    const yesterdayISO = addDaysISO(today, -1);
    newStreak = gs.last_log_date === yesterdayISO ? gs.streak_count + 1 : 1;
    newLongest = Math.max(newStreak, gs.longest_streak);
    coinsEarnedToday = 0; // fresh day
  }

  // Multiplier-based per-log reward, clamped to the streak-scaled daily cap.
  const coinsEarned = coinsForLog(newStreak, isFirstLogToday);
  const cap = dailyCap(newStreak);
  const actualCoins = Math.min(coinsEarned, Math.max(0, cap - coinsEarnedToday));

  // Once-EVER milestone chest (Phase 5f: claims recorded so cycling streaks
  // can't re-farm them). Bypasses the cap; not counted toward the daily total.
  // NOTE: keep this logic in lockstep with queries.ts.
  let claimed: number[];
  try { claimed = JSON.parse(gs.claimed_chests || '[]'); } catch { claimed = []; }
  let chest = 0;
  if (isFirstLogToday && !claimed.includes(newStreak)) {
    chest = chestFor(newStreak);
    if (chest > 0) claimed.push(newStreak);
  }

  gs.streak_count = newStreak;
  gs.last_log_date = today;
  gs.longest_streak = newLongest;
  gs.total_entries = gs.total_entries + 1;
  gs.coins = gs.coins + actualCoins + chest;
  gs.coins_earned_today = coinsEarnedToday + actualCoins;
  gs.claimed_chests = JSON.stringify(claimed);
  persist();
}

// ---- Phase 3: portability ----

export function getExpensesBetween(start: string, end: string): Expense[] {
  return clone(
    db.expenses.filter(e => e.spent_at >= start && e.spent_at <= end).sort(byNewest)
  );
}

export function getBudget(): BudgetRow {
  return { ...db.budget };
}

// ---- Phase 5: income (reuses budget.monthly_budget) ----

export function getIncome(): number | null {
  return db.budget.monthly_budget;
}

export function setIncome(value: number | null): void {
  db.budget.monthly_budget = value;
  persist();
}

// ---- Phase 5: set-asides (allocations) ----

/** Default the Phase-5b recurring-payment fields (5a rows / old backups lack them). */
function normalizeAllocation(a: Partial<Allocation> & Pick<Allocation, 'id' | 'label' | 'amount' | 'kind'>): Allocation {
  return {
    id: a.id,
    label: a.label,
    amount: a.amount,
    note: a.note ?? null,
    kind: a.kind,
    month: a.month ?? null,
    group_id: a.group_id ?? null,
    cycle: a.cycle ?? null,
    due_day: a.due_day ?? null,
    due_month: a.due_month ?? null,
    info_only: a.info_only ?? null,
    percent: a.percent ?? null,
    percent_incl_bonus: a.percent_incl_bonus ?? null,
  };
}

export function getAllocations(): Allocation[] {
  return clone(db.allocations);
}

export function addAllocation(a: Allocation): void {
  db.allocations.push(normalizeAllocation(a));
  persist();
}

export function updateAllocation(id: string, fields: Omit<Allocation, 'id'>): void {
  const i = db.allocations.findIndex(a => a.id === id);
  if (i >= 0) {
    db.allocations[i] = normalizeAllocation({ id, ...fields });
    persist();
  }
}

/** Deleting an allocation also deletes its recorded history (no UI home without a parent). */
export function deleteAllocation(id: string): void {
  db.allocations = db.allocations.filter(a => a.id !== id);
  db.allocation_history = db.allocation_history.filter(h => h.allocation_id !== id);
  persist();
}

// ---- Phase 5b: recurring-payment groups ----

export function getAllocationGroups(): AllocationGroup[] {
  return clone(
    [...db.allocation_groups].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)
    )
  );
}

export function addAllocationGroup(g: AllocationGroup): void {
  db.allocation_groups.push({ ...g, sort_order: g.sort_order ?? 0 });
  persist();
}

export function updateAllocationGroup(id: string, fields: Omit<AllocationGroup, 'id'>): void {
  const i = db.allocation_groups.findIndex(g => g.id === id);
  if (i >= 0) {
    db.allocation_groups[i] = { id, ...fields, sort_order: fields.sort_order ?? 0 };
    persist();
  }
}

/** Delete a group; its member payments become ungrouped (never deleted). */
export function deleteAllocationGroup(id: string): void {
  for (const a of db.allocations) {
    if (a.group_id === id) a.group_id = null;
  }
  db.allocation_groups = db.allocation_groups.filter(g => g.id !== id);
  persist();
}

// ---- v1.5.4: per-month income (salary history + income events) ----

export function getSalaryHistory(): SalaryRow[] {
  return clone([...db.salary_history].sort((a, b) => a.from_month.localeCompare(b.from_month)));
}

/** One salary per effective-month: replaces any existing row with the same from_month. */
export function addSalary(row: SalaryRow): void {
  db.salary_history = db.salary_history.filter(s => s.from_month !== row.from_month);
  db.salary_history.push({ ...row });
  persist();
}

export function deleteSalary(id: string): void {
  db.salary_history = db.salary_history.filter(s => s.id !== id);
  persist();
}

export function getIncomeEvents(): IncomeEvent[] {
  return clone(
    [...db.income_events].sort((a, b) => b.month.localeCompare(a.month) || a.label.localeCompare(b.label))
  );
}

export function addIncomeEvent(e: IncomeEvent): void {
  db.income_events.push({ ...e });
  persist();
}

export function updateIncomeEvent(id: string, fields: Omit<IncomeEvent, 'id'>): void {
  const i = db.income_events.findIndex(e => e.id === id);
  if (i >= 0) {
    db.income_events[i] = { id, ...fields };
    persist();
  }
}

export function deleteIncomeEvent(id: string): void {
  db.income_events = db.income_events.filter(e => e.id !== id);
  persist();
}

// ---- v1.5.6: per-month income overrides ----

export function getIncomeOverrides(): IncomeOverride[] {
  return clone([...db.income_overrides].sort((a, b) => b.month.localeCompare(a.month)));
}

/** One override per month: replaces any existing row for that month. */
export function addIncomeOverride(row: IncomeOverride): void {
  db.income_overrides = db.income_overrides.filter(o => o.month !== row.month);
  db.income_overrides.push({ ...row });
  persist();
}

export function deleteIncomeOverride(id: string): void {
  db.income_overrides = db.income_overrides.filter(o => o.id !== id);
  persist();
}

// ---- v1.5.9: allocation history (record-only per-month actuals) ----

export function getAllocationHistory(allocationId?: string): AllocationHistoryRow[] {
  const rows = allocationId
    ? db.allocation_history.filter(h => h.allocation_id === allocationId)
    : db.allocation_history;
  return clone([...rows].sort((a, b) => b.month.localeCompare(a.month)));
}

/** One record per (allocation_id, month): replaces any existing row for that pair. */
export function addAllocationHistory(row: AllocationHistoryRow): void {
  db.allocation_history = db.allocation_history.filter(
    h => !(h.allocation_id === row.allocation_id && h.month === row.month)
  );
  db.allocation_history.push({ ...row });
  persist();
}

export function deleteAllocationHistory(id: string): void {
  db.allocation_history = db.allocation_history.filter(h => h.id !== id);
  persist();
}

export function getGameStateFull(): GameStateFull {
  return { ...db.game_state };
}

export function getSnapshot(): Snapshot {
  return {
    expenses: getAllExpenses(),
    categories: getAllCategories(),
    game_state: getGameStateFull(),
    budget: getBudget(),
    allocations: getAllocations(),
    allocation_groups: getAllocationGroups(),
    salary_history: getSalaryHistory(),
    income_events: getIncomeEvents(),
    income_overrides: getIncomeOverrides(),
    allocation_history: getAllocationHistory(),
  };
}

export function replaceAllData(snap: Snapshot): void {
  db.expenses = clone(snap.expenses ?? []);
  db.categories = snap.categories && snap.categories.length
    ? clone(snap.categories)
    : DEFAULT_CATEGORIES.map(c => ({ ...c }));
  db.game_state = { ...defaultGameState(), ...(snap.game_state ?? {}) };
  db.budget = snap.budget ?? { monthly_budget: null, currency: 'SGD' };
  db.allocations = (snap.allocations ?? []).map(normalizeAllocation);
  db.allocation_groups = clone(snap.allocation_groups ?? []);
  db.salary_history = clone(snap.salary_history ?? []);
  db.income_events = clone(snap.income_events ?? []);
  db.income_overrides = clone(snap.income_overrides ?? []);
  db.allocation_history = clone(snap.allocation_history ?? []);
  persist();
}

export type MergeResult = {
  categoriesAdded: number;
  expensesAdded: number;
  incomeEventsAdded: number;
  salaryRowsAdded: number;
  incomeOverridesAdded: number;
  allocationHistoryAdded: number;
};

/**
 * Merge = add HISTORICAL RECORDS that don't already exist: expenses, categories
 * and income events by id; salary rows by from_month (one salary per effective-
 * month). game_state, budget and allocations stay untouched (current config).
 * NOTE: keep semantics in lockstep with queries.ts.
 */
export function mergeData(snap: Snapshot): MergeResult {
  let categoriesAdded = 0;
  let expensesAdded = 0;
  let incomeEventsAdded = 0;
  let salaryRowsAdded = 0;
  let incomeOverridesAdded = 0;
  let allocationHistoryAdded = 0;
  const catIds = new Set(db.categories.map(c => c.id));
  for (const c of snap.categories ?? []) {
    if (!catIds.has(c.id)) {
      db.categories.push({ ...c });
      catIds.add(c.id);
      categoriesAdded += 1;
    }
  }
  const expIds = new Set(db.expenses.map(e => e.id));
  for (const e of snap.expenses ?? []) {
    if (!expIds.has(e.id)) {
      db.expenses.push({ ...e });
      expIds.add(e.id);
      expensesAdded += 1;
    }
  }
  const evtIds = new Set(db.income_events.map(e => e.id));
  for (const ev of snap.income_events ?? []) {
    if (!evtIds.has(ev.id)) {
      db.income_events.push({ ...ev });
      evtIds.add(ev.id);
      incomeEventsAdded += 1;
    }
  }
  const salMonths = new Set(db.salary_history.map(s => s.from_month));
  for (const s of snap.salary_history ?? []) {
    if (!salMonths.has(s.from_month)) {
      db.salary_history.push({ ...s });
      salMonths.add(s.from_month);
      salaryRowsAdded += 1;
    }
  }
  const ovrMonths = new Set(db.income_overrides.map(o => o.month));
  for (const o of snap.income_overrides ?? []) {
    if (!ovrMonths.has(o.month)) {
      db.income_overrides.push({ ...o });
      ovrMonths.add(o.month);
      incomeOverridesAdded += 1;
    }
  }
  // allocation_history: dedupe by (allocation_id, month); skip rows whose
  // allocation doesn't exist locally (no parent to attach to).
  const allocIds = new Set(db.allocations.map(a => a.id));
  const histKeys = new Set(db.allocation_history.map(h => `${h.allocation_id}|${h.month}`));
  for (const h of snap.allocation_history ?? []) {
    const key = `${h.allocation_id}|${h.month}`;
    if (allocIds.has(h.allocation_id) && !histKeys.has(key)) {
      db.allocation_history.push({ ...h });
      histKeys.add(key);
      allocationHistoryAdded += 1;
    }
  }
  persist();
  return { categoriesAdded, expensesAdded, incomeEventsAdded, salaryRowsAdded, incomeOverridesAdded, allocationHistoryAdded };
}

// ---- app_meta ----

export function getMeta(key: string): string | null {
  return db.app_meta[key] ?? null;
}

export function setMeta(key: string, value: string): void {
  db.app_meta[key] = value;
  persist();
}

// ---------------------------------------------------------------------------
// Dev tools (developer panel) — direct state mutation for testing.
// ---------------------------------------------------------------------------

/** Directly patch game_state fields. */
export function devSetGameState(patch: DevPatch): void {
  Object.assign(db.game_state, patch);
  persist();
}

/** Wipe everything to a fresh-install state (keeps the seeded categories).
 *  `preserveMetaKeys` are app_meta keys to keep — the dev sandbox's restore point
 *  lives in app_meta, so wiping it would make Exit restore nothing and permanently
 *  lose the user's real data. */
export function devResetAll(preserveMetaKeys: string[] = []): void {
  db.expenses = [];
  const preserved: Record<string, string> = {};
  for (const k of preserveMetaKeys) {
    if (db.app_meta[k] !== undefined) preserved[k] = db.app_meta[k];
  }
  db.app_meta = preserved;
  db.game_state.streak_count = 0;
  db.game_state.last_log_date = null;
  db.game_state.longest_streak = 0;
  db.game_state.total_entries = 0;
  db.game_state.coins = WELCOME_GRANT;
  db.game_state.coins_earned_today = 0;
  db.game_state.claimed_chests = '[]';
  db.game_state.owned_items = '[]';
  db.game_state.equipped_items = '{}';
  persist();
}

// ---------------------------------------------------------------------------
// Phase 4: Wardrobe (buy / equip)
// ---------------------------------------------------------------------------

export function getOwnedItems(): string[] {
  try { return JSON.parse(db.game_state.owned_items); } catch { return []; }
}

export function getEquippedItems(): EquippedMap {
  try { return JSON.parse(db.game_state.equipped_items); } catch { return {}; }
}

/**
 * Deduct coins and append itemId to owned_items.
 * Returns false (no-op) if already owned or insufficient coins.
 */
export function buyItem(itemId: string, price: number): boolean {
  let owned: string[];
  try { owned = JSON.parse(db.game_state.owned_items); } catch { owned = []; }
  if (owned.includes(itemId)) return false;
  if (db.game_state.coins < price) return false;
  owned.push(itemId);
  db.game_state.owned_items = JSON.stringify(owned);
  db.game_state.coins -= price;
  persist();
  return true;
}

/**
 * Sell an owned item for 50% of its retail price. Unequips it from any slot it's
 * worn in. Returns the refund amount (0 if not owned).
 */
export function sellItem(itemId: string, price: number): number {
  let owned: string[];
  try { owned = JSON.parse(db.game_state.owned_items); } catch { owned = []; }
  if (!owned.includes(itemId)) return 0;
  owned = owned.filter(id => id !== itemId);
  let equipped: EquippedMap;
  try { equipped = JSON.parse(db.game_state.equipped_items); } catch { equipped = {}; }
  for (const slot of Object.keys(equipped) as Slot[]) {
    if (equipped[slot] === itemId) delete equipped[slot];
  }
  const refund = Math.floor(price / 2);
  db.game_state.owned_items = JSON.stringify(owned);
  db.game_state.equipped_items = JSON.stringify(equipped);
  db.game_state.coins += refund;
  persist();
  return refund;
}

/** Set the equipped item for a slot. */
export function equipItem(itemId: string, slot: Slot): void {
  let equipped: EquippedMap;
  try { equipped = JSON.parse(db.game_state.equipped_items); } catch { equipped = {}; }
  equipped[slot] = itemId;
  db.game_state.equipped_items = JSON.stringify(equipped);
  persist();
}

/** Remove an item from the equipped slot. */
export function unequipItem(slot: Slot): void {
  let equipped: EquippedMap;
  try { equipped = JSON.parse(db.game_state.equipped_items); } catch { equipped = {}; }
  delete equipped[slot];
  db.game_state.equipped_items = JSON.stringify(equipped);
  persist();
}

/** Replace the entire equipped map (bulk equip, used by Pass C changing room). */
export function equipLook(look: EquippedMap): void {
  db.game_state.equipped_items = JSON.stringify(look);
  persist();
}
