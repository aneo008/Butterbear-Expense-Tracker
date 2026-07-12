// v1.5.4/5.6: pure per-month income math. No RN imports — unit-testable.
//
// A month's income = its BASE income + one-off income events (bonuses etc.).
// Base income precedence (v1.5.6): a per-month OVERRIDE ("key in this exact month")
// wins; else the salary_history row with the greatest from_month <= month; else
// `base` — the legacy budget.monthly_budget "salary since forever".
import { SalaryRow, IncomeEvent, IncomeOverride } from '../db/types';

/** Salary effective for a YYYY-MM (excludes overrides + events), or null. */
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

/**
 * Base income for a YYYY-MM — the recurring part before bonuses: a per-month
 * override wins, else the effective salary, else the base. Null when nothing set.
 */
export function baseIncomeForMonth(
  base: number | null,
  salaryHistory: SalaryRow[],
  overrides: IncomeOverride[],
  month: string
): number | null {
  const override = overrides.find(o => o.month === month);
  if (override) return override.amount;
  return salaryForMonth(base, salaryHistory, month);
}

/** Σ income events tagged to a YYYY-MM. */
export function eventsForMonth(events: IncomeEvent[], month: string): IncomeEvent[] {
  return events.filter(e => e.month === month);
}

/**
 * Total income for a YYYY-MM = base income + Σ events. Returns null only when
 * there's no base income AND no events — callers show the "set income" empty state.
 */
export function incomeForMonth(
  base: number | null,
  salaryHistory: SalaryRow[],
  overrides: IncomeOverride[],
  events: IncomeEvent[],
  month: string
): number | null {
  const baseIncome = baseIncomeForMonth(base, salaryHistory, overrides, month);
  const extras = eventsForMonth(events, month).reduce((s, e) => s + e.amount, 0);
  if (baseIncome === null && extras === 0) return null;
  return (baseIncome ?? 0) + extras;
}
