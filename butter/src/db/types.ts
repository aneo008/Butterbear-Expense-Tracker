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
  // JSON number[] of milestone days whose chest was already paid (once-ever).
  claimed_chests: string;
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

// Phase 5 "set-asides": fixed deductions taken off income before spendable
// (tithe, giving to parents = recurring; a big-ticket carve-out = one-off for a month).
// Phase 5b extends recurring set-asides into structured RECURRING PAYMENTS:
// optionally grouped (insurance, subscriptions…) with a billing cycle + due date.
export type AllocationCycle = 'monthly' | 'yearly';

export type Allocation = {
  id: string;
  label: string;
  amount: number;
  note: string | null;
  kind: 'recurring' | 'oneoff';
  month: string | null; // 'YYYY-MM' for one-offs; null for recurring
  // -- recurring-payment fields (all null for one-offs / plain 5a set-asides) --
  group_id: string | null;          // → allocation_groups.id; null = ungrouped
  cycle: AllocationCycle | null;    // recurring only; null treated as 'monthly'
  due_day: number | null;           // 1–31, clamped to month length when computing
  due_month: number | null;         // 1–12, yearly cycle only
  // 1 = informational only: keeps its due date but does NOT reduce Spendable —
  // the escape hatch for payments the user also logs as expenses (double-count).
  info_only: number | null;
  // v1.5.7: recurring PERCENTAGE set-aside (tithe, parents). Non-null ⇒ deducts
  // `percent`% of income for the month; `amount` is ignored. percent_incl_bonus:
  // 1 = % of total income (incl. bonuses); null/0 = % of base income (salary only).
  percent: number | null;
  percent_incl_bonus: number | null;
};

// Phase 5b: user-defined groups for recurring payments (Insurance, Subscriptions…).
export type AllocationGroup = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
};

// v1.5.4 per-month income.
// Salary effective from a month onward — the row with the greatest from_month <= M
// wins for month M; months before all rows fall back to budget.monthly_budget.
// At most ONE row per from_month (enforced on add + merge).
export type SalaryRow = {
  id: string;
  from_month: string; // 'YYYY-MM'
  amount: number;
};

// One-off income tagged to a month (bonus, 13th month, freelance) — many per month.
export type IncomeEvent = {
  id: string;
  label: string;
  amount: number;
  month: string; // 'YYYY-MM'
};

// v1.5.6: explicit per-month income. Wins over salary_history for its month (the
// "key in this exact month" primitive). At most ONE per month (upsert on add/merge).
export type IncomeOverride = {
  id: string;
  month: string; // 'YYYY-MM'
  amount: number;
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
  allocation_groups: AllocationGroup[];
  salary_history: SalaryRow[];
  income_events: IncomeEvent[];
  income_overrides: IncomeOverride[];
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
