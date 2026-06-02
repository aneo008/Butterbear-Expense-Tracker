// Native haptics — thin pass-through to expo-haptics. The web build resolves
// haptics.web.ts instead (a no-op), so web never imports expo-haptics.
import * as Haptics from 'expo-haptics';

export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = Haptics.NotificationFeedbackType;

export function impactAsync(style?: Haptics.ImpactFeedbackStyle): Promise<void> {
  return Haptics.impactAsync(style);
}

export function notificationAsync(type?: Haptics.NotificationFeedbackType): Promise<void> {
  return Haptics.notificationAsync(type);
}
