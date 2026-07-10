import { getDb } from './database';
import { Category } from '../constants/categories';
import { todayISO, addDaysISO } from '../lib/date';
import { coinsForLog, dailyCap, chestFor, WELCOME_GRANT } from '../lib/streak';
import {
  Expense,
  GameState,
  CategoryBreakdownRow,
  BudgetRow,
  Allocation,
  AllocationGroup,
  GameStateFull,
  Snapshot,
  DevPatch,
} from './types';
import { Slot, EquippedMap } from '../constants/storeItems';

export type { Expense, GameState, CategoryBreakdownRow, BudgetRow, Allocation, AllocationGroup, GameStateFull, Snapshot } from './types';

export function insertExpense(expense: Omit<Expense, 'created_at'>): void {
  const db = getDb();
  db.runSync(
    'INSERT INTO expenses (id, amount, category_id, note, spent_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [expense.id, expense.amount, expense.category_id, expense.note ?? null, expense.spent_at, new Date().toISOString()]
  );
}

export function updateExpense(
  id: string,
  fields: { amount: number; category_id: string; note: string | null; spent_at: string }
): void {
  const db = getDb();
  db.runSync(
    'UPDATE expenses SET amount = ?, category_id = ?, note = ?, spent_at = ? WHERE id = ?',
    [fields.amount, fields.category_id, fields.note ?? null, fields.spent_at, id]
  );
}

export function deleteExpense(id: string): void {
  const db = getDb();
  db.runSync('DELETE FROM expenses WHERE id = ?', [id]);
}

export function getRecentExpenses(limit = 30): Expense[] {
  const db = getDb();
  return db.getAllSync<Expense>(
    'SELECT * FROM expenses ORDER BY spent_at DESC, created_at DESC LIMIT ?',
    [limit]
  );
}

/** Every expense, newest first. Used by the full-history view. */
export function getAllExpenses(): Expense[] {
  const db = getDb();
  return db.getAllSync<Expense>(
    'SELECT * FROM expenses ORDER BY spent_at DESC, created_at DESC'
  );
}

export function getTodayTotal(): number {
  const db = getDb();
  const today = todayISO();
  const row = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE spent_at = ?',
    [today]
  );
  return row?.total ?? 0;
}

/** The YYYY-MM of the earliest expense, or null if there are none. */
export function getEarliestExpenseMonth(): string | null {
  const db = getDb();
  const row = db.getFirstSync<{ min: string | null }>(
    'SELECT MIN(spent_at) as min FROM expenses'
  );
  return row?.min ? row.min.slice(0, 7) : null;
}

/** All expenses in a category for a given YYYY-MM, newest first. */
export function getExpensesByCategoryForMonth(categoryId: string, month: string): Expense[] {
  const db = getDb();
  return db.getAllSync<Expense>(
    `SELECT * FROM expenses
     WHERE category_id = ? AND substr(spent_at, 1, 7) = ?
     ORDER BY spent_at DESC, created_at DESC`,
    [categoryId, month]
  );
}

/** Spending grouped by category for a given YYYY-MM, biggest first. */
export function getMonthBreakdown(month: string): CategoryBreakdownRow[] {
  const db = getDb();
  return db.getAllSync<CategoryBreakdownRow>(
    `SELECT category_id, SUM(amount) as total, COUNT(*) as count
     FROM expenses
     WHERE substr(spent_at, 1, 7) = ?
     GROUP BY category_id
     ORDER BY total DESC`,
    [month]
  );
}

export function getAllCategories(): Category[] {
  const db = getDb();
  // Rank by usage in the last 30 days (most used first); unused categories fall
  // to the bottom in their original sort_order. Nothing is ever hidden.
  return db.getAllSync<Category>(
    `SELECT c.id, c.name, c.icon, c.color, c.is_custom, c.sort_order
     FROM categories c
     LEFT JOIN expenses e
       ON e.category_id = c.id
      AND e.spent_at >= date('now', '-30 days')
     GROUP BY c.id
     ORDER BY COUNT(e.id) DESC, c.sort_order ASC`
  );
}

