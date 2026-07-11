import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { formatMonthLong } from '../lib/date';
import { colors, fonts, radius } from '../constants/theme';

// Phase 5e: 12-month spending trend as plain pressable Views (deliberately not
// SVG — RNW hit-testing on SVG shapes is unreliable, and Views theme for free).
// Tap a bar to drive the whole Insights screen to that month.

export type TrendPoint = { month: string; total: number }; // month = YYYY-MM

type Props = {
  points: TrendPoint[];          // chronological, oldest first, gaps filled with 0
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
};

const BAR_AREA_HEIGHT = 96;

/** "J" is ambiguous three ways — use 3-letter month abbreviations. */
function monthAbbr(month: string): string {
  const m = Number(month.slice(5, 7));
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
}

export default function TrendBars({ points, selectedMonth, onSelectMonth }: Props) {
  const max = Math.max(...points.map(p => p.total), 0);

  return (
    <View style={styles.row}>
      {points.map(p => {
        const active = p.month === selectedMonth;
        // Non-zero months always get a visible sliver, zero months a baseline nub.
        const h = max > 0 && p.total > 0
          ? Math.max(4, Math.round((p.total / max) * BAR_AREA_HEIGHT))
          : 2;
        return (
          <Pressable
            key={p.month}
            onPress={() => onSelectMonth(p.month)}
            style={styles.col}
            accessibilityRole="button"
            accessibilityLabel={`${formatMonthLong(p.month)}: SGD ${p.total.toFixed(2)}`}
          >
            {active && p.total > 0 && (
              <Text selectable={false} style={styles.valueLabel} numberOfLines={1}>
                {p.total >= 1000 ? `${(p.total / 1000).toFixed(1)}k` : Math.round(p.total)}
              </Text>
            )}
            <View style={styles.barArea}>
              <View
                style={[
                  styles.bar,
                  { height: h },
                  active ? styles.barActive : p.total === 0 && styles.barZero,
                ]}
              />
            </View>
            <Text selectable={false} style={[styles.monthLabel, active && styles.monthLabelActive]}>
              {monthAbbr(p.month)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  col: { flex: 1, alignItems: 'center' },
  valueLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.butterDeep,
    marginBottom: 2,
  },
  barArea: {
    height: BAR_AREA_HEIGHT,
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
  },
  bar: {
    alignSelf: 'stretch',
    borderTopLeftRadius: radius.sm / 2,
    borderTopRightRadius: radius.sm / 2,
    backgroundColor: colors.bearBody,
  },
  barActive: { backgroundColor: colors.butter },
  barZero: { backgroundColor: '#EFE7D6' },
  monthLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    color: colors.textSoft,
    marginTop: 4,
  },
  monthLabelActive: { fontFamily: fonts.bodyBold, color: colors.textBrown },
});
