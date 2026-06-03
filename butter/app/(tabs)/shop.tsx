import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useExpenseStore } from '../../src/store/useExpenseStore';
import { colors, radius, fonts, cardShadow } from '../../src/constants/theme';

type ShopCard = {
  icon: string;
  title: string;
  subtitle: string;
  active: boolean;
  onPress?: () => void;
};

function LandingCard({ icon, title, subtitle, active, onPress }: ShopCard) {
  return (
    <Pressable
      onPress={active ? onPress : undefined}
      style={({ pressed }) => [
        styles.card,
        active && pressed && styles.cardPressed,
        !active && styles.cardDisabled,
      ]}
      accessibilityRole={active ? 'button' : undefined}
      accessibilityLabel={title}
    >
      <View style={[styles.cardIconWrap, active ? styles.cardIconActive : styles.cardIconMuted]}>
        <Text style={styles.cardIcon}>{icon}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, !active && styles.textMuted]}>{title}</Text>
        <Text style={[styles.cardSubtitle, !active && styles.textMuted]}>{subtitle}</Text>
      </View>
      <Text style={[styles.chevron, !active && styles.textMuted]}>{active ? '›' : '—'}</Text>
    </Pressable>
  );
}

export default function ShopScreen() {
  const { gameState } = useExpenseStore();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.heading}>Shop</Text>

        {/* Coin balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your coins</Text>
          <Text style={styles.balance}>🪙 {gameState.coins}</Text>
          <Text style={styles.balanceHint}>Log expenses to earn more</Text>
        </View>

        {/* Category cards */}
        <Text style={styles.sectionLabel}>Browse</Text>

        <LandingCard
          icon="🧥"
          title="Wardrobe"
          subtitle="Dress up Butter with outfits and accessories"
          active
          onPress={() => router.push('/closet' as any)}
        />
        <LandingCard
          icon="🍪"
          title="Consumables"
          subtitle="Treats and boosts — coming in a future update"
          active={false}
        />
        <LandingCard
          icon="📈"
          title="Invest"
          subtitle="Put your coins to work — coming in a future update"
          active={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCream },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },

  heading: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.textBrown,
    marginTop: 12,
    marginBottom: 16,
  },

  // Balance card
  balanceCard: {
    backgroundColor: colors.butter,
    borderRadius: radius.xl,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 28,
    alignItems: 'center',
    ...cardShadow,
  },
  balanceLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: '#7A5A1E',
    marginBottom: 4,
  },
  balance: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.textBrown,
  },
  balanceHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#9C7A30',
    marginTop: 4,
  },

  // Section label
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Landing cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...cardShadow,
  },
  cardPressed: { opacity: 0.85 },
  cardDisabled: { opacity: 0.5 },

  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIconActive: { backgroundColor: '#FDF0D5' },
  cardIconMuted: { backgroundColor: '#F3EDE3' },
  cardIcon: { fontSize: 26 },

  cardBody: { flex: 1 },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.textBrown,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSoft,
    lineHeight: 18,
  },

  chevron: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.butterDeep,
    marginLeft: 8,
  },

  textMuted: { color: colors.textSoft },
});
