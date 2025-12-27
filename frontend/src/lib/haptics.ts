/**
 * Haptic Feedback Utility
 * Provides vibration feedback for mobile devices
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface HapticPattern {
  duration: number;
  pattern?: number[];
}

const hapticPatterns: Record<HapticType, HapticPattern> = {
  light: { duration: 10 },
  medium: { duration: 20 },
  heavy: { duration: 30 },
  success: { duration: 0, pattern: [10, 50, 10] },
  warning: { duration: 0, pattern: [20, 100, 20] },
  error: { duration: 0, pattern: [30, 100, 30, 100, 30] },
};

/**
 * Check if haptic feedback is available
 */
export function isHapticAvailable(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 */
export function triggerHaptic(type: HapticType = 'light'): void {
  if (!isHapticAvailable()) return;

  const pattern = hapticPatterns[type];

  try {
    if (pattern.pattern) {
      navigator.vibrate(pattern.pattern);
    } else {
      navigator.vibrate(pattern.duration);
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Stop any ongoing vibration
 */
export function stopHaptic(): void {
  if (!isHapticAvailable()) return;

  try {
    navigator.vibrate(0);
  } catch (error) {
    console.warn('Stop haptic failed:', error);
  }
}

/**
 * Haptic feedback for button clicks
 */
export function hapticClick(): void {
  triggerHaptic('light');
}

/**
 * Haptic feedback for successful actions
 */
export function hapticSuccess(): void {
  triggerHaptic('success');
}

/**
 * Haptic feedback for errors
 */
export function hapticError(): void {
  triggerHaptic('error');
}

/**
 * Haptic feedback for warnings
 */
export function hapticWarning(): void {
  triggerHaptic('warning');
}

/**
 * Haptic feedback for selection
 */
export function hapticSelection(): void {
  triggerHaptic('medium');
}
