import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import { streakMultiplier, dailyCap, coinsForLog, DAILY_BASE_CAP } from '../lib/streak';
import { todayISO } from '../lib/date';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

// Tapping the 🪙 chip on Home opens this (it also auto-opens when a log hits the
// daily cap). It tracks today's coins vs the streak-scaled daily limit, shows how
// much each entry earns, and explains why the limit grows with the multiplier.

type Props = { visible: boolean; onClose: () => void };

// Bar fills mint → butter → deep gold as it approaches the limit ("filling the jar").
function barColor(pct: number): string {
  if (pct >= 0.9) return colors.butterDeep;
  if (pct >= 0.6) return colors.butter;
  return colors.mint;
}

export default function CoinSheet({ visible, onClose }: Props) {
  const { gameState } = useExpenseStore();
  const streak = gameState.streak_count;
  const mult = streakMultiplier(streak);
  const cap = dailyCap(streak);

  // coins_earned_today is stale (yesterday's) until the first log of a new day
  // resets it — so show 0 if we haven't logged today.
  const earnedToday = gameState.last_log_date === todayISO() ? gameState.coins_earned_today : 0;
  const pct = Math.max(0, Math.min(1, cap > 0 ? earnedToday / cap : 0));
  const maxed = earnedToday >= cap;

  const perFirst = coinsForLog(streak, true);
  const perAfter = coinsForLog(streak, false);
  const boosted = mult > 1;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>

          <Text style={styles.coin}>🪙</Text>
          <Text style={styles.title}>Coins today</Text>

          {/* Progress bar */}
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: barColor(pct) }]} />
          </View>
          <Text style={styles.count}>{earnedToday} / {cap}</Text>

          <Text style={styles.blurb}>
            {maxed
              ? `🎉 You've maxed today's coins — come back tomorrow! Your ×${mult} streak keeps the limit high.`
              : `You've earned ${earnedToday} of today's ${cap}-coin limit.`}
          </Text>

          {/* Per entry */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Per entry{boosted ? `  ·  ×${mult} streak boost` : ''}
            </Text>
            <View style={styles.perRow}>
              <Text style={styles.perLabel}>First log of the day</Text>
              <Text style={styles.perValue}>+{perFirst} 🪙</Text>
            </View>
            <View style={styles.perRow}>
              <Text style={styles.perLabel}>Each entry after</Text>
              <Text style={styles.perValue}>+{perAfter} 🪙</Text>
            </View>
          </View>

          {/* Why the limit grows */}
          <Text style={styles.limitLine}>
            Daily limit = {DAILY_BASE_CAP} × ×{mult} = {cap}
          </Text>
          <Text style={styles.hint}>Build your streak → higher multiplier → higher limit.</Text>

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Got it!</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...cardShadow,
  },

  coin: { fontSize: 36 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.textBrown, marginTop: 2, marginBottom: 14 },

  // Progress bar
  track: {
    alignSelf: 'stretch',
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: '#F0EADD',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  count: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textBrown, marginTop: 6 },

  blurb: { fontFamily: fonts.body, fontSize: 13, color: colors.textBrown, textAlign: 'center', marginTop: 6, lineHeight: 19 },

  // Per entry
  section: { alignSelf: 'stretch', marginTop: 16, gap: 4 },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  perRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  perLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textBrown },
  perValue: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textBrown },

  limitLine: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.butterDeep, marginTop: 16 },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft, textAlign: 'center', marginTop: 4 },

  button: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingHorizontal: 32,
    paddingVertical: 11,
    marginTop: 18,
  },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
});
