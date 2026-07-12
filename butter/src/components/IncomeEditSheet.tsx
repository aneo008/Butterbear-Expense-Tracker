import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import { Alert } from '../lib/dialog';
import * as Haptics from '../lib/haptics';
import { currentMonth, formatMonthShort } from '../lib/date';
import { salaryForMonth } from '../lib/incomeMath';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

// v1.5.6: set a month's income. Scope decides where it's written:
//  - 'month'  → a per-month OVERRIDE (key in this exact month; wins for it)
//  - 'from'   → a salary_history row (this month onward, carry-forward)
//  - 'always' → the base salary (budget.monthly_budget; all untouched months)
// Precedence at read time: override > salary(from) > base (see incomeMath).

type Scope = 'month' | 'from' | 'always';

type Props = {
  visible: boolean;
  initialMonth?: string;   // month to preselect (defaults to current)
  onClose: () => void;
};

/** Current month ±6, for the "which month?" picker. */
function monthChoices(extra: string | null): string[] {
  const out: string[] = [];
  let [y, m] = currentMonth().split('-').map(Number);
  m -= 6;
  while (m < 1) { m += 12; y -= 1; }
  for (let i = 0; i < 13; i++) {
    out.push(`${y}-${m < 10 ? '0' + m : m}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  if (extra && !out.includes(extra)) out.unshift(extra);
  return out;
}

export default function IncomeEditSheet({ visible, initialMonth, onClose }: Props) {
  const income = useExpenseStore(s => s.income);
  const salaryHistory = useExpenseStore(s => s.salaryHistory);
  const incomeOverrides = useExpenseStore(s => s.incomeOverrides);
  const setIncome = useExpenseStore(s => s.setIncome);
  const addSalary = useExpenseStore(s => s.addSalary);
  const addIncomeOverride = useExpenseStore(s => s.addIncomeOverride);

  const [month, setMonth] = useState(currentMonth());
  const [amountText, setAmountText] = useState('');
  const [scope, setScope] = useState<Scope>('month');

  useEffect(() => {
    if (!visible) return;
    const m = initialMonth ?? currentMonth();
    setMonth(m);
    // Prefill with whatever this month currently resolves to (override or salary).
    const override = incomeOverrides.find(o => o.month === m);
    const base = override ? override.amount : salaryForMonth(income, salaryHistory, m);
    setAmountText(base !== null ? String(base) : '');
    setScope(override ? 'month' : salaryHistory.length === 0 && income === null ? 'always' : 'month');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialMonth]);

  const save = () => {
    const v = Math.round(parseFloat(amountText) * 100) / 100;
    const amount = Number.isFinite(v) && v > 0 ? v : null;
    if (amount === null) {
      Alert.alert('Missing amount', 'Enter an income greater than zero.');
      return;
    }
    if (scope === 'always') setIncome(amount);
    else if (scope === 'from') addSalary({ from_month: month, amount });
    else addIncomeOverride({ month, amount });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const SCOPES: { key: Scope; label: string; hint: string }[] = [
    { key: 'month', label: 'This month only', hint: `Sets ${formatMonthShort(month)} exactly — other months are untouched.` },
    { key: 'from', label: 'From this month on', hint: `${formatMonthShort(month)} onward, until you change it again.` },
    { key: 'always', label: 'Always', hint: 'Your default income for every month with nothing else set.' },
  ];
  const activeHint = SCOPES.find(s => s.key === scope)!.hint;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text selectable={false} style={styles.title}>Set income</Text>

            <ScrollView
              style={styles.fieldsScroll}
              contentContainerStyle={styles.fieldsBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text selectable={false} style={styles.fieldLabel}>Amount (SGD)</Text>
              <TextInput
                style={styles.input}
                value={amountText}
                onChangeText={setAmountText}
                placeholder="0.00"
                placeholderTextColor="#BCAF9C"
                keyboardType="decimal-pad"
                inputMode="decimal"
                autoFocus
              />

              <Text selectable={false} style={styles.fieldLabel}>Which month?</Text>
              <View style={styles.chipWrap}>
                {monthChoices(initialMonth ?? null).map(m => {
                  const active = month === m;
                  return (
                    <Pressable
                      key={m}
                      accessibilityLabel={`income-edit-month-${m}`}
                      onPress={() => setMonth(m)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text selectable={false} style={[styles.chipText, active && styles.chipTextActive]}>
                        {formatMonthShort(m)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text selectable={false} style={styles.fieldLabel}>Apply to</Text>
              <View style={styles.scopeCol}>
                {SCOPES.map(s => (
                  <Pressable
                    key={s.key}
                    accessibilityLabel={`income-scope-${s.key}`}
                    onPress={() => setScope(s.key)}
                    style={[styles.scopeChip, scope === s.key && styles.scopeChipActive]}
                  >
                    <Text selectable={false} style={[styles.scopeText, scope === s.key && styles.scopeTextActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text selectable={false} style={styles.scopeHint}>{activeHint}</Text>
            </ScrollView>

            <Pressable accessibilityLabel="income-edit-save" onPress={save} style={styles.saveButton}>
              <Text selectable={false} style={styles.saveText}>Save</Text>
            </Pressable>
            <Pressable accessibilityLabel="income-edit-cancel" onPress={onClose} style={styles.cancelButton}>
              <Text selectable={false} style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: '#00000055',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    overflow: 'hidden',
    ...cardShadow,
  },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.textBrown, textAlign: 'center', marginBottom: 8 },
  fieldsScroll: { alignSelf: 'stretch', flexShrink: 1 },
  fieldsBody: { paddingBottom: 4 },

  fieldLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textSoft,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#FBF6EA',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textBrown,
  },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.bearBody,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.bgCard,
  },
  chipActive: { backgroundColor: colors.butter, borderColor: colors.butter },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textBrown },
  chipTextActive: { fontFamily: fonts.bodyBold },

  scopeCol: { gap: 8 },
  scopeChip: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bearBody,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.bgCard,
  },
  scopeChipActive: { backgroundColor: colors.butter, borderColor: colors.butter },
  scopeText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textBrown },
  scopeTextActive: { fontFamily: fonts.bodyBold },
  scopeHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft, marginTop: 8, lineHeight: 17 },

  saveButton: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
  cancelButton: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSoft },
});
