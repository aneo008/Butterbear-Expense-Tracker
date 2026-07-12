// Phase 5b: pure budget/recurring-payment math. No RN imports — unit-testable.
//
// Model (see src/db/types.ts Allocation):
// - kind 'recurring' + cycle 'monthly' (or null, the 5a default) → applies every month.
// - kind 'recurring' + cycle 'yearly' → applies ONCE a year, in its due_month.
//   It deducts from spendable IN THAT MONTH ONLY (cash-flow-true, mirroring the
//   one-off philosophy); monthlyEquivalent() is informational display only.
// - kind 'oneoff' → tagged to a single YYYY-MM via `month`.
import { Allocation } from '../db/types';

/** Days in a month. `month` is 1–12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Clamp a due day (1–31) into a real date within year/month (1–12). */
function clampedISO(year: number, month: number, day: number): string {
  const d = Math.min(Math.max(1, day), daysInMonth(year, month));
  return `${year}-${pad(month)}-${pad(d)}`;
}

/**
 * Next due date (YYYY-MM-DD) for a recurring payment, ON or AFTER todayISO.
 * Returns null for one-offs and recurring items with no due_day set.
 * Monthly: this month's due day if not yet past, else next month (day clamped).
 * Yearly: this year's due_month/due_day if not yet past, else next year.
 */
export function nextDueISO(a: Allocation, todayISO: string): string | null {
  if (a.kind !== 'recurring' || a.due_day == null) return null;
  const year = Number(todayISO.slice(0, 4));
  const monthNum = Number(todayISO.slice(5, 7));

  if (a.cycle === 'yearly') {
    if (a.due_month == null) return null;
    const thisYear = clampedISO(year, a.due_month, a.due_day);
    return thisYear >= todayISO ? thisYear : clampedISO(year + 1, a.due_month, a.due_day);
  }

  // monthly (cycle 'monthly' or null = 5a default)
  const thisMonth = clampedISO(year, monthNum, a.due_day);
  if (thisMonth >= todayISO) return thisMonth;
  const nextY = monthNum === 12 ? year + 1 : year;
  const nextM = monthNum === 12 ? 1 : monthNum + 1;
  return clampedISO(nextY, nextM, a.due_day);
}

/** The monthly-equivalent cost of a recurring payment (yearly ÷ 12). Display only. */
export function monthlyEquivalent(a: Allocation): number {
  if (a.kind !== 'recurring') return 0;
  return a.cycle === 'yearly' ? a.amount / 12 : a.amount;
}

export type MonthCommitment = {
  recurring: number;  // Σ monthly recurring
  yearlyDue: number;  // Σ yearly payments whose due_month falls in this month
  oneoffs: number;    // Σ one-offs tagged to this month
  setAside: number;   // total deducted from income for this month
};

// v1.5.7: a month's income split, so percentage set-asides can be computed.
export type MonthIncome = {
  base: number | null;  // salary/override, excl. bonuses
  total: number | null; // base + bonuses
};

const NO_INCOME: MonthIncome = { base: null, total: null };

/**
 * What THIS allocation deducts in the given month: a percentage set-aside resolves
 * to `percent%` of its chosen income base (0 when that income is unknown); anything
 * else is its fixed `amount`. Used by monthCommitment + the Money row display.
 */
export function allocationAmountForMonth(a: Allocation, income: MonthIncome = NO_INCOME): number {
  if (a.percent != null) {
    const basis = a.percent_incl_bonus ? income.total : income.base;
    return basis != null ? (a.percent / 100) * basis : 0;
  }
  return a.amount;
}

/** What's already spoken for in a given YYYY-MM. `income` needed for % set-asides. */
export function monthCommitment(
  allocations: Allocation[],
  month: string,
  income: MonthIncome = NO_INCOME
): MonthCommitment {
  const monthNum = Number(month.slice(5, 7));
  let recurring = 0;
  let yearlyDue = 0;
  let oneoffs = 0;
  for (const a of allocations) {
    if (a.info_only) continue; // informational: has a due date, never reduces spendable
    if (a.kind === 'oneoff') {
      if (a.month === month) oneoffs += a.amount;
    } else if (a.cycle === 'yearly') {
      if (a.due_month === monthNum) yearlyDue += a.amount;
    } else {
      recurring += allocationAmountForMonth(a, income); // monthly fixed OR percentage
    }
  }
  return { recurring, yearlyDue, oneoffs, setAside: recurring + yearlyDue + oneoffs };
}

export type BudgetSummary = {
  income: number;
  setAside: number;
  spendable: number;   // income − setAside
  spent: number;
  remaining: number;   // spendable − spent
  savingsRate: number; // remaining / income (0 when income is 0)
};

/** The Insights analysis-card numbers for a month. Pass the income split so % set-asides resolve. */
export function budgetSummary(
  income: MonthIncome,
  allocations: Allocation[],
  month: string,
  spent: number
): BudgetSummary {
  const total = income.total ?? 0;
  const { setAside } = monthCommitment(allocations, month, income);
  const spendable = total - setAside;
  const remaining = spendable - spent;
  return {
    income: total,
    setAside,
    spendable,
    spent,
    remaining,
    savingsRate: total > 0 ? remaining / total : 0,
  };
}

/** "due 15th" (monthly) / "due 3 Nov" (yearly) row label; null when no due date. */
export function dueLabel(a: Allocation): string | null {
  if (a.kind !== 'recurring' || a.due_day == null) return null;
  if (a.cycle === 'yearly') {
    if (a.due_month == null) return null;
    const monthName = new Date(2000, a.due_month - 1, 1).toLocaleString('en-SG', { month: 'short' });
    return `due ${a.due_day} ${monthName}`;
  }
  return `due ${ordinal(a.due_day)}`;
}

export function ordinal(n: number): string {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
}
