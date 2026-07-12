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
  CategoryBreakdownRow,
} from '../../src/db/queries';
import TrendBars, { TrendPoint } from '../../src/components/TrendBars';
import { currentMonth, monthRange, formatMonthShort, formatMonthLong } from '../../src/lib/date';
import { dedupeColors } from '../../src/lib/colors';
import CategoryDonut, { DonutSegment } from '../../src/components/CategoryDonut';
import { budgetSummary } from '../../src/lib/allocationMath';
import { incomeForMonth, baseIncomeForMonth } from '../../src/lib/incomeMath';
import { colors } from '../../src/constants/theme';

function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

const FALLBACK_CAT = { name: 'Other', icon: '📦', color: colors.textSoft };

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
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [months, setMonths] = useState<string[]>([currentMonth()]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownRow[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);

  // Reload month list + breakdown on focus, when the selected month changes,
  // and when data mutates (so edits made via the modal sheet show up).
  const reload = useCallback(() => {
    const earliest = getEarliestExpenseMonth();
    // Newest month first (leftmost); older months scroll off to the right.
    setMonths(monthRange(earliest, currentMonth()).reverse());
    setBreakdown(getMonthBreakdown(selectedMonth));
    // 12-month trend ending now; gaps filled with 0 so the axis is continuous.
    const trendStart = monthsBack(11);
    const totals = new Map(getMonthlyTotals(trendStart, currentMonth()).map(r => [r.month, r.total]));
    setTrend(monthRange(trendStart, currentMonth()).map(m => ({ month: m, total: totals.get(m) ?? 0 })));
  }, [selectedMonth, dataVersion]);

  useFocusEffect(reload);

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Month strip */}
      <View style={styles.stripWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
          {months.map(m => {
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
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Budget analysis (Phase 5c; v1.5.4: income is per-month — salary history + bonuses) */}
        {(() => {
          const monthIncome = incomeForMonth(income, salaryHistory, incomeOverrides, incomeEvents, selectedMonth);
          return monthIncome === null ? (
          <TouchableOpacity
            style={styles.budgetEmpty}
            activeOpacity={0.7}
            onPress={() => router.push('/money' as any)}
          >
            <Text selectable={false} style={styles.budgetEmptyText}>
              💰 Set your income to unlock budget insights ›
            </Text>
          </TouchableOpacity>
        ) : (() => {
          const monthBase = baseIncomeForMonth(income, salaryHistory, incomeOverrides, selectedMonth);
          const s = budgetSummary({ base: monthBase, total: monthIncome }, allocations, selectedMonth, total);
          const pct = s.spendable > 0 ? Math.min(1, s.spent / s.spendable) : (s.spent > 0 ? 1 : 0);
          const over = s.remaining < 0;
          return (
            <TouchableOpacity
              style={styles.budgetCard}
              activeOpacity={0.7}
              onPress={() => router.push('/money' as any)}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCream },

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
});

