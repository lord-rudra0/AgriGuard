import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Triggers a device haptic feedback (vibration).
 * Falls back to navigator.vibrate on web if available.
 * 
 * @param {ImpactStyle} style - The style of impact (Light, Medium, Heavy)
 */
export const triggerHaptic = async (style = ImpactStyle.Light) => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      // Very light web vibration fallback
      navigator.vibrate(style === ImpactStyle.Heavy ? 20 : 10);
    }
  } catch (error) {
    console.warn('Haptics failed:', error);
  }
};
