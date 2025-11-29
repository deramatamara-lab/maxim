/* eslint-env node, jest */

// Mock react-native-gesture-handler BEFORE jest-expo preset loads
// This file is referenced in jest.config.js setupFiles to run before preset

const View = require('react-native').View;

// Create chainable gesture mock with ALL methods
const createGestureMock = () => {
  const gesture = {
    enabled: jest.fn(() => gesture),
    onBegin: jest.fn(() => gesture),
    onStart: jest.fn(() => gesture),
    onUpdate: jest.fn(() => gesture),
    onEnd: jest.fn(() => gesture),
    onFinalize: jest.fn(() => gesture),
    withTestId: jest.fn(() => gesture),
    minDistance: jest.fn(() => gesture),
    maxDuration: jest.fn(() => gesture),
    minVelocity: jest.fn(() => gesture),
    numberOfTaps: jest.fn(() => gesture),
    maxDelay: jest.fn(() => gesture),
    minPointers: jest.fn(() => gesture),
    maxPointers: jest.fn(() => gesture),
    averageTouches: jest.fn(() => gesture),
    waitFor: jest.fn(() => gesture),
    simultaneousWithExternalGesture: jest.fn(() => gesture),
    requireExternalGestureToFail: jest.fn(() => gesture),
    hitSlop: jest.fn(() => gesture),
    activeOffsetX: jest.fn(() => gesture),
    activeOffsetY: jest.fn(() => gesture),
    failOffsetX: jest.fn(() => gesture),
    failOffsetY: jest.fn(() => gesture),
    shouldCancelWhenOutside: jest.fn(() => gesture),
    onGestureEvent: jest.fn(() => gesture),
    onHandlerStateChange: jest.fn(() => gesture),
    onRaw: jest.fn(() => gesture),
  };
  return gesture;
};

module.exports = {
  GestureHandlerRootView: View,
  GestureDetector: ({ children }) => children,
  Gesture: {
    Tap: createGestureMock,
    Pan: createGestureMock,
    Pinch: createGestureMock,
    Rotation: createGestureMock,
    Fling: createGestureMock,
    LongPress: createGestureMock,
    ForceTouch: createGestureMock,
    Native: createGestureMock,
    Manual: createGestureMock,
    Race: (...gestures) => createGestureMock(),
    Simultaneous: (...gestures) => createGestureMock(),
    Exclusive: (...gestures) => createGestureMock(),
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

// Apply the mock immediately
jest.mock('react-native-gesture-handler', () => module.exports);
