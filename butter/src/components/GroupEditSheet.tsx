import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import { AllocationGroup } from '../db/types';
import { Alert } from '../lib/dialog';
import { colors, radius, fonts, cardShadow } from '../constants/theme';

// Phase 5b: rename / re-icon / delete a recurring-payment group (opened from the
// pencil on a group card on the Money screen). Deleting keeps the payments —
// they just become ungrouped.

const GROUP_ICON_CHOICES = ['🛡️', '📺', '💳', '🏠', '🚗', '📱', '🎓', '💪', '🎁', '📦'];

type Props = {
  group: AllocationGroup | null; // null = hidden
  onClose: () => void;
};

export default function GroupEditSheet({ group, onClose }: Props) {
  const updateAllocationGroup = useExpenseStore(s => s.updateAllocationGroup);
  const deleteAllocationGroup = useExpenseStore(s => s.deleteAllocationGroup);
  const allocations = useExpenseStore(s => s.allocations);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(GROUP_ICON_CHOICES[0]);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setIcon(group.icon);
    }
  }, [group]);

  if (!group) return null;
  const memberCount = allocations.filter(a => a.group_id === group.id).length;

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Missing name', 'Give the group a name.');
      return;
    }
    updateAllocationGroup(group.id, { name: trimmed, icon, sort_order: group.sort_order });
    onClose();
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete this group?',
      memberCount > 0
        ? `Its ${memberCount} ${memberCount === 1 ? 'payment stays' : 'payments stay'} — they'll just be ungrouped.`
        : 'The group is empty.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAllocationGroup(group.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text selectable={false} style={styles.title}>Edit group</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Group name"
            placeholderTextColor="#BCAF9C"
          />
          <View style={styles.chipWrap}>
            {GROUP_ICON_CHOICES.map(choice => (
              <Pressable
                key={choice}
                accessibilityLabel={`group-icon-${choice}`}
                onPress={() => setIcon(choice)}
                style={[styles.iconChip, icon === choice && styles.iconChipActive]}
              >
                <Text selectable={false} style={styles.iconChipText}>{choice}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable accessibilityLabel="group-save" onPress={save} style={styles.saveButton}>
            <Text selectable={false} style={styles.saveText}>Save</Text>
          </Pressable>
          <Pressable accessibilityLabel="group-delete" onPress={confirmDelete} style={styles.deleteButton}>
            <Text selectable={false} style={styles.deleteText}>Delete group</Text>
          </Pressable>
          <Pressable accessibilityLabel="group-cancel" onPress={onClose} style={styles.cancelButton}>
            <Text selectable={false} style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000055',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 22,
    width: '100%',
    maxWidth: 340,
    ...cardShadow,
  },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.textBrown, textAlign: 'center', marginBottom: 14 },

  input: {
    backgroundColor: '#FBF6EA',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textBrown,
    marginBottom: 12,
  },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.bearBody,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  iconChipActive: { backgroundColor: colors.butter, borderColor: colors.butter },
  iconChipText: { fontSize: 18 },

  saveButton: {
    backgroundColor: colors.butter,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  saveText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textBrown },
  deleteButton: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  deleteText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#D9534F' },
  cancelButton: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSoft },
});
