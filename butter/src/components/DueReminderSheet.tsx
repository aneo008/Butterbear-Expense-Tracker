import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import { getMeta, setMeta } from '../db/queries';
import {
  duePaymentsWithin,
  DuePayment,
  allocationAmountForMonth,
  allocationBaseAmountForMonth,
  MonthIncome,
} from '../lib/allocationMath';
import { incomeForMonth, baseIncomeForMonth } from '../lib/incomeMath';
import { todayISO, addDaysISO, formatDateLabel } from '../lib/date';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

// v1.7.0: launch reminder for payments due in the next few days. Shows at most
// once per calendar day (app_meta stamp) and only when something is actually
// due — fails closed on any bad data. Real phone notifications arrive with the
// native build; duePaymentsWithin() is the shared selection logic for both.

const LAST_SHOWN_KEY = 'due_reminder_last_shown';
export const DUE_REMINDER_HORIZON_DAYS = 3;

type Props = {
  onSettled?: () => void; // launch-popup chaining, same contract as WhatsNewSheet
  forceVisible?: boolean; // dev preview
  onForceClose?: () => void;
};

const fmt = (n: number) => `SGD ${n.toFixed(2)}`;

function whenLabel(due: string, today: string): string {
  if (due === today) return 'today';
  if (due === addDaysISO(today, 1)) return 'tomorrow';
  return formatDateLabel(due);
}

export default function DueReminderSheet({ onSettled, forceVisible, onForceClose }: Props) {
  const controlled = forceVisible !== undefined;
  const allocations = useExpenseStore(s => s.allocations);
  const allocationAmountHistory = useExpenseStore(s => s.allocationAmountHistory);
  const income = useExpenseStore(s => s.income);
  const salaryHistory = useExpenseStore(s => s.salaryHistory);
  const incomeEvents = useExpenseStore(s => s.incomeEvents);
  const incomeOverrides = useExpenseStore(s => s.incomeOverrides);

  const [autoVisible, setAutoVisible] = useState(false);
  const today = todayISO();
  const due = duePaymentsWithin(allocations, today, DUE_REMINDER_HORIZON_DAYS);

  useEffect(() => {
    if (controlled) return;
    if (due.length === 0 || getMeta(LAST_SHOWN_KEY) === today) {
      onSettled?.();
      return;
    }
    const t = setTimeout(() => setAutoVisible(true), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    if (controlled) { onForceClose?.(); return; }
    setMeta(LAST_SHOWN_KEY, today);
    setAutoVisible(false);
    onSettled?.();
  };

  const monthIncomeFor = (m: string): MonthIncome => ({
    base: baseIncomeForMonth(income, salaryHistory, incomeOverrides, m),
    total: incomeForMonth(income, salaryHistory, incomeOverrides, incomeEvents, m),
  });
  const amountFor = (p: DuePayment): number => {
    const m = p.due.slice(0, 7);
    return p.a.percent != null
      ? allocationAmountForMonth(p.a, monthIncomeFor(m), m, allocationAmountHistory)
      : allocationBaseAmountForMonth(p.a, m, allocationAmountHistory);
  };

  const visible = controlled ? !!forceVisible : autoVisible;
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <Pressable style={styles.overlay} onPress={dismiss}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.emoji}>💸</Text>
          <Text style={styles.title}>Payments due soon</Text>
          <View style={styles.list}>
            {due.map(p => (
              <View key={p.a.id} style={styles.row}>
                <Text style={styles.rowLabel} numberOfLines={1}>{p.a.label}</Text>
                <Text style={styles.rowWhen}>{whenLabel(p.due, today)}</Text>
                <Text style={styles.rowAmount}>{fmt(amountFor(p))}</Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.button} onPress={dismiss}>
            <Text style={styles.buttonText}>Got it!</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: 24,
    alignItems: 'center', width: '100%', maxWidth: 360, maxHeight: '80%', ...cardShadow,
  },
  emoji: { fontSize: 36 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.textBrown, marginTop: 2, marginBottom: 12 },
  list: { alignSelf: 'stretch', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textBrown },
  rowWhen: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSoft },
  rowAmount: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textBrown },
  button: { backgroundColor: colors.butter, borderRadius: radius.pill, paddingHorizontal: 36, paddingVertical: 11, marginTop: 18 },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
});
