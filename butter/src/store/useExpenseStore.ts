import { create } from 'zustand';
import { Category } from '../constants/categories';
import {
  Expense,
  GameState,
  getAllCategories,
  getGameState,
  getRecentExpenses,
  getTodayTotal,
  insertExpense,
  updateExpense,
  deleteExpense,
  addCategory,
  updateGameStateAfterLog,
  getOwnedItems,
  getEquippedItems,
  buyItem as buyItemQuery,
  sellItem as sellItemQuery,
  equipItem as equipItemQuery,
  unequipItem as unequipItemQuery,
  equipLook as equipLookQuery,
  devSetGameState as devSetGameStateQuery,
  devResetAll as devResetAllQuery,
  getSnapshot,
  replaceAllData,
  getMeta,
  setMeta,
  getIncome,
  setIncome as setIncomeQuery,
  getAllocations,
  addAllocation as addAllocationQuery,
  updateAllocation as updateAllocationQuery,
  deleteAllocation as deleteAllocationQuery,
  getAllocationGroups,
  addAllocationGroup as addAllocationGroupQuery,
  updateAllocationGroup as updateAllocationGroupQuery,
  deleteAllocationGroup as deleteAllocationGroupQuery,
} from '../db/queries';
import { DevPatch, Allocation, AllocationGroup } from '../db/types';
import { serializeBackup, parseBackup } from '../lib/backup';

const DEV_BACKUP_KEY = 'dev_backup';
import { todayISO } from '../lib/date';
import { Slot, EquippedMap } from '../constants/storeItems';
import { dailyCap, chestFor } from '../lib/streak';

export type CelebrationTier = 'normal' | 'big';
export type Celebration = {
  tier: CelebrationTier;
  reason: string | null; // milestone label for the speech bubble (big only)
  coinsEarned: number;    // total coins gained this log (incl. any milestone chest)
  capReached: boolean;    // this log pushed today's earnings to the scaled daily cap
  chestCoins: number;     // milestone chest awarded this log (0 if none)
};

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

// Decide the celebration tier (and cap/chest signals) by diffing game state.
function computeCelebration(prev: GameState, next: GameState): Celebration {
  const coinsEarned = Math.max(0, next.coins - prev.coins);
  const firstLogToday = prev.last_log_date !== todayISO();
  const hitStreak = STREAK_MILESTONES.includes(next.streak_count) && next.streak_count !== prev.streak_count;
  const newLongest = next.longest_streak > prev.longest_streak && next.longest_streak >= 3;
  const crossedCoins = Math.floor(next.coins / 100) > Math.floor(prev.coins / 100);

  // Cap is reached when this log crosses the scaled daily cap. Skip the first log
  // of the day — coins_earned_today resets to 0 then, so prev is stale and a
  // single first log can never fill the cap.
  const cap = dailyCap(next.streak_count);
  const capReached = !firstLogToday && prev.coins_earned_today < cap && next.coins_earned_today >= cap;
  const chestCoins = firstLogToday ? chestFor(next.streak_count) : 0;

  let tier: CelebrationTier = 'normal';
  let reason: string | null = null;
  if (hitStreak)         { tier = 'big'; reason = `${next.streak_count}-day streak! 🔥`; }
  else if (newLongest)   { tier = 'big'; reason = `New best streak: ${next.longest_streak} days! ⭐`; }
  else if (firstLogToday) { tier = 'big'; reason = 'First log today! 🧈'; }
  else if (crossedCoins) { tier = 'big'; reason = `${Math.floor(next.coins / 100) * 100} coins! 🪙`; }

  return { tier, reason, coinsEarned, capReached, chestCoins };
}

