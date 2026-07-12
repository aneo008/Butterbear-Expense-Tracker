import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import { IncomeEvent } from '../db/types';
import { Alert } from '../lib/dialog';
import * as Haptics from '../lib/haptics';
import { currentMonth, formatMonthShort } from '../lib/date';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

// v1.5.4: add/edit a one-off income entry (bonus, 13th month, freelance…).
// Deliberately tiny — label, amount, which month, delete.

export type IncomeSheetRequest = {
  editing: IncomeEvent | null; // null = add mode
};

type Props = {
  request: IncomeSheetRequest | null; // null = hidden
  onClose: () => void;
};

/** Current month, 5 back and 6 forward — bonuses are usually recent or upcoming. */
function monthChoices(extra: string | null): string[] {
  const out: string[] = [];
  let [y, m] = currentMonth().split('-').map(Number);
  m -= 5;
  while (m < 1) { m += 12; y -= 1; }
  for (let i = 0; i < 12; i++) {
    out.push(`${y}-${m < 10 ? '0' + m : m}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  if (extra && !out.includes(extra)) out.unshift(extra);
  return out;
}

export default function IncomeEventSheet({ request, onClose }: Props) {
  const addIncomeEvent = useExpenseStore(s => s.addIncomeEvent);
  const updateIncomeEvent = useExpenseStore(s => s.updateIncomeEvent);
  const deleteIncomeEvent = useExpenseStore(s => s.deleteIncomeEvent);

  const visible = request !== null;
  const editing = request?.editing ?? null;

  const [label, setLabel] = useState('');
  const [amountText, setAmountText] = useState('');
  const [month, setMonth] = useState(currentMonth());

  useEffect(() => {
    if (!request) return;
    setLabel(request.editing?.label ?? '');
    setAmountText(request.editing ? String(request.editing.amount) : '');
    setMonth(request.editing?.month ?? currentMonth());
  }, [request]);

  const save = () => {
    const trimmed = label.trim();
    const amount = Math.round(parseFloat(amountText) * 100) / 100;
    if (!trimmed) {
      Alert.alert('Missing name', 'Give it a name (e.g. "Year-end bonus").');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Missing amount', 'Enter an amount greater than zero.');
      return;
    }
    if (editing) updateIncomeEvent(editing.id, { label: trimmed, amount, month });
    else addIncomeEvent({ label: trimmed, amount, month });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const confirmDelete = () => {
    if (!editing) return;
    Alert.alert('Delete this entry?', `"${editing.label}" will be removed from your income.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteIncomeEvent(editing.id); onClose(); } },
    ]);
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text selectable={false} style={styles.title}>
            {editing ? 'Edit income' : 'Extra income'}
          </Text>

          {/* Bounded scroll so short (phone) viewports can reach every field. */}
          <ScrollView
            style={styles.fieldsScroll}
            contentContainerStyle={styles.fieldsBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <Text selectable={false} style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Year-end bonus"
            placeholderTextColor="#BCAF9C"
          />

          <Text selectable={false} style={styles.fieldLabel}>Amount (SGD)</Text>
          <TextInput
            style={styles.input}
            value={amountText}
            onChangeText={setAmountText}
            placeholder="0.00"
            placeholderTextColor="#BCAF9C"
            keyboardType="decimal-pad"
            inputMode="decimal"
          />

          <Text selectable={false} style={styles.fieldLabel}>Which month?</Text>
          <View style={styles.chipWrap}>
            {monthChoices(editing?.month ?? null).map(m => {
              const active = month === m;
              return (
                <Pressable
                  key={m}
                  accessibilityLabel={`income-month-${m}`}
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
          </ScrollView>

          <Pressable accessibilityLabel="income-save" onPress={save} style={styles.saveButton}>
            <Text selectable={false} style={styles.saveText}>{editing ? 'Save changes' : 'Add income'}</Text>
          </Pressable>
          {editing && (
            <Pressable accessibilityLabel="income-delete" onPress={confirmDelete} style={styles.deleteButton}>
              <Text selectable={false} style={styles.deleteText}>Delete</Text>
            </Pressable>
          )}
          <Pressable accessibilityLabel="income-cancel" onPress={onClose} style={styles.cancelButton}>
            <Text selectable={false} style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000055',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  fieldsScroll: { alignSelf: 'stretch', flexShrink: 1 },
  fieldsBody: { paddingBottom: 4 },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.textBrown, textAlign: 'center', marginBottom: 8 },

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
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
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

  saveButton: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  saveText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
  deleteButton: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  deleteText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#D9534F' },
  cancelButton: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSoft },
});
