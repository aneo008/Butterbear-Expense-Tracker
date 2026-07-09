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
  // Phase 5: this dormant column is reused as the user's MONTHLY INCOME (the DB
  // column keeps its legacy name `monthly_budget` to avoid a migration).
  monthly_budget: number | null;
  currency: string;
};

// Phase 5 "set-asides": fixed monthly deductions taken off income before spendable
// (tithe, giving to parents = recurring; a big-ticket carve-out = one-off for a month).
export type Allocation = {
  id: string;
  label: string;
  amount: number;
  note: string | null;
  kind: 'recurring' | 'oneoff';
  month: string | null; // 'YYYY-MM' for one-offs; null for recurring
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
  allocations: Allocation[];
};

// Dev-only: directly patch game_state fields (used by the developer panel).
export type DevPatch = Partial<{
  coins: number;
  streak_count: number;
  longest_streak: number;
  last_log_date: string | null;
  coins_earned_today: number;
  owned_items: string;     // JSON array string
  equipped_items: string;  // JSON object string
}>;
