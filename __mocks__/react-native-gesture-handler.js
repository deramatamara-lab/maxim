/* eslint-env node */

// Minimal manual mock for react-native-gesture-handler
// Simplified to isolate the issue

const View = require('react-native').View;

// Simple gesture mock that returns chainable methods
const gesture = {
  enabled: jest.fn(() => gesture),
  onBegin: jest.fn(() => gesture),
  onStart: jest.fn(() => gesture),
  onUpdate: jest.fn(() => gesture),
  onEnd: jest.fn(() => gesture),
  onFinalize: jest.fn(() => gesture),
};

module.exports = {
  GestureHandlerRootView: View,
  GestureDetector: ({ children }) => children,
  Gesture: {
    Tap: () => gesture,
    Pan: () => gesture,
    Pinch: () => gesture,
    Rotation: () => gesture,
    Fling: () => gesture,
    LongPress: () => gesture,
    ForceTouch: () => gesture,
    Native: () => gesture,
    Manual: () => gesture,
    Race: () => gesture,
    Simultaneous: () => gesture,
    Exclusive: () => gesture,
  },
  PanGestureHandler: View,
  TapGestureHandler: View,
  LongPressGestureHandler: View,
  PinchGestureHandler: View,
  RotationGestureHandler: View,
  FlingGestureHandler: View,
  ForceTouchGestureHandler: View,
  ScrollView: require('react-native').ScrollView,
  State: {},
  Directions: {},
};
