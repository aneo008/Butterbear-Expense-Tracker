import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { getMeta, setMeta } from '../db/queries';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

const SEEN_KEY = 'coachmark_seen';

// One-time first-run tip pointing at Butter. Writes an app_meta flag on dismiss
// so it never returns (localStorage on web, SQLite on native).
export default function Coachmark() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getMeta(SEEN_KEY) !== '1') {
      // Small delay so it appears after the screen settles.
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setMeta(SEEN_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <Pressable style={styles.overlay} onPress={dismiss}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🧈</Text>
          <Text style={styles.title}>Hi, I'm Butter!</Text>
          <Text style={styles.body}>Tap me whenever you want to add an expense. Logging takes just a few seconds 🐻</Text>
          <Pressable style={styles.button} onPress={dismiss}>
            <Text style={styles.buttonText}>Got it!</Text>
          </Pressable>
        </View>
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
    padding: 32,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 28,
    alignItems: 'center',
    maxWidth: 320,
    ...cardShadow,
  },
  emoji: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 20, fontFamily: fonts.display, color: colors.textBrown, marginBottom: 8 },
  body: { fontSize: 15, fontFamily: fonts.body, color: colors.textSoft, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  button: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  buttonText: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.textBrown },
});
