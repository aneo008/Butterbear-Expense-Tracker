import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useExpenseStore } from '../src/store/useExpenseStore';
import { STORE_ITEMS } from '../src/constants/storeItems';
import { dailyCap, streakMultiplier } from '../src/lib/streak';
import { todayISO, addDaysISO } from '../src/lib/date';
import { getMeta, setMeta } from '../src/db/queries';
import { backOrHome } from '../src/lib/nav';
import { RELEASES } from '../src/constants/changelog';
import StreakSheet from '../src/components/StreakSheet';
import CoinSheet from '../src/components/CoinSheet';
import WhatsNewSheet from '../src/components/WhatsNewSheet';
import * as Haptics from '../src/lib/haptics';
import { colors, radius, fonts, cardShadow } from '../src/constants/theme';
import { VERSION_LABEL, APP_VERSION } from '../src/lib/version';

const WHATS_NEW_KEY = 'whatsnew_seen_version';

// Developer panel — direct state mutation for testing. Reached from Settings →
// Developer tools (unlocked by tapping the version 7×). Not part of the user flow.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Btn({ label, onPress, tone = 'normal' }: { label: string; onPress: () => void; tone?: 'normal' | 'danger' | 'accent' }) {
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={[styles.btn, tone === 'danger' && styles.btnDanger, tone === 'accent' && styles.btnAccent]}
    >
      <Text style={[styles.btnText, tone === 'danger' && styles.btnDangerText]}>{label}</Text>
    </Pressable>
  );
}

