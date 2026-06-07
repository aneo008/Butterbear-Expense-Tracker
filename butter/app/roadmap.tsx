import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ROADMAP_TEXT } from '../src/constants/roadmapText';
import { backOrHome } from '../src/lib/nav';
import { colors, radius, fonts, cardShadow } from '../src/constants/theme';

// Dev-only reader for docs/ROADMAP.md (embedded at build time via
// scripts/gen-roadmap.mjs). Reached from the Developer panel. Light line-based
// markdown styling — enough to read comfortably, not a full renderer.

function Line({ raw }: { raw: string }) {
  if (raw.trim() === '') return <View style={styles.blank} />;
  if (raw.startsWith('# ')) return <Text selectable style={styles.h1}>{raw.slice(2)}</Text>;
  if (raw.startsWith('## ')) return <Text selectable style={styles.h2}>{raw.slice(3)}</Text>;
  if (raw.startsWith('### ')) return <Text selectable style={styles.h3}>{raw.slice(4)}</Text>;
  if (raw.startsWith('#### ')) return <Text selectable style={styles.h4}>{raw.slice(5)}</Text>;
  if (raw.startsWith('---')) return <View style={styles.rule} />;
  if (raw.startsWith('|')) return <Text selectable style={styles.table}>{raw}</Text>;
  return <Text selectable style={styles.body}>{raw}</Text>;
}

export default function RoadmapScreen() {
  const router = useRouter();
  const lines = ROADMAP_TEXT.split('\n');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => backOrHome(router)} style={styles.back} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>🗺️ Roadmap</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body_wrap} showsVerticalScrollIndicator>
        <View style={styles.card}>
          {lines.map((l, i) => <Line key={i} raw={l} />)}
        </View>
        <Text style={styles.note}>Snapshot of docs/ROADMAP.md (embedded at build time).</Text>
      </ScrollView>
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

  body_wrap: { padding: 16, paddingBottom: 48 },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: 16, ...cardShadow },

  h1: { fontFamily: fonts.display, fontSize: 22, color: colors.textBrown, marginTop: 6, marginBottom: 6 },
  h2: { fontFamily: fonts.displaySemi, fontSize: 18, color: colors.textBrown, marginTop: 14, marginBottom: 4 },
  h3: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown, marginTop: 12, marginBottom: 2 },
  h4: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.butterDeep, marginTop: 10, marginBottom: 2 },
  body: { fontFamily: fonts.body, fontSize: 13, color: colors.textBrown, lineHeight: 19 },
  table: { fontFamily: 'monospace', fontSize: 11, color: colors.textSoft, lineHeight: 16 },
  rule: { height: 1, backgroundColor: colors.hairline, marginVertical: 12 },
  blank: { height: 8 },

  note: { fontFamily: fonts.body, fontSize: 11, color: colors.textSoft, textAlign: 'center', marginTop: 12 },
});
