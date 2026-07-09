import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { VERSION_LABEL } from '../../src/lib/version';
import * as Haptics from '../../src/lib/haptics';
import { Alert } from '../../src/lib/dialog';
import { useExpenseStore } from '../../src/store/useExpenseStore';
import {
  getSnapshot,
  getAllExpenses,
  getAllCategories,
  getExpensesBetween,
  replaceAllData,
  mergeData,
  getMeta,
  setMeta,
} from '../../src/db/queries';
import { serializeBackup, parseBackup } from '../../src/lib/backup';
import { expensesToCSV } from '../../src/lib/csv';
import { writeAndShare, pickAndReadText } from '../../src/lib/fileio';
import { todayISO, currentMonth } from '../../src/lib/date';

const LAST_BACKUP_KEY = 'last_backup_at';

function stamp(): string {
  return todayISO().replace(/-/g, '');
}

function formatBackupTime(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString('en-SG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

const DEV_KEY = 'dev_unlocked';

export default function SettingsScreen() {
  const gameState = useExpenseStore(s => s.gameState);
  const loadData = useExpenseStore(s => s.loadData);
  const leaveDevSandbox = useExpenseStore(s => s.leaveDevSandbox);
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  // Dev-mode unlock: tap the version footer 7×.
  const [devUnlocked, setDevUnlocked] = useState(() => getMeta(DEV_KEY) === '1');
  const [tapHint, setTapHint] = useState<string | null>(null);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLastBackup(getMeta(LAST_BACKUP_KEY));
      setDevUnlocked(getMeta(DEV_KEY) === '1');
    }, [])
  );

  const onVersionTap = useCallback(() => {
    if (devUnlocked) return;
    tapCount.current += 1;
    const n = tapCount.current;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; setTapHint(null); }, 2500);

    if (n >= 7) {
      setMeta(DEV_KEY, '1');
      setDevUnlocked(true);
      setTapHint('🛠️ Developer mode unlocked');
      tapCount.current = 0;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (n >= 4) {
      setTapHint(`${7 - n} ${7 - n === 1 ? 'tap' : 'taps'} to Developer mode`);
    }
  }, [devUnlocked]);

  const lockDev = useCallback(() => {
    leaveDevSandbox();       // restore real data if a sandbox is active
    setMeta(DEV_KEY, '');
    setDevUnlocked(false);
    setTapHint(null);
    tapCount.current = 0;
  }, [leaveDevSandbox]);

  // ---- Export JSON backup ----
  const exportBackup = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const json = serializeBackup(getSnapshot());
      await writeAndShare(`butter-backup-${stamp()}.json`, json, 'application/json');
      const now = new Date().toISOString();
      setMeta(LAST_BACKUP_KEY, now);
      setLastBackup(now);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // ---- Export CSV (with range) ----
  const exportCSVRange = useCallback(async (range: 'month' | 'year' | 'all') => {
    setBusy(true);
    try {
      const today = todayISO();
      let expenses;
      if (range === 'month') expenses = getExpensesBetween(`${currentMonth()}-01`, today);
      else if (range === 'year') expenses = getExpensesBetween(`${today.slice(0, 4)}-01-01`, today);
      else expenses = getAllExpenses();

      if (expenses.length === 0) {
        Alert.alert('Nothing to export', 'There are no expenses in that range yet.');
        return;
      }
      const csv = expensesToCSV(expenses, getAllCategories());
      await writeAndShare(`butter-${range}-${stamp()}.csv`, csv, 'text/csv');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }, []);

  const chooseCSVRange = useCallback(() => {
    if (busy) return;
    Alert.alert('Export spreadsheet (CSV)', 'Which expenses?', [
      { text: 'This month', onPress: () => exportCSVRange('month') },
      { text: 'This year', onPress: () => exportCSVRange('year') },
      { text: 'All time', onPress: () => exportCSVRange('all') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [busy, exportCSVRange]);

  // ---- Import JSON (restore) ----
  const applyRestore = useCallback(async (mode: 'merge' | 'replace', text: string) => {
    setBusy(true);
    try {
      const snap = parseBackup(text);
      if (mode === 'replace') {
        replaceAllData(snap);
        loadData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Restored', `Replaced all data with ${snap.expenses.length} expenses.`);
      } else {
        const { expensesAdded, categoriesAdded } = mergeData(snap);
        loadData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Merged',
          `Added ${expensesAdded} new ${expensesAdded === 1 ? 'expense' : 'expenses'}` +
            (categoriesAdded > 0 ? ` and ${categoriesAdded} ${categoriesAdded === 1 ? 'category' : 'categories'}` : '') +
            '.'
        );
      }
    } catch (e: any) {
      Alert.alert("Couldn't restore", e?.message ?? 'The file could not be read.');
    } finally {
      setBusy(false);
    }
  }, [loadData]);

  const importBackup = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    let picked;
    try {
      picked = await pickAndReadText(['application/json']);
    } catch (e: any) {
      Alert.alert("Couldn't open file", e?.message ?? 'Try again.');
      setBusy(false);
      return;
    }
    setBusy(false);
    if (!picked) return; // cancelled

    Alert.alert(
      'Restore backup',
      `From "${picked.name}".\n\n` +
        '• Merge — adds expense logs & categories you don’t already have. Your coins, streak, wardrobe and budget stay unchanged.\n' +
        '• Replace — wipes current data and restores the backup in full (coins, streak, wardrobe, budget & set-asides and all).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: () =>
            Alert.alert(
              'Merge — logs only',
              'This brings in expense logs and categories only. Your coins, streak, wardrobe and budget won’t change. Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Merge', onPress: () => applyRestore('merge', picked!.text) },
              ]
            ),
        },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Replace everything?', 'This erases your current data and cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Replace', style: 'destructive', onPress: () => applyRestore('replace', picked!.text) },
            ]),
        },
      ]
    );
  }, [busy, applyRestore]);

  // Nudge sooner on web: browser storage (localStorage) can be evicted after ~7 days
  // of non-use, so remind before that horizon rather than the native 30-day cadence.
  const BACKUP_STALE_DAYS = Platform.OS === 'web' ? 7 : 30;
  const stale = daysSince(lastBackup);
  const showNudge = stale === null || stale >= BACKUP_STALE_DAYS;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {busy && (
          <View style={styles.busyRow}>
            <ActivityIndicator color="#5A4632" />
            <Text style={styles.busyText}>Working…</Text>
          </View>
        )}

        {/* Backup status */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Last backup</Text>
          <Text style={styles.cardValue}>{formatBackupTime(lastBackup)}</Text>
          {showNudge && (
            <Text style={styles.nudge}>
              {Platform.OS === 'web'
                ? 'Back up your data — a browser can clear it if you don’t visit for a while 🧈'
                : "It's a good time to back up your data 🧈"}
            </Text>
          )}
        </View>

        {/* Export */}
        <Text style={styles.sectionHeader}>Back up & export</Text>
        <TouchableOpacity style={styles.action} onPress={exportBackup} disabled={busy}>
          <Text style={styles.actionIcon}>💾</Text>
          <View style={styles.actionMid}>
            <Text style={styles.actionTitle}>Export backup (JSON)</Text>
            <Text style={styles.actionSub}>Full app data — for restore or a new phone</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={chooseCSVRange} disabled={busy}>
          <Text style={styles.actionIcon}>📊</Text>
          <View style={styles.actionMid}>
            <Text style={styles.actionTitle}>Export spreadsheet (CSV)</Text>
            <Text style={styles.actionSub}>For Excel / Sheets — pick a date range</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Restore */}
        <Text style={styles.sectionHeader}>Restore</Text>
        <TouchableOpacity style={styles.action} onPress={importBackup} disabled={busy}>
          <Text style={styles.actionIcon}>📥</Text>
          <View style={styles.actionMid}>
            <Text style={styles.actionTitle}>Import backup (JSON)</Text>
            <Text style={styles.actionSub}>Merge logs, or replace everything</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={[styles.action, styles.actionDisabled]}>
          <Text style={styles.actionIcon}>🗂️</Text>
          <View style={styles.actionMid}>
            <Text style={styles.actionTitle}>Import CSV</Text>
            <Text style={styles.actionSub}>Coming soon</Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={styles.sectionHeader}>Your journey</Text>
        <View style={styles.card}>
          <Text style={styles.statRow}>🔥 Longest streak: {gameState.longest_streak} days</Text>
          <Text style={styles.statRow}>📝 Total entries: {gameState.total_entries}</Text>
          <Text style={styles.statRow}>🪙 Total coins: {gameState.coins}</Text>
        </View>

        {/* Developer section — appears once unlocked via the version footer */}
        {devUnlocked && (
          <>
            <Text style={styles.sectionHeader}>Developer</Text>
            <TouchableOpacity style={styles.action} onPress={() => router.push('/dev' as any)}>
              <Text style={styles.actionIcon}>🛠️</Text>
              <View style={styles.actionMid}>
                <Text style={styles.actionTitle}>Developer tools</Text>
                <Text style={styles.actionSub}>Edit coins, streak, wardrobe & more</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={lockDev}>
              <Text style={styles.actionIcon}>🔒</Text>
              <View style={styles.actionMid}>
                <Text style={styles.actionTitle}>Lock developer mode</Text>
                <Text style={styles.actionSub}>Hide these options</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.footnote}>Currency: SGD · more options coming later</Text>

        {/* Version footer — tap 7× to unlock developer mode */}
        <Pressable onPress={onVersionTap} style={styles.versionWrap}>
          <Text selectable={false} style={styles.version}>{VERSION_LABEL}</Text>
        </Pressable>
        {tapHint && <Text style={styles.tapHint}>{tapHint}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF2' },
  body: { padding: 20, paddingBottom: 40 },

  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, justifyContent: 'center' },
  busyText: { color: '#9C8772', fontSize: 14 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    gap: 4,
    shadowColor: '#C9A06E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLabel: { fontSize: 13, color: '#9C8772', fontWeight: '600' },
  cardValue: { fontSize: 17, color: '#5A4632', fontWeight: '700' },
  nudge: { fontSize: 13, color: '#E8A87C', marginTop: 6, fontWeight: '500' },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9C8772',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  action: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    gap: 14,
    shadowColor: '#C9A06E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionDisabled: { opacity: 0.5 },
  actionIcon: { fontSize: 24 },
  actionMid: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#5A4632' },
  actionSub: { fontSize: 12, color: '#9C8772', marginTop: 2 },
  chevron: { fontSize: 22, color: '#C9A06E', fontWeight: '300' },

  statRow: { fontSize: 15, color: '#5A4632', fontWeight: '500' },

  footnote: { fontSize: 12, color: '#9C8772', textAlign: 'center', marginTop: 20 },

  versionWrap: { alignSelf: 'center', marginTop: 10, paddingVertical: 6, paddingHorizontal: 14 },
  version: { fontSize: 12, color: '#C9A06E', textAlign: 'center', userSelect: 'none' },
  tapHint: { fontSize: 12, color: '#9C8772', textAlign: 'center', marginTop: 2, fontWeight: '600' },
});
