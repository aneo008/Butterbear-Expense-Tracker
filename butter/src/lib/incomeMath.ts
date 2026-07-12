// v1.5.4: pure per-month income math. No RN imports — unit-testable.
//
// A month's income = the salary effective for that month + its one-off income
// events (bonuses etc.). Salary = the salary_history row with the greatest
// from_month <= month; months before every row (or with no rows at all) fall
// back to `base` — the legacy budget.monthly_budget "salary since forever".
import { SalaryRow, IncomeEvent } from '../db/types';

/** Salary in effect for a YYYY-MM, or null when nothing is set at all. */
export function salaryForMonth(
  base: number | null,
  salaryHistory: SalaryRow[],
  month: string
): number | null {
  let best: SalaryRow | null = null;
  for (const row of salaryHistory) {
    if (row.from_month <= month && (best === null || row.from_month > best.from_month)) {
      best = row;
    }
  }
  return best ? best.amount : base;
}

/** Σ income events tagged to a YYYY-MM. */
export function eventsForMonth(events: IncomeEvent[], month: string): IncomeEvent[] {
  return events.filter(e => e.month === month);
}

/**
 * Total income for a YYYY-MM. Returns null only when there's no salary AND no
 * events for that month — callers show the "set your income" empty state then.
 */
export function incomeForMonth(
  base: number | null,
  salaryHistory: SalaryRow[],
  events: IncomeEvent[],
  month: string
): number | null {
  const salary = salaryForMonth(base, salaryHistory, month);
  const extras = eventsForMonth(events, month).reduce((s, e) => s + e.amount, 0);
  if (salary === null && extras === 0) return null;
  return (salary ?? 0) + extras;
}
