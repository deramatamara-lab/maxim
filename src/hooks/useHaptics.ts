import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export type HapticKind = 'tap' | 'confirm' | 'error' | 'heavy';
export type HapticPattern = 'tap' | 'confirm' | 'error' | 'selection' | 'success';

export function useHaptics() {
  const trigger = useCallback((kind: HapticKind | HapticPattern) => {
    switch (kind) {
      case 'tap':
      case 'selection':
        Haptics.selectionAsync();
        break;
      case 'confirm':
      case 'success':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      default:
        break;
    }
  }, []);

  return { trigger };
}
