import { getDb } from './database';
import { Category } from '../constants/categories';
import { todayISO, addDaysISO } from '../lib/date';
import {
  Expense,
  GameState,
  CategoryBreakdownRow,
  BudgetRow,
  GameStateFull,
  Snapshot,
} from './types';

export type { Expense, GameState, CategoryBreakdownRow, BudgetRow, GameStateFull, Snapshot } from './types';

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
    coins: 0,
    coins_earned_today: 0,
  };
}

export function updateGameStateAfterLog(): void {
  const db = getDb();
  const today = todayISO();
  const gs = getGameState();

  let newStreak = gs.streak_count;
  let newLongest = gs.longest_streak;
  let coinsEarned = 5; // base per entry
  let coinsEarnedToday = gs.coins_earned_today;
  const DAILY_CAP = 60;

  const isFirstLogToday = gs.last_log_date !== today;

  if (isFirstLogToday) {
    // Determine streak continuation
    const yesterdayISO = addDaysISO(today, -1);

    if (gs.last_log_date === yesterdayISO) {
      newStreak = gs.streak_count + 1;
    } else if (gs.last_log_date === today) {
      newStreak = gs.streak_count; // already counted
    } else {
      newStreak = 1; // reset
    }
    newLongest = Math.max(newStreak, gs.longest_streak);
    coinsEarned += 10; // first log of day bonus
    coinsEarnedToday = 0; // reset for fresh day
  }

  // Streak bonus
  coinsEarned += Math.floor(5 * (newStreak / 7));

  // Apply daily cap
  const remaining = DAILY_CAP - coinsEarnedToday;
  const actualCoins = Math.min(coinsEarned, Math.max(0, remaining));

  db.runSync(
    `UPDATE game_state SET
      streak_count = ?,
      last_log_date = ?,
      longest_streak = ?,
      total_entries = total_entries + 1,
      coins = coins + ?,
      coins_earned_today = ?
    WHERE id = 1`,
    [newStreak, today, newLongest, actualCoins, coinsEarnedToday + actualCoins]
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
  });
}

/**
 * Merge restore: add expenses + categories from the backup that don't already
 * exist (matched by id). Leaves game_state and budget untouched.
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