export function addCategory(fields: { name: string; icon: string; color: string }): Category {
  const db = getDb();
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const row = db.getFirstSync<{ maxOrder: number | null }>(
    'SELECT MAX(sort_order) as maxOrder FROM categories'
  );
  const sortOrder = (row?.maxOrder ?? 0) + 1;
  db.runSync(
    'INSERT INTO categories (id, name, icon, color, is_custom, sort_order) VALUES (?, ?, ?, ?, 1, ?)',
    [id, fields.name, fields.icon, fields.color, sortOrder]
  );
  return { id, name: fields.name, icon: fields.icon, color: fields.color, is_custom: 1, sort_order: sortOrder };
}

export function getGameState(): GameState {
  const db = getDb();
  return db.getFirstSync<GameState>('SELECT * FROM game_state WHERE id = 1') ?? {
    streak_count: 0,
    last_log_date: null,
    longest_streak: 0,
    total_entries: 0,
    coins: WELCOME_GRANT,
    coins_earned_today: 0,
  };
}

export function updateGameStateAfterLog(): void {
  const db = getDb();
  const today = todayISO();
  const gs = getGameState();

  let newStreak = gs.streak_count;
  let newLongest = gs.longest_streak;
  let coinsEarnedToday = gs.coins_earned_today;

  const isFirstLogToday = gs.last_log_date !== today;

  if (isFirstLogToday) {
    // Continue the streak if yesterday was logged, otherwise reset to 1.
    const yesterdayISO = addDaysISO(today, -1);
    newStreak = gs.last_log_date === yesterdayISO ? gs.streak_count + 1 : 1;
    newLongest = Math.max(newStreak, gs.longest_streak);
    coinsEarnedToday = 0; // fresh day
  }

  // Multiplier-based per-log reward, clamped to the streak-scaled daily cap.
  const coinsEarned = coinsForLog(newStreak, isFirstLogToday);
  const cap = dailyCap(newStreak);
  const actualCoins = Math.min(coinsEarned, Math.max(0, cap - coinsEarnedToday));

  // One-time milestone chest on the first log of a milestone day. Bypasses the
  // cap and is NOT counted toward coins_earned_today (so it never suppresses income).
  const chest = isFirstLogToday ? chestFor(newStreak) : 0;

  db.runSync(
    `UPDATE game_state SET
      streak_count = ?,
      last_log_date = ?,
      longest_streak = ?,
      total_entries = total_entries + 1,
      coins = coins + ?,
      coins_earned_today = ?
    WHERE id = 1`,
    [newStreak, today, newLongest, actualCoins + chest, coinsEarnedToday + actualCoins]
  );
}

// ---------------------------------------------------------------------------
// Phase 3: data portability (export / backup / restore)
// ---------------------------------------------------------------------------

/** Expenses whose spent_at falls within [start, end] inclusive (YYYY-MM-DD). */
export function getExpensesBetween(start: string, end: string): Expense[] {
  const db = getDb();
  return db.getAllSync<Expense>(
    `SELECT * FROM expenses
     WHERE spent_at >= ? AND spent_at <= ?
     ORDER BY spent_at DESC, created_at DESC`,
    [start, end]
  );
}

export function getBudget(): BudgetRow {
  const db = getDb();
  return db.getFirstSync<BudgetRow>('SELECT monthly_budget, currency FROM budget WHERE id = 1')
    ?? { monthly_budget: null, currency: 'SGD' };
}

// ---- Phase 5: income (reuses the budget.monthly_budget column) ----

export function getIncome(): number | null {
  return getBudget().monthly_budget;
}

export function setIncome(value: number | null): void {
  const db = getDb();
  db.runSync('UPDATE budget SET monthly_budget = ? WHERE id = 1', [value]);
}

// ---- Phase 5: set-asides (allocations) ----

export function getAllocations(): Allocation[] {
  const db = getDb();
  return db.getAllSync<Allocation>(
    `SELECT id, label, amount, note, kind, month, group_id, cycle, due_day, due_month
     FROM allocations ORDER BY kind DESC, label`
  ) ?? [];
}

