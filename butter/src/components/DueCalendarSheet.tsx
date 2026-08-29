import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import { Allocation } from '../db/types';
import {
  dueDateInMonth,
  allocationAmountForMonth,
  allocationBaseAmountForMonth,
  MonthIncome,
} from '../lib/allocationMath';
import { incomeForMonth, baseIncomeForMonth } from '../lib/incomeMath';
import { todayISO, currentMonth, addMonths, monthRange, formatMonthLong, formatDateLabel } from '../lib/date';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

// v1.7.0: full due-date calendar behind the Money screen's "Due soon" card.
// Months are display groups only — "past" is time-based (the app never tracks
// whether a payment was actually paid). Past months grey out entirely; in the
// current month, dates before today grey out. Yearly rows show their FULL
// amount in their due month (payment calendar, not the ÷12 display equivalent).

const MONTHS_BACK = 3;
const MONTHS_FWD = 12; // ≥12 so every yearly payment appears exactly once

type Props = { visible: boolean; onClose: () => void };

const fmt = (n: number) => `SGD ${n.toFixed(2)}`;

export default function DueCalendarSheet({ visible, onClose }: Props) {
  const allocations = useExpenseStore(s => s.allocations);
  const allocationGroups = useExpenseStore(s => s.allocationGroups);
  const allocationAmountHistory = useExpenseStore(s => s.allocationAmountHistory);
  const income = useExpenseStore(s => s.income);
  const salaryHistory = useExpenseStore(s => s.salaryHistory);
  const incomeEvents = useExpenseStore(s => s.incomeEvents);
  const incomeOverrides = useExpenseStore(s => s.incomeOverrides);

  const today = todayISO();
  const thisMonth = currentMonth();

  const monthIncomeFor = (m: string): MonthIncome => ({
    base: baseIncomeForMonth(income, salaryHistory, incomeOverrides, m),
    total: incomeForMonth(income, salaryHistory, incomeOverrides, incomeEvents, m),
  });
  // Amount actually due that month (percent rows resolve against that month's income).
  const amountFor = (a: Allocation, m: string): number =>
    a.percent != null
      ? allocationAmountForMonth(a, monthIncomeFor(m), m, allocationAmountHistory)
      : allocationBaseAmountForMonth(a, m, allocationAmountHistory);

  const groupIcon = (id: string | null): string =>
    allocationGroups.find(g => g.id === id)?.icon ?? '📌';

  const sections = useMemo(() => {
    const recurring = allocations.filter(a => a.kind === 'recurring');
    return monthRange(addMonths(thisMonth, -MONTHS_BACK), addMonths(thisMonth, MONTHS_FWD))
      .map(m => ({
        month: m,
        rows: recurring
          .map(a => ({ a, due: dueDateInMonth(a, m) }))
          .filter((x): x is { a: Allocation; due: string } => x.due !== null)
          .sort((x, y) => x.due.localeCompare(y.due)),
      }))
      .filter(s => s.rows.length > 0);
  }, [allocations, thisMonth]);

  // Open scrolled to the current month (or the first future one if this month is empty).
  const scrollRef = useRef<ScrollView>(null);
  const currentY = useRef(0);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => scrollRef.current?.scrollTo({ y: currentY.current, animated: false }), 60);
    return () => clearTimeout(t);
  }, [visible]);
  const anchorMonth = sections.find(s => s.month >= thisMonth)?.month;

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.emoji}>🗓️</Text>
          <Text style={styles.title}>Due dates</Text>

          {sections.length === 0 ? (
            <Text style={styles.empty}>No recurring payments with due dates yet.</Text>
          ) : (
            <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
              {sections.map(s => {
                const pastMonth = s.month < thisMonth;
                return (
                  <View
                    key={s.month}
                    style={styles.section}
                    onLayout={s.month === anchorMonth ? e => { currentY.current = e.nativeEvent.layout.y; } : undefined}
                  >
                    <Text style={[styles.monthHeader, pastMonth && styles.mutedText]}>
                      {formatMonthLong(s.month)}
                    </Text>
                    {s.rows.map(({ a, due }) => {
                      const past = pastMonth || due < today;
                      return (
                        <View key={`${a.id}-${due}`} style={[styles.row, past && styles.rowPast]}>
                          <Text style={[styles.rowIcon, past && styles.mutedText]}>{groupIcon(a.group_id)}</Text>
                          <Text style={[styles.rowLabel, past && styles.mutedText]} numberOfLines={1}>{a.label}</Text>
                          <Text style={[styles.rowWhen, past && styles.mutedText]}>{formatDateLabel(due)}</Text>
                          <Text style={[styles.rowAmount, past && styles.mutedText]}>{fmt(amountFor(a, s.month))}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          )}

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: 20,
    alignItems: 'center', width: '100%', maxWidth: 380, maxHeight: '85%', ...cardShadow,
  },
  emoji: { fontSize: 32 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.textBrown, marginTop: 2, marginBottom: 8 },
  scroll: { alignSelf: 'stretch' },
  section: { marginBottom: 6 },
  monthHeader: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textBrown, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  rowPast: { opacity: 0.45 },
  rowIcon: { fontSize: 15 },
  rowLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textBrown },
  rowWhen: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft },
  rowAmount: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textBrown },
  mutedText: { color: colors.textSoft },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.textSoft, paddingVertical: 16, textAlign: 'center' },
  button: { backgroundColor: colors.butter, borderRadius: radius.pill, paddingHorizontal: 36, paddingVertical: 11, marginTop: 12 },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
});
