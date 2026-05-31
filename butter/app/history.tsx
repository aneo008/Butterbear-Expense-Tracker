import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useExpenseStore } from '../src/store/useExpenseStore';
import { Expense, getAllExpenses } from '../src/db/queries';
import { formatDateLabel, formatMonthLong } from '../src/lib/date';

function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

type Section = {
  month: string;
  total: number;
  data: Expense[];
};

function groupByMonth(expenses: Expense[]): Section[] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const month = e.spent_at.slice(0, 7);
    const list = map.get(month);
    if (list) list.push(e);
    else map.set(month, [e]);
  }
  // getAllExpenses() is already newest-first, so Map preserves that month order.
  return Array.from(map.entries()).map(([month, data]) => ({
    month,
    data,
    total: data.reduce((s, e) => s + e.amount, 0),
  }));
}

export default function HistoryScreen() {
  const categories = useExpenseStore(s => s.categories);
  const dataVersion = useExpenseStore(s => s.dataVersion);
  const openEditSheet = useExpenseStore(s => s.openEditSheet);

  const sections = useMemo(() => groupByMonth(getAllExpenses()), [dataVersion]);

  const handleEdit = useCallback((item: Expense) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openEditSheet(item);
  }, [openEditSheet]);

  const catInfo = useCallback(
    (id: string) => categories.find(c => c.id === id) ?? { name: 'Other', icon: '📦', color: '#9C8772' },
    [categories]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'All Expenses',
          headerBackTitle: 'Home',
          headerStyle: { backgroundColor: '#FFFBF2' },
          headerShadowVisible: false,
          headerTintColor: '#5A4632',
          headerTitleStyle: { color: '#5A4632', fontWeight: '700' },
        }}
      />

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No expenses yet 🧈</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionMonth}>{formatMonthLong(section.month)}</Text>
              <Text style={styles.sectionTotal}>SGD {formatCurrency(section.total)}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const cat = catInfo(item.category_id);
            return (
              <TouchableOpacity
                onPress={() => handleEdit(item)}
                activeOpacity={0.7}
                style={styles.row}
              >
                <View style={[styles.dot, { backgroundColor: cat.color }]}>
                  <Text style={styles.icon}>{cat.icon}</Text>
                </View>
                <View style={styles.rowMid}>
                  <Text style={styles.rowCat}>{cat.name}</Text>
                  <Text style={styles.rowDate}>
                    {formatDateLabel(item.spent_at)}
                    {item.note ? ` · ${item.note}` : ''}
                  </Text>
                </View>
                <Text style={styles.rowAmount}>SGD {formatCurrency(item.amount)}</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF2' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#9C8772' },

  list: { paddingHorizontal: 20, paddingBottom: 24 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionMonth: { fontSize: 16, fontWeight: '800', color: '#5A4632' },
  sectionTotal: { fontSize: 14, fontWeight: '700', color: '#9C8772' },

  row: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  rowMid: { flex: 1 },
  rowCat: { fontSize: 15, fontWeight: '600', color: '#5A4632' },
  rowDate: { fontSize: 12, color: '#9C8772', marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '700', color: '#5A4632' },
});
