import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Baloo2_600SemiBold, Baloo2_700Bold } from '@expo-google-fonts/baloo-2';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { initDatabase } from '../src/db/database';
import { reloadIfStale } from '../src/lib/staleness';
import { useExpenseStore } from '../src/store/useExpenseStore';
import { DialogHost } from '../src/lib/dialog';
import DevBanner from '../src/components/DevBanner';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
  const loadData = useExpenseStore(s => s.loadData);
  const [dataReady, setDataReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    // On web, check for a stale cached bundle BEFORE touching localStorage — an old
    // bundle's initWebStore() doesn't know about fields added since it was built,
    // and would silently drop them on its next persist(). See staleness.web.ts.
    reloadIfStale().then(reloading => {
      if (reloading) return; // hard reload in flight; don't touch localStorage this session
      initDatabase().then(() => {
        // If the app was closed mid dev-sandbox, revert to real data before loading.
        useExpenseStore.getState().recoverDevOrphan();
        loadData();
        setDataReady(true);
      });
    });
  }, []);

  // Hold render until fonts are ready AND data has loaded, so text doesn't flash in
  // a system font and there's no flash of empty UI while a stale-bundle reload/data
  // load is in flight.
  if (!fontsLoaded || !dataReady) {
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
