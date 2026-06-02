/// <reference lib="dom" />
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { todayISO, addDaysISO } from '../lib/date';

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
};

// Web uses the browser's native date input (value format is already YYYY-MM-DD).
export default function DateField({ value, onChange }: Props) {
  const today = todayISO();
  const yesterday = addDaysISO(today, -1);

  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>Date</Text>
      <View style={styles.dateControls}>
        <TouchableOpacity
          onPress={() => onChange(today)}
          style={[styles.dateChip, value === today && styles.dateChipActive]}
        >
          <Text style={[styles.dateChipText, value === today && styles.dateChipTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChange(yesterday)}
          style={[styles.dateChip, value === yesterday && styles.dateChipActive]}
        >
          <Text style={[styles.dateChipText, value === yesterday && styles.dateChipTextActive]}>Yesterday</Text>
        </TouchableOpacity>
        {React.createElement('input', {
          type: 'date',
          value,
          max: today,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.value) onChange(e.target.value);
          },
          style: {
            fontSize: 13,
            color: '#5A4632',
            border: '1px solid #E3C49A',
            borderRadius: 16,
            padding: '6px 10px',
            background: '#fff',
            fontFamily: 'inherit',
          },
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E3C49A44',
  },
  metaLabel: { fontSize: 15, color: '#9C8772' },
  dateControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3C49A',
  },
  dateChipActive: { backgroundColor: '#F5C45E', borderColor: '#F5C45E' },
  dateChipText: { fontSize: 13, color: '#5A4632', fontWeight: '500' },
  dateChipTextActive: { fontWeight: '700' },
});
