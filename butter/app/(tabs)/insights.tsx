import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useExpenseStore } from '../../src/store/useExpenseStore';
import {
  getEarliestExpenseMonth,
  getMonthBreakdown,
  getMonthlyTotals,
  getYearBreakdown,
  getTopExpense,
  CategoryBreakdownRow,
  Expense,
} from '../../src/db/queries';
import TrendBars, { TrendPoint } from '../../src/components/TrendBars';
import { currentMonth, monthRange, formatMonthShort, formatMonthLong } from '../../src/lib/date';
import { dedupeColors } from '../../src/lib/colors';
import CategoryDonut, { DonutSegment } from '../../src/components/CategoryDonut';
import { budgetSummary } from '../../src/lib/allocationMath';
import { incomeForMonth, baseIncomeForMonth } from '../../src/lib/incomeMath';
import { yearSummary, YearSummary } from '../../src/lib/yearMath';
import { colors, fonts, radius, cardShadow } from '../../src/constants/theme';

function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

const FALLBACK_CAT = { name: 'Other', icon: '📦', color: colors.textSoft };
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** YYYY-MM exactly n months before the current month. */
function monthsBack(n: number): string {
  const [y, m] = currentMonth().split('-').map(Number);
  const idx = y * 12 + (m - 1) - n;
  const yy = Math.floor(idx / 12);
  const mm = (idx % 12) + 1;
  return `${yy}-${mm < 10 ? '0' + mm : mm}`;
}

