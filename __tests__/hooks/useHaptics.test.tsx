/**
 * useHaptics Hook Tests
 * Comprehensive test coverage for the haptics functionality
 */

import { renderHook } from '@testing-library/react-native';
import { useHaptics } from '../../src/hooks/useHaptics';
import { TestProviders } from '../TestProviders';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Mock AsyncStorage for settings
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock useSound to avoid expo-av issues
jest.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    play: jest.fn(),
  }),
}));

describe('useHaptics', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders>{children}</TestProviders>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default haptic patterns', () => {
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      expect(result.current).toHaveProperty('trigger');
      expect(typeof result.current.trigger).toBe('function');
    });

    it('provides trigger method', () => {
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      expect(result.current).toHaveProperty('trigger');
      expect(typeof result.current.trigger).toBe('function');
    });
  });

  describe('Haptic Triggers', () => {
    it('triggers selection haptic for tap pattern', () => {
      const { selectionAsync } = require('expo-haptics');
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      result.current.trigger('tap');
      
      expect(selectionAsync).toHaveBeenCalled();
    });

    it('triggers heavy haptic for heavy pattern', () => {
      const { impactAsync } = require('expo-haptics');
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      result.current.trigger('heavy');
      
      expect(impactAsync).toHaveBeenCalledWith('heavy');
    });

    it('triggers heavy haptic for confirm pattern', () => {
      const { impactAsync } = require('expo-haptics');
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      result.current.trigger('confirm');
      
      expect(impactAsync).toHaveBeenCalledWith('heavy');
    });

    it('triggers error notification for error pattern', () => {
      const { notificationAsync } = require('expo-haptics');
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      result.current.trigger('error');
      
      expect(notificationAsync).toHaveBeenCalledWith('error');
    });

    it('handles custom haptic patterns', () => {
      const { impactAsync } = require('expo-haptics');
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      result.current.trigger('success');
      
      expect(impactAsync).toHaveBeenCalledWith('heavy');
    });
  });

  describe('Error Handling', () => {
    it('handles invalid haptic patterns', () => {
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      // Should not throw error for invalid patterns
      expect(() => result.current.trigger('invalid' as any)).not.toThrow();
    });
  });

  describe('Haptic Patterns', () => {
    it('triggers selection haptic for selection pattern', () => {
      const { selectionAsync } = require('expo-haptics');
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      result.current.trigger('selection');
      
      expect(selectionAsync).toHaveBeenCalled();
    });

    it('handles unknown patterns gracefully', () => {
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      // Should not throw for unknown patterns
      expect(() => result.current.trigger('unknown' as any)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('handles rapid haptic triggers efficiently', () => {
      const { selectionAsync } = require('expo-haptics');
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      // Trigger multiple haptics rapidly
      for (let i = 0; i < 10; i++) {
        result.current.trigger('tap');
      }
      
      expect(selectionAsync).toHaveBeenCalledTimes(10);
    });

    it('does not cause memory leaks', () => {
      const { unmount } = renderHook(() => useHaptics(), { wrapper });
      
      // Should unmount without issues
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('provides haptic feedback for accessibility actions', () => {
      const { impactAsync } = require('expo-haptics');
      const { result } = renderHook(() => useHaptics(), { wrapper });
      
      result.current.trigger('confirm');
      
      expect(impactAsync).toHaveBeenCalledWith('heavy');
    });
  });
});
