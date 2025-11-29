/**
 * Mock for useInteractionState hook
 * Provides a simplified mock that bypasses gesture handler complexity
 */

// Note: No React imports needed for this mock

// Mock shared value type
interface MockSharedValue<T> {
  value: T;
}

// Create mock shared value
const createMockSharedValue = <T>(initial: T): MockSharedValue<T> => ({
  value: initial,
});

// Mock animated style
const createMockAnimatedStyle = () => ({
  transform: [{ scale: 1 }, { translateX: 0 }, { translateY: 0 }],
  opacity: 1,
});

// Mock gesture
const createMockGesture = () => ({
  enabled: jest.fn().mockReturnThis(),
  onBegin: jest.fn().mockReturnThis(),
  onStart: jest.fn().mockReturnThis(),
  onUpdate: jest.fn().mockReturnThis(),
  onEnd: jest.fn().mockReturnThis(),
  onFinalize: jest.fn().mockReturnThis(),
});

export const useInteractionState = jest.fn(() => ({
  pressProgress: createMockSharedValue(0),
  glowProgress: createMockSharedValue(0),
  successProgress: createMockSharedValue(0),
  errorProgress: createMockSharedValue(0),
  pressStyle: createMockAnimatedStyle(),
  glowStyle: createMockAnimatedStyle(),
  successStyle: createMockAnimatedStyle(),
  errorStyle: createMockAnimatedStyle(),
  gesture: createMockGesture(),
  triggerSuccess: jest.fn(),
  triggerError: jest.fn(),
  reset: jest.fn(),
}));

export default useInteractionState;
