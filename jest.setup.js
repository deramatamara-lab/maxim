/* eslint-env node, jest */
/* eslint-disable no-undef */

// Ensure NODE_ENV is set to 'test' before any imports
global.process.env.NODE_ENV = 'test';

// Force late binding mock for react-native-gesture-handler AFTER jest-expo loads
// This overrides any preset mock
jest.doMock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  
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

  return {
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
});


// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Reanimated to work in Jest without needing a native environment.
// Based on official react-native-reanimated testing docs.
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text, Image, ScrollView, Pressable } = require('react-native');
  
  const valueWrapper = (initial) => ({ value: initial });
  const identity = (v) => v;

  const createAnimatedComponent = (Component) => {
    if (!Component) return View; // Fallback to View if Component is undefined
    // Return a component that forwards props to the original
    const AnimatedComponent = React.forwardRef((props, ref) => {
      // Filter out reanimated-specific props
      const { entering, exiting, layout, animatedProps, ...rest } = props;
      return React.createElement(Component, { ...rest, ref });
    });
    AnimatedComponent.displayName = `Animated(${(Component && Component.displayName) || (Component && Component.name) || 'Component'})`;
    return AnimatedComponent;
  };

  return {
    __esModule: true,
    default: {
      // Map Animated.View etc to actual RN components wrapped
      View: createAnimatedComponent(View),
      Text: createAnimatedComponent(Text),
      Image: createAnimatedComponent(Image),
      ScrollView: createAnimatedComponent(ScrollView),
      createAnimatedComponent,
      call: () => {},
      event: () => () => {},
      add: () => {},
      set: () => {},
      Value: class {
        constructor(value) {
          this.value = value;
        }
        setValue(value) {
          this.value = value;
        }
      },
      ValueXY: class {
        constructor() {
          this.x = { value: 0 };
          this.y = { value: 0 };
        }
        setValue(value) {
          this.x.value = value.x || 0;
          this.y.value = value.y || 0;
        }
      },
      cond: () => {},
      eq: () => {},
      interpolate: () => {},
      Animated: {
        Value: class {
          constructor(value) {
            this.value = value;
          }
        },
        ValueXY: class {
          constructor() {
            this.x = { value: 0 };
            this.y = { value: 0 };
          }
        },
        timing: () => ({
          start: () => {},
          stop: () => {},
        }),
        spring: () => ({
          start: () => {},
          stop: () => {},
        }),
      },
    },
    Easing: {
      bezier: () => identity,
      linear: identity,
      step0: identity,
      step1: identity,
    },
    Extrapolate: {
      CLAMP: 'clamp',
      EXTEND: 'extend',
      IDENTITY: 'identity',
    },
    interpolate: (value, inputRange, outputRange) => {
      // Simple linear interpolation mock
      if (typeof value === 'object' && value.value !== undefined) {
        return outputRange[0];
      }
      return outputRange[0];
    },
    useSharedValue: valueWrapper,
    useAnimatedStyle: (fn) => fn(),
    useAnimatedProps: (fn) => fn(),
    useDerivedValue: (fn) => valueWrapper(fn()),
    withTiming: identity,
    withSpring: identity,
    withDecay: identity,
    interpolateColor: () => 0,
    runOnJS: (fn) => (...args) => fn(...args),
    runOnUI: (fn) => (...args) => fn(...args),
    // Chainable animation builder mock
    ...(() => {
      const createChainable = () => {
        const chainable = {
          springify: () => chainable,
          damping: () => chainable,
          duration: () => chainable,
          delay: () => chainable,
          withInitialValues: () => chainable,
          withCallback: () => chainable,
          build: () => chainable,
        };
        return chainable;
      };
      return {
        FadeIn: createChainable(),
        FadeOut: createChainable(),
        FadeInDown: createChainable(),
        FadeInUp: createChainable(),
        FadeInLeft: createChainable(),
        FadeInRight: createChainable(),
        FadeOutDown: createChainable(),
        FadeOutUp: createChainable(),
        SlideInDown: createChainable(),
        SlideInUp: createChainable(),
        SlideInLeft: createChainable(),
        SlideInRight: createChainable(),
        SlideOutDown: createChainable(),
        SlideOutUp: createChainable(),
        SlideOutLeft: createChainable(),
        SlideOutRight: createChainable(),
        ZoomIn: createChainable(),
        ZoomOut: createChainable(),
        Layout: createChainable(),
        LinearTransition: createChainable(),
        SequencedTransition: createChainable(),
      };
    })(),
    useAnimatedSensor: () => ({ sensor: { value: { x: 0, y: 0 } } }),
    withRepeat: identity,
    withSequence: identity,
    useAnimatedGestureHandler: () => ({}),
    createAnimatedComponent,
    View: createAnimatedComponent(View),
    Text: createAnimatedComponent(Text),
    Image: createAnimatedComponent(Image),
    ScrollView: createAnimatedComponent(ScrollView),
  };
});

// Silence warnings from the native animated helper.
jest.mock(
  'react-native/Libraries/Animated/NativeAnimatedHelper',
  () => ({}),
  { virtual: true }
);

// Provide a no-op worklet init for Reanimated 2+.
// @ts-expect-error - global for reanimated
global.__reanimatedWorkletInit = global.__reanimatedWorkletInit || (() => {});

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {},
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-linear-gradient', () => 'LinearGradient');

// Import comprehensive Expo mocks
import './__tests__/mocks/expoMocks';

// Mock expo-secure-store specifically for tests using the real module shape
jest.mock('expo-secure-store', () => ({
  __esModule: true,
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock expo-av for sound playback
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn().mockResolvedValue({}),
          unloadAsync: jest.fn().mockResolvedValue({}),
          setVolumeAsync: jest.fn().mockResolvedValue({}),
        },
        status: { isLoaded: true },
      }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue({}),
  },
}));

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
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
}));

// Mock react-native Alert to prevent crashes from Alert.alert calls in tests
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Text: 'Text',
}));