export default function InsightsScreen() {
  const categories = useExpenseStore(s => s.categories);
  const dataVersion = useExpenseStore(s => s.dataVersion);
  const income = useExpenseStore(s => s.income);
  const allocations = useExpenseStore(s => s.allocations);
  const salaryHistory = useExpenseStore(s => s.salaryHistory);
  const incomeEvents = useExpenseStore(s => s.incomeEvents);
  const incomeOverrides = useExpenseStore(s => s.incomeOverrides);
  const allocationAmountHistory = useExpenseStore(s => s.allocationAmountHistory);
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [months, setMonths] = useState<string[]>([currentMonth()]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownRow[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);

  // v1.6.2: Month <-> Year scope toggle. Year mode reuses the same visual
  // components (budget card, TrendBars, CategoryDonut) fed by yearMath.ts.
  const [scope, setScope] = useState<'month' | 'year'>('month');
  const [years, setYears] = useState<number[]>([Number(currentMonth().slice(0, 4))]);
  const [selectedYear, setSelectedYear] = useState(Number(currentMonth().slice(0, 4)));
  const [yearSum, setYearSum] = useState<YearSummary | null>(null);
  const [yearBreakdown, setYearBreakdown] = useState<CategoryBreakdownRow[]>([]);
  const [topExpense, setTopExpense] = useState<Expense | null>(null);
  const [prevYearSum, setPrevYearSum] = useState<YearSummary | null>(null);
  const [prevYearBreakdown, setPrevYearBreakdown] = useState<CategoryBreakdownRow[]>([]);

  // Reload month list + breakdown on focus, when the selected month/year/scope
  // changes, and when data mutates (so edits made via the modal sheet show up).
  const reload = useCallback(() => {
    const earliest = getEarliestExpenseMonth();
    // Newest month first (leftmost); older months scroll off to the right.
    setMonths(monthRange(earliest, currentMonth()).reverse());
    setBreakdown(getMonthBreakdown(selectedMonth));
    // 12-month trend ending now; gaps filled with 0 so the axis is continuous.
    const trendStart = monthsBack(11);
    const totals = new Map(getMonthlyTotals(trendStart, currentMonth()).map(r => [r.month, r.total]));
    setTrend(monthRange(trendStart, currentMonth()).map(m => ({ month: m, total: totals.get(m) ?? 0 })));

    // Year chips: earliest data year (expenses OR any income record) through
    // the current year, newest first.
    const incomeMonths = [
      ...salaryHistory.map(s => s.from_month),
      ...incomeOverrides.map(o => o.month),
      ...incomeEvents.map(e => e.month),
      ...allocations.filter(a => a.kind === 'oneoff' && a.month).map(a => a.month as string),
    ];
    const allMonths = earliest ? [earliest, ...incomeMonths] : incomeMonths;
    const curYear = Number(currentMonth().slice(0, 4));
    const earliestYear = allMonths.length ? Math.min(...allMonths.map(m => Number(m.slice(0, 4)))) : curYear;
    const yearList: number[] = [];
    for (let y = curYear; y >= earliestYear; y--) yearList.push(y);
    setYears(yearList);

    if (scope === 'year') {
      const buildYear = (year: number) =>
        yearSummary(year, currentMonth(), {
          base: income,
          salaryHistory,
          overrides: incomeOverrides,
          events: incomeEvents,
          allocations,
          allocationAmountHistory,
          monthlyTotals: getMonthlyTotals(`${year}-01`, `${year}-12`),
        });
      setYearSum(buildYear(selectedYear));
      setYearBreakdown(getYearBreakdown(selectedYear));
      setTopExpense(getTopExpense(`${selectedYear}-01-01`, `${selectedYear}-12-31`));
      setPrevYearSum(buildYear(selectedYear - 1));
      setPrevYearBreakdown(getYearBreakdown(selectedYear - 1));
    }
  }, [selectedMonth, dataVersion, scope, selectedYear, income, allocations, salaryHistory, incomeEvents, incomeOverrides, allocationAmountHistory]);

  useFocusEffect(reload);

  /** Year-mode trend bar tap: jump straight to that month. */
  const drillToMonth = (month: string) => {
    setSelectedMonth(month);
    setScope('month');
  };

  const catInfo = useCallback(
    (id: string) => categories.find(c => c.id === id) ?? FALLBACK_CAT,
    [categories]
  );

  const total = breakdown.reduce((s, r) => s + r.total, 0);
  // Keep category colors but ensure every slice in this month is distinct.
  const chartColors = dedupeColors(breakdown.map(r => catInfo(r.category_id).color));
  const segments: DonutSegment[] = breakdown.map((r, i) => ({
    key: r.category_id,
    value: r.total,
    color: chartColors[i],
  }));

  // v1.6.2: year-mode derived values — cheap, only rendered when scope === 'year'.
  const yearTotal = yearBreakdown.reduce((s, r) => s + r.total, 0);
  const yearChartColors = dedupeColors(yearBreakdown.map(r => catInfo(r.category_id).color));
  const yearSegments: DonutSegment[] = yearBreakdown.map((r, i) => ({
    key: r.category_id,
    value: r.total,
    color: yearChartColors[i],
  }));

  // Trend bars always span the full Jan–Dec of the selected year (un-elapsed
  // months of the current year simply show as 0, same visual language as the
  // existing 12-month spending trend) — the elapsed-months rule only governs
  // the yearSum TOTALS, not the chart's x-axis.
  const yearMonthRange = monthRange(`${selectedYear}-01`, `${selectedYear}-12`);
  const yearIncomeByMonth = new Map((yearSum?.months ?? []).map(m => [m.month, m.income]));
  const yearSpentByMonth = new Map((yearSum?.months ?? []).map(m => [m.month, m.spent]));
  const incomeTrendPoints: TrendPoint[] = yearMonthRange.map(m => ({ month: m, total: yearIncomeByMonth.get(m) ?? 0 }));
  const spendTrendPoints: TrendPoint[] = yearMonthRange.map(m => ({ month: m, total: yearSpentByMonth.get(m) ?? 0 }));

  const yearPct = yearSum && yearSum.spendable > 0
    ? Math.min(1, yearSum.spent / yearSum.spendable)
    : (yearSum && yearSum.spent > 0 ? 1 : 0);
  const yearOver = !!yearSum && yearSum.remaining < 0;

  const monthsWithSpend = (yearSum?.months ?? []).filter(m => m.spent > 0);
  const biggestMonth = monthsWithSpend.length
    ? monthsWithSpend.reduce((a, b) => (b.spent > a.spent ? b : a))
    : null;
  const smallestMonth = monthsWithSpend.length
    ? monthsWithSpend.reduce((a, b) => (b.spent < a.spent ? b : a))
    : null;

  // Gate on `years` (built from actual RECORDED dates: expenses, salary rows,
  // overrides, events, one-offs) rather than prevYearSum.income > 0 alone —
  // a base income set with "Always" scope applies retroactively forever, so
  // it alone would make every prior year look like it "has data".
  const earliestDataYear = years.length ? years[years.length - 1] : selectedYear;
  const hasPrevYearData =
    !!prevYearSum && selectedYear - 1 >= earliestDataYear && (prevYearBreakdown.length > 0 || prevYearSum.income > 0);
  const { up: shiftUp, down: shiftDown } = (() => {
    if (!hasPrevYearData) return { up: [] as { id: string; shift: number }[], down: [] as { id: string; shift: number }[] };
    const prevTotal = prevYearBreakdown.reduce((s, r) => s + r.total, 0);
    const ids = new Set([...yearBreakdown.map(r => r.category_id), ...prevYearBreakdown.map(r => r.category_id)]);
    const rows = Array.from(ids).map(id => {
      const cur = yearBreakdown.find(r => r.category_id === id)?.total ?? 0;
      const prev = prevYearBreakdown.find(r => r.category_id === id)?.total ?? 0;
      const curPct = yearTotal > 0 ? (cur / yearTotal) * 100 : 0;
      const prevPct = prevTotal > 0 ? (prev / prevTotal) * 100 : 0;
      return { id, shift: curPct - prevPct };
    });
    return {
      up: [...rows].filter(r => r.shift > 0).sort((a, b) => b.shift - a.shift).slice(0, 2),
      down: [...rows].filter(r => r.shift < 0).sort((a, b) => a.shift - b.shift).slice(0, 2),
    };
  })();
  const overspendMonths = (yearSum?.months ?? []).filter(m => m.remaining < 0).length;
  const committedTrendText = (() => {
    if (!yearSum || yearSum.months.length < 2) return null;
    const first = yearSum.months[0];
    const last = yearSum.months[yearSum.months.length - 1];
    if (first.income <= 0 || last.income <= 0) return null;
    const firstPct = (first.setAside / first.income) * 100;
    const lastPct = (last.setAside / last.income) * 100;
    return `${formatMonthShort(first.month)} ${firstPct.toFixed(0)}% → ${formatMonthShort(last.month)} ${lastPct.toFixed(0)}%`;
  })();

  return (
    <SafeAreaView style={styles.container}>
      {/* v1.6.2: Month <-> Year scope toggle */}
      <View style={styles.scopeRow}>
        <TouchableOpacity
          accessibilityLabel="scope-month"
          onPress={() => setScope('month')}
          style={[styles.scopeBtn, scope === 'month' && styles.scopeBtnActive]}
        >
          <Text selectable={false} style={[styles.scopeBtnText, scope === 'month' && styles.scopeBtnTextActive]}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="scope-year"
          onPress={() => setScope('year')}
          style={[styles.scopeBtn, scope === 'year' && styles.scopeBtnActive]}
        >
          <Text selectable={false} style={[styles.scopeBtnText, scope === 'year' && styles.scopeBtnTextActive]}>Year</Text>
        </TouchableOpacity>
      </View>

      {/* Month or Year strip */}
      <View style={styles.stripWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {scope === 'month'
            ? months.map(m => {
                const active = m === selectedMonth;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMonth(m)}
                    style={[styles.monthChip, active && styles.monthChipActive]}
                  >
                    <Text style={[styles.monthChipText, active && styles.monthChipTextActive]}>
                      {formatMonthShort(m)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            : years.map(y => {
                const active = y === selectedYear;
                return (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setSelectedYear(y)}
                    style={[styles.monthChip, active && styles.monthChipActive]}
                  >
                    <Text style={[styles.monthChipText, active && styles.monthChipTextActive]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                );
              })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {scope === 'month' ? (
        <>
        {/* Budget analysis (Phase 5c; v1.5.4: income is per-month — salary history + bonuses) */}
        {(() => {
          const monthIncome = incomeForMonth(income, salaryHistory, incomeOverrides, incomeEvents, selectedMonth);
          return monthIncome === null ? (
          <TouchableOpacity
            style={styles.budgetEmpty}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/money', params: { month: selectedMonth } } as any)}
          >
            <Text selectable={false} style={styles.budgetEmptyText}>
              💰 Set your income to unlock budget insights ›
            </Text>
          </TouchableOpacity>
        ) : (() => {
          const monthBase = baseIncomeForMonth(income, salaryHistory, incomeOverrides, selectedMonth);
          const s = budgetSummary({ base: monthBase, total: monthIncome }, allocations, selectedMonth, total, allocationAmountHistory);
          const pct = s.spendable > 0 ? Math.min(1, s.spent / s.spendable) : (s.spent > 0 ? 1 : 0);
          const over = s.remaining < 0;
          return (
            <TouchableOpacity
              style={styles.budgetCard}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/money', params: { month: selectedMonth } } as any)}
            >
              <View style={styles.budgetTopRow}>
                <View style={styles.budgetCell}>
                  <Text selectable={false} style={styles.budgetCellLabel}>Income</Text>
                  <Text selectable={false} style={styles.budgetCellValue}>{formatCurrency(s.income)}</Text>
                </View>
                <View style={styles.budgetCell}>
                  <Text selectable={false} style={styles.budgetCellLabel}>Set aside</Text>
                  <Text selectable={false} style={styles.budgetCellValue}>{formatCurrency(s.setAside)}</Text>
                </View>
                <View style={styles.budgetCell}>
                  <Text selectable={false} style={styles.budgetCellLabel}>Spendable</Text>
                  <Text selectable={false} style={styles.budgetCellValue}>{formatCurrency(s.spendable)}</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${pct * 100}%` },
                    over && styles.progressOver,
                  ]}
                />
              </View>

              <View style={styles.budgetBottomRow}>
                <Text selectable={false} style={styles.budgetSpent}>
                  Spent {formatCurrency(s.spent)}
                </Text>
                <Text selectable={false} style={[styles.budgetRemaining, over && styles.budgetOverText]}>
                  {over
                    ? `Over by ${formatCurrency(-s.remaining)}`
                    : `Remaining ${formatCurrency(s.remaining)}`}
                </Text>
              </View>
              {!over && s.income > 0 && (
                <Text selectable={false} style={styles.savingsRate}>
                  On track to save {(s.savingsRate * 100).toFixed(0)}% of income 🧈
                </Text>
              )}
            </TouchableOpacity>
          );
        })();
        })()}

        {/* 12-month trend (Phase 5e) — hidden until there's a second month of data */}
        {trend.filter(p => p.total > 0).length >= 2 && (
          <View style={styles.trendCard}>
            <Text selectable={false} style={styles.trendTitle}>Last 12 months</Text>
            <TrendBars points={trend} selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />
          </View>
        )}

        {/* Donut */}
        <View style={styles.donutCard}>
          <Text style={styles.monthLabel}>{formatMonthLong(selectedMonth)}</Text>
          <CategoryDonut
            segments={segments}
            total={total}
            size={210}
            strokeWidth={30}
            accessibilityLabel={
              breakdown.length === 0
                ? `${formatMonthLong(selectedMonth)}: nothing logged`
                : `${formatMonthLong(selectedMonth)}: SGD ${total.toFixed(2)} across ${breakdown.length} ${breakdown.length === 1 ? 'category' : 'categories'}; most spent on ${catInfo(breakdown[0].category_id).name}`
            }
          />
        </View>

        {/* Legend / breakdown */}
        {breakdown.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nothing logged in</Text>
            <Text style={styles.emptyText}>{formatMonthLong(selectedMonth)} 🧈</Text>
          </View>
        ) : (
          <View style={styles.legend}>
            {breakdown.map((row, i) => {
              const cat = catInfo(row.category_id);
              const pct = total > 0 ? (row.total / total) * 100 : 0;
              return (
                <TouchableOpacity
                  key={row.category_id}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/category/[categoryId]',
                      params: { categoryId: row.category_id, month: selectedMonth },
                    })
                  }
                  style={styles.legendRow}
                >
                  <View style={[styles.dot, { backgroundColor: chartColors[i] }]}>
                    <Text style={styles.icon}>{cat.icon}</Text>
                  </View>
                  <View style={styles.legendMid}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catCount}>
                      {row.count} {row.count === 1 ? 'entry' : 'entries'}
                    </Text>
                  </View>
                  <View style={styles.legendRight}>
                    <Text style={styles.catTotal}>SGD {formatCurrency(row.total)}</Text>
                    <Text style={styles.catPct}>{pct.toFixed(0)}%</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        </>
        ) : (
        <>
        {/* v1.6.2: Year budget card */}
        {yearSum && (yearSum.income > 0 ? (
          <View style={styles.budgetCard}>
            <View style={styles.budgetTopRow}>
              <View style={styles.budgetCell}>
                <Text selectable={false} style={styles.budgetCellLabel}>Income</Text>
                <Text selectable={false} style={styles.budgetCellValue}>{formatCurrency(yearSum.income)}</Text>
              </View>
              <View style={styles.budgetCell}>
                <Text selectable={false} style={styles.budgetCellLabel}>Set aside</Text>
                <Text selectable={false} style={styles.budgetCellValue}>{formatCurrency(yearSum.setAside)}</Text>
              </View>
              <View style={styles.budgetCell}>
                <Text selectable={false} style={styles.budgetCellLabel}>Spendable</Text>
                <Text selectable={false} style={styles.budgetCellValue}>{formatCurrency(yearSum.spendable)}</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${yearPct * 100}%` }, yearOver && styles.progressOver]} />
            </View>
            <View style={styles.budgetBottomRow}>
              <Text selectable={false} style={styles.budgetSpent}>Spent {formatCurrency(yearSum.spent)}</Text>
              <Text selectable={false} style={[styles.budgetRemaining, yearOver && styles.budgetOverText]}>
                {yearOver ? `Over by ${formatCurrency(-yearSum.remaining)}` : `Remaining ${formatCurrency(yearSum.remaining)}`}
              </Text>
            </View>
            {!yearOver && (
              <Text selectable={false} style={styles.savingsRate}>
                On track to save {(yearSum.savingsRate * 100).toFixed(0)}% of income 🧈
              </Text>
            )}
            <Text selectable={false} style={styles.yearElapsedNote}>
              {yearSum.elapsedMonths < 12
                ? `Jan–${MONTH_ABBR[yearSum.elapsedMonths - 1]} ${yearSum.year} so far`
                : `Full year ${yearSum.year}`}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.budgetEmpty}
            activeOpacity={0.7}
            onPress={() => router.push('/money' as any)}
          >
            <Text selectable={false} style={styles.budgetEmptyText}>
              💰 Set your income to unlock budget insights ›
            </Text>
          </TouchableOpacity>
        ))}

        {/* Income & spending trends — tap a bar to jump to that month */}
        {yearSum && incomeTrendPoints.some(p => p.total > 0) && (
          <View style={styles.trendCard}>
            <Text selectable={false} style={styles.trendTitle}>Income by month</Text>
            <TrendBars points={incomeTrendPoints} selectedMonth="" onSelectMonth={drillToMonth} />
          </View>
        )}
        {yearSum && spendTrendPoints.some(p => p.total > 0) && (
          <View style={styles.trendCard}>
            <Text selectable={false} style={styles.trendTitle}>Spending by month</Text>
            <TrendBars points={spendTrendPoints} selectedMonth="" onSelectMonth={drillToMonth} />
          </View>
        )}

        {/* Category year donut */}
        <View style={styles.donutCard}>
          <Text style={styles.monthLabel}>{selectedYear}</Text>
          <CategoryDonut
            segments={yearSegments}
            total={yearTotal}
            size={210}
            strokeWidth={30}
            accessibilityLabel={
              yearBreakdown.length === 0
                ? `${selectedYear}: nothing logged`
                : `${selectedYear}: SGD ${yearTotal.toFixed(2)} across ${yearBreakdown.length} ${yearBreakdown.length === 1 ? 'category' : 'categories'}; most spent on ${catInfo(yearBreakdown[0].category_id).name}`
            }
          />
        </View>

        {/* Legend — display only in year mode; drill-down stays a month-mode feature */}
        {yearBreakdown.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nothing logged in</Text>
            <Text style={styles.emptyText}>{selectedYear} 🧈</Text>
          </View>
        ) : (
          <View style={styles.legend}>
            {yearBreakdown.map((row, i) => {
              const cat = catInfo(row.category_id);
              const pct = yearTotal > 0 ? (row.total / yearTotal) * 100 : 0;
              const elapsed = yearSum?.elapsedMonths || 1;
              const avgPerMonth = row.total / elapsed;
              return (
                <View key={row.category_id} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: yearChartColors[i] }]}>
                    <Text style={styles.icon}>{cat.icon}</Text>
                  </View>
                  <View style={styles.legendMid}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catCount}>
                      {row.count} {row.count === 1 ? 'entry' : 'entries'} · avg SGD {avgPerMonth.toFixed(2)}/mo
                    </Text>
                  </View>
                  <View style={styles.legendRight}>
                    <Text style={styles.catTotal}>SGD {formatCurrency(row.total)}</Text>
                    <Text style={styles.catPct}>{pct.toFixed(0)}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Highlights */}
        {yearSum && (biggestMonth || smallestMonth || yearBreakdown.length > 0 || topExpense || yearSum.bonuses.count > 0 || yearSum.oneoffs.count > 0 || yearSum.setAside > 0) && (
          <View style={styles.highlightsCard}>
            <Text selectable={false} style={styles.highlightsTitle}>Highlights</Text>
            {biggestMonth && (
              <Text selectable={false} style={styles.highlightRow}>
                📈 Biggest month: {formatMonthShort(biggestMonth.month)} · SGD {formatCurrency(biggestMonth.spent)}
              </Text>
            )}
            {smallestMonth && smallestMonth.month !== biggestMonth?.month && (
              <Text selectable={false} style={styles.highlightRow}>
                📉 Lightest month: {formatMonthShort(smallestMonth.month)} · SGD {formatCurrency(smallestMonth.spent)}
              </Text>
            )}
            {yearBreakdown.length > 0 && (
              <Text selectable={false} style={styles.highlightRow}>
                🏆 Top category: {catInfo(yearBreakdown[0].category_id).icon} {catInfo(yearBreakdown[0].category_id).name} · SGD {formatCurrency(yearBreakdown[0].total)}
              </Text>
            )}
            {topExpense && (
              <Text selectable={false} style={styles.highlightRow}>
                💥 Biggest expense: SGD {formatCurrency(topExpense.amount)} · {catInfo(topExpense.category_id).name} · {formatMonthShort(topExpense.spent_at.slice(0, 7))}
              </Text>
            )}
            {yearSum.bonuses.count > 0 && (
              <Text selectable={false} style={styles.highlightRow}>
                🎁 Bonuses: {yearSum.bonuses.count} · SGD {formatCurrency(yearSum.bonuses.total)} total
              </Text>
            )}
            {yearSum.oneoffs.count > 0 && (
              <Text selectable={false} style={styles.highlightRow}>
                🎯 One-offs: {yearSum.oneoffs.count} · SGD {formatCurrency(yearSum.oneoffs.total)} total
              </Text>
            )}
            {yearSum.setAside > 0 && (
              <Text selectable={false} style={styles.highlightRow}>
                🔁 Set aside: SGD {formatCurrency(yearSum.commitment.recurring)} recurring · SGD {formatCurrency(yearSum.commitment.yearlyDue)} yearly · SGD {formatCurrency(yearSum.commitment.oneoffs)} one-off
              </Text>
            )}
          </View>
        )}

        {/* Compared to last year */}
        {hasPrevYearData && (
          <View style={styles.highlightsCard}>
            <Text selectable={false} style={styles.highlightsTitle}>Compared to {selectedYear - 1}</Text>
            {shiftUp.length > 0 && (
              <Text selectable={false} style={styles.highlightRow}>
                ⬆️ Up: {shiftUp.map(r => `${catInfo(r.id).name} (+${r.shift.toFixed(0)}pp)`).join(', ')}
              </Text>
            )}
            {shiftDown.length > 0 && (
              <Text selectable={false} style={styles.highlightRow}>
                ⬇️ Down: {shiftDown.map(r => `${catInfo(r.id).name} (${r.shift.toFixed(0)}pp)`).join(', ')}
              </Text>
            )}
            <Text selectable={false} style={styles.highlightRow}>
              {overspendMonths === 0 ? '✅ No overspent months' : `⚠️ Overspent in ${overspendMonths} month${overspendMonths === 1 ? '' : 's'}`}
            </Text>
            {committedTrendText && (
              <Text selectable={false} style={styles.highlightRow}>🔒 Committed vs free: {committedTrendText}</Text>
            )}
            {yearSum && yearSum.income > 0 && (
              <Text selectable={false} style={styles.highlightRow}>
                🎁 Bonus dependency: {((yearSum.bonuses.total / yearSum.income) * 100).toFixed(0)}% of income
              </Text>
            )}
          </View>
        )}
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCream },

  // v1.6.2: Month <-> Year scope toggle
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  scopeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bearBody,
  },
  scopeBtnActive: { backgroundColor: colors.textBrown, borderColor: colors.textBrown },
  scopeBtnText: { fontSize: 13, color: colors.textBrown, fontWeight: '700' },
  scopeBtnTextActive: { color: colors.bgCream },

  stripWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  strip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bearBody,
    marginRight: 8,
  },
  monthChipActive: { backgroundColor: colors.butter, borderColor: colors.butter },
  monthChipText: { fontSize: 13, color: colors.textBrown, fontWeight: '500' },
  monthChipTextActive: { fontWeight: '800' },

  body: { paddingBottom: 32 },

  // Budget analysis card (Phase 5c)
  budgetCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: 18,
    shadowColor: colors.bearShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetEmpty: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.bearBody,
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  budgetEmptyText: { fontSize: 13, color: colors.textSoft, fontWeight: '600' },
  budgetTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetCell: { flex: 1, alignItems: 'center' },
  budgetCellLabel: { fontSize: 11, color: colors.textSoft, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  budgetCellValue: { fontSize: 16, color: colors.textBrown, fontWeight: '800', marginTop: 2 },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3EAD8',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.butter },
  progressOver: { backgroundColor: '#E8837C' },
  budgetBottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  budgetSpent: { fontSize: 13, color: colors.textBrown, fontWeight: '600' },
  budgetRemaining: { fontSize: 13, color: '#3C8C4C', fontWeight: '700' },
  budgetOverText: { color: '#C0392B' },
  savingsRate: { fontSize: 12, color: colors.textSoft, marginTop: 8, textAlign: 'center', fontWeight: '500' },
  // v1.6.2: year budget card elapsed-months footnote
  yearElapsedNote: { fontSize: 11, color: colors.textSoft, marginTop: 4, textAlign: 'center' },

  trendCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: colors.bearShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  trendTitle: {
    fontSize: 11,
    color: colors.textSoft,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },

  donutCard: {
    margin: 20,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: colors.bearShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  monthLabel: { fontSize: 15, color: colors.textSoft, fontWeight: '600' },

  empty: { alignItems: 'center', marginTop: 24 },
  emptyText: { fontSize: 15, color: colors.textSoft, textAlign: 'center', lineHeight: 22 },

  legend: { paddingHorizontal: 20 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: colors.bearShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  legendMid: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '600', color: colors.textBrown },
  catCount: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  legendRight: { alignItems: 'flex-end' },
  catTotal: { fontSize: 15, fontWeight: '700', color: colors.textBrown },
  catPct: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.bearShadow, marginLeft: 4, fontWeight: '300' },

  // v1.6.2: year-mode Highlights / Compared-to-last-year cards
  highlightsCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: 18,
    gap: 8,
    shadowColor: colors.bearShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  highlightsTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.textBrown,
    marginBottom: 2,
  },
  highlightRow: { fontSize: 13, color: colors.textBrown, lineHeight: 19 },
});

