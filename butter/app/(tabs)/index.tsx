import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useExpenseStore } from '../../src/store/useExpenseStore';
import { Expense } from '../../src/db/queries';
import { formatDateLabel } from '../../src/lib/date';
import * as Haptics from '../../src/lib/haptics';

function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

function ExpenseRow({
  item,
  categories,
  onEdit,
}: {
  item: Expense;
  categories: { id: string; name: string; icon: string; color: string }[];
  onEdit: (item: Expense) => void;
}) {
  const cat = categories.find(c => c.id === item.category_id);

  return (
    <TouchableOpacity
      onPress={() => onEdit(item)}
      activeOpacity={0.7}
      style={styles.row}
    >
      <View style={[styles.catDot, { backgroundColor: cat?.color ?? '#E3C49A' }]}>
        <Text style={styles.catIcon}>{cat?.icon ?? '📦'}</Text>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.rowCat}>{cat?.name ?? 'Other'}</Text>
        {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>SGD {formatCurrency(item.amount)}</Text>
        <Text style={styles.rowDate}>{formatDateLabel(item.spent_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { expenses, todayTotal, categories, gameState, openAddSheet, openEditSheet } = useExpenseStore();
  const router = useRouter();

  const handleMascotPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    openAddSheet();
  }, [openAddSheet]);

  const handleEdit = useCallback((item: Expense) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openEditSheet(item);
  }, [openEditSheet]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>Butter 🧈</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statChip}>🔥 {gameState.streak_count}</Text>
          <Text style={styles.statChip}>🪙 {gameState.coins}</Text>
        </View>
      </View>

      {/* Today total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Today</Text>
        <Text style={styles.totalAmount}>SGD {formatCurrency(todayTotal)}</Text>
      </View>

      {/* Mascot placeholder (Phase 2 will replace with the real Butter SVG) */}
      <Pressable onPress={handleMascotPress} style={styles.mascotArea}>
        <Text style={styles.mascotEmoji}>🐻</Text>
        <Text style={styles.mascotHint}>Tap to add an expense</Text>
      </Pressable>

      {/* Recent entries */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Recent</Text>
        {expenses.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/history')} hitSlop={8}>
            <Text style={styles.viewAll}>View all ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {expenses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No expenses yet.</Text>
          <Text style={styles.emptyText}>Tap Butter above to add one!</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ExpenseRow item={item} categories={categories} onEdit={handleEdit} />
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

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  appName: { fontSize: 22, fontWeight: '800', color: '#5A4632' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A4632',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },

  totalCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#C9A06E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  totalLabel: { fontSize: 14, color: '#9C8772', fontWeight: '500', marginBottom: 4 },
  totalAmount: { fontSize: 40, fontWeight: '800', color: '#5A4632', letterSpacing: -1 },

  mascotArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  mascotEmoji: { fontSize: 80 },
  mascotHint: { fontSize: 13, color: '#9C8772', fontWeight: '500' },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A4632',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9A06E',
  },

  list: { paddingHorizontal: 20, paddingBottom: 24 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#C9A06E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  catDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIcon: { fontSize: 20 },
  rowMid: { flex: 1 },
  rowCat: { fontSize: 15, fontWeight: '600', color: '#5A4632' },
  rowNote: { fontSize: 12, color: '#9C8772', marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 15, fontWeight: '700', color: '#5A4632' },
  rowDate: { fontSize: 12, color: '#9C8772', marginTop: 2 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyText: { fontSize: 15, color: '#9C8772', textAlign: 'center' },
});
