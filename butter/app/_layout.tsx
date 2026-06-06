import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Baloo2_600SemiBold, Baloo2_700Bold } from '@expo-google-fonts/baloo-2';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { initDatabase } from '../src/db/database';
import { useExpenseStore } from '../src/store/useExpenseStore';
import { DialogHost } from '../src/lib/dialog';
import DevBanner from '../src/components/DevBanner';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
  const loadData = useExpenseStore(s => s.loadData);

  const [fontsLoaded] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    initDatabase().then(() => {
      // If the app was closed mid dev-sandbox, revert to real data before loading.
      useExpenseStore.getState().recoverDevOrphan();
      loadData();
    });
  }, []);

  // Hold render until fonts are ready so text doesn't flash in a system font.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bgCream }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      {/* In-flow banner: when the dev sandbox is active it sits above all screens
          and pushes them down (no overlap); renders nothing otherwise. */}
      <DevBanner />
      <Stack screenOptions={{ headerShown: false }} />
      <DialogHost />
    </GestureHandlerRootView>
  );
}
