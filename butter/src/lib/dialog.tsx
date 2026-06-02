// Cross-platform dialogs in a SINGLE file (branching on Platform.OS) so there's
// no platform-resolution ambiguity. Native delegates to RN's Alert; web renders
// a real modal (react-native-web has no Alert) driven by a Zustand store.
import React from 'react';
import { Platform, Alert as RNAlert, Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { create } from 'zustand';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type DialogData = { title: string; message?: string; buttons: AlertButton[] };

type DialogStore = {
  dialog: DialogData | null;
  show: (d: DialogData) => void;
  dismiss: () => void;
};

const useDialogStore = create<DialogStore>((set) => ({
  dialog: null,
  show: (d) => set({ dialog: d }),
  dismiss: () => set({ dialog: null }),
}));

type AlertApi = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
};

const WebAlert: AlertApi = {
  alert(title, message, buttons) {
    useDialogStore.getState().show({
      title,
      message,
      buttons: buttons && buttons.length ? buttons : [{ text: 'OK' }],
    });
  },
};

export const Alert: AlertApi = Platform.OS === 'web' ? WebAlert : (RNAlert as AlertApi);

export function DialogHost() {
  // Hooks must run unconditionally; on native this just renders null.
  const dialog = useDialogStore((s) => s.dialog);
  const dismiss = useDialogStore((s) => s.dismiss);

  if (Platform.OS !== 'web' || !dialog) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{dialog.title}</Text>
          {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
          <View style={styles.buttons}>
            {dialog.buttons.map((b, i) => (
              <Pressable
                key={`${b.text}-${i}`}
                onPress={() => {
                  dismiss();
                  b.onPress?.();
                }}
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    b.style === 'cancel' && styles.cancelText,
                    b.style === 'destructive' && styles.destructiveText,
                  ]}
                >
                  {b.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
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
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFBF2',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#5A4632', marginBottom: 6 },
  message: { fontSize: 14, color: '#9C8772', lineHeight: 20, marginBottom: 8 },
  buttons: { marginTop: 12, gap: 4 },
  button: { paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  buttonPressed: { backgroundColor: '#E3C49A33' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#5A4632' },
  cancelText: { color: '#9C8772' },
  destructiveText: { color: '#E8A87C' },
});
