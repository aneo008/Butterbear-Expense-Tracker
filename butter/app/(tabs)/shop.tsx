import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useExpenseStore } from '../../src/store/useExpenseStore';

export default function ShopScreen() {
  const { gameState } = useExpenseStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your coins</Text>
        <Text style={styles.balance}>🪙 {gameState.coins}</Text>
      </View>
      <Text style={styles.coming}>
        Store & Closet coming in Phase 4!{'\n'}
        Keep logging to earn coins 🧈
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF2', alignItems: 'center' },
  balanceCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '88%',
    shadowColor: '#C9A06E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: { fontSize: 14, color: '#9C8772', marginBottom: 4 },
  balance: { fontSize: 36, fontWeight: '800', color: '#5A4632' },
  coming: {
    fontSize: 16,
    color: '#9C8772',
    textAlign: 'center',
    lineHeight: 26,
    marginTop: 40,
  },
});
