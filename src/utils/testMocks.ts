/**
 * Test Mocks Utilities
 * Comprehensive mocks for testing environment
 */

// Type for the mock gesture object
interface MockGesture {
  enabled: jest.Mock<MockGesture>;
  onBegin: jest.Mock<MockGesture>;
  onStart: jest.Mock<MockGesture>;
  onUpdate: jest.Mock<MockGesture>;
  onEnd: jest.Mock<MockGesture>;
  onFinalize: jest.Mock<MockGesture>;
  withTestId: jest.Mock<MockGesture>;
  minDistance: jest.Mock<MockGesture>;
  maxDuration: jest.Mock<MockGesture>;
  minVelocity: jest.Mock<MockGesture>;
  numberOfTaps: jest.Mock<MockGesture>;
  maxDelay: jest.Mock<MockGesture>;
  minPointers: jest.Mock<MockGesture>;
  maxPointers: jest.Mock<MockGesture>;
  averageTouches: jest.Mock<MockGesture>;
  waitFor: jest.Mock<MockGesture>;
  simultaneousWithExternalGesture: jest.Mock<MockGesture>;
  requireExternalGestureToFail: jest.Mock<MockGesture>;
  hitSlop: jest.Mock<MockGesture>;
  activeOffsetX: jest.Mock<MockGesture>;
  activeOffsetY: jest.Mock<MockGesture>;
  failOffsetX: jest.Mock<MockGesture>;
  failOffsetY: jest.Mock<MockGesture>;
  shouldCancelWhenOutside: jest.Mock<MockGesture>;
  onGestureEvent: jest.Mock<MockGesture>;
  onHandlerStateChange: jest.Mock<MockGesture>;
  onRaw: jest.Mock<MockGesture>;
}

// Create a comprehensive mock gesture object with all possible methods
export const createMockGesture = (): MockGesture => {
  const mockGesture: MockGesture = {
    // Chainable configuration methods
    enabled: jest.fn(() => mockGesture),
    onBegin: jest.fn(() => mockGesture),
    onStart: jest.fn(() => mockGesture),
    onUpdate: jest.fn(() => mockGesture),
    onEnd: jest.fn(() => mockGesture),
    onFinalize: jest.fn(() => mockGesture),
    withTestId: jest.fn(() => mockGesture),
    minDistance: jest.fn(() => mockGesture),
    maxDuration: jest.fn(() => mockGesture),
    minVelocity: jest.fn(() => mockGesture),
    numberOfTaps: jest.fn(() => mockGesture),
    maxDelay: jest.fn(() => mockGesture),
    minPointers: jest.fn(() => mockGesture),
    maxPointers: jest.fn(() => mockGesture),
    averageTouches: jest.fn(() => mockGesture),
    waitFor: jest.fn(() => mockGesture),
    simultaneousWithExternalGesture: jest.fn(() => mockGesture),
    requireExternalGestureToFail: jest.fn(() => mockGesture),
    hitSlop: jest.fn(() => mockGesture),
    activeOffsetX: jest.fn(() => mockGesture),
    activeOffsetY: jest.fn(() => mockGesture),
    failOffsetX: jest.fn(() => mockGesture),
    failOffsetY: jest.fn(() => mockGesture),
    shouldCancelWhenOutside: jest.fn(() => mockGesture),
    onGestureEvent: jest.fn(() => mockGesture),
    onHandlerStateChange: jest.fn(() => mockGesture),
    onRaw: jest.fn(() => mockGesture),
  };
  
  return mockGesture;
};

// Export comprehensive gesture handler mock for tests
export const mockGestureHandler = {
  Gesture: {
    Tap: createMockGesture,
    Pan: createMockGesture,
    Pinch: createMockGesture,
    Rotation: createMockGesture,
    Fling: createMockGesture,
    LongPress: createMockGesture,
    ForceTouch: createMockGesture,
    Native: createMockGesture,
    Manual: createMockGesture,
    Race: (...gestures: any[]) => createMockGesture(),
    Simultaneous: (...gestures: any[]) => createMockGesture(),
    Exclusive: (...gestures: any[]) => createMockGesture(),
  },
  GestureDetector: ({ children }: any) => children,
  GestureHandlerRootView: 'View',
  // Legacy gesture handlers
  PanGestureHandler: 'View',
  TapGestureHandler: 'View',
  LongPressGestureHandler: 'View',
  PinchGestureHandler: 'View',
  RotationGestureHandler: 'View',
  FlingGestureHandler: 'View',
  ForceTouchGestureHandler: 'View',
  ScrollView: 'ScrollView',
  State: {},
  Directions: {},
};
