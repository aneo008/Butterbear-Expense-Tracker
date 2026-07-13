// v1.6.2: pure yearly-analytics math. No RN imports — unit-testable.
//
// Elapsed-months rule: the CURRENT year only aggregates Jan..the given "today"
// month (never projects unset future income/set-asides as zero-and-average);
// past years always use all 12. Callers pass `todayMonth` explicitly so this
// file stays pure (mirrors incomeMath/allocationMath taking month strings,
// not calling date.ts themselves).
import { Allocation, SalaryRow, IncomeEvent, IncomeOverride } from '../db/types';
import { incomeForMonth, baseIncomeForMonth } from './incomeMath';
import { monthCommitment, MonthIncome } from './allocationMath';

const pad = (n: number) => String(n).padStart(2, '0');

export type YearMonthPoint = {
  month: string; // YYYY-MM
  income: number;
  setAside: number;
  spent: number;
  spendable: number; // income - setAside
  remaining: number; // spendable - spent
};

export type YearSummary = {
  year: number;
  months: YearMonthPoint[]; // Jan..elapsedMonths, chronological
  elapsedMonths: number; // 1-12
  income: number;
  setAside: number;
  spent: number;
  spendable: number;
  remaining: number;
  savingsRate: number; // remaining / income; 0 when income is 0
  bonuses: { count: number; total: number };
  // ALL one-off allocations tagged within the elapsed months (incl. info-only
  // ones) — a display fact for Highlights, not a budget-math component. The
  // money actually deducted from spendable is `commitment.oneoffs` below.
  oneoffs: { count: number; total: number };
  commitment: { recurring: number; yearlyDue: number; oneoffs: number }; // sums to `setAside`
};

export type YearSummaryInput = {
  base: number | null;
  salaryHistory: SalaryRow[];
  overrides: IncomeOverride[];
  events: IncomeEvent[];
  allocations: Allocation[];
  monthlyTotals: { month: string; total: number }[]; // spend per month (any range covering this year)
};

export function yearSummary(year: number, todayMonth: string, input: YearSummaryInput): YearSummary {
  const currentYear = Number(todayMonth.slice(0, 4));
  const elapsedMonths = year === currentYear ? Number(todayMonth.slice(5, 7)) : 12;
  const spentByMonth = new Map(input.monthlyTotals.map(r => [r.month, r.total]));

  const months: YearMonthPoint[] = [];
  let income = 0, setAside = 0, spent = 0;
  let recurring = 0, yearlyDue = 0, commitOneoffs = 0;

  for (let m = 1; m <= elapsedMonths; m++) {
    const month = `${year}-${pad(m)}`;
    const monthTotal = incomeForMonth(input.base, input.salaryHistory, input.overrides, input.events, month) ?? 0;
    const monthBase = baseIncomeForMonth(input.base, input.salaryHistory, input.overrides, month);
    const monthIncome: MonthIncome = { base: monthBase, total: monthTotal };
    const commit = monthCommitment(input.allocations, month, monthIncome);
    const monthSpent = spentByMonth.get(month) ?? 0;
    const monthSpendable = monthTotal - commit.setAside;

    months.push({
      month,
      income: monthTotal,
      setAside: commit.setAside,
      spent: monthSpent,
      spendable: monthSpendable,
      remaining: monthSpendable - monthSpent,
    });

    income += monthTotal;
    setAside += commit.setAside;
    spent += monthSpent;
    recurring += commit.recurring;
    yearlyDue += commit.yearlyDue;
    commitOneoffs += commit.oneoffs;
  }

  const spendable = income - setAside;
  const remaining = spendable - spent;

  const startMonth = `${year}-01`;
  const endMonth = `${year}-${pad(elapsedMonths)}`;
  const yearEvents = input.events.filter(e => e.month >= startMonth && e.month <= endMonth);
  const yearOneoffAllocs = input.allocations.filter(
    a => a.kind === 'oneoff' && a.month != null && a.month >= startMonth && a.month <= endMonth
  );

  return {
    year,
    months,
    elapsedMonths,
    income,
    setAside,
    spent,
    spendable,
    remaining,
    savingsRate: income > 0 ? remaining / income : 0,
    bonuses: {
      count: yearEvents.length,
      total: yearEvents.reduce((s, e) => s + e.amount, 0),
    },
    oneoffs: {
      count: yearOneoffAllocs.length,
      total: yearOneoffAllocs.reduce((s, a) => s + a.amount, 0),
    },
    commitment: { recurring, yearlyDue, oneoffs: commitOneoffs },
  };
}
