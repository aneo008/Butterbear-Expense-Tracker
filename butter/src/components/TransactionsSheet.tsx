import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Animated } from 'react-native';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import * as Haptics from '../lib/haptics';
import { useExpenseStore } from '../store/useExpenseStore';
import { Expense, getAllExpenses } from '../db/queries';
import { formatDateLabel, formatMonthLong, currentMonth } from '../lib/date';
import { colors, radius, fonts, softShadow } from '../constants/theme';

// Two-state "notification-shade" sheet over the Home stage. Collapsed shows a peek
// (handle + a couple of rows); swipe/drag up snaps to expanded (all transactions,
// grouped by month); drag the handle down snaps back to Butter. Built on
// gesture-handler pan + built-in Animated (no Reanimated). Absolutely fills its
// parent (Home's "stage"), which clips the off-screen portion via overflow:hidden.

const PEEK = 172;          // visible height when collapsed (handle + ~2 rows)
const VELOCITY_SNAP = 450; // px/s fling threshold to open/close

const fmt = (n: number) => n.toFixed(2);

type Section = { month: string; total: number; data: Expense[] };

function groupByMonth(expenses: Expense[]): Section[] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const m = e.spent_at.slice(0, 7);
    const l = map.get(m);
    if (l) l.push(e);
    else map.set(m, [e]);
  }
  // getAllExpenses() is newest-first, so insertion order keeps months newest-first.
  return Array.from(map.entries()).map(([month, data]) => ({
    month,
    data,
    total: data.reduce((s, e) => s + e.amount, 0),
  }));
}

