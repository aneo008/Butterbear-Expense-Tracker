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
} from 'react-native';
import * as Haptics from '../lib/haptics';
import { Alert } from '../lib/dialog';
import { useExpenseStore } from '../store/useExpenseStore';
import { CATEGORY_ICON_CHOICES, CATEGORY_COLOR_CHOICES } from '../constants/categories';
import { todayISO } from '../lib/date';
import DateField from './DateField';

type Op = '+' | '−' | '×' | '÷';

// Round to cents, dodging float artefacts (e.g. 0.1 + 0.2).
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function applyOp(a: number, op: Op, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
  }
}

// Clean display string: drop trailing zeros, max 2 dp.
function fmt(n: number): string {
  if (!isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
}

// One keypad button. Variants tint operators / the = key; `active` highlights the
// pending operator. Haptics live in the press handlers, so this stays presentational.
function CalcKey({
  label, onPress, variant = 'digit', wide = false, active = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'digit' | 'op' | 'eq' | 'clear';
  wide?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        wide && styles.keyWide,
        variant === 'eq' && styles.keyEq,
        active && styles.keyOpActive,
        pressed && styles.keyPressed,
      ]}
    >
      <Text
        selectable={false}
        style={[
          styles.keyText,
          variant === 'op' && styles.keyOpText,
          variant === 'eq' && styles.keyEqText,
          variant === 'clear' && styles.keyClearText,
          active && styles.keyOpActiveText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

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

  // Calculator state. `display` is the operand on screen; `acc`/`op` hold a pending
  // left-to-right calculation; `overwrite` means the next digit starts a new operand.
  const [display, setDisplay] = useState('0');
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());

  // Category creator state
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(CATEGORY_ICON_CHOICES[0]);
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLOR_CHOICES[0]);

  // Prefill (edit) or reset (add) whenever the sheet opens.
  useEffect(() => {
    if (!isAddSheetOpen) return;
    setCreatingCategory(false);
    setAcc(null);
    setOp(null);
    setOverwrite(false);
    if (editingExpense) {
      setDisplay(String(editingExpense.amount));
      setSelectedCategory(editingExpense.category_id);
      setNote(editingExpense.note ?? '');
      setDate(editingExpense.spent_at);
    } else {
      setDisplay('0');
      setSelectedCategory(null);
      setNote('');
      setDate(todayISO());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddSheetOpen]);

  const handleClose = useCallback(() => {
    closeAddSheet();
  }, [closeAddSheet]);

  const inputDigit = useCallback((d: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDisplay(prev => {
      if (overwrite) return d;
      if (prev === '0') return d;
      if (prev.includes('.')) {
        const decimals = prev.split('.')[1];
        if (decimals.length >= 2) return prev; // max 2 decimals
      }
      if (prev.replace('.', '').length >= 9) return prev; // sanity cap
      return prev + d;
    });
    if (overwrite) setOverwrite(false);
  }, [overwrite]);

  const inputDot = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (overwrite) { setDisplay('0.'); setOverwrite(false); return; }
    setDisplay(prev => (prev.includes('.') ? prev : prev + '.'));
  }, [overwrite]);

  const backspace = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (overwrite) return; // nothing typed on a fresh operand yet
    setDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  }, [overwrite]);

  const clearAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDisplay('0'); setAcc(null); setOp(null); setOverwrite(false);
  }, []);

  const chooseOp = useCallback((next: Op) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cur = parseFloat(display) || 0;
    if (op !== null && acc !== null && !overwrite) {
      // chain: collapse the pending op first (left-to-right, no precedence)
      const res = round2(applyOp(acc, op, cur));
      if (!isFinite(res)) { setDisplay('0'); setAcc(null); setOp(null); setOverwrite(true); return; }
      setAcc(res);
      setDisplay(fmt(res));
    } else if (acc === null) {
      setAcc(cur);
    }
    setOp(next);
    setOverwrite(true);
  }, [display, op, acc, overwrite]);

  const equals = useCallback(() => {
    if (op === null || acc === null) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const cur = parseFloat(display) || 0;
    const res = round2(applyOp(acc, op, cur));
    setDisplay(isFinite(res) ? fmt(res) : '0');
    setAcc(null); setOp(null); setOverwrite(true);
  }, [op, acc, display]);

  // The value that would be saved — auto-applies a pending op (as if = were pressed).
  const currentValue = useCallback((): number => {
    const cur = parseFloat(display) || 0;
    if (op !== null && acc !== null && !overwrite) {
      const res = round2(applyOp(acc, op, cur));
      return isFinite(res) ? res : 0;
    }
    return cur;
  }, [display, op, acc, overwrite]);

  const handleSave = useCallback(() => {
    const numAmount = currentValue();
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
  }, [currentValue, selectedCategory, categories, note, date, editingExpense, addExpense, editExpense, handleClose]);

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

  const canSave = currentValue() > 0;

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

      {/* Amount display + running calculation */}
      <View style={styles.amountWrap}>
        <Text selectable={false} style={styles.expr}>
          {op !== null && acc !== null ? `${fmt(acc)} ${op}` : ' '}
        </Text>
        <View style={styles.amountRow}>
          <Text style={styles.currency}>SGD</Text>
          <Text selectable={false} style={styles.amount}>{display}</Text>
        </View>
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

      {/* Date row + quick chips (platform-specific picker) */}
      <DateField value={date} onChange={setDate} />

      <TextInput
        style={styles.noteInput}
        placeholder="Add a note (optional)"
        placeholderTextColor="#9C8772"
        value={note}
        onChangeText={setNote}
        maxLength={120}
        returnKeyType="done"
      />

      {/* Calculator keypad (4 cols; operators run left-to-right) */}
      <View style={styles.numpad}>
        <CalcKey label="7" onPress={() => inputDigit('7')} />
        <CalcKey label="8" onPress={() => inputDigit('8')} />
        <CalcKey label="9" onPress={() => inputDigit('9')} />
        <CalcKey label="÷" variant="op" active={op === '÷'} onPress={() => chooseOp('÷')} />

        <CalcKey label="4" onPress={() => inputDigit('4')} />
        <CalcKey label="5" onPress={() => inputDigit('5')} />
        <CalcKey label="6" onPress={() => inputDigit('6')} />
        <CalcKey label="×" variant="op" active={op === '×'} onPress={() => chooseOp('×')} />

        <CalcKey label="1" onPress={() => inputDigit('1')} />
        <CalcKey label="2" onPress={() => inputDigit('2')} />
        <CalcKey label="3" onPress={() => inputDigit('3')} />
        <CalcKey label="−" variant="op" active={op === '−'} onPress={() => chooseOp('−')} />

        <CalcKey label="." onPress={inputDot} />
        <CalcKey label="0" onPress={() => inputDigit('0')} />
        <CalcKey label="⌫" onPress={backspace} />
        <CalcKey label="+" variant="op" active={op === '+'} onPress={() => chooseOp('+')} />

        <CalcKey label="C" variant="clear" onPress={clearAll} />
        <CalcKey label="=" variant="eq" wide onPress={equals} />
      </View>

      {/* Delete (edit mode only) */}
      {isEditing && (
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Delete expense</Text>
        </TouchableOpacity>
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

  amountWrap: { alignItems: 'center', paddingTop: 14, paddingBottom: 8 },
  expr: { fontSize: 16, color: '#9C8772', fontWeight: '600', minHeight: 20, userSelect: 'none' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  currency: { fontSize: 20, color: '#9C8772', marginBottom: 6, userSelect: 'none' },
  amount: { fontSize: 52, fontWeight: '700', color: '#5A4632', letterSpacing: -1, userSelect: 'none' },

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
    paddingHorizontal: 8,
    paddingBottom: 8,
    marginTop: 'auto',
  },
  key: {
    width: '25%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  keyWide: { width: '75%' },
  keyPressed: { backgroundColor: '#E3C49A44' },
  keyText: { fontSize: 24, fontWeight: '500', color: '#5A4632', userSelect: 'none' },
  keyOpText: { color: '#ECB13F', fontWeight: '700', fontSize: 26 },
  keyOpActive: { backgroundColor: '#FBEFD6' },
  keyOpActiveText: { color: '#5A4632' },
  keyEq: { backgroundColor: '#F5C45E' },
  keyEqText: { color: '#5A4632', fontWeight: '700' },
  keyClearText: { color: '#9C8772' },

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
