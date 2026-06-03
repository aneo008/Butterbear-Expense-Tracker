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
  // Butter's celebration burst. Home watches this and ignores the initial 0.
  celebrationSignal: number;

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

  loadData: () => {
    const expenses = getRecentExpenses(30);
    const todayTotal = getTodayTotal();
    const categories = getAllCategories();
    const gameState = getGameState();
    set({ expenses, todayTotal, categories, gameState, dataVersion: get().dataVersion + 1 });
  },

  addExpense: (expense) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    insertExpense({ ...expense, id });
    updateGameStateAfterLog();
    get().loadData();
    set({ celebrationSignal: get().celebrationSignal + 1 });
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
