import { Router } from 'expo-router';

// Go back, but fall back to Home when there's no history — e.g. after a web page
// refresh that lands directly on a pushed route (the back stack is empty, so a
// plain router.back() would be a no-op).
export function backOrHome(router: Router): void {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)' as never);
}
