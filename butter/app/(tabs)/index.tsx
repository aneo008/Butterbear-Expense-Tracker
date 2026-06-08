import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useExpenseStore } from '../../src/store/useExpenseStore';
import { moodFromState, speechLine } from '../../src/lib/mascotMood';
import Mascot, { MascotHandle } from '../../src/components/Mascot';
import Coachmark from '../../src/components/Coachmark';
import WhatsNewSheet from '../../src/components/WhatsNewSheet';
import StreakSheet from '../../src/components/StreakSheet';
import CoinSheet from '../../src/components/CoinSheet';
import ConfettiBurst from '../../src/components/ConfettiBurst';
import CoinFly from '../../src/components/CoinFly';
import TransactionsSheet from '../../src/components/TransactionsSheet';
import { colors, radius, fonts, cardShadow, softShadow } from '../../src/constants/theme';
import * as Haptics from '../../src/lib/haptics';

function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

export default function HomeScreen() {
  const { todayTotal, gameState, equippedItems, openAddSheet, celebrationSignal, lastCelebration } = useExpenseStore();
  const router = useRouter();

  const mascotRef = useRef<MascotHandle>(null);

  // Burst triggers + transient milestone bubble line.
  const [confettiKey, setConfettiKey] = useState(0);
  const [coinKey, setCoinKey] = useState(0);
  const [milestoneLine, setMilestoneLine] = useState<string | null>(null);
  const [streakOpen, setStreakOpen] = useState(false);
  const [coinOpen, setCoinOpen] = useState(false);

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

    // Crossing today's coin limit auto-opens the coin popup (in its maxed state).
    if (lastCelebration.capReached) setCoinOpen(true);

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar — pinned (stays visible even when the transactions sheet is up) */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>Butter 🧈</Text>
        <View style={styles.statsRow}>
          <Pressable
            onPress={() => setStreakOpen(true)}
            style={styles.statChip}
            accessibilityRole="button"
            accessibilityLabel="View streak"
          >
            <Text style={styles.statText}>🔥 {gameState.streak_count}</Text>
          </Pressable>
          <Pressable
            onPress={() => setCoinOpen(true)}
            style={styles.statChip}
            accessibilityRole="button"
            accessibilityLabel="Coin details"
          >
            <Text style={styles.statText}>🪙 {gameState.coins}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/closet' as any)}
            style={styles.statChip}
            accessibilityRole="button"
            accessibilityLabel="Open wardrobe"
          >
            <Text style={styles.statText}>🧥</Text>
          </Pressable>
        </View>
      </View>

      {/* Stage — Butter content, with the transactions sheet layered on top.
          overflow:hidden clips the sheet's off-screen portion when collapsed. */}
      <View style={styles.stage}>
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
              <Mascot ref={mascotRef} mood={mood} size={180} equipped={equippedItems} />
            </Pressable>
            <View pointerEvents="none" style={styles.confettiLayer}>
              <ConfettiBurst playKey={confettiKey} size={300} />
            </View>
          </View>
          {showHint && <Text style={styles.mascotHint}>Tap Butter to add an expense</Text>}
        </View>

        {/* Recent / all transactions — swipe up to expand, down to collapse */}
        <TransactionsSheet />
      </View>

      {/* coin-fly: from the mascot up to the coin chip in the header (screen coords) */}
      <CoinFly playKey={coinKey} from={{ x: 200, y: 320 }} to={{ x: 250, y: 30 }} />

      <Coachmark />
      <WhatsNewSheet />
      <StreakSheet visible={streakOpen} onClose={() => setStreakOpen(false)} />
      <CoinSheet visible={coinOpen} onClose={() => setCoinOpen(false)} />
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

  stage: { flex: 1, position: 'relative', overflow: 'hidden' },

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
});
