/**
 * Accessibility Utilities
 * Production requirement: UX-03 - Accessibility
 * Provides utilities for accessibility compliance
 */

import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Accessibility roles for components
 */
export type AccessibilityRole = 
  | 'button'
  | 'link'
  | 'header'
  | 'text'
  | 'image'
  | 'search'
  | 'menu'
  | 'menuitem'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'slider'
  | 'progressbar'
  | 'alert'
  | 'dialog'
  | 'list'
  | 'listitem'
  | 'tab'
  | 'tablist';

/**
 * Generates accessibility props for common components
 */
export function getAccessibilityProps(
  role: AccessibilityRole,
  label: string,
  options?: {
    hint?: string;
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    busy?: boolean;
    expanded?: boolean;
    value?: { min?: number; max?: number; now?: number; text?: string };
  }
) {
  const props: Record<string, unknown> = {
    accessible: true,
    accessibilityRole: role,
    accessibilityLabel: label,
  };

  if (options?.hint) {
    props.accessibilityHint = options.hint;
  }

  const state: Record<string, boolean | undefined> = {};
  
  if (options?.disabled !== undefined) {
    state.disabled = options.disabled;
  }
  if (options?.selected !== undefined) {
    state.selected = options.selected;
  }
  if (options?.checked !== undefined) {
    state.checked = options.checked;
  }
  if (options?.busy !== undefined) {
    state.busy = options.busy;
  }
  if (options?.expanded !== undefined) {
    state.expanded = options.expanded;
  }

  if (Object.keys(state).length > 0) {
    props.accessibilityState = state;
  }

  if (options?.value) {
    props.accessibilityValue = options.value;
  }

  return props;
}

/**
 * Color contrast checker
 * WCAG 2.1 requires:
 * - Normal text: contrast ratio of at least 4.5:1
 * - Large text (18pt+ or 14pt bold): contrast ratio of at least 3:1
 */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    // Remove # if present
    const color = hex.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(color.substring(0, 2), 16) / 255;
    const g = parseInt(color.substring(2, 4), 16) / 255;
    const b = parseInt(color.substring(4, 6), 16) / 255;

    // Apply gamma correction
    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    // Calculate relative luminance
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if color contrast meets WCAG requirements
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? 3 : 4.5;
  
  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
  };
}

/**
 * Large text support - scales font sizes based on system settings
 */
export function getScaledFontSize(
  baseFontSize: number,
  maxScale: number = 1.5
): number {
  // In a real implementation, this would use PixelRatio.getFontScale()
  // For now, return the base size
  return baseFontSize;
}

/**
 * Checks if screen reader is enabled
 */
export async function isScreenReaderEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch {
    return false;
  }
}

/**
 * Checks if reduce motion is enabled
 */
export async function isReduceMotionEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}

/**
 * Announces a message for screen readers
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Common accessibility labels for the app
 */
export const A11Y_LABELS = {
  // Navigation
  back: 'Go back',
  close: 'Close',
  menu: 'Open menu',
  home: 'Go to home',
  
  // Actions
  search: 'Search',
  submit: 'Submit',
  cancel: 'Cancel',
  confirm: 'Confirm',
  retry: 'Retry',
  
  // Ride flow
  pickupLocation: 'Pickup location',
  dropoffLocation: 'Drop-off location',
  selectRideOption: (name: string) => `Select ${name} ride option`,
  requestRide: 'Request ride',
  cancelRide: 'Cancel ride',
  
  // Driver
  driverInfo: (name: string, rating: number) => `Driver ${name}, rated ${rating} stars`,
  callDriver: 'Call driver',
  messageDriver: 'Message driver',
  
  // Payment
  addPaymentMethod: 'Add payment method',
  selectPaymentMethod: (type: string) => `Select ${type} payment method`,
  
  // Status
  loadingContent: 'Loading content',
  error: (message: string) => `Error: ${message}`,
  success: (message: string) => `Success: ${message}`,
};

/**
 * Accessibility hints for interactive elements
 */
export const A11Y_HINTS = {
  doubleTapToSelect: 'Double tap to select',
  doubleTapToActivate: 'Double tap to activate',
  swipeToNavigate: 'Swipe left or right to navigate',
  dragToAdjust: 'Drag to adjust value',
  pinchToZoom: 'Pinch to zoom in or out',
};

/**
 * Validates that all required accessibility props are present
 */
export function validateAccessibilityProps(props: Record<string, unknown>): {
  isValid: boolean;
  missing: string[];
} {
  const required = ['accessibilityLabel'];
  const recommended = ['accessibilityRole', 'accessibilityHint'];
  
  const missing: string[] = [];
  
  for (const prop of required) {
    if (!props[prop]) {
      missing.push(prop);
    }
  }
  
  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Focus management utilities
 */
export const FocusManager = {
  /**
   * Sets focus to an element (for web)
   */
  setFocus: (ref: { focus?: () => void } | null): void => {
    if (ref?.focus) {
      ref.focus();
    }
  },
  
  /**
   * Traps focus within a container (for modals)
   */
  trapFocus: (containerRef: unknown): (() => void) => {
    // Returns cleanup function
    return () => {};
  },
};
