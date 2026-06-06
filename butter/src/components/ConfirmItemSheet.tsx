import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { StoreItem, TIER_META, itemThumbSvg } from '../constants/storeItems';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

// Confirmation before buying or selling a cosmetic. Shows the item's picture on
// its rarity-colored tile + the rarity badge, so the user clearly sees what they
// are committing to. Sell refunds 50% of retail.

type Props = {
  item: StoreItem | null;             // null = hidden
  action: 'buy' | 'sell';
  equipped?: boolean;                 // item currently worn (sell warning)
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmItemSheet({ item, action, equipped, onConfirm, onCancel }: Props) {
  if (!item) return null;
  const tier = TIER_META[item.tier];
  const isBuy = action === 'buy';
  const refund = Math.floor(item.price / 2);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>

          <Text style={styles.title}>{isBuy ? 'Buy this?' : 'Sell this?'}</Text>

          {/* Item picture on its rarity tile */}
          <View style={[styles.tile, { backgroundColor: tier.tile }]}>
            <SvgXml xml={itemThumbSvg(item)} width="100%" height="100%" />
          </View>

          <Text style={styles.name}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: tier.badgeBg }]}>
            <Text style={[styles.badgeText, { color: tier.badgeText }]}>{tier.label}</Text>
          </View>

          {/* Price / refund line */}
          {isBuy ? (
            <Text style={styles.priceLine}>Buy for 🪙 {item.price}?</Text>
          ) : (
            <Text style={styles.priceLine}>
              Sell for 🪙 {refund}
              <Text style={styles.priceSub}>  (50% of {item.price})</Text>
            </Text>
          )}

          {!isBuy && equipped && (
            <Text style={styles.wornNote}>Currently worn — it'll be taken off.</Text>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnCancel]} onPress={onCancel}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, isBuy ? styles.btnBuy : styles.btnSell]} onPress={onConfirm}>
              <Text style={[styles.btnText, !isBuy && styles.btnSellText]}>{isBuy ? 'Buy ✓' : 'Sell ✓'}</Text>
            </Pressable>
          </View>
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
    maxWidth: 320,
    ...cardShadow,
  },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.textBrown, marginBottom: 14 },

  tile: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00000010',
  },
  name: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textBrown, marginTop: 12 },
  badge: { borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.3 },

  priceLine: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown, marginTop: 14 },
  priceSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft },
  wornNote: { fontFamily: fonts.body, fontSize: 12, color: colors.warnSoft, marginTop: 6 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  btn: { flex: 1, paddingVertical: 11, borderRadius: radius.pill, alignItems: 'center' },
  btnCancel: { backgroundColor: '#F3EDE3' },
  btnCancelText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSoft },
  btnBuy: { backgroundColor: colors.butter },
  btnSell: { backgroundColor: '#FBE9E7', borderWidth: 1, borderColor: '#E89B92' },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textBrown },
  btnSellText: { color: '#D6584C' },
});
