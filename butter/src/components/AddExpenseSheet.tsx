import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useExpenseStore } from '../store/useExpenseStore';
import { CATEGORY_ICON_CHOICES, CATEGORY_COLOR_CHOICES } from '../constants/categories';
import { todayISO, addDaysISO, isoToDate, dateToISO, formatDateLabel } from '../lib/date';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export default function AddExpenseSheet() {
  const {
    isAddSheetOpen,
    editingExpense,
    closeAddSheet,
    categories,
    addExpense,
    editExpense,
    removeExpense,
    createCategory,
  } = useExpenseStore();

  const isEditing = !!editingExpense;

  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Category creator state
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(CATEGORY_ICON_CHOICES[0]);
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLOR_CHOICES[0]);

  // Prefill (edit) or reset (add) whenever the sheet opens.
  useEffect(() => {
    if (!isAddSheetOpen) return;
    setShowDatePicker(false);
    setCreatingCategory(false);
    if (editingExpense) {
      setAmount(String(editingExpense.amount));
      setSelectedCategory(editingExpense.category_id);
      setNote(editingExpense.note ?? '');
      setDate(editingExpense.spent_at);
    } else {
      setAmount('0');
      setSelectedCategory(null);
      setNote('');
      setDate(todayISO());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddSheetOpen]);

  const handleClose = useCallback(() => {
    closeAddSheet();
  }, [closeAddSheet]);

  const handleKey = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === '⌫') {
      setAmount(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }

    setAmount(prev => {
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      if (prev === '0' && key !== '.') return key;
      if (prev.includes('.')) {
        const decimals = prev.split('.')[1];
        if (decimals.length >= 2) return prev;
      }
      return prev + key;
    });
  }, []);

  const handleSave = useCallback(() => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    const catId = selectedCategory ?? (categories[0]?.id ?? 'other');

    if (editingExpense) {
      editExpense(editingExpense.id, {
        amount: numAmount,
        category_id: catId,
        note: note.trim() || null,
        spent_at: date,
      });
    } else {
      addExpense({
        amount: numAmount,
        category_id: catId,
        note: note.trim() || null,
        spent_at: date,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  }, [amount, selectedCategory, categories, note, date, editingExpense, addExpense, editExpense, handleClose]);

  const handleDelete = useCallback(() => {
    if (!editingExpense) return;
    Alert.alert('Delete expense?', 'This entry will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          removeExpense(editingExpense.id);
          handleClose();
        },
      },
    ]);
  }, [editingExpense, removeExpense, handleClose]);

  const onChangeDate = useCallback((event: DateTimePickerEvent, picked?: Date) => {
    // Android fires once and dismisses; iOS keeps the inline picker open.
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && picked) {
      setDate(dateToISO(picked));
    }
  }, []);

  const handleCreateCategory = useCallback(() => {
    const name = newCatName.trim();
    if (!name) return;
    const cat = createCategory({ name, icon: newCatIcon, color: newCatColor });
    setSelectedCategory(cat.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCreatingCategory(false);
    setNewCatName('');
    setNewCatIcon(CATEGORY_ICON_CHOICES[0]);
    setNewCatColor(CATEGORY_COLOR_CHOICES[0]);
  }, [newCatName, newCatIcon, newCatColor, createCategory]);

  const canSave = parseFloat(amount) > 0;
  const today = todayISO();
  const yesterday = addDaysISO(today, -1);

  // ----- Category creator view -----
  const renderCreator = () => (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCreatingCategory(false)} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Category</Text>
        <TouchableOpacity
          onPress={handleCreateCategory}
          disabled={!newCatName.trim()}
          style={[styles.saveBtn, !newCatName.trim() && styles.saveBtnDisabled]}
        >
          <Text style={[styles.saveText, !newCatName.trim() && styles.saveTextDisabled]}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Live preview */}
      <View style={styles.creatorPreview}>
        <View style={[styles.previewDot, { backgroundColor: newCatColor }]}>
          <Text style={styles.previewIcon}>{newCatIcon}</Text>
        </View>
        <Text style={styles.previewName}>{newCatName.trim() || 'Category name'}</Text>
      </View>

      <TextInput
        style={styles.nameInput}
        placeholder="Category name"
        placeholderTextColor="#9C8772"
        value={newCatName}
        onChangeText={setNewCatName}
        maxLength={20}
        autoFocus
        returnKeyType="done"
      />

      <Text style={styles.creatorLabel}>Icon</Text>
      <View style={styles.iconGrid}>
        {CATEGORY_ICON_CHOICES.map(icon => (
          <Pressable
            key={icon}
            onPress={() => {
              setNewCatIcon(icon);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.iconCell, newCatIcon === icon && styles.iconCellActive]}
          >
            <Text style={styles.iconCellText}>{icon}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.creatorLabel}>Color</Text>
      <View style={styles.swatchRow}>
        {CATEGORY_COLOR_CHOICES.map(color => (
          <Pressable
            key={color}
            onPress={() => {
              setNewCatColor(color);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
              styles.swatch,
              { backgroundColor: color },
              newCatColor === color && styles.swatchActive,
            ]}
          />
        ))}
      </View>
    </KeyboardAvoidingView>
  );

  // ----- Main add/edit view -----
  const renderSheet = () => (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        >
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Amount display */}
      <View style={styles.amountRow}>
        <Text style={styles.currency}>SGD</Text>
        <Text style={styles.amount}>{amount}</Text>
      </View>

      {/* Category picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(cat => {
          const active = selectedCategory === cat.id || (!selectedCategory && cat === categories[0]);
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => {
                setSelectedCategory(cat.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.catChip,
                active && { backgroundColor: cat.color, borderColor: cat.color },
              ]}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, active && styles.catLabelActive]}>{cat.name}</Text>
            </TouchableOpacity>
          );
        })}
        {/* Pinned Add chip — always last */}
        <TouchableOpacity
          onPress={() => {
            setCreatingCategory(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={[styles.catChip, styles.addChip]}
        >
          <Text style={styles.catIcon}>➕</Text>
          <Text style={styles.catLabel}>Add</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date row + quick chips */}
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Date</Text>
        <View style={styles.dateControls}>
          <TouchableOpacity
            onPress={() => setDate(today)}
            style={[styles.dateChip, date === today && styles.dateChipActive]}
          >
            <Text style={[styles.dateChipText, date === today && styles.dateChipTextActive]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDate(yesterday)}
            style={[styles.dateChip, date === yesterday && styles.dateChipActive]}
          >
            <Text style={[styles.dateChipText, date === yesterday && styles.dateChipTextActive]}>Yesterday</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateChip}>
            <Text style={styles.dateChipText}>
              {date !== today && date !== yesterday ? formatDateLabel(date) : '📅'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={styles.noteInput}
        placeholder="Add a note (optional)"
        placeholderTextColor="#9C8772"
        value={note}
        onChangeText={setNote}
        maxLength={120}
        returnKeyType="done"
      />

      {/* Numpad */}
      <View style={styles.numpad}>
        {KEYS.map(k => (
          <Pressable
            key={k}
            onPress={() => handleKey(k)}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
          >
            <Text style={styles.keyText}>{k}</Text>
          </Pressable>
        ))}
      </View>

      {/* Delete (edit mode only) */}
      {isEditing && (
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Delete expense</Text>
        </TouchableOpacity>
      )}

      {/* Date picker — Android dialog vs iOS inline-in-modal */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={isoToDate(date)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onChangeDate}
        />
      )}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShowDatePicker(false)}>
          <Pressable style={styles.pickerOverlay} onPress={() => setShowDatePicker(false)}>
            <Pressable style={styles.pickerCard}>
              <DateTimePicker
                value={isoToDate(date)}
                mode="date"
                display="inline"
                maximumDate={new Date()}
                onChange={onChangeDate}
              />
              <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.pickerDone}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );

  return (
    <Modal
      visible={isAddSheetOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      {creatingCategory ? renderCreator() : renderSheet()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3C49A44',
  },
  cancelBtn: { padding: 4, minWidth: 60 },
  cancelText: { fontSize: 16, color: '#9C8772' },
  title: { fontSize: 17, fontWeight: '600', color: '#5A4632' },
  saveBtn: {
    backgroundColor: '#F5C45E',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#E3D5BE' },
  saveText: { fontSize: 16, fontWeight: '700', color: '#5A4632' },
  saveTextDisabled: { color: '#9C8772' },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  currency: { fontSize: 22, color: '#9C8772', marginBottom: 8 },
  amount: { fontSize: 64, fontWeight: '700', color: '#5A4632', letterSpacing: -1 },

  categoryScroll: { flexGrow: 0 },
  categoryContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E3C49A',
    marginRight: 8,
  },
  addChip: {
    borderStyle: 'dashed',
    borderColor: '#C9A06E',
  },
  catIcon: { fontSize: 16 },
  catLabel: { fontSize: 13, color: '#5A4632', fontWeight: '500' },
  catLabelActive: { fontWeight: '700' },

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

  noteInput: {
    marginHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E3C49A44',
    fontSize: 15,
    color: '#5A4632',
  },

  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    marginTop: 'auto',
  },
  key: {
    width: '33.33%',
    aspectRatio: 1.9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  keyPressed: { backgroundColor: '#E3C49A44' },
  keyText: { fontSize: 24, fontWeight: '500', color: '#5A4632' },

  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8,
  },
  deleteText: { fontSize: 15, color: '#E8A87C', fontWeight: '600' },

  // Date picker (iOS modal)
  pickerOverlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pickerCard: {
    backgroundColor: '#FFFBF2',
    borderRadius: 24,
    padding: 12,
  },
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

  // Category creator
  creatorPreview: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  previewDot: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: { fontSize: 30 },
  previewName: { fontSize: 16, fontWeight: '600', color: '#5A4632' },
  nameInput: {
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3C49A',
    fontSize: 16,
    color: '#5A4632',
  },
  creatorLabel: {
    fontSize: 13,
    color: '#9C8772',
    fontWeight: '600',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 6,
  },
  iconCell: {
    width: '11.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconCellActive: { borderColor: '#F5C45E', backgroundColor: '#FDEFCF' },
  iconCellText: { fontSize: 20 },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchActive: { borderColor: '#5A4632' },
});
