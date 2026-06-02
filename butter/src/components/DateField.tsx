import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { todayISO, addDaysISO, isoToDate, dateToISO, formatDateLabel } from '../lib/date';

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
};

export default function DateField({ value, onChange }: Props) {
  const [show, setShow] = useState(false);
  const today = todayISO();
  const yesterday = addDaysISO(today, -1);

  const onChangeDate = useCallback(
    (event: DateTimePickerEvent, picked?: Date) => {
      if (Platform.OS === 'android') setShow(false);
      if (event.type === 'set' && picked) onChange(dateToISO(picked));
    },
    [onChange]
  );

  return (
    <>
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
          <TouchableOpacity onPress={() => setShow(true)} style={styles.dateChip}>
            <Text style={styles.dateChipText}>
              {value !== today && value !== yesterday ? formatDateLabel(value) : '📅'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={isoToDate(value)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onChangeDate}
        />
      )}
      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShow(false)}>
          <Pressable style={styles.pickerOverlay} onPress={() => setShow(false)}>
            <Pressable style={styles.pickerCard}>
              <DateTimePicker
                value={isoToDate(value)}
                mode="date"
                display="inline"
                maximumDate={new Date()}
                onChange={onChangeDate}
              />
              <TouchableOpacity onPress={() => setShow(false)} style={styles.pickerDone}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
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
  dateControls: { flexDirection: 'row', gap: 6 },
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pickerCard: { backgroundColor: '#FFFBF2', borderRadius: 24, padding: 12 },
  pickerDone: {
    alignSelf: 'center',
    backgroundColor: '#F5C45E',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  pickerDoneText: { fontSize: 16, fontWeight: '700', color: '#5A4632' },
});
