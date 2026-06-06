import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import { fonts } from '../constants/theme';

// Thin top bar shown while the dev sandbox is active. Lives above the screen stack
// (in flow), so it shifts everything down rather than overlapping. "Exit" reverts
// all dev changes. Renders nothing when the sandbox is off.
export default function DevBanner() {
  const devActive = useExpenseStore(s => s.devActive);
  const leave = useExpenseStore(s => s.leaveDevSandbox);

  if (!devActive) return null;

  return (
    <View style={styles.bar}>
      <Text style={styles.text}>🛠 Dev sandbox · changes won't be saved</Text>
      <Pressable onPress={leave} style={styles.exitBtn} hitSlop={8}>
        <Text style={styles.exitText}>Exit ✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3A2E22',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  text: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#F5C45E' },
  exitBtn: {
    backgroundColor: '#F5C45E',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  exitText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#3A2E22' },
});
