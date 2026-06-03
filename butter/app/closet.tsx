import React, { useState, useRef, useMemo } from 'react';
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

// Podium shadow — two stacked ellipses
const PODIUM_SVG = `<svg viewBox="0 0 120 18" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="13" rx="52" ry="10" fill="#EDE0C8"/>
  <ellipse cx="60" cy="10" rx="52" ry="10" fill="#F5ECD8"/>
</svg>`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClosetScreen() {
  const router = useRouter();
  const { gameState, equippedItems, ownedItems, buyItem, equipLook } = useExpenseStore();
  const mood = moodFromState(gameState);
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const PANEL_WIDTH = Math.round(SCREEN_WIDTH * 0.7);

  // ── Core state ───────────────────────────────────────────────────────────────
  // inRoom  — whether the changing-room scene is active (vs. play mode)
  // panelOpen — whether the item panel is slid in (only meaningful in room)
  // facing  — which way Butter faces on the podium
  const panelAnim = useRef(new Animated.Value(0)).current;
  const [inRoom,   setInRoom]   = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [facing,   setFacing]   = useState<'front' | 'back'>('front');
  const [fittingEquipped, setFittingEquipped] = useState<EquippedMap>({});

  // ── Panel tab / filter ───────────────────────────────────────────────────────
  const [activeTab,  setActiveTab]  = useState<TabKey>('store');
  const [activeSlot, setActiveSlot] = useState<SlotFilter>('all');

  // ── Derived ──────────────────────────────────────────────────────────────────
  // Save is only offered when the user has actually changed something
  const canSave = JSON.stringify(fittingEquipped) !== JSON.stringify(equippedItems);
  const mascotSize   = inRoom && panelOpen ? 90 : inRoom ? 140 : 150;
  const stageEquipped = inRoom ? fittingEquipped : equippedItems;

  // Memoize so the same Animated.Interpolation object is reused across renders —
  // recreating it every frame can cause RNW to re-attach the subscription and
  // deliver finished:false to the timing callback before it truly completes.
  const panelWidthAnim = useMemo(
    () => panelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, PANEL_WIDTH] }),
    [PANEL_WIDTH]
  );

  // ── Spring helper ────────────────────────────────────────────────────────────
  function springPanel(toValue: number, done?: () => void) {
    // Use timing (not spring) for the panel slide — it's a UI drawer, not Butter.
    // Timing settles deterministically so the `done` callback always fires reliably.
    Animated.timing(panelAnim, {
      toValue,
      duration: 280,
      useNativeDriver: false,
    }).start(({ finished }) => { if (finished && done) done(); });
  }

  // ── Navigation actions ───────────────────────────────────────────────────────

  // Play → Changing Room (panel auto-opens)
  function enterRoom() {
    setFittingEquipped({ ...equippedItems });
    setFacing('front');
    setInRoom(true);
    setPanelOpen(true);
    springPanel(1);
  }

  // Open the panel from inside the room (panel-closed state)
  function openPanel() {
    setPanelOpen(true);
    springPanel(1);
  }

  // Close the panel — stay in the changing room
  function closePanel() {
    springPanel(0, () => setPanelOpen(false));
  }

  // Leave the changing room WITHOUT saving — back to play
  function exitRoom() {
    const finish = () => { setPanelOpen(false); setInRoom(false); setFacing('front'); };
    panelOpen ? springPanel(0, finish) : finish();
  }

  // Save the current fitting look, then exit to play
  function saveAndExit() {
    equipLook({ ...fittingEquipped });
    const finish = () => { setPanelOpen(false); setInRoom(false); setFacing('front'); };
    panelOpen ? springPanel(0, finish) : finish();
  }

  // ── Fitting mutations (local — no DB write) ──────────────────────────────────
  function fitItem(itemId: string, slot: Slot) {
    setFittingEquipped(prev => ({ ...prev, [slot]: itemId }));
  }
  function removeFit(slot: Slot) {
    setFittingEquipped(prev => { const n = { ...prev }; delete n[slot]; return n; });
  }

  // ── Filtered panel list ──────────────────────────────────────────────────────
  const panelItems = useMemo(() => {
    let items = STORE_ITEMS;
    if (activeTab === 'owned') items = items.filter(i => ownedItems.includes(i.id));
    if (activeSlot !== 'all') items = items.filter(i => i.slot === activeSlot);
    return items;
  }, [activeTab, activeSlot, ownedItems]);

  // ── Item card ────────────────────────────────────────────────────────────────
  function renderItem({ item }: { item: StoreItem }) {
    const owned     = ownedItems.includes(item.id);
    const fitted    = fittingEquipped[item.slot] === item.id;
    const trying    = !owned && fitted;
    const canAfford = gameState.coins >= item.price;

    return (
      <View style={styles.itemCard}>
        {/* Left: info */}
        <View style={styles.itemInfo}>
          <View style={styles.itemNameRow}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.slotTag}>
              <Text style={styles.slotTagText}>{SLOT_LABELS[item.slot]}</Text>
            </View>
          </View>
          {fitted && (
            <View style={[styles.statusBadge, trying ? styles.badgeTrying : styles.badgeFitted]}>
              <Text style={[styles.statusText, trying && styles.statusTextTrying]}>
                {trying ? 'Trying' : 'Fitted ✓'}
              </Text>
            </View>
          )}
          {!owned && (
            <Text style={[styles.priceText, !canAfford && styles.priceMuted]}>
              🪙 {item.price}
            </Text>
          )}
        </View>

        {/* Right: actions */}
        <View style={styles.itemActions}>
          {owned ? (
            <Pressable
              onPress={() => fitted ? removeFit(item.slot) : fitItem(item.id, item.slot)}
              style={[styles.actionBtn, fitted ? styles.btnRemove : styles.btnFit]}
            >
              <Text style={[styles.actionBtnText, fitted && styles.textMuted]}>
                {fitted ? 'Remove' : 'Fit'}
              </Text>
            </Pressable>
          ) : trying ? (
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

      {/* ── Main: [panel?][handle?][stage] ── */}
      <View style={styles.mainArea}>

        {/* Panel + handle — only present in room mode */}
        {inRoom && (
          <>
            {/* Clip wrapper animates; inner is fixed PANEL_WIDTH so content never compresses */}
            <Animated.View style={[styles.panelClip, { width: panelWidthAnim }]}>
              <View style={[styles.panelInner, { width: PANEL_WIDTH }]}>

                {/* Owned / Store tabs */}
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

                {/* Slot filter — View wrapper fixes RNW ScrollView flex-grow:1 issue */}
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
                  ListEmptyComponent={
                    <Text style={styles.emptyList}>
                      {activeTab === 'owned' ? 'No items owned yet.\nHead to Store to browse!' : 'No items in this slot.'}
                    </Text>
                  }
                />

                {/* Bottom bar: ← Leave always; Save Look only when changes exist */}
                <View style={styles.panelBottom}>
                  <Pressable
                    onPress={exitRoom}
                    style={[styles.bottomBtn, styles.btnLeave, !canSave && styles.bottomBtnFull]}
                  >
                    <Text style={styles.leaveText}>← Leave</Text>
                  </Pressable>
                  {canSave && (
                    <Pressable onPress={saveAndExit} style={[styles.bottomBtn, styles.btnSave]}>
                      <Text style={styles.saveText}>Save Look ✓</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* Handle — toggles panel open/close while staying in the room */}
            <Pressable
              onPress={panelOpen ? closePanel : openPanel}
              style={styles.handle}
              accessibilityRole="button"
              accessibilityLabel={panelOpen ? 'Close wardrobe panel' : 'Open wardrobe panel'}
            >
              <Text style={styles.handleIcon}>{panelOpen ? '‹' : '›'}</Text>
            </Pressable>
          </>
        )}

        {/* Stage — full width in play, flex:1 remainder in room */}
        <View style={[styles.stage, inRoom && styles.stageRoom]}>

          {/* Changing room background decorations */}
          {inRoom && (
            <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
              {/* Floor line */}
              <View style={styles.roomFloor} />
              {/* Mirror — only when panel is closed and stage is wide */}
              {!panelOpen && <View style={styles.roomMirror} />}
            </View>
          )}

          {/* Butter on podium (or play pose) */}
          <View style={styles.mascotWrap}>
            <Mascot
              mood={mood}
              size={mascotSize}
              equipped={stageEquipped}
              facingOverride={inRoom ? facing : undefined}
            />
            {inRoom && (
              <View style={styles.podium}>
                <SvgXml
                  xml={PODIUM_SVG}
                  width={panelOpen ? 70 : 110}
                  height={18}
                />
              </View>
            )}
          </View>

          {/* ── Room controls (panel closed) ── */}
          {inRoom && !panelOpen && (
            <View style={styles.roomControls}>
              {/* Rotate Butter front ↔ back */}
              <Pressable onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')} style={styles.rotateBtn}>
                <Text style={styles.rotateBtnText}>↺</Text>
              </Pressable>
              {/* Open the item panel */}
              <Pressable onPress={openPanel} style={styles.openPanelBtn}>
                <Text style={styles.openPanelBtnText}>👗  Wardrobe ›</Text>
              </Pressable>
              {/* Exit back to play */}
              <Pressable onPress={exitRoom} style={styles.exitRoomBtn}>
                <Text style={styles.exitRoomBtnText}>← Back to play</Text>
              </Pressable>
            </View>
          )}

          {/* ── Play mode: Dress Up entry ── */}
          {!inRoom && (
            <Pressable onPress={enterRoom} style={styles.dressUpBtn}>
              <Text style={styles.dressUpBtnText}>👗  Dress Up</Text>
            </Pressable>
          )}

        </View>
      </View>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ROOM_BG   = '#EAE4F2'; // soft lavender — distinct from play cream
const ROOM_LINE = '#C4B0D8'; // muted purple for floor/mirror

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

  // Layout
  mainArea: { flex: 1, flexDirection: 'row' },

  // Panel clip + inner
  panelClip: { overflow: 'hidden', alignSelf: 'stretch' },
  panelInner: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
  },

  // Tabs
  tabRow:        { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.hairline },
  tab:           { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: colors.butter },
  tabText:       { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSoft },
  tabTextActive: { fontFamily: fonts.bodyBold,   fontSize: 14, color: colors.textBrown },

  // Slot filter — View wrapper prevents RNW ScrollView flex-grow:1 from inflating height
  filterRow:        { height: 44, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  filterContent:    { paddingHorizontal: 12, paddingVertical: 8, gap: 6, alignItems: 'center' },
  filterPill:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: '#F3EDE3' },
  filterPillActive: { backgroundColor: colors.butter },
  filterText:       { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSoft },
  filterTextActive: { fontFamily: fonts.bodyBold,   fontSize: 12, color: colors.textBrown },

  // Item list
  flatList:  { flex: 1 },
  itemList:  { padding: 10, gap: 8, paddingBottom: 16 },
  emptyList: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSoft,
    marginTop: 32,
    lineHeight: 20,
  },

  // Item card
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

  // Item action buttons
  itemActions:   { alignItems: 'stretch', justifyContent: 'center', minWidth: 60 },
  actionBtn:     { paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.sm, alignItems: 'center' },
  btnFit:        { backgroundColor: colors.butter },
  btnRemove:     { backgroundColor: '#F3EDE3' },
  btnTry:        { backgroundColor: '#DCF0E8' },
  btnBuy:        { backgroundColor: colors.butter },
  btnDisabled:   { backgroundColor: '#EDE8DF', opacity: 0.55 },
  actionBtnText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.textBrown },
  textMuted:     { color: colors.textSoft },

  // Panel bottom bar
  panelBottom:    { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.hairline },
  bottomBtn:      { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  bottomBtnFull:  { flex: 1 }, // takes full width when Save is hidden
  btnLeave:       { backgroundColor: '#F3EDE3' },
  btnSave:        { backgroundColor: colors.butter, ...cardShadow },
  leaveText:      { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSoft },
  saveText:       { fontFamily: fonts.bodyBold,   fontSize: 13, color: colors.textBrown },

  // Handle tab
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
  stage:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCream },
  stageRoom: { backgroundColor: ROOM_BG },

  // Changing room decorations (absolute, non-interactive)
  roomFloor: {
    position: 'absolute',
    left: 0, right: 0,
    bottom: 56,
    height: 1.5,
    backgroundColor: ROOM_LINE,
    opacity: 0.6,
  },
  roomMirror: {
    position: 'absolute',
    top: 28,
    right: 16,
    width: 50,
    height: 104,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: ROOM_LINE,
    backgroundColor: '#F4F0FA',
    opacity: 0.7,
  },

  // Mascot
  mascotWrap: { alignItems: 'center' },
  podium:     { marginTop: -6 },

  // Room controls (visible when in room, panel closed)
  roomControls: {
    position: 'absolute',
    bottom: 24,
    left: 0, right: 0,
    alignItems: 'center',
    gap: 10,
  },
  rotateBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4F0FA',
    borderWidth: 1.5,
    borderColor: ROOM_LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotateBtnText: { fontSize: 22, color: colors.textBrown },

  openPanelBtn: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 9,
    ...softShadow,
  },
  openPanelBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textBrown },

  exitRoomBtn: { paddingVertical: 6 },
  exitRoomBtnText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSoft },

  // Play mode entry
  dressUpBtn: {
    position: 'absolute',
    bottom: 32,
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingHorizontal: 28,
    paddingVertical: 12,
    ...cardShadow,
  },
  dressUpBtnText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
});
