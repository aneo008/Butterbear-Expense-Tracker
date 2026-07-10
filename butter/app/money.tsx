import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useExpenseStore } from '../src/store/useExpenseStore';
import { Allocation, AllocationGroup } from '../src/db/types';
import AllocationEditSheet, { EditSheetRequest } from '../src/components/AllocationEditSheet';
import GroupEditSheet from '../src/components/GroupEditSheet';
import {
  nextDueISO,
  monthCommitment,
  monthlyEquivalent,
  dueLabel,
} from '../src/lib/allocationMath';
import { todayISO, currentMonth, formatDateLabel, formatMonthShort } from '../src/lib/date';
import { backOrHome } from '../src/lib/nav';
import { colors, radius, fonts, cardShadow, softShadow } from '../src/constants/theme';

// Phase 5b: the Money screen — the finance hub. Monthly income, recurring
// payments organised into groups (with due dates), other set-asides and
// one-off carve-outs. Everything here is deducted from Spendable on Insights.

function fmt(n: number): string {
  return `SGD ${n.toFixed(2)}`;
}

export default function MoneyScreen() {
  const router = useRouter();
  const income = useExpenseStore(s => s.income);
  const setIncome = useExpenseStore(s => s.setIncome);
  const allocations = useExpenseStore(s => s.allocations);
  const allocationGroups = useExpenseStore(s => s.allocationGroups);

  const [editRequest, setEditRequest] = useState<EditSheetRequest | null>(null);
  const [editingGroup, setEditingGroup] = useState<AllocationGroup | null>(null);
  const [incomeEditing, setIncomeEditing] = useState(false);
  const [incomeText, setIncomeText] = useState('');

  const today = todayISO();
  const month = currentMonth();

  // ---- derived lists ----
  const recurring = allocations.filter(a => a.kind === 'recurring');
  const oneoffs = allocations
    .filter(a => a.kind === 'oneoff')
    .sort((a, b) => (a.month ?? '').localeCompare(b.month ?? ''));
  const ungrouped = recurring.filter(a => a.group_id === null);

  const dueSoon = useMemo(() => {
    return recurring
      .map(a => ({ a, due: nextDueISO(a, today) }))
      .filter((x): x is { a: Allocation; due: string } => x.due !== null)
      .sort((x, y) => x.due.localeCompare(y.due))
      .slice(0, 5);
  }, [allocations, today]);

  const commit = monthCommitment(allocations, month);
  const spendable = income !== null ? income - commit.setAside : null;

  const groupIcon = (id: string | null): string =>
    allocationGroups.find(g => g.id === id)?.icon ?? '📌';

  // ---- income editing ----
  const openIncomeEdit = () => {
    setIncomeText(income !== null ? String(income) : '');
    setIncomeEditing(true);
  };
  const saveIncome = () => {
    const v = Math.round(parseFloat(incomeText) * 100) / 100;
    setIncome(Number.isFinite(v) && v > 0 ? v : null);
    setIncomeEditing(false);
  };

  // ---- row + card renderers ----
  const renderPaymentRow = (a: Allocation) => {
    const due = dueLabel(a);
    return (
      <TouchableOpacity
        key={a.id}
        style={styles.payRow}
        onPress={() => setEditRequest({ editing: a })}
        accessibilityLabel={`payment-${a.label}`}
      >
        <View style={styles.payMid}>
          <Text selectable={false} style={styles.payLabel}>{a.label}</Text>
          <View style={styles.payTags}>
            <View style={[styles.badge, a.cycle === 'yearly' ? styles.badgeYearly : styles.badgeMonthly]}>
              <Text selectable={false} style={styles.badgeText}>
                {a.cycle === 'yearly' ? 'yearly' : 'monthly'}
              </Text>
            </View>
            {due && <Text selectable={false} style={styles.dueText}>{due}</Text>}
          </View>
          {!!a.note && <Text selectable={false} style={styles.noteText} numberOfLines={1}>{a.note}</Text>}
        </View>
        <View style={styles.payRight}>
          <Text selectable={false} style={styles.payAmount}>{fmt(a.amount)}</Text>
          {a.cycle === 'yearly' && (
            <Text selectable={false} style={styles.equivText}>≈ {fmt(monthlyEquivalent(a))}/mo</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupCard = (g: AllocationGroup) => {
    const members = recurring.filter(a => a.group_id === g.id);
    const monthlyEquivTotal = members.reduce((s, a) => s + monthlyEquivalent(a), 0);
    return (
      <View key={g.id} style={styles.card}>
        <View style={styles.groupHeader}>
          <Text selectable={false} style={styles.groupTitle}>{g.icon} {g.name}</Text>
          <Pressable
            accessibilityLabel={`group-edit-${g.name}`}
            onPress={() => setEditingGroup(g)}
            hitSlop={8}
          >
            <Text selectable={false} style={styles.pencil}>✎</Text>
          </Pressable>
        </View>
        {members.length === 0 ? (
          <Text selectable={false} style={styles.emptyLine}>No payments yet</Text>
        ) : (
          members.map(renderPaymentRow)
        )}
        <View style={styles.groupFooter}>
          <Text selectable={false} style={styles.subtotal}>
            {members.length > 0 ? `≈ ${fmt(monthlyEquivTotal)}/mo` : ''}
          </Text>
          <TouchableOpacity
            accessibilityLabel={`group-add-${g.name}`}
            onPress={() => setEditRequest({ editing: null, presetGroupId: g.id })}
            style={styles.addChip}
          >
            <Text selectable={false} style={styles.addChipText}>＋ Add payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '💰 Money',
          headerStyle: { backgroundColor: colors.bgCream },
          headerShadowVisible: false,
          headerTintColor: colors.textBrown,
          headerTitleStyle: { color: colors.textBrown, fontWeight: '700' },
          // Custom back so it still works after a web refresh (empty history → Home).
          headerLeft: () => (
            <Pressable onPress={() => backOrHome(router)} hitSlop={8} style={{ paddingHorizontal: 4 }}>
              <Text selectable={false} style={{ color: colors.butterDeep, fontSize: 16, fontWeight: '600' }}>‹ Back</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Income */}
        <View style={styles.card}>
          <Text selectable={false} style={styles.cardLabel}>Monthly income</Text>
          {incomeEditing ? (
            <View style={styles.incomeEditRow}>
              <TextInput
                style={styles.incomeInput}
                value={incomeText}
                onChangeText={setIncomeText}
                placeholder="0.00"
                placeholderTextColor="#BCAF9C"
                keyboardType="decimal-pad"
                inputMode="decimal"
                autoFocus
              />
              <TouchableOpacity accessibilityLabel="income-save" onPress={saveIncome} style={styles.incomeSave}>
                <Text selectable={false} style={styles.incomeSaveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityLabel="income-cancel" onPress={() => setIncomeEditing(false)} style={styles.incomeCancel}>
                <Text selectable={false} style={styles.incomeCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity accessibilityLabel="income-edit" onPress={openIncomeEdit}>
              <Text selectable={false} style={income !== null ? styles.incomeValue : styles.incomeUnset}>
                {income !== null ? fmt(income) : 'Tap to set'}
              </Text>
            </TouchableOpacity>
          )}
          {income !== null && (
            <Text selectable={false} style={styles.incomeSub}>
              Set aside this month {fmt(commit.setAside)} · Spendable {fmt(spendable ?? 0)}
            </Text>
          )}
        </View>

        {/* Due soon */}
        {dueSoon.length > 0 && (
          <>
            <Text selectable={false} style={styles.sectionHeader}>Due soon</Text>
            <View style={styles.card}>
              {dueSoon.map(({ a, due }) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.dueRow}
                  onPress={() => setEditRequest({ editing: a })}
                  accessibilityLabel={`due-${a.label}`}
                >
                  <Text selectable={false} style={styles.dueIcon}>{groupIcon(a.group_id)}</Text>
                  <Text selectable={false} style={styles.dueLabel} numberOfLines={1}>{a.label}</Text>
                  <Text selectable={false} style={styles.dueWhen}>{formatDateLabel(due)}</Text>
                  <Text selectable={false} style={styles.dueAmount}>{fmt(a.amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Groups */}
        <Text selectable={false} style={styles.sectionHeader}>Recurring payments</Text>
        {allocationGroups.map(renderGroupCard)}
        <TouchableOpacity
          accessibilityLabel="new-group"
          onPress={() => setEditRequest({ editing: null })}
          style={styles.newGroupHint}
        >
          <Text selectable={false} style={styles.newGroupHintText}>
            {allocationGroups.length === 0
              ? '＋ Add a payment — create groups like Insurance or Subscriptions as you go'
              : '＋ Add a payment'}
          </Text>
        </TouchableOpacity>

        {/* Ungrouped set-asides */}
        {ungrouped.length > 0 && (
          <>
            <Text selectable={false} style={styles.sectionHeader}>Other set-asides</Text>
            <View style={styles.card}>
              {ungrouped.map(renderPaymentRow)}
            </View>
          </>
        )}

        {/* One-offs */}
        <Text selectable={false} style={styles.sectionHeader}>One-off set-asides</Text>
        <View style={styles.card}>
          {oneoffs.length === 0 ? (
            <Text selectable={false} style={styles.emptyLine}>
              Carve out a big-ticket month (e.g. a new phone) so it doesn't distort your spending.
            </Text>
          ) : (
            oneoffs.map(a => (
              <TouchableOpacity
                key={a.id}
                style={styles.payRow}
                onPress={() => setEditRequest({ editing: a })}
                accessibilityLabel={`payment-${a.label}`}
              >
                <View style={styles.payMid}>
                  <Text selectable={false} style={styles.payLabel}>{a.label}</Text>
                  <Text selectable={false} style={styles.dueText}>{a.month ? formatMonthShort(a.month) : ''}</Text>
                  {!!a.note && <Text selectable={false} style={styles.noteText} numberOfLines={1}>{a.note}</Text>}
                </View>
                <Text selectable={false} style={styles.payAmount}>{fmt(a.amount)}</Text>
              </TouchableOpacity>
            ))
          )}
          <View style={styles.groupFooter}>
            <View />
            <TouchableOpacity
              accessibilityLabel="oneoff-add"
              onPress={() => setEditRequest({ editing: null, presetKind: 'oneoff' })}
              style={styles.addChip}
            >
              <Text selectable={false} style={styles.addChipText}>＋ Add one-off</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text selectable={false} style={styles.footnote}>
          Payments here are set aside from Spendable — don't also log them as expenses,
          or they'd be counted twice. 🧈
        </Text>
      </ScrollView>

      <AllocationEditSheet request={editRequest} onClose={() => setEditRequest(null)} />
      <GroupEditSheet group={editingGroup} onClose={() => setEditingGroup(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCream },
  body: { padding: 20, paddingBottom: 40 },

  sectionHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textSoft,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 10,
    ...cardShadow,
  },
  cardLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textSoft },

  // income
  incomeValue: { fontFamily: fonts.display, fontSize: 26, color: colors.textBrown, marginTop: 2 },
  incomeUnset: { fontFamily: fonts.bodyMedium, fontSize: 18, color: '#BCAF9C', marginTop: 4 },
  incomeSub: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSoft, marginTop: 6 },
  incomeEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  incomeInput: {
    flex: 1,
    backgroundColor: '#FBF6EA',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textBrown,
  },
  incomeSave: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  incomeSaveText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textBrown },
  incomeCancel: { paddingHorizontal: 6, paddingVertical: 9 },
  incomeCancelText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSoft },

  // due soon
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  dueIcon: { fontSize: 17 },
  dueLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textBrown },
  dueWhen: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.butterDeep },
  dueAmount: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textBrown },

  // group cards
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  groupTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textBrown },
  pencil: { fontSize: 16, color: colors.textSoft, padding: 4 },
  emptyLine: { fontFamily: fonts.body, fontSize: 13, color: colors.textSoft, paddingVertical: 8, lineHeight: 18 },
  groupFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  subtotal: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSoft },
  addChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.bearBody,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.bgCard,
    ...softShadow,
  },
  addChipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textBrown },

  // payment rows
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    gap: 10,
  },
  payMid: { flex: 1 },
  payLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textBrown },
  payTags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeMonthly: { backgroundColor: '#EAF4EE' },
  badgeYearly: { backgroundColor: '#F0E9FA' },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.textSoft },
  dueText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.butterDeep },
  noteText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft, marginTop: 2 },
  payRight: { alignItems: 'flex-end' },
  payAmount: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
  equivText: { fontFamily: fonts.body, fontSize: 11, color: colors.textSoft, marginTop: 2 },

  newGroupHint: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.bearBody,
    borderStyle: 'dashed',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  newGroupHintText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSoft, textAlign: 'center', lineHeight: 18 },

  footnote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSoft,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 17,
  },
});
