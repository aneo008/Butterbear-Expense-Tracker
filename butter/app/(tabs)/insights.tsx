import React, { useCallback, useRef, useState } from 'react';
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

function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

const FALLBACK_CAT = { name: 'Other', icon: '📦', color: '#9C8772' };

export default function InsightsScreen() {
  const categories = useExpenseStore(s => s.categories);
  const dataVersion = useExpenseStore(s => s.dataVersion);
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [months, setMonths] = useState<string[]>([currentMonth()]);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownRow[]>([]);

  const stripRef = useRef<ScrollView>(null);
  const hasAutoScrolled = useRef(false);

  // Reload month list + breakdown on focus, when the selected month changes,
  // and when data mutates (so edits made via the modal sheet show up).
  const reload = useCallback(() => {
    const earliest = getEarliestExpenseMonth();
    setMonths(monthRange(earliest, currentMonth()));
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
          ref={stripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
          onContentSizeChange={() => {
            if (!hasAutoScrolled.current) {
              stripRef.current?.scrollToEnd({ animated: false });
              hasAutoScrolled.current = true;
            }
          }}
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

