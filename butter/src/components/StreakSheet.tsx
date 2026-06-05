import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import { STREAK_TIERS, streakMultiplier, nextTier, dailyCap, chestFor } from '../lib/streak';
import { todayISO } from '../lib/date';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

// Tapping the 🔥 chip on Home opens this. It explains what the streak is worth —
// the current coin multiplier, the full tier ladder (so the user sees how high it
// climbs), the milestone chests, and whether today's streak is safe. All numbers
// come from src/lib/streak.ts so they always match what's actually awarded.

type Props = { visible: boolean; onClose: () => void };

// The ladder shows the unlock tiers (the ×1.0 base at day 0 is implicit).
const LADDER = STREAK_TIERS.filter(t => t.days > 0);

export default function StreakSheet({ visible, onClose }: Props) {
  const { gameState } = useExpenseStore();
  const streak = gameState.streak_count;
  const mult = streakMultiplier(streak);
  const cap = dailyCap(streak);
  const next = nextTier(streak);
  const loggedToday = gameState.last_log_date === todayISO();

  // Highest tier day reached (0 if below the first tier) — that row is "current".
  const currentDays = [...STREAK_TIERS].reverse().find(t => streak >= t.days)?.days ?? 0;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* stop taps inside the card from dismissing */}
        <Pressable style={styles.card} onPress={() => {}}>

          {/* Header */}
          <Text style={styles.flame}>🔥</Text>
          <Text style={styles.title}>
            {streak === 0 ? 'Start a streak!' : `${streak}-day streak`}
          </Text>

          {/* Multiplier badge */}
          <View style={styles.multPill}>
            <Text style={styles.multText}>×{mult}</Text>
          </View>
          <Text style={styles.multLabel}>coin multiplier</Text>
          <Text style={styles.subline}>
            {mult === 1
              ? 'Build a streak to multiply your coins!'
              : `Every log earns ${mult}× coins · up to ${cap}/day`}
          </Text>

          {/* Tier ladder */}
          <View style={styles.ladder}>
            {LADDER.map(tier => {
              const reached = streak >= tier.days;
              const isCurrent = reached && tier.days === currentDays;
              const isNext = next?.days === tier.days;
              const glyph = isCurrent ? '●' : reached ? '✓' : '○';
              return (
                <View key={tier.days} style={[styles.row, isCurrent && styles.rowCurrent]}>
                  <Text style={[styles.glyph, isCurrent && styles.glyphCurrent, !reached && styles.glyphLocked]}>
                    {glyph}
                  </Text>
                  <Text style={[styles.rowDays, !reached && styles.rowMuted]}>{tier.days} days</Text>
                  <Text style={[styles.rowMult, !reached && styles.rowMuted]}>×{tier.mult}</Text>
                  <Text style={[styles.rowChest, !reached && styles.rowMuted]}>🎁 {chestFor(tier.days)}</Text>
                  {isNext && <Text style={styles.rowHint}>{tier.days - streak}d 🔓</Text>}
                </View>
              );
            })}
          </View>

          {/* Next-tier / max line */}
          {next ? (
            <Text style={styles.nextLine}>
              {next.days - streak} more {next.days - streak === 1 ? 'day' : 'days'} → ×{next.mult}
            </Text>
          ) : (
            <Text style={styles.nextLine}>Max multiplier reached! 🎉</Text>
          )}

          {/* Best streak */}
          {gameState.longest_streak > 0 && (
            <Text style={styles.best}>
              Best: {gameState.longest_streak} {gameState.longest_streak === 1 ? 'day' : 'days'} ⭐
            </Text>
          )}

          {/* Streak-safety nudge */}
          <View style={[styles.nudge, loggedToday ? styles.nudgeSafe : styles.nudgeWarn]}>
            <Text style={[styles.nudgeText, loggedToday ? styles.nudgeTextSafe : styles.nudgeTextWarn]}>
              {loggedToday
                ? 'Logged today ✓ — streak safe'
                : streak === 0
                  ? 'Log today to start your streak 🔥'
                  : 'Log today to keep your streak 🔥'}
            </Text>
          </View>

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Keep it up! 🧈</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000055',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...cardShadow,
  },

  flame: { fontSize: 38 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.textBrown, marginTop: 2, marginBottom: 10 },

  multPill: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 6,
    ...cardShadow,
  },
  multText: { fontFamily: fonts.display, fontSize: 28, color: colors.textBrown },
  multLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSoft, marginTop: 4 },
  subline: { fontFamily: fonts.body, fontSize: 13, color: colors.textBrown, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  // Ladder
  ladder: { alignSelf: 'stretch', marginTop: 16, gap: 3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    gap: 8,
  },
  rowCurrent: { backgroundColor: '#FBF0D6' },
  glyph: { fontSize: 13, color: colors.textSoft, width: 16, textAlign: 'center' },
  glyphCurrent: { color: colors.butterDeep },
  glyphLocked: { color: '#CFC4B2' },
  rowDays: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textBrown, width: 64 },
  rowMult: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textBrown, width: 42 },
  rowChest: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft, flex: 1 },
  rowHint: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.butterDeep },
  rowMuted: { color: '#BCAF9C' },

  nextLine: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.butterDeep, marginTop: 12 },
  best: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSoft, marginTop: 6 },

  nudge: { borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8, marginTop: 14, alignSelf: 'stretch', alignItems: 'center' },
  nudgeSafe: { backgroundColor: '#E8F5E9' },
  nudgeWarn: { backgroundColor: '#FFF4E0' },
  nudgeText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  nudgeTextSafe: { color: '#3C8C4C' },
  nudgeTextWarn: { color: '#C57A1E' },

  button: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingHorizontal: 32,
    paddingVertical: 11,
    marginTop: 18,
  },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
});
