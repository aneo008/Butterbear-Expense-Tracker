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
  equipItem as equipItemQuery,
  unequipItem as unequipItemQuery,
  equipLook as equipLookQuery,
} from '../db/queries';
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
  equipItem: (itemId: string, slot: Slot) => void;
  unequipItem: (slot: Slot) => void;
  equipLook: (equipped: EquippedMap) => void;
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
  isAddSheetOpen: false,
  editingExpense: null,
  dataVersion: 0,
  celebrationSignal: 0,
  lastCelebration: { tier: 'normal', reason: null, coinsEarned: 0, capReached: false, chestCoins: 0 },

  loadData: () => {
    const expenses = getRecentExpenses(30);
    const todayTotal = getTodayTotal();
    const categories = getAllCategories();
    const gameState = getGameState();
    const ownedItems = getOwnedItems();
    const equippedItems = getEquippedItems();
    set({ expenses, todayTotal, categories, gameState, ownedItems, equippedItems, dataVersion: get().dataVersion + 1 });
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
}));
