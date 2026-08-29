import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { getMeta, setMeta } from '../db/queries';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

// v1.7.1: one-time guided tour for new users — a sequence of Butter-narrated
// cards (no screen-spotlighting; RNW element measuring across tabs is fragile).
// Keys off the same coachmark_seen flag the old one-card Coachmark wrote, so
// existing installs never see it and WhatsNewSheet's fresh-install seeding
// keeps working unchanged. Replayable from Settings via forceVisible.

const SEEN_KEY = 'coachmark_seen';

type Step = { emoji: string; title: string; body: string };

const STEPS: Step[] = [
  { emoji: '🧈', title: "Hi, I'm Butter!", body: 'Tap me on the Home screen whenever you spend something — logging an expense takes just a few seconds 🐻' },
  { emoji: '🔥', title: 'Streaks & coins', body: 'Every log earns coins, and logging daily builds a streak that multiplies them. Tap the 🔥 and 🪙 chips up top to see how it works.' },
  { emoji: '🛍️', title: 'Shop & closet', body: 'Spend your coins in the Shop on outfits and goodies for me, then dress me up in the Closet (the 🧥 chip).' },
  { emoji: '📊', title: 'Insights', body: 'The Insights tab shows where your money goes — daily trends, category breakdowns, and monthly or yearly views.' },
  { emoji: '💰', title: 'Money', body: 'Set your income and recurring payments in Settings → Money. Set-asides are deducted so Insights shows what you can really spend.' },
  { emoji: '🗓️', title: 'Due dates', body: "Give payments a due day and the Money page shows what's coming up — the app reminds you when something's due in the next few days." },
  { emoji: '💾', title: 'Back up your data', body: 'Everything lives on this device — export a backup from Settings every so often. That\'s it, let\'s go! 🧈' },
];

type Props = {
  onSettled?: () => void;
  forceVisible?: boolean;
  onForceClose?: () => void;
};

export default function TutorialSheet({ onSettled, forceVisible, onForceClose }: Props) {
  const controlled = forceVisible !== undefined;
  const [autoVisible, setAutoVisible] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (controlled) return;
    if (getMeta(SEEN_KEY) === '1') {
      onSettled?.();
      return;
    }
    const t = setTimeout(() => setAutoVisible(true), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to the first card each time the replay opens.
  useEffect(() => { if (controlled && forceVisible) setIdx(0); }, [controlled, forceVisible]);

  const finish = () => {
    if (controlled) { onForceClose?.(); return; }
    setMeta(SEEN_KEY, '1');
    setAutoVisible(false);
    onSettled?.();
  };

  const visible = controlled ? !!forceVisible : autoVisible;
  if (!visible) return null;

  const step = STEPS[idx];
  const last = idx === STEPS.length - 1;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={finish}>
      {/* Plain View overlay (not Pressable): a stray tap outside must not end the
          tour — Skip is the explicit way out. */}
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{step.emoji}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.buttons}>
            {idx > 0 ? (
              <Pressable style={styles.ghostBtn} onPress={() => setIdx(i => i - 1)} accessibilityLabel="tutorial-back">
                <Text style={styles.ghostText}>Back</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.ghostBtn} onPress={finish} accessibilityLabel="tutorial-skip">
                <Text style={styles.ghostText}>Skip</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.button}
              onPress={() => (last ? finish() : setIdx(i => i + 1))}
              accessibilityLabel="tutorial-next"
            >
              <Text style={styles.buttonText}>{last ? "Let's go!" : 'Next'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: 28, alignItems: 'center', maxWidth: 340, width: '100%', ...cardShadow },
  emoji: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 20, fontFamily: fonts.display, color: colors.textBrown, marginBottom: 8 },
  // minHeight keeps the card from resizing between steps of different lengths.
  body: { fontSize: 15, fontFamily: fonts.body, color: colors.textSoft, textAlign: 'center', lineHeight: 22, marginBottom: 16, minHeight: 88 },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E3C49A' },
  dotActive: { backgroundColor: colors.textBrown },
  buttons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  ghostBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  ghostText: { fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.textSoft },
  button: { backgroundColor: colors.butter, borderRadius: radius.pill, paddingHorizontal: 32, paddingVertical: 12 },
  buttonText: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.textBrown },
});
