import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '../src/db/database';
import { useExpenseStore } from '../src/store/useExpenseStore';
import { DialogHost } from '../src/lib/dialog';

export default function RootLayout() {
  const loadData = useExpenseStore(s => s.loadData);

  useEffect(() => {
    initDatabase().then(() => {
      loadData();
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
      <DialogHost />
    </GestureHandlerRootView>
  );
}
