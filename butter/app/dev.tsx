import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useExpenseStore } from '../src/store/useExpenseStore';
import { STORE_ITEMS } from '../src/constants/storeItems';
import { dailyCap, streakMultiplier } from '../src/lib/streak';
import { todayISO, addDaysISO } from '../src/lib/date';
import { setMeta } from '../src/db/queries';
import StreakSheet from '../src/components/StreakSheet';
import * as Haptics from '../src/lib/haptics';
import { colors, radius, fonts, cardShadow } from '../src/constants/theme';
import { VERSION_LABEL } from '../src/lib/version';

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
    enterDevSandbox, leaveDevSandbox,
  } = useExpenseStore();

  // Entering the panel snapshots the real data; it's restored on Exit (or app
  // restart). Roaming other screens keeps the sandbox active until you Exit.
  useEffect(() => { enterDevSandbox(); }, [enterDevSandbox]);

  const exitDev = () => { leaveDevSandbox(); router.back(); };

  const [coins, setCoins] = useState(String(gameState.coins));
  const [streak, setStreak] = useState(String(gameState.streak_count));
  const [longest, setLongest] = useState(String(gameState.longest_streak));
  const [streakOpen, setStreakOpen] = useState(false);

  const applyNum = (text: string, field: 'coins' | 'streak_count' | 'longest_streak') => {
    const n = parseInt(text, 10);
    if (Number.isFinite(n)) devSetGameState({ [field]: Math.max(0, n) });
  };

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
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>🛠️ Developer</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Sandbox */}
        <Section title="Sandbox">
          <Text style={styles.note}>Changes here (and across the app) are discarded when you exit.</Text>
          <Btn label="Exit dev mode (discard changes)" tone="accent" onPress={exitDev} />
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
            <Btn label="+100" onPress={() => devSetGameState({ coins: gameState.coins + 100 })} />
            <Btn label="+1000" onPress={() => devSetGameState({ coins: gameState.coins + 1000 })} />
            <Btn label="Set 0" onPress={() => { setCoins('0'); devSetGameState({ coins: 0 }); }} />
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
          <View style={styles.row}>
            <Btn label="Reset cap (0)" onPress={() => devSetGameState({ coins_earned_today: 0 })} />
            <Btn label="Fill cap" onPress={() => devSetGameState({ coins_earned_today: dailyCap(gameState.streak_count) })} />
          </View>
          <Text style={styles.note}>earned today: {gameState.coins_earned_today} / {dailyCap(gameState.streak_count)}</Text>
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
            <Btn label="Quick-log $5" onPress={quickLog} />
            <Btn label="Reset onboarding" onPress={resetFlags} />
          </View>
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
