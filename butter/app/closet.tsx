import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useExpenseStore } from '../src/store/useExpenseStore';
import { STORE_ITEMS, Slot } from '../src/constants/storeItems';
import Mascot from '../src/components/Mascot';
import { moodFromState } from '../src/lib/mascotMood';
import { colors, radius, fonts, cardShadow, softShadow } from '../src/constants/theme';

// Slot filter options
type SlotFilter = Slot | 'all';
const SLOT_FILTERS: Array<{ label: string; value: SlotFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Head', value: 'head' },
  { label: 'Face', value: 'face' },
  { label: 'Neck', value: 'neck' },
  { label: 'Body', value: 'body' },
  { label: 'Held', value: 'held' },
];

// Friendly slot display names for the badge on each card
const SLOT_LABELS: Record<Slot, string> = {
  head: 'Head',
  face: 'Face',
  neck: 'Neck',
  body: 'Body',
  held: 'Held',
};

export default function ClosetScreen() {
  const router = useRouter();
  const {
    gameState,
    equippedItems,
    ownedItems,
    buyItem,
    equipItem,
    unequipItem,
  } = useExpenseStore();

  const mood = moodFromState(gameState);
  const [activeSlot, setActiveSlot] = useState<SlotFilter>('all');

  const visibleItems = useMemo(
    () =>
      activeSlot === 'all'
        ? STORE_ITEMS
        : STORE_ITEMS.filter(i => i.slot === activeSlot),
    [activeSlot]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Wardrobe</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>🪙 {gameState.coins}</Text>
        </View>
      </View>

      {/* ── Mascot preview ── */}
      <View style={styles.previewArea}>
        <Mascot mood={mood} size={150} equipped={equippedItems} />
      </View>

      {/* ── Slot filter tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {SLOT_FILTERS.map(f => (
          <Pressable
            key={f.value}
            onPress={() => setActiveSlot(f.value)}
            style={[styles.filterPill, activeSlot === f.value && styles.filterPillActive]}
          >
            <Text style={[styles.filterText, activeSlot === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Item grid ── */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {visibleItems.map(item => {
          const owned = ownedItems.includes(item.id);
          const equipped = equippedItems[item.slot] === item.id;
          const canAfford = gameState.coins >= item.price;

          return (
            <View key={item.id} style={styles.card}>
              {/* Item header row */}
              <View style={styles.cardHeader}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.slotTag}>
                  <Text style={styles.slotTagText}>{SLOT_LABELS[item.slot]}</Text>
                </View>
              </View>

              {/* Status line */}
              {equipped ? (
                <View style={styles.equippedBadge}>
                  <Text style={styles.equippedBadgeText}>Equipped ✓</Text>
                </View>
              ) : owned ? (
                <Text style={styles.ownedLabel}>Owned</Text>
              ) : (
                <Text style={[styles.priceLabel, !canAfford && styles.priceLabelMuted]}>
                  🪙 {item.price}
                </Text>
              )}

              {/* Action button */}
              {owned ? (
                <Pressable
                  onPress={() => equipped ? unequipItem(item.slot) : equipItem(item.id, item.slot)}
                  style={({ pressed }) => [
                    styles.btn,
                    equipped ? styles.btnUnequip : styles.btnEquip,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text style={[styles.btnText, equipped && styles.btnTextUnequip]}>
                    {equipped ? 'Unequip' : 'Equip'}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => buyItem(item.id, item.price)}
                  disabled={!canAfford}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnBuy,
                    !canAfford && styles.btnDisabled,
                    pressed && canAfford && styles.btnPressed,
                  ]}
                >
                  <Text style={[styles.btnText, !canAfford && styles.btnTextDisabled]}>
                    Buy 🪙{item.price}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCream },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.butterDeep },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textBrown,
    textAlign: 'center',
  },
  coinBadge: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  coinText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textBrown },

  // Mascot preview
  previewArea: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#FDF6E6',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },

  // Slot filter
  filterRow: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bgCard,
    ...softShadow,
  },
  filterPillActive: { backgroundColor: colors.butter },
  filterText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSoft },
  filterTextActive: { color: colors.textBrown },

  // Item grid — 2 columns
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 12,
    ...cardShadow,
  },

  // Card internals
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 4 },
  itemName: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textBrown,
    lineHeight: 17,
  },
  slotTag: {
    backgroundColor: '#F3EDE3',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  slotTagText: { fontFamily: fonts.body, fontSize: 10, color: colors.textSoft },

  // Status
  equippedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  equippedBadgeText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: '#388E3C' },

  ownedLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSoft,
    marginBottom: 8,
  },
  priceLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textBrown,
    marginBottom: 8,
  },
  priceLabelMuted: { color: colors.textSoft },

  // Buttons
  btn: {
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.75 },
  btnEquip: { backgroundColor: colors.butter },
  btnUnequip: { backgroundColor: '#F3EDE3' },
  btnBuy: { backgroundColor: colors.butter },
  btnDisabled: { backgroundColor: '#EDE8DF', opacity: 0.6 },

  btnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textBrown },
  btnTextUnequip: { color: colors.textSoft },
  btnTextDisabled: { color: colors.textSoft },
});
