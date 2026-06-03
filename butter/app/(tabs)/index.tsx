import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
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
import { moodFromState, speechLine } from '../../src/lib/mascotMood';
import Mascot, { MascotHandle } from '../../src/components/Mascot';
import Coachmark from '../../src/components/Coachmark';
import ConfettiBurst from '../../src/components/ConfettiBurst';
import CoinFly from '../../src/components/CoinFly';
import { colors, radius, fonts, cardShadow, softShadow } from '../../src/constants/theme';
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
    <TouchableOpacity onPress={() => onEdit(item)} activeOpacity={0.7} style={styles.row}>
      <View style={[styles.catDot, { backgroundColor: cat?.color ?? colors.bearBody }]}>
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
  const { expenses, todayTotal, categories, gameState, openAddSheet, openEditSheet, celebrationSignal, lastCelebration } = useExpenseStore();
  const router = useRouter();

  const mascotRef = useRef<MascotHandle>(null);

  // Burst triggers + transient milestone bubble line.
  const [confettiKey, setConfettiKey] = useState(0);
  const [coinKey, setCoinKey] = useState(0);
  const [milestoneLine, setMilestoneLine] = useState<string | null>(null);

  const mood = useMemo(() => moodFromState(gameState), [gameState]);
  const baseLine = useMemo(
    () => speechLine(gameState),
    [gameState.last_log_date, gameState.streak_count]
  );
  const line = milestoneLine ?? baseLine;

  // On a new log: fire the tiered celebration (skip the initial 0).
  const lastSignal = useRef(celebrationSignal);
  useEffect(() => {
    if (celebrationSignal === lastSignal.current) return;
    lastSignal.current = celebrationSignal;

    const big = lastCelebration.tier === 'big';
    mascotRef.current?.celebrate(big);
    setCoinKey(k => k + 1); // coin-fly every log
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (big) {
      setConfettiKey(k => k + 1);
      if (lastCelebration.reason) {
        setMilestoneLine(lastCelebration.reason);
        const t = setTimeout(() => setMilestoneLine(null), 2600);
        return () => clearTimeout(t);
      }
    }
  }, [celebrationSignal]);

  // Hide the persistent hint once the user has logged a few times.
  const showHint = gameState.total_entries < 3;

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
          <View style={styles.statChip}>
            <Text style={styles.statText}>🔥 {gameState.streak_count}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statText}>🪙 {gameState.coins}</Text>
          </View>
        </View>
      </View>

      {/* Today total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Today</Text>
        <Text style={styles.totalAmount}>
          <Text style={styles.totalCurrency}>SGD </Text>
          {formatCurrency(todayTotal)}
        </Text>
      </View>

      {/* Mascot + speech bubble */}
      <View style={styles.mascotArea}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{line}</Text>
          <View style={styles.bubbleTail} />
        </View>
        <View>
          <Pressable onPress={handleMascotPress} accessibilityRole="button" accessibilityLabel="Add an expense">
            <Mascot ref={mascotRef} mood={mood} size={180} />
          </Pressable>
          {/* confetti overlays the mascot, centred on it */}
          <View pointerEvents="none" style={styles.confettiLayer}>
            <ConfettiBurst playKey={confettiKey} size={300} />
          </View>
        </View>
        {showHint && <Text style={styles.mascotHint}>Tap Butter to add an expense</Text>}
      </View>

      {/* coin-fly: from the mascot up to the coin chip in the header */}
      <CoinFly playKey={coinKey} from={{ x: 200, y: 320 }} to={{ x: 250, y: 30 }} />

      <Coachmark />


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
  container: { flex: 1, backgroundColor: colors.bgCream },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  appName: { fontSize: 24, fontFamily: fonts.display, color: colors.textBrown },
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...softShadow,
  },
  statText: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.textBrown },

  totalCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    ...cardShadow,
  },
  totalLabel: { fontSize: 14, color: colors.textSoft, fontFamily: fonts.bodyMedium, marginBottom: 2 },
  totalAmount: { fontSize: 42, fontFamily: fonts.display, color: colors.textBrown },
  totalCurrency: { fontSize: 22, color: colors.textSoft, fontFamily: fonts.displaySemi },

  mascotArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  confettiLayer: {
    position: 'absolute',
    top: -60,
    left: -60,
    right: -60,
    bottom: -60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: 280,
    marginBottom: 4,
    ...softShadow,
  },
  bubbleText: { fontSize: 14, color: colors.textBrown, fontFamily: fonts.bodyMedium, textAlign: 'center' },
  bubbleTail: {
    position: 'absolute',
    bottom: -7,
    alignSelf: 'center',
    left: 0,
    right: 0,
    width: 14,
    height: 14,
    marginHorizontal: 'auto',
    backgroundColor: colors.bgCard,
    transform: [{ rotate: '45deg' }],
  },
  mascotHint: { fontSize: 13, color: colors.textSoft, fontFamily: fonts.bodyMedium, marginTop: 4 },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  sectionHeader: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.textBrown },
  viewAll: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.bearShadow },

  list: { paddingHorizontal: 20, paddingBottom: 24 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    ...softShadow,
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
  rowCat: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.textBrown },
  rowNote: { fontSize: 12, color: colors.textSoft, fontFamily: fonts.body, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.textBrown },
  rowDate: { fontSize: 12, color: colors.textSoft, fontFamily: fonts.body, marginTop: 2 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyText: { fontSize: 15, color: colors.textSoft, fontFamily: fonts.bodyMedium, textAlign: 'center' },
});
