import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Animated,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useExpenseStore } from '../src/store/useExpenseStore';
import { STORE_ITEMS, Slot, EquippedMap, StoreItem } from '../src/constants/storeItems';
import Mascot from '../src/components/Mascot';
import { moodFromState } from '../src/lib/mascotMood';
import { getMeta, setMeta } from '../src/db/queries';
import { colors, radius, fonts, cardShadow, softShadow } from '../src/constants/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

type SlotFilter = Slot | 'all';
type TabKey = 'owned' | 'store';

const SLOT_FILTERS: Array<{ label: string; value: SlotFilter }> = [
  { label: 'All',  value: 'all'  },
  { label: 'Head', value: 'head' },
  { label: 'Face', value: 'face' },
  { label: 'Neck', value: 'neck' },
  { label: 'Body', value: 'body' },
  { label: 'Held', value: 'held' },
];

const SLOT_LABELS: Record<Slot, string> = {
  head: 'Head', face: 'Face', neck: 'Neck', body: 'Body', held: 'Held',
};

// Simple podium shadow drawn as two stacked ellipses
const PODIUM_SVG = `<svg viewBox="0 0 120 18" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="13" rx="52" ry="10" fill="#EDE0C8"/>
  <ellipse cx="60" cy="10" rx="52" ry="10" fill="#F5ECD8"/>
</svg>`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClosetScreen() {
  const router = useRouter();
  const {
    gameState, equippedItems, ownedItems,
    buyItem, equipLook,
  } = useExpenseStore();

  const mood = moodFromState(gameState);
  // useWindowDimensions re-renders on resize and is more reliable in RNW
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const PANEL_WIDTH = Math.round(SCREEN_WIDTH * 0.7);

  // ── Panel animation (0 = closed, 1 = open) ──────────────────────────────────
  const panelAnim = useRef(new Animated.Value(0)).current;
  const [mode, setMode] = useState<'play' | 'dress'>('play');

  const [fittingEquipped, setFittingEquipped] = useState<EquippedMap>({});

  // ── Panel tabs / filter ──────────────────────────────────────────────────────
  const [activeTab,  setActiveTab]  = useState<TabKey>('store');
  const [activeSlot, setActiveSlot] = useState<SlotFilter>('all');

  // ── First-run hint ───────────────────────────────────────────────────────────
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    if (!getMeta('closet_mode_hint_seen')) setShowHint(true);
  }, []);

  function dismissHint() {
    setShowHint(false);
    setMeta('closet_mode_hint_seen', '1');
  }

  // ── Open / close panel ───────────────────────────────────────────────────────
  function openPanel() {
    dismissHint();
    setFittingEquipped({ ...equippedItems });
    setMode('dress');
    Animated.spring(panelAnim, {
      toValue: 1,
      useNativeDriver: false,
      stiffness: 90,
      damping: 14,
    }).start();
  }

  // Write immediately at click-time so fittingEquipped is in scope (no async ref issues)
  function closePanel(save: boolean) {
    if (save) equipLook({ ...fittingEquipped });
    Animated.spring(panelAnim, {
      toValue: 0,
      useNativeDriver: false,
      stiffness: 90,
      damping: 14,
    }).start(() => setMode('play'));
  }

  // ── Fitting mutations (local only — no DB write) ─────────────────────────────
  function fitItem(itemId: string, slot: Slot) {
    setFittingEquipped(prev => ({ ...prev, [slot]: itemId }));
  }
  function removeFit(slot: Slot) {
    setFittingEquipped(prev => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  }

  // ── Filtered item list ───────────────────────────────────────────────────────
  const panelItems = useMemo(() => {
    let items = STORE_ITEMS;
    if (activeTab === 'owned') items = items.filter(i => ownedItems.includes(i.id));
    if (activeSlot !== 'all') items = items.filter(i => i.slot === activeSlot);
    return items;
  }, [activeTab, activeSlot, ownedItems]);

  // ── Animated panel width ─────────────────────────────────────────────────────
  const panelWidthAnim = panelAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, PANEL_WIDTH],
  });

  // ── Item card renderer ───────────────────────────────────────────────────────
  function renderItem({ item }: { item: StoreItem }) {
    const owned     = ownedItems.includes(item.id);
    const fitted    = fittingEquipped[item.slot] === item.id;
    const trying    = !owned && fitted;           // in fitting but not purchased
    const canAfford = gameState.coins >= item.price;

    return (
      <View style={styles.itemCard}>
        {/* ── Left: info ── */}
        <View style={styles.itemInfo}>
          <View style={styles.itemNameRow}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.slotTag}>
              <Text style={styles.slotTagText}>{SLOT_LABELS[item.slot]}</Text>
            </View>
          </View>

          {/* Status badge */}
          {fitted && (
            <View style={[styles.statusBadge, trying ? styles.badgeTrying : styles.badgeFitted]}>
              <Text style={[styles.statusText, trying && styles.statusTextTrying]}>
                {trying ? 'Trying' : 'Fitted ✓'}
              </Text>
            </View>
          )}

          {/* Price (shown when not owned) */}
          {!owned && (
            <Text style={[styles.priceText, !canAfford && styles.priceMuted]}>
              🪙 {item.price}
            </Text>
          )}
        </View>

        {/* ── Right: action buttons ── */}
        <View style={styles.itemActions}>
          {owned ? (
            /* Owned: Fit / Remove */
            <Pressable
              onPress={() => fitted ? removeFit(item.slot) : fitItem(item.id, item.slot)}
              style={[styles.actionBtn, fitted ? styles.btnRemove : styles.btnFit]}
            >
              <Text style={[styles.actionBtnText, fitted && styles.textMuted]}>
                {fitted ? 'Remove' : 'Fit'}
              </Text>
            </Pressable>
          ) : trying ? (
            /* Trying unowned item: Buy + Remove */
            <>
              <Pressable
                onPress={() => buyItem(item.id, item.price)}
                disabled={!canAfford}
                style={[styles.actionBtn, styles.btnBuy, !canAfford && styles.btnDisabled]}
              >
                <Text style={[styles.actionBtnText, !canAfford && styles.textMuted]}>Buy</Text>
              </Pressable>
              <Pressable
                onPress={() => removeFit(item.slot)}
                style={[styles.actionBtn, styles.btnRemove, { marginTop: 4 }]}
              >
                <Text style={[styles.actionBtnText, styles.textMuted]}>Remove</Text>
              </Pressable>
            </>
          ) : (
            /* Unowned, not trying: Try + Buy */
            <>
              <Pressable
                onPress={() => fitItem(item.id, item.slot)}
                style={[styles.actionBtn, styles.btnTry]}
              >
                <Text style={styles.actionBtnText}>Try</Text>
              </Pressable>
              <Pressable
                onPress={() => buyItem(item.id, item.price)}
                disabled={!canAfford}
                style={[styles.actionBtn, styles.btnBuy, !canAfford && styles.btnDisabled, { marginTop: 4 }]}
              >
                <Text style={[styles.actionBtnText, !canAfford && styles.textMuted]}>Buy</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  }

  const mascotSize     = mode === 'dress' ? 90 : 150;
  const stageEquipped  = mode === 'dress' ? fittingEquipped : equippedItems;

  // ── Render ───────────────────────────────────────────────────────────────────
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

      {/* ── Main area: [panel][handle][stage] ── */}
      <View style={styles.mainArea}>

        {/* Panel — clipping wrapper animates width; inner view holds fixed PANEL_WIDTH */}
        <Animated.View style={[styles.panelClip, { width: panelWidthAnim }]}>
          <View style={[styles.panelInner, { width: PANEL_WIDTH }]}>

            {/* Owned / Store toggle */}
            <View style={styles.tabRow}>
              {(['owned', 'store'] as TabKey[]).map(tab => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === 'owned' ? 'Owned' : 'Store'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Slot filter — wrapped in a View so the fixed height is respected.
                RNW's ScrollView outer wrapper has flex-grow:1 by default,
                which makes plain style={height:44} on the ScrollView useless.
                A View wrapper is not affected by that default. */}
            <View style={styles.filterRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
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
            </View>

            {/* Item list */}
            <FlatList
              data={panelItems}
              keyExtractor={i => i.id}
              renderItem={renderItem}
              extraData={[fittingEquipped, ownedItems, gameState.coins]}
              contentContainerStyle={styles.itemList}
              showsVerticalScrollIndicator={false}
              style={styles.flatList}
            />

            {/* Save / Discard bar */}
            <View style={styles.panelBottom}>
              <Pressable onPress={() => closePanel(false)} style={[styles.bottomBtn, styles.btnDiscard]}>
                <Text style={styles.discardText}>Discard</Text>
              </Pressable>
              <Pressable onPress={() => closePanel(true)} style={[styles.bottomBtn, styles.btnSave]}>
                <Text style={styles.saveText}>Save Look ✓</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Handle — always sits between panel and stage */}
        <Pressable
          onPress={mode === 'play' ? openPanel : () => closePanel(false)}
          style={styles.handle}
          accessibilityRole="button"
          accessibilityLabel={mode === 'play' ? 'Open dress-up panel' : 'Close panel'}
        >
          <Text style={styles.handleIcon}>{mode === 'play' ? '›' : '‹'}</Text>
        </Pressable>

        {/* Stage — Butter's display area */}
        <View style={styles.stage}>
          <View style={styles.mascotWrap}>
            <Mascot mood={mood} size={mascotSize} equipped={stageEquipped} />
            {mode === 'dress' && (
              <View style={styles.podium}>
                <SvgXml xml={PODIUM_SVG} width={100} height={18} />
              </View>
            )}
          </View>

          {/* First-run hint — fades after panel is opened once */}
          {showHint && mode === 'play' && (
            <Pressable onPress={openPanel} style={styles.hint}>
              <Text style={styles.hintText}>› Dress up Butter</Text>
            </Pressable>
          )}
        </View>
      </View>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
  backBtn:     { paddingVertical: 6, paddingRight: 12 },
  backText:    { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.butterDeep },
  headerTitle: { flex: 1, fontFamily: fonts.display, fontSize: 22, color: colors.textBrown, textAlign: 'center' },
  coinBadge:   { backgroundColor: colors.butter, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  coinText:    { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textBrown },

  // Main area
  mainArea: { flex: 1, flexDirection: 'row' },

  // Panel clip — overflow:hidden so the spring slide looks right
  panelClip: { overflow: 'hidden', alignSelf: 'stretch' },
  panelInner: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
  },

  // Owned / Store tabs
  tabRow:        { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.hairline },
  tab:           { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: colors.butter },
  tabText:       { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSoft },
  tabTextActive: { fontFamily: fonts.bodyBold,   fontSize: 14, color: colors.textBrown },

  // Slot filter — explicit height keeps the row at a fixed 44px.
  // RNW's CSS flex layout would otherwise expand a horizontal ScrollView to
  // fill the parent column (minHeight/flexShrink alone don't prevent that).
  filterRow: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  filterContent:     { paddingHorizontal: 12, paddingVertical: 8, gap: 6, alignItems: 'center' },
  filterPill:        { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: '#F3EDE3' },
  filterPillActive:  { backgroundColor: colors.butter },
  filterText:        { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSoft },
  filterTextActive:  { fontFamily: fonts.bodyBold,   fontSize: 12, color: colors.textBrown },

  // Item list
  flatList: { flex: 1 },
  itemList: { padding: 10, gap: 8, paddingBottom: 16 },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCream,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  itemInfo:    { flex: 1, marginRight: 8 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  itemName:    { flex: 1, fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textBrown },

  slotTag:     { backgroundColor: '#F3EDE3', borderRadius: radius.pill, paddingHorizontal: 5, paddingVertical: 1 },
  slotTagText: { fontFamily: fonts.body, fontSize: 9, color: colors.textSoft },

  statusBadge:      { borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 3 },
  badgeFitted:      { backgroundColor: '#E8F5E9' },
  badgeTrying:      { backgroundColor: '#FFF8E1' },
  statusText:       { fontFamily: fonts.bodyMedium, fontSize: 10, color: '#388E3C' },
  statusTextTrying: { color: '#F57F17' },

  priceText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textBrown, marginTop: 2 },
  priceMuted: { color: colors.textSoft },

  // Item action buttons (right column)
  itemActions:   { alignItems: 'stretch', justifyContent: 'center', minWidth: 60 },
  actionBtn:     { paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.sm, alignItems: 'center' },
  btnFit:        { backgroundColor: colors.butter },
  btnRemove:     { backgroundColor: '#F3EDE3' },
  btnTry:        { backgroundColor: '#DCF0E8' },
  btnBuy:        { backgroundColor: colors.butter },
  btnDisabled:   { backgroundColor: '#EDE8DF', opacity: 0.55 },
  actionBtnText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textBrown },
  textMuted:     { color: colors.textSoft },

  // Save / Discard bar
  panelBottom: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  bottomBtn:   { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  btnDiscard:  { backgroundColor: '#F3EDE3' },
  btnSave:     { backgroundColor: colors.butter, ...cardShadow },
  discardText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSoft },
  saveText:    { fontFamily: fonts.bodyBold,   fontSize: 13, color: colors.textBrown },

  // Handle tab — sits between panel and stage as a flex child
  handle: {
    width: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
  },
  handleIcon: { fontFamily: fonts.display, fontSize: 18, color: colors.butterDeep },

  // Stage
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF6E6',
  },
  mascotWrap: { alignItems: 'center' },
  podium:     { marginTop: -6 },

  // First-run hint
  hint: { position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' },
  hintText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.butterDeep,
    backgroundColor: '#FFFBF2EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
