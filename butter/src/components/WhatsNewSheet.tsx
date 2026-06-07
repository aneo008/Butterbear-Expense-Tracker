import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { getMeta, setMeta } from '../db/queries';
import { APP_VERSION } from '../lib/version';
import { releasesSince } from '../lib/changelog';
import { RELEASES, Release, ChangeTag } from '../constants/changelog';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

const SEEN_KEY = 'whatsnew_seen_version'; // app_meta: last version whose notes were shown
const COACHMARK_KEY = 'coachmark_seen';   // set once the first-run tip is dismissed

// PHASE 4 BACKFILL — one-time; remove at end of Phase 5 (see docs/ROADMAP.md G1).
// Existing users who pre-date this popup (no SEEN_KEY yet) get a recap of all of
// Phase 4 on first launch after updating. Floored at 1.4.0 so it shows only
// Phase 4 versions (1.4.x), not Phases 1–3 they already used.
const PHASE4_FLOOR = '1.4.0';

type Props = {
  // Dev-only controlled mode: when provided, the sheet ignores its own gating and
  // shows releases on demand (no app_meta writes). Home mounts it uncontrolled.
  forceVisible?: boolean;
  onForceClose?: () => void;
  // Dev preview: simulate the user's last-seen version. '' / undefined = the
  // one-time Phase 4 backfill; a version = normal catch-up from there.
  previewSeen?: string;
};

const TAG_META: Record<ChangeTag, { label: string; bg: string; fg: string }> = {
  new:    { label: 'New',    bg: '#E4F3EC', fg: '#3E8E72' },
  fix:    { label: 'Fix',    bg: '#E6EEF6', fg: '#3E6E9E' },
  change: { label: 'Change', bg: '#FBEFD6', fg: '#B07D1E' },
};

// Tapping the 🪙/🔥 chips, etc. don't trigger this — it fires itself on launch
// (from Home) when the app is newer than what the user last saw.
export default function WhatsNewSheet({ forceVisible, onForceClose, previewSeen }: Props) {
  const controlled = forceVisible !== undefined;

  const [autoVisible, setAutoVisible] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [backfill, setBackfill] = useState(false);

  useEffect(() => {
    if (controlled) return; // dev drives visibility

    const seen = getMeta(SEEN_KEY);
    const coachmarkSeen = getMeta(COACHMARK_KEY) === '1';

    // Fresh install: onboarding (coachmark) covers them — seed silently, no popup.
    if (!coachmarkSeen) {
      setMeta(SEEN_KEY, APP_VERSION);
      return;
    }

    // Existing pre-popup user (no flag, or dev-reset to empty) → one-time Phase 4
    // backfill. Otherwise normal catch-up from the user's stored version.
    const isBackfill = !seen;
    const floor = isBackfill ? PHASE4_FLOOR : seen;

    const rels = releasesSince(floor);
    if (rels.length === 0) {
      setMeta(SEEN_KEY, APP_VERSION); // nothing new; advance the marker
      return;
    }

    // Small delay so it appears after the screen settles (matches the coachmark).
    const t = setTimeout(() => {
      setReleases(rels);
      setBackfill(isBackfill);
      setAutoVisible(true);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    if (controlled) {
      onForceClose?.();
      return;
    }
    setMeta(SEEN_KEY, APP_VERSION);
    setAutoVisible(false);
  };

  // In dev (controlled) mode, simulate the chosen last-seen version: empty = backfill.
  const previewIsBackfill = !previewSeen;
  const previewFloor = previewIsBackfill ? PHASE4_FLOOR : previewSeen;

  const visible = controlled ? !!forceVisible : autoVisible;
  const shown = controlled ? releasesSince(previewFloor) : releases;
  const isBackfill = controlled ? previewIsBackfill : backfill;

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <Pressable style={styles.overlay} onPress={dismiss}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>What's new</Text>
          <Text style={styles.subtitle}>
            {shown.length === 0
              ? "You're all caught up — nothing new 🧈"
              : isBackfill
                ? "Welcome back — here's everything new in Butter 🧈"
                : 'Here’s what changed since you were last here 🧈'}
          </Text>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {shown.map(rel => (
              <View key={rel.version} style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{rel.title}</Text>
                  <Text style={styles.sectionVer}>v{rel.version}</Text>
                </View>
                {rel.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <View style={[styles.pill, { backgroundColor: TAG_META[item.tag].bg }]}>
                      <Text style={[styles.pillText, { color: TAG_META[item.tag].fg }]}>
                        {TAG_META[item.tag].label}
                      </Text>
                    </View>
                    <Text style={styles.itemText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

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
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    ...cardShadow,
  },

  emoji: { fontSize: 36 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.textBrown, marginTop: 2 },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.textSoft, textAlign: 'center', marginTop: 4, marginBottom: 10, lineHeight: 19 },

  scroll: { alignSelf: 'stretch' },
  scrollBody: { paddingVertical: 4, gap: 18 },

  section: { gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 16, color: colors.textBrown },
  sectionVer: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSoft },

  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pill: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: 1 },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  itemText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textBrown, lineHeight: 19 },

  button: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingHorizontal: 36,
    paddingVertical: 11,
    marginTop: 16,
  },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
});
