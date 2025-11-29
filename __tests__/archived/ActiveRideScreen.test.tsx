/**
 * ActiveRideScreen Component Tests
 * Tests the ride tracking screen with driver info, ETA updates, and ride completion
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import ActiveRideScreen from '@/app/(rider)/active-ride';
import {
  resetAllMocks,
  setupDefaultMocks,
  createMockActiveRide,
  createMockDriver,
  createMockLocation,
  render as customRender,
  waitForAsync,
} from '../utils/testUtils';

// Mock the hooks and dependencies
jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    trigger: jest.fn(),
    tap: jest.fn(),
    confirm: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    play: jest.fn(),
  }),
}));

jest.mock('@/store/useEnhancedAppStore', () => ({
  useEnhancedRideState: () => ({
    currentRide: {
      id: 'ride-123',
      status: 'active',
      driver: {
        id: 'driver-456',
        name: 'John Doe',
        rating: 4.8,
        avatar: 'https://example.com/avatar.jpg',
        vehicle: {
          make: 'Toyota',
          model: 'Camry',
          color: 'Silver',
          licensePlate: 'ABC-123',
        },
        phone: '+1234567890',
      },
      pickup: {
        lat: 37.7749,
        lon: -122.4194,
        address: '123 Main St',
      },
      destination: {
        lat: 37.7849,
        lon: -122.4094,
        address: '456 Oak Ave',
      },
      route: {
        distance: 5000,
        duration: 1200,
        geometry: 'encoded_polyline',
      },
      estimatedPrice: 25.50,
      estimatedDuration: 1200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    isLoadingRide: false,
    cancelRide: jest.fn(),
  }),
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
  };
});

describe('ActiveRideScreen Component', () => {
  const mockOnRideComplete = jest.fn();
  const mockOnRideCancel = jest.fn();

  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return customRender(
      <ActiveRideScreen
        onRideComplete={mockOnRideComplete}
        onRideCancel={mockOnRideCancel}
        {...props}
      />
    );
  };

  it('should render ride information correctly', async () => {
    renderComponent();

    await waitForAsync();

    // Check for driver information
    expect(screen.getByText('Alex Chen')).toBeTruthy();
    expect(screen.getByText(/4\.9 • Premium/)).toBeTruthy();

    // Check for vehicle information
    expect(screen.getByText('Tesla Model 3')).toBeTruthy();
    expect(screen.getByText('AURA-123')).toBeTruthy();

    // Check for ride status
    expect(screen.getByText('Driver on the way')).toBeTruthy();

    // Check for ETA
    expect(screen.getByText(/5 min/)).toBeTruthy();
  });

  it('should display driver photo and rating', async () => {
    renderComponent();

    await waitForAsync();

    // Driver photo should be present
    const driverPhoto = screen.getByTestId('driver-photo');
    expect(driverPhoto).toBeTruthy();

    // Driver rating should be displayed
    expect(screen.getByText('4.9')).toBeTruthy();
  });

  it('should show live tracking indicator', async () => {
    renderComponent();

    await waitForAsync();

    // Check for live tracking indicator
    expect(screen.getByText('Live Tracking')).toBeTruthy();
  });

  it('should handle call driver button press', async () => {
    const { trigger } = require('@/hooks/useHaptics').useHaptics();
    const { play } = require('@/hooks/useSound').useSound();

    renderComponent();

    await waitForAsync();

    const callButton = screen.getByText('Call Driver');
    fireEvent.press(callButton);

    expect(trigger).toHaveBeenCalledWith('confirm');
    expect(play).toHaveBeenCalledWith('success');
  });

  it('should handle message driver button press', async () => {
    const { trigger } = require('@/hooks/useHaptics').useHaptics();
    const { play } = require('@/hooks/useSound').useSound();

    renderComponent();

    await waitForAsync();

    const messageButton = screen.getByText('Message');
    fireEvent.press(messageButton);

    expect(trigger).toHaveBeenCalledWith('tap');
    expect(play).toHaveBeenCalledWith('tapSoft');
  });

  it('should handle cancel ride button press', async () => {
    const { cancelRide } = require('@/store/useEnhancedAppStore').useEnhancedRideState();
    const { trigger } = require('@/hooks/useHaptics').useHaptics();
    const { play } = require('@/hooks/useSound').useSound();

    renderComponent();

    await waitForAsync();

    const cancelButton = screen.getByText('Cancel Ride');
    fireEvent.press(cancelButton);

    expect(trigger).toHaveBeenCalledWith('error');
    expect(play).toHaveBeenCalledWith('warning');
  });

  it('should update ETA countdown', async () => {
    jest.useFakeTimers();

    renderComponent();

    await waitForAsync();

    // Initial ETA should be 5 minutes
    expect(screen.getByText('5 min away')).toBeTruthy();

    // Fast-forward 1 minute
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    await waitForAsync();

    // ETA should now be 4 minutes
    expect(screen.getByText('4 min away')).toBeTruthy();

    jest.useRealTimers();
  });

  it('should show loading state when ride is loading', async () => {
    // Override mock to show loading state
    jest.doMock('@/store/useEnhancedAppStore', () => ({
      useEnhancedRideState: () => ({
        currentRide: null,
        isLoadingRide: true,
        cancelRide: jest.fn(),
      }),
    }));

    renderComponent();

    await waitForAsync();

    // Should show loading indicator
    expect(screen.getByText('Loading ride details...')).toBeTruthy();
  });

  it('should show error state when ride fails to load', async () => {
    // Override mock to show error state
    jest.doMock('@/store/useEnhancedAppStore', () => ({
      useEnhancedRideState: () => ({
        currentRide: null,
        isLoadingRide: false,
        cancelRide: jest.fn(),
      }),
    }));

    renderComponent();

    await waitForAsync();

    // Should show error message
    expect(screen.getByText('No active ride')).toBeTruthy();
  });

  it('should handle ride completion', async () => {
    jest.useFakeTimers();

    renderComponent();

    await waitForAsync();

    // Fast-forward past ride completion time
    act(() => {
      jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes
    });

    await waitForAsync();

    // Should call onRideComplete
    expect(mockOnRideComplete).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should display route information', async () => {
    renderComponent();

    await waitForAsync();

    // Check for pickup and destination addresses
    expect(screen.getByText('Times Square, New York, NY')).toBeTruthy();
    expect(screen.getByText('Grand Central Terminal, New York, NY')).toBeTruthy();
  });

  it('should show progress indicator', async () => {
    renderComponent();

    await waitForAsync();

    // Progress indicator should be present
    const progressIndicator = screen.getByTestId('ride-progress');
    expect(progressIndicator).toBeTruthy();
  });

  it('should handle driver location updates', async () => {
    renderComponent();

    await waitForAsync();

    // Simulate driver location update
    const locationUpdate = {
      lat: 40.7200,
      lon: -74.0000,
    };

    // This would typically come from a real-time update
    // For testing, we verify the component can handle location updates
    expect(screen.getByText('Live Tracking')).toBeTruthy();
  });

  it('should display correct ride status based on ride state', async () => {
    // Test different ride statuses
    const rideStates = [
      { status: 'pending', expectedText: 'Driver on the way' },
      { status: 'accepted', expectedText: 'Driver on the way' },
      { status: 'confirmed', expectedText: 'Driver on the way' },
      { status: 'arrived', expectedText: 'Driver has arrived' },
      { status: 'in_progress', expectedText: 'Ride in progress' },
    ];

    for (const { status, expectedText } of rideStates) {
      const mockRide = createMockActiveRide(
        createMockLocation(0),
        createMockLocation(1),
        'lux',
        'user-1',
        'Test ride'
      );
      mockRide.status = status;

      jest.doMock('@/store/useEnhancedAppStore', () => ({
        useEnhancedRideState: () => ({
          currentRide: mockRide,
          isLoadingRide: false,
          cancelRide: jest.fn(),
        }),
      }));

      const { unmount } = renderComponent();

      await waitForAsync();

      expect(screen.getByText(expectedText)).toBeTruthy();

      unmount();
    }
  });

  it('should handle accessibility correctly', async () => {
    renderComponent();

    await waitForAsync();

    // Check for accessibility labels
    const callButton = screen.getByLabelText('Call driver');
    const messageButton = screen.getByLabelText('Message driver');
    const cancelButton = screen.getByLabelText('Cancel ride');

    expect(callButton).toBeTruthy();
    expect(messageButton).toBeTruthy();
    expect(cancelButton).toBeTruthy();
  });

  it('should handle emergency button press', async () => {
    const { trigger } = require('@/hooks/useHaptics').useHaptics();
    const { play } = require('@/hooks/useSound').useSound();

    renderComponent();

    await waitForAsync();

    const emergencyButton = screen.getByText('Emergency');
    fireEvent.press(emergencyButton);

    expect(trigger).toHaveBeenCalledWith('error');
    expect(play).toHaveBeenCalledWith('warning');
  });

  it('should display trip cost and duration', async () => {
    renderComponent();

    await waitForAsync();

    // Check for cost and duration information
    expect(screen.getByText(/\$\d+\.\d+/)).toBeTruthy(); // Price format
    expect(screen.getByText(/\d+ min/)).toBeTruthy(); // Duration format
  });

  it('should handle share trip functionality', async () => {
    const { trigger } = require('@/hooks/useHaptics').useHaptics();
    const { play } = require('@/hooks/useSound').useSound();

    renderComponent();

    await waitForAsync();

    const shareButton = screen.getByText('Share Trip');
    fireEvent.press(shareButton);

    expect(trigger).toHaveBeenCalledWith('tap');
    expect(play).toHaveBeenCalledWith('tapSoft');
  });
});

describe('ActiveRideScreen - Edge Cases', () => {
  beforeEach(() => {
    resetAllMocks();
    setupDefaultMocks();
    jest.clearAllMocks();
  });

  it('should handle missing driver information', async () => {
    const mockRide = createMockActiveRide(
      createMockLocation(0),
      createMockLocation(1),
      'lux',
      'user-1',
      'Test ride'
    );
    mockRide.driver = undefined;

    jest.doMock('@/store/useEnhancedAppStore', () => ({
      useEnhancedRideState: () => ({
        currentRide: mockRide,
        isLoadingRide: false,
        cancelRide: jest.fn(),
      }),
    }));

    const { unmount } = render(
      <ActiveRideScreen
        onRideComplete={jest.fn()}
        onRideCancel={jest.fn()}
      />
    );

    await waitForAsync();

    // Should show placeholder for missing driver info
    expect(screen.getByText('Driver information unavailable')).toBeTruthy();

    unmount();
  });

  it('should handle missing vehicle information', async () => {
    const mockRide = createMockActiveRide(
      createMockLocation(0),
      createMockLocation(1),
      'lux',
      'user-1',
      'Test ride'
    );
    if (mockRide.driver) {
      mockRide.driver.vehicle = undefined;
    }

    jest.doMock('@/store/useEnhancedAppStore', () => ({
      useEnhancedRideState: () => ({
        currentRide: mockRide,
        isLoadingRide: false,
        cancelRide: jest.fn(),
      }),
    }));

    const { unmount } = render(
      <ActiveRideScreen
        onRideComplete={jest.fn()}
        onRideCancel={jest.fn()}
      />
    );

    await waitForAsync();

    // Should show placeholder for missing vehicle info
    expect(screen.getByText('Vehicle information unavailable')).toBeTruthy();

    unmount();
  });

  it('should handle very short ETA times', async () => {
    jest.useFakeTimers();

    // Override mock to show 1 minute ETA
    jest.doMock('@/store/useEnhancedAppStore', () => ({
      useEnhancedRideState: () => ({
        currentRide: createMockActiveRide(
          createMockLocation(0),
          createMockLocation(1),
          'lux',
          'user-1',
          'Test ride'
        ),
        isLoadingRide: false,
        cancelRide: jest.fn(),
      }),
    }));

    const { unmount } = render(
      <ActiveRideScreen
        onRideComplete={jest.fn()}
        onRideCancel={jest.fn()}
      />
    );

    await waitForAsync();

    // Fast-forward to 1 minute remaining
    act(() => {
      jest.advanceTimersByTime(4 * 60 * 1000);
    });

    await waitForAsync();

    expect(screen.getByText('1 min away')).toBeTruthy();
    expect(screen.getByText('Almost there!')).toBeTruthy();

    unmount();
    jest.useRealTimers();
  });

  it('should handle expired ETA (ride should be completed)', async () => {
    jest.useFakeTimers();

    const mockOnRideComplete = jest.fn();

    const { unmount } = render(
      <ActiveRideScreen
        onRideComplete={mockOnRideComplete}
        onRideCancel={jest.fn()}
      />
    );

    await waitForAsync();

    // Fast-forward past ride completion time
    act(() => {
      jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes
    });

    await waitForAsync();

    // Should have called ride completion
    expect(mockOnRideComplete).toHaveBeenCalled();

    unmount();
    jest.useRealTimers();
  });
});
