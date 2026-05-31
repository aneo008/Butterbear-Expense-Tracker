import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useExpenseStore } from '../../src/store/useExpenseStore';
import { Expense, getExpensesByCategoryForMonth } from '../../src/db/queries';
import { formatDateLabel, formatMonthLong } from '../../src/lib/date';

function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

const FALLBACK_CAT = { name: 'Category', icon: '📦', color: '#9C8772' };

export default function CategoryDetailScreen() {
  const params = useLocalSearchParams<{ categoryId: string; month: string }>();
  const categoryId = Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId;
  const month = Array.isArray(params.month) ? params.month[0] : params.month;

  const categories = useExpenseStore(s => s.categories);
  const dataVersion = useExpenseStore(s => s.dataVersion);
  const openEditSheet = useExpenseStore(s => s.openEditSheet);

  const cat = categories.find(c => c.id === categoryId) ?? FALLBACK_CAT;

  // Re-query whenever data mutates (edits/deletes happen via the global modal,
  // which fires no navigation focus event on this screen).
  const expenses = useMemo(
    () => getExpensesByCategoryForMonth(categoryId, month),
    [categoryId, month, dataVersion]
  );

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const handleEdit = useCallback((item: Expense) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openEditSheet(item);
  }, [openEditSheet]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `${cat.icon} ${cat.name}`,
          headerBackTitle: 'Insights',
          headerStyle: { backgroundColor: '#FFFBF2' },
          headerShadowVisible: false,
          headerTintColor: '#5A4632',
          headerTitleStyle: { color: '#5A4632', fontWeight: '700' },
        }}
      />

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryMonth}>{formatMonthLong(month)}</Text>
        <Text style={styles.summaryTotal}>SGD {formatCurrency(total)}</Text>
        <Text style={styles.summaryCount}>
          {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nothing in {cat.name} this month.</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              activeOpacity={0.7}
              style={styles.row}
            >
              <View style={[styles.dot, { backgroundColor: cat.color }]}>
                <Text style={styles.icon}>{cat.icon}</Text>
              </View>
              <View style={styles.rowMid}>
                <Text style={styles.rowDate}>{formatDateLabel(item.spent_at)}</Text>
                {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
              </View>
              <Text style={styles.rowAmount}>SGD {formatCurrency(item.amount)}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF2' },

  summaryCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#C9A06E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryMonth: { fontSize: 14, color: '#9C8772', fontWeight: '500' },
  summaryTotal: { fontSize: 36, fontWeight: '800', color: '#5A4632', letterSpacing: -1 },
  summaryCount: { fontSize: 13, color: '#9C8772' },

  empty: { flex: 1, alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, color: '#9C8772' },

  list: { paddingHorizontal: 20, paddingBottom: 24 },
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
  rowDate: { fontSize: 15, fontWeight: '600', color: '#5A4632' },
  rowNote: { fontSize: 12, color: '#9C8772', marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '700', color: '#5A4632' },
});