export default function TransactionsSheet() {
  const categories = useExpenseStore(s => s.categories);
  const dataVersion = useExpenseStore(s => s.dataVersion);
  const openEditSheet = useExpenseStore(s => s.openEditSheet);

  const sections = useMemo(() => groupByMonth(getAllExpenses()), [dataVersion]);

  // Collapsible months — only the current month is open by default. Headers (with
  // subtotals) always show; collapsing a month just hides its rows (data: []).
  const [openMonths, setOpenMonths] = useState<Set<string>>(() => new Set([currentMonth()]));
  const didInitOpen = useRef(false);
  useEffect(() => {
    if (didInitOpen.current || sections.length === 0) return;
    didInitOpen.current = true;
    const cm = currentMonth();
    // Fall back to the newest month if there's nothing logged this month yet.
    setOpenMonths(new Set([sections.some(s => s.month === cm) ? cm : sections[0].month]));
  }, [sections]);

  const toggleMonth = useCallback((m: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpenMonths(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  }, []);

  const displaySections = useMemo(
    () => sections.map(s => ({ ...s, data: openMonths.has(s.month) ? s.data : [] })),
    [sections, openMonths]
  );

  const [h, setH] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const translateY = useRef(new Animated.Value(9999)).current; // off-screen until measured
  const lastOffset = useRef(9999);
  const inited = useRef(false);

  const collapsedY = useCallback((height: number) => Math.max(0, height - PEEK), []);

  const onLayout = useCallback((e: { nativeEvent: { layout: { height: number } } }) => {
    const newH = e.nativeEvent.layout.height;
    if (!newH) return;
    setH(prev => (prev !== newH ? newH : prev));
    if (!inited.current) {
      const c = Math.max(0, newH - PEEK);
      translateY.setValue(c);
      lastOffset.current = c;
      inited.current = true;
    }
  }, [translateY]);

  const snapTo = useCallback((toExpanded: boolean) => {
    const dest = toExpanded ? 0 : collapsedY(h);
    lastOffset.current = dest;
    setExpanded(toExpanded);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(translateY, { toValue: dest, useNativeDriver: false, bounciness: 2, speed: 16 }).start();
  }, [collapsedY, h, translateY]);

  const onPan = useCallback((e: PanGestureHandlerGestureEvent) => {
    const max = collapsedY(h);
    const next = Math.min(Math.max(lastOffset.current + e.nativeEvent.translationY, 0), max);
    translateY.setValue(next);
  }, [collapsedY, h, translateY]);

  const onPanState = useCallback((e: PanGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.state !== State.END) return;
    const { translationY, velocityY } = e.nativeEvent;
    if (Math.abs(translationY) < 6) { snapTo(!expanded); return; } // tap → toggle
    let toExpanded: boolean;
    if (velocityY < -VELOCITY_SNAP) toExpanded = true;
    else if (velocityY > VELOCITY_SNAP) toExpanded = false;
    else {
      const max = collapsedY(h);
      const current = Math.min(Math.max(lastOffset.current + translationY, 0), max);
      toExpanded = current < max / 2;
    }
    snapTo(toExpanded);
  }, [collapsedY, expanded, h, snapTo]);

  const handleEdit = useCallback((item: Expense) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openEditSheet(item);
  }, [openEditSheet]);

  const catInfo = useCallback(
    (id: string) => categories.find(c => c.id === id) ?? { name: 'Other', icon: '📦', color: colors.bearBody },
    [categories]
  );

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]} onLayout={onLayout}>
      {/* Drag handle / header — always pannable (up = expand, down = collapse, tap = toggle) */}
      <PanGestureHandler onGestureEvent={onPan} onHandlerStateChange={onPanState}>
        <Animated.View style={styles.handleZone}>
          <View style={styles.grabber} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>{expanded ? 'Transactions' : 'Recent'}</Text>
            <Text style={styles.chevron}>{expanded ? '⌄' : '⌃'}</Text>
          </View>
        </Animated.View>
      </PanGestureHandler>

      {/* Body — list scrolls only when expanded; while collapsed, a pan-up here expands. */}
      <PanGestureHandler enabled={!expanded} onGestureEvent={onPan} onHandlerStateChange={onPanState}>
        <Animated.View style={styles.body}>
          {sections.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No expenses yet.</Text>
              <Text style={styles.emptyText}>Tap Butter to add one!</Text>
            </View>
          ) : (
            <SectionList
              sections={displaySections}
              keyExtractor={item => item.id}
              scrollEnabled={expanded}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section }) => {
                const open = openMonths.has(section.month);
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleMonth(section.month)}
                    style={styles.sectionHeader}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <Text style={styles.sectionChevron}>{open ? '▾' : '▸'}</Text>
                      <Text style={styles.sectionMonth}>{formatMonthLong(section.month)}</Text>
                    </View>
                    <Text style={styles.sectionTotal}>SGD {fmt(section.total)}</Text>
                  </TouchableOpacity>
                );
              }}
              renderItem={({ item }) => {
                const cat = catInfo(item.category_id);
                return (
                  <TouchableOpacity onPress={() => handleEdit(item)} activeOpacity={0.7} style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: cat.color }]}>
                      <Text style={styles.icon}>{cat.icon}</Text>
                    </View>
                    <View style={styles.rowMid}>
                      <Text style={styles.rowCat}>{cat.name}</Text>
                      <Text style={styles.rowDate}>
                        {formatDateLabel(item.spent_at)}{item.note ? ` · ${item.note}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.rowAmount}>SGD {fmt(item.amount)}</Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: colors.bgCream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#C9A06E',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 12,
  },
  handleZone: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.bgCream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#E3C49A', marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textBrown },
  chevron: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.textSoft },

  body: { flex: 1 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, paddingBottom: 8 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionChevron: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSoft, width: 12 },
  sectionMonth: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
  sectionTotal: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textSoft },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.md,
    padding: 14, marginBottom: 8, gap: 12, ...softShadow,
  },
  dot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  rowMid: { flex: 1 },
  rowCat: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
  rowDate: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft, marginTop: 2 },
  rowAmount: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },

  empty: { padding: 28, alignItems: 'center' },
  emptyText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSoft, textAlign: 'center' },
});
