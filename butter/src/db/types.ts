// Shared data-layer types, used by both the native (SQLite) and web
// (localStorage) query implementations. Keeping them here avoids a circular
// import: on web, importing from './queries' resolves to queries.web.ts.
import { Category } from '../constants/categories';

export type Expense = {
  id: string;
  amount: number;
  category_id: string;
  note: string | null;
  spent_at: string;
  created_at: string;
};

export type GameState = {
  streak_count: number;
  last_log_date: string | null;
  longest_streak: number;
  total_entries: number;
  coins: number;
  coins_earned_today: number;
};

export type CategoryBreakdownRow = {
  category_id: string;
  total: number;
  count: number;
};

export type BudgetRow = {
  monthly_budget: number | null;
  currency: string;
};

export type GameStateFull = GameState & {
  owned_items: string;
  equipped_items: string;
  story_progress: number;
};

export type Snapshot = {
  expenses: Expense[];
  categories: Category[];
  game_state: GameStateFull;
  budget: BudgetRow;
};
