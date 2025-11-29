/**
 * Test mock for useInteractionState hook
 * Bypasses gesture-handler issues by mocking the entire hook
 */

import { ReactNode } from 'react';

export interface InteractionStateConfig {
  scale?: number;
  opacity?: number;
  glowIntensity?: number;
  translateX?: number;
  translateY?: number;
  pressDuration?: number;
  releaseDuration?: number;
  pressEasing?: [number, number, number, number];
  releaseEasing?: [number, number, number, number];
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  hapticPattern?: 'tap' | 'confirm' | 'error' | 'heavy' | 'selection' | 'success';
  soundEffect?: 'tapSoft' | 'success' | 'warning' | 'error';
  successHaptic?: 'tap' | 'confirm' | 'error' | 'heavy' | 'selection' | 'success';
  successSound?: 'tapSoft' | 'success' | 'warning' | 'error';
  errorHaptic?: 'tap' | 'confirm' | 'error' | 'heavy' | 'selection' | 'success';
  errorSound?: 'tapSoft' | 'success' | 'warning' | 'error';
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
}

export interface InteractionStateReturn {
  pressProgress: { value: number };
  glowProgress: { value: number };
  successProgress: { value: number };
  animatedStyle: any;
  gestureHandlers: any;
  handlePress: () => void;
  handlePressIn: () => void;
  handlePressOut: () => void;
  setSuccess: (success: boolean) => void;
  setError: (error: boolean) => void;
  reset: () => void;
}

// Mock implementation that returns safe defaults
export const useInteractionState = (config?: InteractionStateConfig): InteractionStateReturn => {
  return {
    pressProgress: { value: 0 },
    glowProgress: { value: 0 },
    successProgress: { value: 0 },
    animatedStyle: {},
    gestureHandlers: {},
    handlePress: jest.fn(),
    handlePressIn: jest.fn(),
    handlePressOut: jest.fn(),
    setSuccess: jest.fn(),
    setError: jest.fn(),
    reset: jest.fn(),
  };
};

// Mock the entire hook module
jest.mock('@/hooks/useInteractionState', () => ({
  useInteractionState,
  InteractionStateProvider: ({ children }: { children: ReactNode }) => children,
}));
