// Web no-op haptics (browsers have no haptic API). Mirrors the native surface
// so call sites stay identical.
export const ImpactFeedbackStyle = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy',
  Soft: 'soft',
  Rigid: 'rigid',
} as const;

export const NotificationFeedbackType = {
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
} as const;

export function impactAsync(_style?: unknown): Promise<void> {
  return Promise.resolve();
}

export function notificationAsync(_type?: unknown): Promise<void> {
  return Promise.resolve();
}