export default function DevScreen() {
  const router = useRouter();
  const {
    gameState, ownedItems, equippedItems, categories,
    devSetGameState, devResetAll, addExpense,
    enterDevSandbox, devActive,
  } = useExpenseStore();

  // Entering the panel snapshots the real data; it's restored when you Exit via
  // the banner (or on app restart). Roaming other screens keeps the sandbox active.
  useEffect(() => { enterDevSandbox(); }, [enterDevSandbox]);

  // If the sandbox is exited (e.g. via the banner) while this panel is still open,
  // leave the screen — otherwise edits here would write to the user's real data.
  const enteredRef = useRef(false);
  useEffect(() => {
    if (devActive) enteredRef.current = true;
    else if (enteredRef.current) backOrHome(router);
  }, [devActive, router]);

  const [coins, setCoins] = useState(String(gameState.coins));
  const [streak, setStreak] = useState(String(gameState.streak_count));
  const [longest, setLongest] = useState(String(gameState.longest_streak));
  const [earned, setEarned] = useState(String(gameState.coins_earned_today));
  const [streakOpen, setStreakOpen] = useState(false);
  const [coinOpen, setCoinOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [previewSeen, setPreviewSeen] = useState('1.4.4');
  const [storedSeen, setStoredSeen] = useState<string | null>(getMeta(WHATS_NEW_KEY));
  const refreshStoredSeen = () => setStoredSeen(getMeta(WHATS_NEW_KEY));

  // Keep the inputs in sync with the live state (e.g. after a quick-add button).
  useEffect(() => { setCoins(String(gameState.coins)); }, [gameState.coins]);
  useEffect(() => { setStreak(String(gameState.streak_count)); }, [gameState.streak_count]);
  useEffect(() => { setLongest(String(gameState.longest_streak)); }, [gameState.longest_streak]);
  useEffect(() => { setEarned(String(gameState.coins_earned_today)); }, [gameState.coins_earned_today]);

  const applyNum = (text: string, field: 'coins' | 'streak_count' | 'longest_streak' | 'coins_earned_today') => {
    const n = parseInt(text, 10);
    if (Number.isFinite(n)) devSetGameState({ [field]: Math.max(0, n) });
  };

  // Read fresh coins each tap so rapid quick-adds accumulate (avoids a stale closure).
  const addCoins = (delta: number) =>
    devSetGameState({ coins: useExpenseStore.getState().gameState.coins + delta });

  const quickLog = () => {
    const cat = categories[0];
    if (!cat) return;
    addExpense({ amount: 5, category_id: cat.id, note: 'dev', spent_at: todayISO() });
  };

  const resetFlags = () => {
    setMeta('coachmark_seen', '');
    setMeta('closet_mode_hint_seen', '');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => backOrHome(router)} style={styles.back} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>🛠️ Developer</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Sandbox */}
        <Section title="Sandbox">
          <Text style={styles.note}>Changes here (and across the app) are discarded — use “Exit ✕” in the top banner to leave.</Text>
        </Section>

        {/* Coins */}
        <Section title="Coins">
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={coins}
              onChangeText={setCoins}
              placeholder={String(gameState.coins)}
            />
            <Btn label="Set" onPress={() => applyNum(coins, 'coins')} tone="accent" />
          </View>
          <View style={styles.row}>
            <Btn label="+100" onPress={() => addCoins(100)} />
            <Btn label="+1000" onPress={() => addCoins(1000)} />
            <Btn label="Set 0" onPress={() => devSetGameState({ coins: 0 })} />
          </View>
        </Section>

        {/* Streak */}
        <Section title="Streak">
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={streak}
              onChangeText={setStreak}
              placeholder={String(gameState.streak_count)}
            />
            <Btn label="Set" onPress={() => applyNum(streak, 'streak_count')} tone="accent" />
          </View>
          <View style={styles.row}>
            {[0, 3, 7, 14, 30, 100].map(d => (
              <Btn key={d} label={`${d}`} onPress={() => { setStreak(String(d)); devSetGameState({ streak_count: d }); }} />
            ))}
          </View>
          <Text style={styles.note}>→ ×{streakMultiplier(gameState.streak_count)} multiplier · cap {dailyCap(gameState.streak_count)}/day</Text>
        </Section>

        {/* Longest streak */}
        <Section title="Longest streak">
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={longest}
              onChangeText={setLongest}
              placeholder={String(gameState.longest_streak)}
            />
            <Btn label="Set" onPress={() => applyNum(longest, 'longest_streak')} tone="accent" />
          </View>
        </Section>

        {/* Last log date (streak timing) */}
        <Section title="Last log date">
          <View style={styles.row}>
            <Btn label="Today" onPress={() => devSetGameState({ last_log_date: todayISO() })} />
            <Btn label="Yesterday" onPress={() => devSetGameState({ last_log_date: addDaysISO(todayISO(), -1) })} />
            <Btn label="3 days ago" onPress={() => devSetGameState({ last_log_date: addDaysISO(todayISO(), -3) })} />
            <Btn label="Clear" onPress={() => devSetGameState({ last_log_date: null })} />
          </View>
          <Text style={styles.note}>now: {gameState.last_log_date ?? 'null'} (today {todayISO()})</Text>
        </Section>

        {/* Daily cap */}
        <Section title="Daily cap">
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={earned}
              onChangeText={setEarned}
              placeholder={String(gameState.coins_earned_today)}
            />
            <Btn label="Set" onPress={() => applyNum(earned, 'coins_earned_today')} tone="accent" />
          </View>
          <View style={styles.row}>
            <Btn label="Reset cap (0)" onPress={() => devSetGameState({ coins_earned_today: 0 })} />
            <Btn label="Fill cap" onPress={() => devSetGameState({ coins_earned_today: dailyCap(gameState.streak_count) })} />
          </View>
          <Text style={styles.note}>earned today: {gameState.coins_earned_today} / {dailyCap(gameState.streak_count)} (note: not recomputed when you change streak)</Text>
        </Section>

        {/* Wardrobe */}
        <Section title="Wardrobe">
          <View style={styles.row}>
            <Btn label="Own all" onPress={() => devSetGameState({ owned_items: JSON.stringify(STORE_ITEMS.map(i => i.id)) })} />
            <Btn label="Clear owned" onPress={() => devSetGameState({ owned_items: '[]', equipped_items: '{}' })} />
            <Btn label="Unequip all" onPress={() => devSetGameState({ equipped_items: '{}' })} />
          </View>
          <Text style={styles.note}>owned: {ownedItems.length}/{STORE_ITEMS.length}</Text>
        </Section>

        {/* Triggers */}
        <Section title="Triggers">
          <View style={styles.row}>
            <Btn label="Open StreakSheet" onPress={() => setStreakOpen(true)} />
            <Btn label="Open CoinSheet" onPress={() => setCoinOpen(true)} />
            <Btn label="Quick-log $5" onPress={quickLog} />
            <Btn label="Reset onboarding" onPress={resetFlags} />
          </View>
        </Section>

        {/* What's New popup */}
        <Section title="What's New popup">
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={previewSeen}
              onChangeText={setPreviewSeen}
              placeholder="last-seen ver e.g. 1.4.4 (empty = backfill)"
            />
            <Btn label="Preview" onPress={() => setWhatsNewOpen(true)} tone="accent" />
          </View>
          <View style={styles.row}>
            <Btn label="Backfill (empty)" onPress={() => setPreviewSeen('')} />
            {RELEASES.map(r => (
              <Btn key={r.version} label={r.version} onPress={() => setPreviewSeen(r.version)} />
            ))}
          </View>
          <View style={styles.row}>
            <Btn label="Set stored = value" tone="accent" onPress={() => { setMeta(WHATS_NEW_KEY, previewSeen); refreshStoredSeen(); }} />
            <Btn label="Reset stored (empty)" onPress={() => { setMeta(WHATS_NEW_KEY, ''); refreshStoredSeen(); }} />
          </View>
          <Text style={styles.note}>stored seen: {storedSeen == null ? 'null' : (storedSeen === '' ? '(empty → backfill)' : storedSeen)} · app v{APP_VERSION}</Text>
          <Text style={styles.note}>Preview simulates the auto-popup for that last-seen version (no reload). Editing the stored value reverts on sandbox exit.</Text>
        </Section>

        {/* Inspector */}
        <Section title="game_state">
          <Text style={styles.json}>
            {JSON.stringify({
              coins: gameState.coins,
              streak_count: gameState.streak_count,
              longest_streak: gameState.longest_streak,
              last_log_date: gameState.last_log_date,
              coins_earned_today: gameState.coins_earned_today,
              total_entries: gameState.total_entries,
              owned: ownedItems,
              equipped: equippedItems,
            }, null, 2)}
          </Text>
        </Section>

        {/* Danger zone */}
        <Section title="Danger zone">
          <Btn label="Wipe all data & re-seed" tone="danger" onPress={devResetAll} />
          <Text style={styles.note}>Clears expenses, wardrobe & flags; resets to a fresh install.</Text>
        </Section>

        <Text style={styles.version}>{VERSION_LABEL}</Text>
      </ScrollView>

      <StreakSheet visible={streakOpen} onClose={() => setStreakOpen(false)} />
      <CoinSheet visible={coinOpen} onClose={() => setCoinOpen(false)} />
      <WhatsNewSheet forceVisible={whatsNewOpen} onForceClose={() => setWhatsNewOpen(false)} previewSeen={previewSeen} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCream },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
  },
  back: { paddingVertical: 6, width: 56 },
  backText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.butterDeep },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.textBrown },

  body: { padding: 16, paddingBottom: 40, gap: 14 },

  section: { gap: 8 },
  sectionTitle: {
    fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSoft,
    textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 2,
  },
  sectionBody: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: 12, gap: 8, ...cardShadow,
  },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: colors.bgCream, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 9, fontFamily: fonts.bodyBold,
    fontSize: 15, color: colors.textBrown, borderWidth: 1, borderColor: colors.hairline,
  },

  btn: {
    backgroundColor: '#F3EDE3', borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  btnAccent: { backgroundColor: colors.butter },
  btnDanger: { backgroundColor: '#FBE9E7', borderWidth: 1, borderColor: '#E89B92' },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textBrown },
  btnDangerText: { color: '#D6584C' },

  note: { fontFamily: fonts.body, fontSize: 12, color: colors.textSoft },
  json: { fontFamily: 'monospace', fontSize: 11, color: colors.textBrown, lineHeight: 16 },
  version: { fontFamily: fonts.body, fontSize: 11, color: colors.textSoft, textAlign: 'center', marginTop: 8 },
});
