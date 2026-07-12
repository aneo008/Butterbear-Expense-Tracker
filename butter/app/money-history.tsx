import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useExpenseStore } from '../src/store/useExpenseStore';
import { Allocation } from '../src/db/types';
import AllocationEditSheet, { EditSheetRequest } from '../src/components/AllocationEditSheet';
import IncomeEventSheet, { IncomeSheetRequest } from '../src/components/IncomeEventSheet';
import { currentMonth, formatMonthShort } from '../src/lib/date';
import { backOrHome } from '../src/lib/nav';
import { colors, radius, fonts, cardShadow } from '../src/constants/theme';

// v1.5.8: past bonuses + one-off set-asides live here so they don't clutter the
// Money page. Tap any to edit/delete via the same sheets used on the Money screen.

function fmt(n: number): string {
  return `SGD ${n.toFixed(2)}`;
}

export default function MoneyHistoryScreen() {
  const router = useRouter();
  const incomeEvents = useExpenseStore(s => s.incomeEvents);
  const allocations = useExpenseStore(s => s.allocations);

  const [editRequest, setEditRequest] = useState<EditSheetRequest | null>(null);
  const [incomeSheet, setIncomeSheet] = useState<IncomeSheetRequest | null>(null);

  const cm = currentMonth();
  const pastBonuses = incomeEvents.filter(e => e.month < cm).sort((a, b) => b.month.localeCompare(a.month));
  const pastOneoffs = allocations
    .filter(a => a.kind === 'oneoff' && (a.month ?? '') < cm)
    .sort((a, b) => (b.month ?? '').localeCompare(a.month ?? ''));

  const empty = pastBonuses.length === 0 && pastOneoffs.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '🗂️ Past income & one-offs',
          headerStyle: { backgroundColor: colors.bgCream },
          headerShadowVisible: false,
          headerTintColor: colors.textBrown,
          headerTitleStyle: { color: colors.textBrown, fontWeight: '700' },
          headerLeft: () => (
            <Pressable onPress={() => backOrHome(router)} hitSlop={8} style={{ paddingHorizontal: 4 }}>
              <Text selectable={false} style={{ color: colors.butterDeep, fontSize: 16, fontWeight: '600' }}>‹ Back</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {empty && (
          <Text selectable={false} style={styles.empty}>
            Nothing here yet. Past bonuses and one-off set-asides move here once their month has passed. 🧈
          </Text>
        )}

        {pastBonuses.length > 0 && (
          <>
            <Text selectable={false} style={styles.sectionHeader}>Past bonuses & extra income</Text>
            <View style={styles.card}>
              {pastBonuses.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={styles.row}
                  onPress={() => setIncomeSheet({ editing: e })}
                  accessibilityLabel={`past-income-${e.label}`}
                >
                  <View style={styles.mid}>
                    <Text selectable={false} style={styles.rowLabel}>{e.label}</Text>
                    <Text selectable={false} style={styles.rowMonth}>{formatMonthShort(e.month)}</Text>
                  </View>
                  <Text selectable={false} style={styles.income}>+ {fmt(e.amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {pastOneoffs.length > 0 && (
          <>
            <Text selectable={false} style={styles.sectionHeader}>Past one-off set-asides</Text>
            <View style={styles.card}>
              {pastOneoffs.map((a: Allocation) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.row}
                  onPress={() => setEditRequest({ editing: a })}
                  accessibilityLabel={`past-oneoff-${a.label}`}
                >
                  <View style={styles.mid}>
                    <Text selectable={false} style={styles.rowLabel}>{a.label}</Text>
                    <Text selectable={false} style={styles.rowMonth}>{a.month ? formatMonthShort(a.month) : ''}</Text>
                  </View>
                  <Text selectable={false} style={styles.amount}>{fmt(a.amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <AllocationEditSheet request={editRequest} onClose={() => setEditRequest(null)} />
      <IncomeEventSheet request={incomeSheet} onClose={() => setIncomeSheet(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCream },
  body: { padding: 20, paddingBottom: 40 },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.textSoft, textAlign: 'center', marginTop: 40, lineHeight: 21 },

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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    gap: 10,
  },
  mid: { flex: 1 },
  rowLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textBrown },
  rowMonth: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSoft, marginTop: 2 },
  amount: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
  income: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#3C8C4C' },
});
