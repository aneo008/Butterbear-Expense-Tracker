import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export type DonutSegment = {
  key: string;
  value: number;
  color: string;
};

type Props = {
  segments: DonutSegment[];
  total: number;
  size?: number;
  strokeWidth?: number;
  // Non-visual summary for screen readers (the ring itself is decorative).
  accessibilityLabel?: string;
};

function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

export default function CategoryDonut({ segments, total, size = 200, strokeWidth = 28, accessibilityLabel }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const sum = segments.reduce((s, seg) => s + seg.value, 0);
  const hasData = sum > 0 && segments.length > 0;

  // Cumulative offset as we walk around the ring.
  let accumulated = 0;

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={size} height={size}>
        {/* Rotate -90° so segments start at 12 o'clock. */}
        <G rotation={-90} origin={`${center}, ${center}`}>
          {/* Base track (also the empty-state ring). */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F0E6D2"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {hasData &&
            segments.map(seg => {
              const fraction = seg.value / sum;
              const dash = fraction * circumference;
              const gap = circumference - dash;
              const offset = -accumulated * circumference;
              accumulated += fraction;
              return (
                <Circle
                  key={seg.key}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                />
              );
            })}
        </G>
      </Svg>

      {/* Center label */}
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.centerCurrency}>SGD</Text>
        <Text style={styles.centerTotal}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCurrency: { fontSize: 13, color: '#9C8772', fontWeight: '600' },
  centerTotal: { fontSize: 28, fontWeight: '800', color: '#5A4632', letterSpacing: -0.5 },
});