function insertAllocationRaw(a: Allocation): void {
  const db = getDb();
  db.runSync(
    `INSERT INTO allocations (id, label, amount, note, kind, month, group_id, cycle, due_day, due_month)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      a.id, a.label, a.amount, a.note ?? null, a.kind, a.month ?? null,
      a.group_id ?? null, a.cycle ?? null, a.due_day ?? null, a.due_month ?? null,
    ]
  );
}

export function addAllocation(a: Allocation): void {
  insertAllocationRaw(a);
}

export function updateAllocation(id: string, fields: Omit<Allocation, 'id'>): void {
  const db = getDb();
  db.runSync(
    `UPDATE allocations SET label = ?, amount = ?, note = ?, kind = ?, month = ?,
       group_id = ?, cycle = ?, due_day = ?, due_month = ?
     WHERE id = ?`,
    [
      fields.label, fields.amount, fields.note ?? null, fields.kind, fields.month ?? null,
      fields.group_id ?? null, fields.cycle ?? null, fields.due_day ?? null, fields.due_month ?? null,
      id,
    ]
  );
}

export function deleteAllocation(id: string): void {
  const db = getDb();
  db.runSync('DELETE FROM allocations WHERE id = ?', [id]);
}

// ---- Phase 5b: recurring-payment groups ----

export function getAllocationGroups(): AllocationGroup[] {
  const db = getDb();
  return db.getAllSync<AllocationGroup>(
    'SELECT id, name, icon, sort_order FROM allocation_groups ORDER BY sort_order, name'
  ) ?? [];
}

function insertAllocationGroupRaw(g: AllocationGroup): void {
  const db = getDb();
  db.runSync(
    'INSERT INTO allocation_groups (id, name, icon, sort_order) VALUES (?, ?, ?, ?)',
    [g.id, g.name, g.icon, g.sort_order ?? 0]
  );
}

export function addAllocationGroup(g: AllocationGroup): void {
  insertAllocationGroupRaw(g);
}

export function updateAllocationGroup(id: string, fields: Omit<AllocationGroup, 'id'>): void {
  const db = getDb();
  db.runSync(
    'UPDATE allocation_groups SET name = ?, icon = ?, sort_order = ? WHERE id = ?',
    [fields.name, fields.icon, fields.sort_order ?? 0, id]
  );
}

/** Delete a group; its member payments become ungrouped (never deleted). */
export function deleteAllocationGroup(id: string): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync('UPDATE allocations SET group_id = NULL WHERE group_id = ?', [id]);
    db.runSync('DELETE FROM allocation_groups WHERE id = ?', [id]);
  });
}

/** Full game_state row (all columns) for backups. */
export function getGameStateFull(): GameStateFull {
  const db = getDb();
  return db.getFirstSync<GameStateFull>('SELECT * FROM game_state WHERE id = 1') ?? {
    streak_count: 0,
    last_log_date: null,
    longest_streak: 0,
    total_entries: 0,
    coins: 0,
    coins_earned_today: 0,
    owned_items: '[]',
    equipped_items: '{}',
    story_progress: 0,
  };
}

/** Read the complete app state for a JSON backup. */
export function getSnapshot(): Snapshot {
  return {
    expenses: getAllExpenses(),
    categories: getAllCategories(),
    game_state: getGameStateFull(),
    budget: getBudget(),
    allocations: getAllocations(),
    allocation_groups: getAllocationGroups(),
  };
}

function insertCategoryRaw(c: Category, orIgnore: boolean): void {
  const db = getDb();
  db.runSync(
    `INSERT ${orIgnore ? 'OR IGNORE ' : ''}INTO categories (id, name, icon, color, is_custom, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
    [c.id, c.name, c.icon, c.color, c.is_custom ?? 0, c.sort_order ?? 0]
  );
}

function insertExpenseRaw(e: Expense, orIgnore: boolean): void {
  const db = getDb();
  db.runSync(
    `INSERT ${orIgnore ? 'OR IGNORE ' : ''}INTO expenses (id, amount, category_id, note, spent_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [e.id, e.amount, e.category_id, e.note ?? null, e.spent_at, e.created_at]
  );
}

/** Full restore: wipe expenses + categories and load everything from the backup. */
export function replaceAllData(snap: Snapshot): void {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM expenses');
    db.runSync('DELETE FROM categories');
    for (const c of snap.categories) insertCategoryRaw(c, false);
    for (const e of snap.expenses) insertExpenseRaw(e, false);

    const gs = snap.game_state;
    if (gs) {
      db.runSync(
        `UPDATE game_state SET
          streak_count = ?, last_log_date = ?, longest_streak = ?,
          total_entries = ?, coins = ?, coins_earned_today = ?,
          owned_items = ?, equipped_items = ?, story_progress = ?
        WHERE id = 1`,
        [
          gs.streak_count, gs.last_log_date, gs.longest_streak,
          gs.total_entries, gs.coins, gs.coins_earned_today,
          gs.owned_items ?? '[]', gs.equipped_items ?? '{}', gs.story_progress ?? 0,
        ]
      );
    }
    if (snap.budget) {
      db.runSync('UPDATE budget SET monthly_budget = ?, currency = ? WHERE id = 1', [
        snap.budget.monthly_budget ?? null,
        snap.budget.currency ?? 'SGD',
      ]);
    }

    // Set-asides + payment groups: native must handle its own tables explicitly
    // (web auto-spreads the snapshot). Wipe + reload so a Replace fully restores them.
    db.runSync('DELETE FROM allocations');
    for (const a of snap.allocations ?? []) insertAllocationRaw(a);
    db.runSync('DELETE FROM allocation_groups');
    for (const g of snap.allocation_groups ?? []) insertAllocationGroupRaw(g);
  });
}

/**
 * Merge restore: add expenses + categories from the backup that don't already
 * exist (matched by id). Leaves game_state, budget and allocations untouched.
 * Returns how many new rows were added.
 */
export function mergeData(snap: Snapshot): { categoriesAdded: number; expensesAdded: number } {
  const db = getDb();
  let categoriesAdded = 0;
  let expensesAdded = 0;
  db.withTransactionSync(() => {
    const catBefore = db.getFirstSync<{ c: number }>('SELECT COUNT(*) c FROM categories')?.c ?? 0;
    const expBefore = db.getFirstSync<{ c: number }>('SELECT COUNT(*) c FROM expenses')?.c ?? 0;
    for (const c of snap.categories) insertCategoryRaw(c, true);
    for (const e of snap.expenses) insertExpenseRaw(e, true);
    const catAfter = db.getFirstSync<{ c: number }>('SELECT COUNT(*) c FROM categories')?.c ?? 0;
    const expAfter = db.getFirstSync<{ c: number }>('SELECT COUNT(*) c FROM expenses')?.c ?? 0;
    categoriesAdded = catAfter - catBefore;
    expensesAdded = expAfter - expBefore;
  });
  return { categoriesAdded, expensesAdded };
}

// ---- app_meta key/value (last backup date, future flags) ----

export function getMeta(key: string): string | null {
  const db = getDb();
  return db.getFirstSync<{ value: string }>('SELECT value FROM app_meta WHERE key = ?', [key])?.value ?? null;
}

export function setMeta(key: string, value: string): void {
  const db = getDb();
  db.runSync(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

// ---------------------------------------------------------------------------
// Dev tools (developer panel) — direct state mutation for testing.
// ---------------------------------------------------------------------------

const DEV_COLUMNS = [
  'coins', 'streak_count', 'longest_streak', 'last_log_date', 'coins_earned_today',
  'owned_items', 'equipped_items',
] as const;

/** Directly patch game_state fields (whitelisted columns only). */
export function devSetGameState(patch: DevPatch): void {
  const db = getDb();
  const keys = Object.keys(patch).filter(k => (DEV_COLUMNS as readonly string[]).includes(k));
  if (!keys.length) return;
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const vals = keys.map(k => (patch as Record<string, unknown>)[k]);
  db.runSync(`UPDATE game_state SET ${sets} WHERE id = 1`, vals as never[]);
}

/** Wipe everything to a fresh-install state (keeps the seeded categories).
 *  `preserveMetaKeys` are app_meta keys to keep — the dev sandbox's restore point
 *  lives in app_meta, so wiping it would make Exit restore nothing and permanently
 *  lose the user's real data. */
export function devResetAll(preserveMetaKeys: string[] = []): void {
  const db = getDb();
  db.runSync('DELETE FROM expenses');
  if (preserveMetaKeys.length) {
    const holes = preserveMetaKeys.map(() => '?').join(',');
    db.runSync(`DELETE FROM app_meta WHERE key NOT IN (${holes})`, preserveMetaKeys);
  } else {
    db.runSync('DELETE FROM app_meta');
  }
  db.runSync(
    `UPDATE game_state SET streak_count = 0, last_log_date = NULL, longest_streak = 0,
      total_entries = 0, coins = ?, coins_earned_today = 0,
      owned_items = '[]', equipped_items = '{}' WHERE id = 1`,
    [WELCOME_GRANT]
  );
}

// ---------------------------------------------------------------------------
// Phase 4: Wardrobe (buy / equip)
// ---------------------------------------------------------------------------

export function getOwnedItems(): string[] {
  const db = getDb();
  const row = db.getFirstSync<{ owned_items: string }>(
    'SELECT owned_items FROM game_state WHERE id = 1'
  );
  try { return JSON.parse(row?.owned_items ?? '[]'); } catch { return []; }
}

export function getEquippedItems(): EquippedMap {
  const db = getDb();
  const row = db.getFirstSync<{ equipped_items: string }>(
    'SELECT equipped_items FROM game_state WHERE id = 1'
  );
  try { return JSON.parse(row?.equipped_items ?? '{}'); } catch { return {}; }
}

/**
 * Deduct coins and append itemId to owned_items.
 * Returns false (no-op) if already owned or insufficient coins.
 */
export function buyItem(itemId: string, price: number): boolean {
  const db = getDb();
  const row = db.getFirstSync<{ coins: number; owned_items: string }>(
    'SELECT coins, owned_items FROM game_state WHERE id = 1'
  );
  if (!row) return false;
  let owned: string[];
  try { owned = JSON.parse(row.owned_items); } catch { owned = []; }
  if (owned.includes(itemId)) return false;
  if (row.coins < price) return false;
  owned.push(itemId);
  db.runSync(
    'UPDATE game_state SET coins = coins - ?, owned_items = ? WHERE id = 1',
    [price, JSON.stringify(owned)]
  );
  return true;
}

/**
 * Sell an owned item for 50% of its retail price. Unequips it from any slot it's
 * worn in. Returns the refund amount (0 if not owned).
 */
export function sellItem(itemId: string, price: number): number {
  const db = getDb();
  const row = db.getFirstSync<{ owned_items: string; equipped_items: string }>(
    'SELECT owned_items, equipped_items FROM game_state WHERE id = 1'
  );
  if (!row) return 0;
  let owned: string[];
  try { owned = JSON.parse(row.owned_items); } catch { owned = []; }
  if (!owned.includes(itemId)) return 0;
  owned = owned.filter(id => id !== itemId);
  let equipped: EquippedMap;
  try { equipped = JSON.parse(row.equipped_items); } catch { equipped = {}; }
  for (const slot of Object.keys(equipped) as Slot[]) {
    if (equipped[slot] === itemId) delete equipped[slot];
  }
  const refund = Math.floor(price / 2);
  db.runSync(
    'UPDATE game_state SET coins = coins + ?, owned_items = ?, equipped_items = ? WHERE id = 1',
    [refund, JSON.stringify(owned), JSON.stringify(equipped)]
  );
  return refund;
}

/** Set the equipped item for a slot. */
export function equipItem(itemId: string, slot: Slot): void {
  const db = getDb();
  const row = db.getFirstSync<{ equipped_items: string }>(
    'SELECT equipped_items FROM game_state WHERE id = 1'
  );
  let equipped: EquippedMap;
  try { equipped = JSON.parse(row?.equipped_items ?? '{}'); } catch { equipped = {}; }
  equipped[slot] = itemId;
  db.runSync(
    'UPDATE game_state SET equipped_items = ? WHERE id = 1',
    [JSON.stringify(equipped)]
  );
}

/** Remove an item from the equipped slot. */
export function unequipItem(slot: Slot): void {
  const db = getDb();
  const row = db.getFirstSync<{ equipped_items: string }>(
    'SELECT equipped_items FROM game_state WHERE id = 1'
  );
  let equipped: EquippedMap;
  try { equipped = JSON.parse(row?.equipped_items ?? '{}'); } catch { equipped = {}; }
  delete equipped[slot];
  db.runSync(
    'UPDATE game_state SET equipped_items = ? WHERE id = 1',
    [JSON.stringify(equipped)]
  );
}

/** Replace the entire equipped map (bulk equip, used by Pass C changing room). */
export function equipLook(look: EquippedMap): void {
  const db = getDb();
  db.runSync(
    'UPDATE game_state SET equipped_items = ? WHERE id = 1',
    [JSON.stringify(look)]
  );
}
