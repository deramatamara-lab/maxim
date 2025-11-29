/**
 * useReducedMotion Hook
 * Detects user preference for reduced motion and provides animation controls
 * Supports both system preferences and manual override for accessibility
 */

import { useState, useEffect, useCallback } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '../utils/logger';

const REDUCED_MOTION_KEY = 'aura_reduced_motion_preference';

interface ReducedMotionState {
  /** Whether reduced motion is currently enabled (system or user preference) */
  isReducedMotion: boolean;
  /** Whether the system prefers reduced motion */
  systemPrefersReducedMotion: boolean;
  /** User's manual override (null = follow system) */
  userPreference: boolean | null;
  /** Whether the preference is still loading */
  isLoading: boolean;
}

interface ReducedMotionControls {
  /** Set user preference for reduced motion */
  setReducedMotion: (enabled: boolean | null) => Promise<void>;
  /** Get animation duration based on reduced motion preference */
  getAnimationDuration: (normalDuration: number) => number;
  /** Get animation config for Reanimated */
  getAnimationConfig: () => AnimationConfig;
}

interface AnimationConfig {
  /** Whether to skip animations entirely */
  skipAnimation: boolean;
  /** Duration multiplier (0 = instant, 1 = normal) */
  durationMultiplier: number;
  /** Whether to use spring animations */
  useSpring: boolean;
  /** Spring damping (higher = less bouncy) */
  springDamping: number;
}

export function useReducedMotion(): ReducedMotionState & ReducedMotionControls {
  const [state, setState] = useState<ReducedMotionState>({
    isReducedMotion: false,
    systemPrefersReducedMotion: false,
    userPreference: null,
    isLoading: true,
  });

  // Load user preference from storage
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(REDUCED_MOTION_KEY);
        if (stored !== null) {
          setState(prev => ({
            ...prev,
            userPreference: stored === 'true',
          }));
        }
      } catch (error) {
        log.warn('Failed to load reduced motion preference', {
          event: 'reduced_motion_load_failed',
          component: 'useReducedMotion',
        });
      }
    };

    loadPreference();
  }, []);

  // Listen for system reduced motion preference
  useEffect(() => {
    const checkSystemPreference = async () => {
      try {
        if (Platform.OS === 'web') {
          // Web: Use media query
          const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
          const systemPrefers = mediaQuery.matches;
          
          setState(prev => ({
            ...prev,
            systemPrefersReducedMotion: systemPrefers,
            isReducedMotion: prev.userPreference ?? systemPrefers,
            isLoading: false,
          }));

          // Listen for changes
          const handleChange = (e: MediaQueryListEvent) => {
            setState(prev => ({
              ...prev,
              systemPrefersReducedMotion: e.matches,
              isReducedMotion: prev.userPreference ?? e.matches,
            }));
          };

          mediaQuery.addEventListener('change', handleChange);
          return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
          // Native: Use AccessibilityInfo
          const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
          
          setState(prev => ({
            ...prev,
            systemPrefersReducedMotion: isReduceMotionEnabled,
            isReducedMotion: prev.userPreference ?? isReduceMotionEnabled,
            isLoading: false,
          }));

          // Listen for changes
          const subscription = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            (isEnabled) => {
              setState(prev => ({
                ...prev,
                systemPrefersReducedMotion: isEnabled,
                isReducedMotion: prev.userPreference ?? isEnabled,
              }));
            }
          );

          return () => subscription.remove();
        }
      } catch (error) {
        log.warn('Failed to check system reduced motion preference', {
          event: 'reduced_motion_check_failed',
          component: 'useReducedMotion',
        });
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    const cleanup = checkSystemPreference();
    return () => {
      cleanup?.then(fn => fn?.());
    };
  }, []);

  // Update isReducedMotion when userPreference changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isReducedMotion: prev.userPreference ?? prev.systemPrefersReducedMotion,
    }));
  }, [state.userPreference, state.systemPrefersReducedMotion]);

  const setReducedMotion = useCallback(async (enabled: boolean | null) => {
    try {
      if (enabled === null) {
        await AsyncStorage.removeItem(REDUCED_MOTION_KEY);
      } else {
        await AsyncStorage.setItem(REDUCED_MOTION_KEY, String(enabled));
      }
      
      setState(prev => ({
        ...prev,
        userPreference: enabled,
        isReducedMotion: enabled ?? prev.systemPrefersReducedMotion,
      }));

      log.info('Reduced motion preference updated', {
        event: 'reduced_motion_updated',
        component: 'useReducedMotion',
        enabled,
        source: enabled === null ? 'system' : 'user',
      });
    } catch (error) {
      log.error('Failed to save reduced motion preference', {
        event: 'reduced_motion_save_failed',
        component: 'useReducedMotion',
      }, error);
    }
  }, []);

  const getAnimationDuration = useCallback((normalDuration: number): number => {
    if (state.isReducedMotion) {
      // Reduce duration to 10% for reduced motion (still provides feedback)
      return Math.max(normalDuration * 0.1, 50);
    }
    return normalDuration;
  }, [state.isReducedMotion]);

  const getAnimationConfig = useCallback((): AnimationConfig => {
    if (state.isReducedMotion) {
      return {
        skipAnimation: false, // Still animate, but faster
        durationMultiplier: 0.1,
        useSpring: false, // Disable spring for reduced motion
        springDamping: 100, // High damping = no bounce
      };
    }
    return {
      skipAnimation: false,
      durationMultiplier: 1,
      useSpring: true,
      springDamping: 15, // Normal spring behavior
    };
  }, [state.isReducedMotion]);

  return {
    ...state,
    setReducedMotion,
    getAnimationDuration,
    getAnimationConfig,
  };
}

/**
 * Get reduced motion safe animation duration
 * Utility function for use outside of React components
 */
export function getReducedMotionDuration(
  normalDuration: number,
  isReducedMotion: boolean
): number {
  if (isReducedMotion) {
    return Math.max(normalDuration * 0.1, 50);
  }
  return normalDuration;
}

/**
 * Check if system prefers reduced motion (one-time check)
 * Useful for initial render decisions
 */
export async function checkSystemReducedMotion(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}

export default useReducedMotion;
