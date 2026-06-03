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
} from '../db/queries';
import { todayISO } from '../lib/date';

export type CelebrationTier = 'normal' | 'big';
export type Celebration = {
  tier: CelebrationTier;
  reason: string | null; // milestone label for the speech bubble (big only)
  coinsEarned: number;
};

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

// Decide the celebration tier by diffing game state across a log.
function computeCelebration(prev: GameState, next: GameState): Celebration {
  const coinsEarned = Math.max(0, next.coins - prev.coins);
  const firstLogToday = prev.last_log_date !== todayISO();
  const hitStreak = STREAK_MILESTONES.includes(next.streak_count) && next.streak_count !== prev.streak_count;
  const newLongest = next.longest_streak > prev.longest_streak && next.longest_streak >= 3;
  const crossedCoins = Math.floor(next.coins / 100) > Math.floor(prev.coins / 100);

  if (hitStreak) return { tier: 'big', reason: `${next.streak_count}-day streak! 🔥`, coinsEarned };
  if (newLongest) return { tier: 'big', reason: `New best streak: ${next.longest_streak} days! ⭐`, coinsEarned };
  if (firstLogToday) return { tier: 'big', reason: 'First log today! 🧈', coinsEarned };
  if (crossedCoins) return { tier: 'big', reason: `${Math.floor(next.coins / 100) * 100} coins! 🪙`, coinsEarned };
  return { tier: 'normal', reason: null, coinsEarned };
}

type ExpenseStore = {
  expenses: Expense[];
  todayTotal: number;
  categories: Category[];
  gameState: GameState;
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
  isAddSheetOpen: false,
  editingExpense: null,
  dataVersion: 0,
  celebrationSignal: 0,
  lastCelebration: { tier: 'normal', reason: null, coinsEarned: 0 },

  loadData: () => {
    const expenses = getRecentExpenses(30);
    const todayTotal = getTodayTotal();
    const categories = getAllCategories();
    const gameState = getGameState();
    set({ expenses, todayTotal, categories, gameState, dataVersion: get().dataVersion + 1 });
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
}));