type ExpenseStore = {
  expenses: Expense[];
  todayTotal: number;
  categories: Category[];
  gameState: GameState;
  // Phase 4: wardrobe state (separate from gameState to avoid regressions)
  ownedItems: string[];       // item IDs the user owns
  equippedItems: EquippedMap; // {slot → itemId} currently worn
  // Phase 5: budget/income context
  income: number | null;      // monthly income (null = not set)
  allocations: Allocation[];  // set-asides & recurring payments (recurring + one-off)
  allocationGroups: AllocationGroup[]; // recurring-payment groups (Insurance, Subscriptions…)
  isAddSheetOpen: boolean;
  editingExpense: Expense | null;
  // Bumped on every data mutation so screens that query SQLite directly
  // (e.g. Insights, the category detail screen) can refresh after an edit
  // made through the global modal sheet, which fires no navigation focus event.
  dataVersion: number;
  // Bumped only when a NEW expense is added (not edit/delete), so Home can fire
  // Butter's celebration. Home watches this and ignores the initial 0.
  celebrationSignal: number;
  // Details of the most recent log's celebration (tier/reason/coins). Home reads
  // this when celebrationSignal changes.
  lastCelebration: Celebration;

  loadData: () => void;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
  editExpense: (id: string, fields: { amount: number; category_id: string; note: string | null; spent_at: string }) => void;
  removeExpense: (id: string) => void;
  createCategory: (fields: { name: string; icon: string; color: string }) => Category;
  openAddSheet: () => void;
  openEditSheet: (expense: Expense) => void;
  closeAddSheet: () => void;
  // Phase 4: wardrobe actions
  buyItem: (itemId: string, price: number) => boolean;
  sellItem: (itemId: string, price: number) => number;
  equipItem: (itemId: string, slot: Slot) => void;
  unequipItem: (slot: Slot) => void;
  equipLook: (equipped: EquippedMap) => void;
  // Phase 5: budget actions
  setIncome: (value: number | null) => void;
  addAllocation: (fields: Omit<Allocation, 'id'>) => string;
  updateAllocation: (id: string, fields: Omit<Allocation, 'id'>) => void;
  deleteAllocation: (id: string) => void;
  addAllocationGroup: (fields: Omit<AllocationGroup, 'id'>) => string;
  updateAllocationGroup: (id: string, fields: Omit<AllocationGroup, 'id'>) => void;
  deleteAllocationGroup: (id: string) => void;
  // Dev tools
  devActive: boolean; // dev sandbox in effect this session (changes revert on exit)
  devSetGameState: (patch: DevPatch) => void;
  devResetAll: () => void;
  enterDevSandbox: () => void;
  leaveDevSandbox: () => void;
  recoverDevOrphan: () => void;
};

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  todayTotal: 0,
  categories: [],
  gameState: {
    streak_count: 0,
    last_log_date: null,
    longest_streak: 0,
    total_entries: 0,
    coins: 0,
    coins_earned_today: 0,
  },
  ownedItems: [],
  equippedItems: {},
  income: null,
  allocations: [],
  allocationGroups: [],
  isAddSheetOpen: false,
  editingExpense: null,
  dataVersion: 0,
  celebrationSignal: 0,
  lastCelebration: { tier: 'normal', reason: null, coinsEarned: 0, capReached: false, chestCoins: 0 },
  devActive: false,

  loadData: () => {
    const expenses = getRecentExpenses(30);
    const todayTotal = getTodayTotal();
    const categories = getAllCategories();
    const gameState = getGameState();
    const ownedItems = getOwnedItems();
    const equippedItems = getEquippedItems();
    const income = getIncome();
    const allocations = getAllocations();
    const allocationGroups = getAllocationGroups();
    set({ expenses, todayTotal, categories, gameState, ownedItems, equippedItems, income, allocations, allocationGroups, dataVersion: get().dataVersion + 1 });
  },

  addExpense: (expense) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const prev = getGameState();
    insertExpense({ ...expense, id });
    updateGameStateAfterLog();
    const next = getGameState();
    const celebration = computeCelebration(prev, next);
    get().loadData();
    set({ celebrationSignal: get().celebrationSignal + 1, lastCelebration: celebration });
  },

  editExpense: (id, fields) => {
    // Editing an existing entry does not award coins or touch the streak.
    updateExpense(id, fields);
    get().loadData();
  },

  removeExpense: (id) => {
    // Deleting does not refund coins or recompute the streak (kept intentionally simple).
    deleteExpense(id);
    get().loadData();
  },

  createCategory: (fields) => {
    const cat = addCategory(fields);
    // Refresh categories so the new one is available everywhere.
    set({ categories: getAllCategories() });
    return cat;
  },

  openAddSheet: () => set({ isAddSheetOpen: true, editingExpense: null }),
  openEditSheet: (expense) => set({ isAddSheetOpen: true, editingExpense: expense }),
  closeAddSheet: () => set({ isAddSheetOpen: false }),

  // Phase 4: wardrobe actions — each persists via the query then refreshes store
  buyItem: (itemId, price) => {
    const ok = buyItemQuery(itemId, price);
    if (ok) get().loadData();
    return ok;
  },
  sellItem: (itemId, price) => {
    const refund = sellItemQuery(itemId, price);
    if (refund > 0) get().loadData();
    return refund;
  },
  equipItem: (itemId, slot) => {
    equipItemQuery(itemId, slot);
    get().loadData();
  },
  unequipItem: (slot) => {
    unequipItemQuery(slot);
    get().loadData();
  },
  equipLook: (equipped) => {
    equipLookQuery(equipped);
    get().loadData();
  },

  // Phase 5: budget/income + set-asides
  setIncome: (value) => {
    setIncomeQuery(value);
    get().loadData();
  },
  addAllocation: (fields) => {
    const id = `alloc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    addAllocationQuery({ id, ...fields });
    get().loadData();
    return id;
  },
  updateAllocation: (id, fields) => {
    updateAllocationQuery(id, fields);
    get().loadData();
  },
  deleteAllocation: (id) => {
    deleteAllocationQuery(id);
    get().loadData();
  },
  addAllocationGroup: (fields) => {
    const id = `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    addAllocationGroupQuery({ id, ...fields });
    get().loadData();
    return id;
  },
  updateAllocationGroup: (id, fields) => {
    updateAllocationGroupQuery(id, fields);
    get().loadData();
  },
  deleteAllocationGroup: (id) => {
    deleteAllocationGroupQuery(id);
    get().loadData();
  },

  // Dev tools
  devSetGameState: (patch) => {
    // Safety: never mutate real data outside the sandbox (e.g. if the dev panel
    // is still mounted after Exit reverted the sandbox).
    if (!get().devActive) return;
    devSetGameStateQuery(patch);
    get().loadData();
  },
  devResetAll: () => {
    if (!get().devActive) return;
    // Preserve the sandbox restore point (in app_meta) so Exit can still revert this wipe.
    devResetAllQuery([DEV_BACKUP_KEY]);
    get().loadData();
  },

  // Dev sandbox: snapshot real data on enter, restore it on exit, so nothing done
  // in dev mode persists. The backup lives in app_meta so it survives a crash.
  enterDevSandbox: () => {
    if (!getMeta(DEV_BACKUP_KEY)) {
      setMeta(DEV_BACKUP_KEY, serializeBackup(getSnapshot()));
    }
    set({ devActive: true });
  },
  leaveDevSandbox: () => {
    const backup = getMeta(DEV_BACKUP_KEY);
    if (backup) {
      replaceAllData(parseBackup(backup));
      setMeta(DEV_BACKUP_KEY, '');
      get().loadData();
    }
    set({ devActive: false });
  },
  // Cold-start safety: if a sandbox backup is left over (app closed mid-session),
  // restore real data so dev changes can never leak out. Caller refreshes after.
  recoverDevOrphan: () => {
    const backup = getMeta(DEV_BACKUP_KEY);
    if (backup) {
      replaceAllData(parseBackup(backup));
      setMeta(DEV_BACKUP_KEY, '');
    }
  },
}));
