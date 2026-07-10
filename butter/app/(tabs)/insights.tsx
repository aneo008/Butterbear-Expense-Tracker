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
  CategoryBreakdownRow,
} from '../../src/db/queries';
import { currentMonth, monthRange, formatMonthShort, formatMonthLong } from '../../src/lib/date';
import { dedupeColors } from '../../src/lib/colors';
import CategoryDonut, { DonutSegment } from '../../src/components/CategoryDonut';
import { budgetSummary } from '../../src/lib/allocationMath';

function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

const FALLBACK_CAT = { name: 'Other', icon: '📦', color: '#9C8772' };

export default function InsightsScreen() {
  const categories = useExpenseStore(s => s.categories);
  const dataVersion = useExpenseStore(s => s.dataVersion);
  const income = useExpenseStore(s => s.income);
  const allocations = useExpenseStore(s => s.allocations);
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [months, setMonths] = useState<string[]>([currentMonth()]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownRow[]>([]);

  // Reload month list + breakdown on focus, when the selected month changes,
  // and when data mutates (so edits made via the modal sheet show up).
  const reload = useCallback(() => {
    const earliest = getEarliestExpenseMonth();
    // Newest month first (leftmost); older months scroll off to the right.
    setMonths(monthRange(earliest, currentMonth()).reverse());
    setBreakdown(getMonthBreakdown(selectedMonth));
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
        {/* Budget analysis (Phase 5c) — income vs set-asides vs spending for the month */}
        {income === null ? (
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
          const s = budgetSummary(income, allocations, selectedMonth, total);
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
        })()}

        {/* Donut */}
        <View style={styles.donutCard}>
          <Text style={styles.monthLabel}>{formatMonthLong(selectedMonth)}</Text>
          <CategoryDonut segments={segments} total={total} size={210} strokeWidth={30} />
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
  container: { flex: 1, backgroundColor: '#FFFBF2' },

  stripWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3C49A44',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3C49A',
    marginRight: 8,
  },
  monthChipActive: { backgroundColor: '#F5C45E', borderColor: '#F5C45E' },
  monthChipText: { fontSize: 13, color: '#5A4632', fontWeight: '500' },
  monthChipTextActive: { fontWeight: '800' },

  body: { paddingBottom: 32 },

  // Budget analysis card (Phase 5c)
  budgetCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#C9A06E',
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
    borderColor: '#E3C49A',
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  budgetEmptyText: { fontSize: 13, color: '#9C8772', fontWeight: '600' },
  budgetTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetCell: { flex: 1, alignItems: 'center' },
  budgetCellLabel: { fontSize: 11, color: '#9C8772', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  budgetCellValue: { fontSize: 16, color: '#5A4632', fontWeight: '800', marginTop: 2 },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3EAD8',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: '#F5C45E' },
  progressOver: { backgroundColor: '#E8837C' },
  budgetBottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  budgetSpent: { fontSize: 13, color: '#5A4632', fontWeight: '600' },
  budgetRemaining: { fontSize: 13, color: '#3C8C4C', fontWeight: '700' },
  budgetOverText: { color: '#C0392B' },
  savingsRate: { fontSize: 12, color: '#9C8772', marginTop: 8, textAlign: 'center', fontWeight: '500' },

  donutCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#C9A06E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  monthLabel: { fontSize: 15, color: '#9C8772', fontWeight: '600' },

  empty: { alignItems: 'center', marginTop: 24 },
  emptyText: { fontSize: 15, color: '#9C8772', textAlign: 'center', lineHeight: 22 },

  legend: { paddingHorizontal: 20 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#C9A06E',
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
  catName: { fontSize: 15, fontWeight: '600', color: '#5A4632' },
  catCount: { fontSize: 12, color: '#9C8772', marginTop: 2 },
  legendRight: { alignItems: 'flex-end' },
  catTotal: { fontSize: 15, fontWeight: '700', color: '#5A4632' },
  catPct: { fontSize: 12, color: '#9C8772', marginTop: 2 },
  chevron: { fontSize: 22, color: '#C9A06E', marginLeft: 4, fontWeight: '300' },
});

