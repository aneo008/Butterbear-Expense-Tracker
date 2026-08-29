import React from 'react';
import { Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import { chestFor } from '../lib/streak';
import * as Haptics from '../lib/haptics';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

// v1.7.2: interactive milestone-gift claim. Earning a chest (streak milestone)
// parks it in pending_chests; this popup is the satisfying tap that actually
// pays it. "Later" keeps it pending — the 🎁 badge on the streak chip and the
// Claim buttons in StreakSheet make sure it's never lost.

type Props = {
  day: number | null;                 // milestone day on offer; null = hidden
  onClaimed: (coins: number) => void; // fired after a successful claim (coin-fly etc.)
  onClose: () => void;
};

export default function ChestClaimSheet({ day, onClaimed, onClose }: Props) {
  const claimChest = useExpenseStore(s => s.claimChest);
  if (day == null) return null;
  const coins = chestFor(day);

  const claim = () => {
    if (claimChest(day)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClaimed(coins);
    }
    onClose();
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.emoji}>🎁</Text>
          <Text style={styles.title}>{day}-day streak!</Text>
          <Text style={styles.body}>You've earned a milestone gift — {coins} coins 🪙</Text>
          <Pressable style={styles.button} onPress={claim} accessibilityLabel="chest-claim">
            <Text style={styles.buttonText}>Claim your gift</Text>
          </Pressable>
          <Pressable style={styles.laterBtn} onPress={onClose} accessibilityLabel="chest-later">
            <Text style={styles.laterText}>Later</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: 28, alignItems: 'center', maxWidth: 320, width: '100%', ...cardShadow },
  emoji: { fontSize: 48, marginBottom: 6 },
  title: { fontSize: 22, fontFamily: fonts.display, color: colors.textBrown, marginBottom: 6 },
  body: { fontSize: 15, fontFamily: fonts.body, color: colors.textSoft, textAlign: 'center', lineHeight: 22, marginBottom: 18 },
  button: { backgroundColor: colors.butter, borderRadius: radius.pill, paddingHorizontal: 32, paddingVertical: 12 },
  buttonText: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.textBrown },
  laterBtn: { paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  laterText: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.textSoft },
});
