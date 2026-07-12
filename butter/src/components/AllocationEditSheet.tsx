import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import { Allocation, AllocationCycle } from '../db/types';
import { Alert } from '../lib/dialog';
import * as Haptics from '../lib/haptics';
import { currentMonth, formatMonthShort } from '../lib/date';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

function fmt(n: number): string {
  return `SGD ${n.toFixed(2)}`;
}

// Phase 5b: one sheet for adding/editing a set-aside or recurring payment —
// label, amount, group, cycle (monthly/yearly) + due date, one-off month, note.
// Groups can be created inline (small name + icon form) without leaving the sheet.

export type EditSheetRequest = {
  editing: Allocation | null;                // null = add mode
  presetGroupId?: string | null;             // preselect group when adding from a group card
  presetKind?: 'recurring' | 'oneoff';
};

type Props = {
  request: EditSheetRequest | null;          // null = hidden
  onClose: () => void;
};

const GROUP_ICON_CHOICES = ['🛡️', '📺', '💳', '🏠', '🚗', '📱', '🎓', '💪', '🎁', '📦'];

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The next 12 YYYY-MM values starting from the current month (for one-offs). */
function upcomingMonths(): string[] {
  const out: string[] = [];
  let [y, m] = currentMonth().split('-').map(Number);
  for (let i = 0; i < 12; i++) {
    out.push(`${y}-${m < 10 ? '0' + m : m}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

/** 12 months back through 2 months ahead (for logging a historical actual). */
function historyMonthChoices(): string[] {
  const out: string[] = [];
  let [y, m] = currentMonth().split('-').map(Number);
  m -= 12;
  while (m < 1) { m += 12; y -= 1; }
  for (let i = 0; i < 15; i++) {
    out.push(`${y}-${m < 10 ? '0' + m : m}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

export default function AllocationEditSheet({ request, onClose }: Props) {
  const allocationGroups = useExpenseStore(s => s.allocationGroups);
  const addAllocation = useExpenseStore(s => s.addAllocation);
  const updateAllocation = useExpenseStore(s => s.updateAllocation);
  const deleteAllocation = useExpenseStore(s => s.deleteAllocation);
  const addAllocationGroup = useExpenseStore(s => s.addAllocationGroup);
  const allocationHistoryAll = useExpenseStore(s => s.allocationHistory);
  const addAllocationHistory = useExpenseStore(s => s.addAllocationHistory);
  const deleteAllocationHistory = useExpenseStore(s => s.deleteAllocationHistory);

  const visible = request !== null;
  const editing = request?.editing ?? null;

  // Form state — re-initialised whenever the sheet is (re)opened.
  const [label, setLabel] = useState('');
  const [amountText, setAmountText] = useState('');
  const [kind, setKind] = useState<'recurring' | 'oneoff'>('recurring');
  const [cycle, setCycle] = useState<AllocationCycle>('monthly');
  const [dueDayText, setDueDayText] = useState('');
  const [dueMonth, setDueMonth] = useState<number | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [groupId, setGroupId] = useState<string | null>(null);
  const [infoOnly, setInfoOnly] = useState(false);
  const [isPercent, setIsPercent] = useState(false);      // v1.5.7: % set-aside mode
  const [percentInclBonus, setPercentInclBonus] = useState(true);
  const [note, setNote] = useState('');
  // Inline "new group" mini-form
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState(GROUP_ICON_CHOICES[0]);
  // v1.5.9: "Recorded history" mini-form (log a past actual for this allocation)
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(currentMonth());
  const [historyAmountText, setHistoryAmountText] = useState('');

  useEffect(() => {
    if (!request) return;
    const a = request.editing;
    setLabel(a?.label ?? '');
    setKind(a?.kind ?? request.presetKind ?? 'recurring');
    setCycle(a?.cycle ?? 'monthly');
    setDueDayText(a?.due_day != null ? String(a.due_day) : '');
    setDueMonth(a?.due_month ?? null);
    setMonth(a?.month ?? currentMonth());
    setGroupId(a ? a.group_id : request.presetGroupId ?? null);
    setInfoOnly(a?.info_only === 1);
    setIsPercent(a?.percent != null);
    setPercentInclBonus(a ? a.percent_incl_bonus === 1 : true);
    setAmountText(a ? String(a.percent != null ? a.percent : a.amount) : '');
    setNote(a?.note ?? '');
    setNewGroupOpen(false);
    setNewGroupName('');
    setNewGroupIcon(GROUP_ICON_CHOICES[0]);
    setHistoryOpen(false);
    setHistoryMonth(currentMonth());
    setHistoryAmountText('');
  }, [request]);

  // v1.5.9: recorded actuals for the allocation being edited (record-only — never
  // feeds monthCommitment/Spendable; today's config still drives every month's math).
  const history = editing
    ? allocationHistoryAll.filter(h => h.allocation_id === editing.id).sort((a, b) => b.month.localeCompare(a.month))
    : [];

  const addHistoryRow = () => {
    if (!editing) return;
    const v = Math.round(parseFloat(historyAmountText) * 100) / 100;
    if (!Number.isFinite(v) || v <= 0) {
      Alert.alert('Missing amount', 'Enter an amount greater than zero.');
      return;
    }
    addAllocationHistory({ allocation_id: editing.id, month: historyMonth, amount: v });
    setHistoryOpen(false);
    setHistoryAmountText('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const confirmDeleteHistory = (id: string, label: string) => {
    Alert.alert('Remove this record?', `${label} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteAllocationHistory(id) },
    ]);
  };

  const createGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const id = addAllocationGroup({ name, icon: newGroupIcon, sort_order: allocationGroups.length });
    setGroupId(id);
    setNewGroupOpen(false);
    setNewGroupName('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const percentMode = kind === 'recurring' && isPercent;

  const save = () => {
    const trimmed = label.trim();
    const num = Math.round(parseFloat(amountText) * 100) / 100;
    if (!trimmed) {
      Alert.alert('Missing name', 'Give this set-aside a name (e.g. "Tithe").');
      return;
    }
    if (percentMode) {
      if (!Number.isFinite(num) || num <= 0 || num > 100) {
        Alert.alert('Percentage', 'Enter a percentage between 0 and 100.');
        return;
      }
    } else if (!Number.isFinite(num) || num <= 0) {
      Alert.alert('Missing amount', 'Enter an amount greater than zero.');
      return;
    }
    const dueDay = dueDayText.trim() === '' ? null : Number(dueDayText);
    if (!percentMode && dueDay !== null && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) {
      Alert.alert('Due day', 'The due day must be between 1 and 31.');
      return;
    }
    if (kind === 'recurring' && !isPercent && cycle === 'yearly' && dueMonth === null) {
      Alert.alert('Due month', 'Pick which month this yearly payment lands in.');
      return;
    }

    const fields: Omit<Allocation, 'id'> = kind === 'recurring'
      ? percentMode
        ? {
            // Percentage set-aside: monthly, no due date; amount unused (0).
            label: trimmed, amount: 0, note: note.trim() || null, kind,
            month: null, group_id: groupId, cycle: 'monthly',
            due_day: null, due_month: null, info_only: infoOnly ? 1 : null,
            percent: num, percent_incl_bonus: percentInclBonus ? 1 : null,
          }
        : {
            label: trimmed, amount: num, note: note.trim() || null, kind,
            month: null,
            group_id: groupId,
            cycle,
            // Yearly needs a concrete date for the math/labels — default day 1.
            due_day: cycle === 'yearly' ? (dueDay ?? 1) : dueDay,
            due_month: cycle === 'yearly' ? dueMonth : null,
            info_only: infoOnly ? 1 : null,
            percent: null, percent_incl_bonus: null,
          }
      : {
          label: trimmed, amount: num, note: note.trim() || null, kind,
          month,
          group_id: null, cycle: null, due_day: null, due_month: null,
          info_only: null, percent: null, percent_incl_bonus: null,
        };

    if (editing) updateAllocation(editing.id, fields);
    else addAllocation(fields);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const confirmDelete = () => {
    if (!editing) return;
    Alert.alert('Delete this payment?', `"${editing.label}" will be removed from your set-asides.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAllocation(editing.id);
          onClose();
        },
      },
    ]);
  };

  const months = upcomingMonths();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      {/* KAV lives at the overlay level (iOS-only behavior; inert on web/Android) so the
          card's height chain stays bounded — see the phone-viewport overflow fix. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text selectable={false} style={styles.title}>
              {editing ? 'Edit payment' : 'New payment'}
            </Text>

            {/* Fields scroll; the ScrollView MUST be a direct flex child of the
                height-capped card (flexShrink) or it can neither scroll nor clip. */}
            <ScrollView
              style={styles.fieldsScroll}
              contentContainerStyle={styles.fieldsBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Name + amount */}
              <Text selectable={false} style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={label}
                onChangeText={setLabel}
                placeholder="e.g. Term life insurance"
                placeholderTextColor="#BCAF9C"
              />
              <Text selectable={false} style={styles.fieldLabel}>
                {percentMode ? 'Percentage of income (%)' : 'Amount (SGD)'}
              </Text>
              <TextInput
                style={styles.input}
                value={amountText}
                onChangeText={setAmountText}
                placeholder={percentMode ? '10' : '0.00'}
                placeholderTextColor="#BCAF9C"
                keyboardType="decimal-pad"
                inputMode="decimal"
              />

              {/* Kind */}
              <Text selectable={false} style={styles.fieldLabel}>Type</Text>
              <View style={styles.segmentRow}>
                {(['recurring', 'oneoff'] as const).map(k => (
                  <Pressable
                    key={k}
                    accessibilityLabel={`kind-${k}`}
                    onPress={() => setKind(k)}
                    style={[styles.segment, kind === k && styles.segmentActive]}
                  >
                    <Text selectable={false} style={[styles.segmentText, kind === k && styles.segmentTextActive]}>
                      {k === 'recurring' ? 'Recurring' : 'One-off'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {kind === 'recurring' ? (
                <>
                  {/* Fixed vs percentage-of-income */}
                  <Text selectable={false} style={styles.fieldLabel}>Set aside as</Text>
                  <View style={styles.segmentRow}>
                    <Pressable
                      accessibilityLabel="mode-fixed"
                      onPress={() => setIsPercent(false)}
                      style={[styles.segment, !isPercent && styles.segmentActive]}
                    >
                      <Text selectable={false} style={[styles.segmentText, !isPercent && styles.segmentTextActive]}>
                        Fixed amount
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel="mode-percent"
                      onPress={() => setIsPercent(true)}
                      style={[styles.segment, isPercent && styles.segmentActive]}
                    >
                      <Text selectable={false} style={[styles.segmentText, isPercent && styles.segmentTextActive]}>
                        Percentage
                      </Text>
                    </Pressable>
                  </View>

                  {isPercent && (
                    <>
                      <Text selectable={false} style={styles.fieldLabel}>Percentage of</Text>
                      <View style={styles.segmentRow}>
                        <Pressable
                          accessibilityLabel="pct-total"
                          onPress={() => setPercentInclBonus(true)}
                          style={[styles.segment, percentInclBonus && styles.segmentActive]}
                        >
                          <Text selectable={false} style={[styles.segmentText, percentInclBonus && styles.segmentTextActive]}>
                            Total income
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityLabel="pct-salary"
                          onPress={() => setPercentInclBonus(false)}
                          style={[styles.segment, !percentInclBonus && styles.segmentActive]}
                        >
                          <Text selectable={false} style={[styles.segmentText, !percentInclBonus && styles.segmentTextActive]}>
                            Salary only
                          </Text>
                        </Pressable>
                      </View>
                      <Text selectable={false} style={styles.budgetHint}>
                        {percentInclBonus
                          ? 'Deducts this % of everything that comes in — salary plus bonuses that month.'
                          : 'Deducts this % of your salary only — bonuses don’t increase it.'}
                      </Text>
                    </>
                  )}

                  {isPercent ? null : (<>
                  {/* Cycle */}
                  <Text selectable={false} style={styles.fieldLabel}>Billing cycle</Text>
                  <View style={styles.segmentRow}>
                    {(['monthly', 'yearly'] as const).map(c => (
                      <Pressable
                        key={c}
                        accessibilityLabel={`cycle-${c}`}
                        onPress={() => setCycle(c)}
                        style={[styles.segment, cycle === c && styles.segmentActive]}
                      >
                        <Text selectable={false} style={[styles.segmentText, cycle === c && styles.segmentTextActive]}>
                          {c === 'monthly' ? 'Monthly' : 'Yearly'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Due date */}
                  <Text selectable={false} style={styles.fieldLabel}>
                    {cycle === 'yearly' ? 'Due date (day + month)' : 'Due day of month (optional)'}
                  </Text>
                  <View style={styles.dueRow}>
                    <TextInput
                      style={[styles.input, styles.dueDayInput]}
                      value={dueDayText}
                      onChangeText={t => setDueDayText(t.replace(/[^0-9]/g, ''))}
                      placeholder={cycle === 'yearly' ? '1' : '—'}
                      placeholderTextColor="#BCAF9C"
                      keyboardType="number-pad"
                      inputMode="numeric"
                      maxLength={2}
                    />
                    {cycle === 'monthly' && (
                      <Text selectable={false} style={styles.dueHint}>e.g. 15 → “due 15th”</Text>
                    )}
                  </View>
                  {cycle === 'yearly' && (
                    <View style={styles.chipWrap}>
                      {MONTH_ABBR.map((name, i) => {
                        const active = dueMonth === i + 1;
                        return (
                          <Pressable
                            key={name}
                            accessibilityLabel={`due-month-${name}`}
                            onPress={() => setDueMonth(i + 1)}
                            style={[styles.chip, active && styles.chipActive]}
                          >
                            <Text selectable={false} style={[styles.chipText, active && styles.chipTextActive]}>
                              {name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                  </>)}

                  {/* Group */}
                  <Text selectable={false} style={styles.fieldLabel}>Group</Text>
                  <View style={styles.chipWrap}>
                    <Pressable
                      accessibilityLabel="group-none"
                      onPress={() => setGroupId(null)}
                      style={[styles.chip, groupId === null && styles.chipActive]}
                    >
                      <Text selectable={false} style={[styles.chipText, groupId === null && styles.chipTextActive]}>
                        None
                      </Text>
                    </Pressable>
                    {allocationGroups.map(g => {
                      const active = groupId === g.id;
                      return (
                        <Pressable
                          key={g.id}
                          accessibilityLabel={`group-${g.name}`}
                          onPress={() => setGroupId(g.id)}
                          style={[styles.chip, active && styles.chipActive]}
                        >
                          <Text selectable={false} style={[styles.chipText, active && styles.chipTextActive]}>
                            {g.icon} {g.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      accessibilityLabel="group-new"
                      onPress={() => setNewGroupOpen(o => !o)}
                      style={[styles.chip, styles.chipDashed]}
                    >
                      <Text selectable={false} style={styles.chipText}>＋ New group</Text>
                    </Pressable>
                  </View>
                  {newGroupOpen && (
                    <View style={styles.newGroupBox}>
                      <TextInput
                        style={styles.input}
                        value={newGroupName}
                        onChangeText={setNewGroupName}
                        placeholder="Group name (e.g. Insurance)"
                        placeholderTextColor="#BCAF9C"
                      />
                      <View style={styles.chipWrap}>
                        {GROUP_ICON_CHOICES.map(icon => (
                          <Pressable
                            key={icon}
                            accessibilityLabel={`group-icon-${icon}`}
                            onPress={() => setNewGroupIcon(icon)}
                            style={[styles.iconChip, newGroupIcon === icon && styles.chipActive]}
                          >
                            <Text selectable={false} style={styles.iconChipText}>{icon}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <Pressable accessibilityLabel="group-create" onPress={createGroup} style={styles.smallButton}>
                        <Text selectable={false} style={styles.smallButtonText}>Create group</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Budget behaviour (double-count escape hatch) */}
                  <Text selectable={false} style={styles.fieldLabel}>Budget</Text>
                  <View style={styles.segmentRow}>
                    <Pressable
                      accessibilityLabel="budget-counts"
                      onPress={() => setInfoOnly(false)}
                      style={[styles.segment, !infoOnly && styles.segmentActive]}
                    >
                      <Text selectable={false} style={[styles.segmentText, !infoOnly && styles.segmentTextActive]}>
                        Deducts
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel="budget-info-only"
                      onPress={() => setInfoOnly(true)}
                      style={[styles.segment, infoOnly && styles.segmentActive]}
                    >
                      <Text selectable={false} style={[styles.segmentText, infoOnly && styles.segmentTextActive]}>
                        Info only
                      </Text>
                    </Pressable>
                  </View>
                  <Text selectable={false} style={styles.budgetHint}>
                    {infoOnly
                      ? "Info only: keeps its due date but doesn't reduce Spendable — for payments you also log as expenses, so they aren't counted twice."
                      : 'This amount is set aside from Spendable each month.'}
                  </Text>

                  {/* v1.5.9: recorded history — only for an existing allocation (needs an id
                      to attach to). Record-only: doesn't change Spendable for any month. */}
                  {editing && (
                    <>
                      <Text selectable={false} style={styles.fieldLabel}>Recorded history</Text>
                      {history.length === 0 && !historyOpen && (
                        <Text selectable={false} style={styles.emptyHistoryText}>
                          No actual amounts logged yet — the amount above still applies to every month.
                        </Text>
                      )}
                      {history.map(h => (
                        <View key={h.id} style={styles.historyRowWrap}>
                          <Text selectable={false} style={styles.historyRow}>
                            {formatMonthShort(h.month)} · {fmt(h.amount)}
                          </Text>
                          <Pressable
                            accessibilityLabel={`history-delete-${h.month}`}
                            hitSlop={8}
                            onPress={() => confirmDeleteHistory(h.id, `${formatMonthShort(h.month)} (${fmt(h.amount)})`)}
                          >
                            <Text selectable={false} style={styles.historyDelete}>✕</Text>
                          </Pressable>
                        </View>
                      ))}
                      {historyOpen ? (
                        <View style={styles.newGroupBox}>
                          <View style={styles.chipWrap}>
                            {historyMonthChoices().map(m => {
                              const active = historyMonth === m;
                              return (
                                <Pressable
                                  key={m}
                                  accessibilityLabel={`history-month-${m}`}
                                  onPress={() => setHistoryMonth(m)}
                                  style={[styles.chip, active && styles.chipActive]}
                                >
                                  <Text selectable={false} style={[styles.chipText, active && styles.chipTextActive]}>
                                    {formatMonthShort(m)}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                          <TextInput
                            style={styles.input}
                            value={historyAmountText}
                            onChangeText={setHistoryAmountText}
                            placeholder="0.00"
                            placeholderTextColor="#BCAF9C"
                            keyboardType="decimal-pad"
                            inputMode="decimal"
                          />
                          <Pressable accessibilityLabel="history-save" onPress={addHistoryRow} style={styles.smallButton}>
                            <Text selectable={false} style={styles.smallButtonText}>Save record</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          accessibilityLabel="history-add"
                          onPress={() => setHistoryOpen(true)}
                          style={[styles.chip, styles.chipDashed, styles.historyAddChip]}
                        >
                          <Text selectable={false} style={styles.chipText}>＋ Log a month's actual amount</Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* One-off month */}
                  <Text selectable={false} style={styles.fieldLabel}>Which month?</Text>
                  <View style={styles.chipWrap}>
                    {(months.includes(month) ? months : [month, ...months]).map(m => {
                      const active = month === m;
                      return (
                        <Pressable
                          key={m}
                          accessibilityLabel={`oneoff-month-${m}`}
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
                </>
              )}

              {/* Note */}
              <Text selectable={false} style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder="e.g. policy no., who it's for…"
                placeholderTextColor="#BCAF9C"
              />

            </ScrollView>

            {/* Actions — pinned below the scroll area, always reachable */}
            <Pressable accessibilityLabel="alloc-save" onPress={save} style={styles.saveButton}>
              <Text selectable={false} style={styles.saveText}>{editing ? 'Save changes' : 'Add payment'}</Text>
            </Pressable>
            {editing && (
              <Pressable accessibilityLabel="alloc-delete" onPress={confirmDelete} style={styles.deleteButton}>
                <Text selectable={false} style={styles.deleteText}>Delete</Text>
              </Pressable>
            )}
            <Pressable accessibilityLabel="alloc-cancel" onPress={onClose} style={styles.cancelButton}>
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

  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.bearBody,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
  },
  segmentActive: { backgroundColor: colors.butter, borderColor: colors.butter },
  segmentText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textBrown },
  segmentTextActive: { fontFamily: fonts.bodyBold },

  budgetHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSoft,
    marginTop: 8,
    lineHeight: 17,
  },

  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dueDayInput: { width: 72, textAlign: 'center' },
  dueHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.bearBody,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.bgCard,
  },
  chipDashed: { borderStyle: 'dashed' },
  chipActive: { backgroundColor: colors.butter, borderColor: colors.butter },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textBrown },
  chipTextActive: { fontFamily: fonts.bodyBold },

  newGroupBox: {
    marginTop: 10,
    backgroundColor: '#FBF6EA',
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
  },
  iconChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.bearBody,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  iconChipText: { fontSize: 18 },
  smallButton: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingVertical: 9,
    alignItems: 'center',
  },
  smallButtonText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textBrown },

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

  emptyHistoryText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft, lineHeight: 17 },
  historyRowWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  historyRow: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textBrown },
  historyDelete: { fontSize: 12, color: '#C57A6E', padding: 2 },
  historyAddChip: { alignSelf: 'flex-start', marginTop: 4 },
});
