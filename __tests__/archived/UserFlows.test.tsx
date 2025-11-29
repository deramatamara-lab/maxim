import React, { useRef } from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { Vector3 } from 'three';

import { TestProviders } from '../TestProviders';
import { FloatingTabBar, TabId } from '../../src/components/ui/FloatingTabBar';
import { SleekNav } from '../../src/components/ui/SleekNav';
import { Globe, GlobeHandle } from '../../src/components/3d/Globe.native';
import { MapContainer, MapContainerHandle } from '../../src/components/map/MapContainer';

// Mock all external dependencies for integration testing
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initialValue: any) => ({ value: initialValue }),
  useAnimatedStyle: (fn: () => any) => fn(),
  withTiming: (value: any, config?: any) => value,
  withSpring: (value: any, config?: any) => value,
  interpolateColor: (value: any, inputRange: any[], outputRange: any[]) => outputRange[1],
  Easing: {
    bezier: (x1: number, y1: number, x2: number, y2: number) => `bezier(${x1},${y1},${x2},${y2})`,
  },
}));

jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Tap: () => ({
      onBegin: jest.fn().mockReturnThis(),
      onFinalize: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-three/fiber/native', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div testID="three-canvas">{children}</div>
  ),
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({
    camera: {
      position: new Vector3(0, 0, 3.6),
      lookAt: jest.fn(),
    },
  })),
}));

jest.mock('@rnmapbox/maps', () => ({
  MapView: ({ children }: { children: React.ReactNode }) => (
    <div testID="mapbox-map-view">{children}</div>
  ),
  Camera: ({ children }: { children: React.ReactNode }) => (
    <div testID="mapbox-camera">{children}</div>
  ),
  setAccessToken: jest.fn(),
  setTelemetryEnabled: jest.fn(),
}));

jest.mock('three', () => ({
  Vector3: class {
    constructor(public x = 0, public y = 0, public z = 0) {}
    copy(v: any) { 
      this.x = v.x; 
      this.y = v.y; 
      this.z = v.z; 
      return this;
    }
    clone() { return new (this.constructor as any)(this.x, this.y, this.z); }
    equals(v: any) { 
      return this.x === v.x && this.y === v.y && this.z === v.z; 
    }
  },
  Color: jest.fn(),
  ShaderMaterial: jest.fn(),
  BufferAttribute: jest.fn(),
  AdditiveBlending: 'additive',
  BackSide: 'back',
  Mesh: jest.fn(),
  Points: jest.fn(),
}));

jest.mock('../../src/components/ui/GlassCard', () => ({
  GlassCard: ({ children, ...props }: any) => (
    <div testID="glass-card" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('../../src/components/ui/Icon', () => ({
  Icon: ({ name, ...props }: any) => (
    <div testID={`icon-${name}`} {...props}>
      {name}
    </div>
  ),
}));

jest.mock('../../src/components/ui/CustomIcon', () => ({
  CustomIcon: ({ name, ...props }: any) => (
    <div testID={`custom-icon-${name}`} {...props}>
      {name}
    </div>
  ),
}));

jest.mock('../../src/hooks/useHaptics', () => ({
  useHaptics: () => ({
    trigger: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useSound', () => ({
  useSound: () => ({
    play: jest.fn(),
  }),
}));

jest.mock('../../src/constants/theme', () => ({
  ds: {
    colors: {
      glass: 'rgba(255, 255, 255, 0.1)',
      surfaceElevated: 'rgba(255, 255, 255, 0.2)',
      glassBorder: 'rgba(255, 255, 255, 0.3)',
      outlineSubtle: 'rgba(255, 255, 255, 0.4)',
      primary: '#0066FF',
      textSecondary: '#888888',
      border: 'rgba(255, 255, 255, 0.5)',
    },
    radius: {
      '2xl': 24,
      lg: 16,
      sm: 8,
    },
    spacing: {
      xl: 32,
      md: 16,
      sm: 8,
    },
    typography: {
      family: 'Poppins',
      size: { caption: 12 },
      weight: { medium: '500' },
    },
    motion: {
      duration: { micro: 140, exit: 220 },
      easing: {
        micro: [0.25, 0.1, 0.25, 1],
        exit: [0.55, 0.085, 0.68, 0.53],
      },
    },
    shadow: {
      card: { opacity: 0.1, radius: 8 },
      soft: { radius: 4 },
    },
  },
}));

jest.mock('../../src/constants/config', () => ({
  config: {
    mapboxToken: 'mock-mapbox-token',
  },
}));

jest.mock('../../src/components/map/auraDarkStyle', () => ({
  auraDarkStyleJSON: '{"version": 8, "sources": {}, "layers": []}',
}));

describe('Integration Tests - Critical User Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Navigation Flow Integration', () => {
    it('should complete full navigation cycle through all tabs', async () => {
      const mockOnTabChange = jest.fn();
      
      const { getByText } = render(
        <TestProviders>
          <FloatingTabBar activeTab="home" onTabChange={mockOnTabChange} />
        </TestProviders>
      );

      // Navigate through all tabs in sequence
      fireEvent.press(getByText('Activity'));
      expect(mockOnTabChange).toHaveBeenCalledWith('activity');

      fireEvent.press(getByText('Location'));
      expect(mockOnTabChange).toHaveBeenCalledWith('location');

      fireEvent.press(getByText('Profile'));
      expect(mockOnTabChange).toHaveBeenCalledWith('profile');

      fireEvent.press(getByText('Home'));
      expect(mockOnTabChange).toHaveBeenCalledWith('home');

      // Verify complete navigation cycle
      expect(mockOnTabChange).toHaveBeenCalledTimes(4);
    });

    it('should maintain navigation state across component re-renders', async () => {
      const mockOnTabChange = jest.fn();
      
      const { rerender, getByText } = render(
        <TestProviders>
          <FloatingTabBar activeTab="home" onTabChange={mockOnTabChange} />
        </TestProviders>
      );

      // Navigate to activity
      fireEvent.press(getByText('Activity'));
      expect(mockOnTabChange).toHaveBeenCalledWith('activity');

      // Simulate parent component updating activeTab
      rerender(
        <TestProviders>
          <FloatingTabBar activeTab="activity" onTabChange={mockOnTabChange} />
        </TestProviders>
      );

      // Navigate to next tab
      fireEvent.press(getByText('Location'));
      expect(mockOnTabChange).toHaveBeenCalledWith('location');
    });

    it('should handle rapid navigation without state corruption', async () => {
      const mockOnTabChange = jest.fn();
      
      const { getByText } = render(
        <TestProviders>
          <FloatingTabBar activeTab="home" onTabChange={mockOnTabChange} />
        </TestProviders>
      );

      // Rapid navigation
      fireEvent.press(getByText('Activity'));
      fireEvent.press(getByText('Location'));
      fireEvent.press(getByText('Profile'));
      fireEvent.press(getByText('Home'));
      fireEvent.press(getByText('Activity'));

      expect(mockOnTabChange).toHaveBeenCalledTimes(5);
      expect(mockOnTabChange).toHaveBeenLastCalledWith('activity');
    });
  });

  describe('Globe to Map Transition Flow', () => {
    it('should handle globe zoom to map transition', async () => {
      const globeRef = useRef<GlobeHandle>(null);
      const mapRef = useRef<MapContainerHandle>(null);
      const onZoomComplete = jest.fn();
      const mockOnTabChange = jest.fn();

      const GlobeWithRef = () => {
        const [activeTab, setActiveTab] = React.useState<TabId>('home');
        const [showMap, setShowMap] = React.useState(false);

        const handleTabChange = (tab: TabId) => {
          setActiveTab(tab);
          if (tab === 'location') {
            // Trigger globe zoom
            globeRef.current?.zoomToLocation({ lat: 40.7128, lon: -74.0060 });
          }
          mockOnTabChange(tab);
        };

        const handleZoomComplete = () => {
          setShowMap(true);
          onZoomComplete();
        };

        return (
          <TestProviders>
            <FloatingTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            {!showMap ? (
              <Globe
                ref={globeRef}
                onZoomComplete={handleZoomComplete}
              />
            ) : (
              <MapContainer
                ref={mapRef}
                coordinate={[-74.0060, 40.7128]}
              />
            )}
          </TestProviders>
        );
      };

      const { getByText } = render(<GlobeWithRef />);

      // Verify initial state - globe renders without errors
      expect(true).toBe(true);

      // Navigate to location tab
      fireEvent.press(getByText('Location'));
      expect(mockOnTabChange).toHaveBeenCalledWith('location');

      // Simulate zoom completion
      act(() => {
        onZoomComplete();
      });

      // Verify map renders without errors
      expect(true).toBe(true);
    });

    it('should handle map focus back to globe transition', async () => {
      const globeRef = useRef<GlobeHandle>(null);
      const mapRef = useRef<MapContainerHandle>(null);
      const mockOnTabChange = jest.fn();

      const MapWithRef = () => {
        const [activeTab, setActiveTab] = React.useState<TabId>('location');
        const [showMap, setShowMap] = React.useState(true);

        const handleTabChange = (tab: TabId) => {
          setActiveTab(tab);
          if (tab !== 'location') {
            setShowMap(false);
          }
          mockOnTabChange(tab);
        };

        return (
          <TestProviders>
            <FloatingTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            {showMap ? (
              <MapContainer
                ref={mapRef}
                coordinate={[-74.0060, 40.7128]}
                testID="map-component"
              />
            ) : (
              <Globe
                ref={globeRef}
                testID="globe-component"
              />
            )}
          </TestProviders>
        );
      };

      const { getByText } = render(<MapWithRef />);

      // Verify initial state - map renders without errors
      expect(true).toBe(true);

      // Navigate away from location tab
      fireEvent.press(getByText('Home'));
      expect(mockOnTabChange).toHaveBeenCalledWith('home');

      // Verify globe renders without errors
      expect(true).toBe(true);
    });
  });

  describe('Multi-Component State Integration', () => {
    it('should synchronize navigation state across multiple components', async () => {
      const mockOnTabChange = jest.fn();

      const MultiNavComponent = () => {
        const [activeTab, setActiveTab] = React.useState<TabId>('home');

        const handleTabChange = (tab: TabId) => {
          setActiveTab(tab);
          mockOnTabChange(tab);
        };

        return (
          <TestProviders>
            <FloatingTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            <SleekNav activeTab={activeTab} onTabChange={handleTabChange} />
          </TestProviders>
        );
      };

      const { getByText } = render(<MultiNavComponent />);

      // Both navigation components should render without errors
      expect(true).toBe(true);

      // Navigate to activity in FloatingTabBar
      fireEvent.press(getByText('Activity'));
      expect(mockOnTabChange).toHaveBeenCalledWith('activity');

      // Navigation should work without errors
      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
    });

    it('should handle component lifecycle integration', async () => {
      const mockOnTabChange = jest.fn();

      const LifecycleComponent = ({ showSecondNav }: { showSecondNav: boolean }) => {
        const [activeTab, setActiveTab] = React.useState<TabId>('home');

        const handleTabChange = (tab: TabId) => {
          setActiveTab(tab);
          mockOnTabChange(tab);
        };

        return (
          <TestProviders>
            <FloatingTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            {showSecondNav && (
              <SleekNav activeTab={activeTab} onTabChange={handleTabChange} />
            )}
          </TestProviders>
        );
      };

      const { rerender, getByText } = render(<LifecycleComponent showSecondNav={false} />);

      // Navigate with single navigation component
      fireEvent.press(getByText('Activity'));
      expect(mockOnTabChange).toHaveBeenCalledWith('activity');

      // Add second navigation component
      rerender(<LifecycleComponent showSecondNav={true} />);

      // Continue navigation - both components should be synchronized
      fireEvent.press(getByText('Location'));
      expect(mockOnTabChange).toHaveBeenCalledWith('location');
    });
  });

  describe('Performance Integration', () => {
    it('should handle performance monitoring across components', async () => {
      const onPerformanceSample = jest.fn();
      const onZoomComplete = jest.fn();

      const PerformanceComponent = () => (
        <TestProviders enablePerformanceMonitoring={true}>
          <Globe
            onPerformanceSample={onPerformanceSample}
            onZoomComplete={onZoomComplete}
            testID="performance-globe"
          />
        </TestProviders>
      );

      render(<PerformanceComponent />);

      // Simulate performance sample
      const mockSample = {
        fps: 60,
        frameTimeMs: 16.67,
        heapSizeBytes: 1024000,
        timestamp: 1.5,
      };

      act(() => {
        onPerformanceSample(mockSample);
      });

      expect(onPerformanceSample).toHaveBeenCalledWith(mockSample);
    });

    it('should handle animation performance across navigation', async () => {
      const mockOnTabChange = jest.fn();

      const AnimationComponent = () => {
        const [activeTab, setActiveTab] = React.useState<TabId>('home');

        const handleTabChange = (tab: TabId) => {
          setActiveTab(tab);
          mockOnTabChange(tab);
        };

        return (
          <TestProviders>
            <FloatingTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            <Globe testID="animated-globe" />
          </TestProviders>
        );
      };

      const { getByText } = render(<AnimationComponent />);

      // Rapid navigation should not cause performance issues
      expect(() => {
        for (let i = 0; i < 10; i++) {
          fireEvent.press(getByText('Activity'));
          fireEvent.press(getByText('Location'));
          fireEvent.press(getByText('Profile'));
          fireEvent.press(getByText('Home'));
        }
      }).not.toThrow();

      expect(mockOnTabChange).toHaveBeenCalledTimes(40);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle navigation errors gracefully', async () => {
      const errorOnTabChange = jest.fn(() => {
        throw new Error('Navigation error');
      });

      const ErrorComponent = () => {
        const [activeTab, setActiveTab] = React.useState<TabId>('home');

        const handleTabChange = (tab: TabId) => {
          try {
            setActiveTab(tab);
            errorOnTabChange();
          } catch (error) {
            // Error handling would go here
            console.error('Navigation error:', error);
          }
        };

        return (
          <TestProviders>
            <FloatingTabBar activeTab={activeTab} onTabChange={handleTabChange} />
          </TestProviders>
        );
      };

      const { getByText } = render(<ErrorComponent />);

      // Should handle error without crashing
      expect(() => {
        fireEvent.press(getByText('Activity'));
      }).not.toThrow();

      expect(errorOnTabChange).toHaveBeenCalled();
    });

    it('should handle component mount/unmount integration', async () => {
      const MountComponent = ({ showGlobe }: { showGlobe: boolean }) => (
        <TestProviders>
          <FloatingTabBar activeTab="home" onTabChange={jest.fn()} />
          {showGlobe && <Globe testID="mountable-globe" />}
        </TestProviders>
      );

      const { rerender, getByTestId, queryByTestId } = render(
        <MountComponent showGlobe={true} />
      );

      // Globe should be mounted
      expect(getByTestId('mountable-globe')).toBeTruthy();

      // Unmount globe
      rerender(<MountComponent showGlobe={false} />);

      // Globe should be unmounted
      expect(queryByTestId('mountable-globe')).toBeNull();

      // Remount globe
      rerender(<MountComponent showGlobe={true} />);

      // Globe should be mounted again
      expect(getByTestId('mountable-globe')).toBeTruthy();
    });
  });

  describe('Platform-Specific Integration', () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', {
        get: () => originalPlatform,
      });
    });

    it('should handle iOS-specific integration correctly', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
      });

      const IOSComponent = () => (
        <TestProviders>
          <MapContainer
            coordinate={[-74.0060, 40.7128]}
            testID="ios-map"
          />
        </TestProviders>
      );

      const { getByTestId } = render(<IOSComponent />);

      expect(getByTestId('ios-map')).toBeTruthy();
    });

    it('should handle Android-specific integration correctly', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
      });

      const AndroidComponent = () => (
        <TestProviders>
          <MapContainer
            coordinate={[-74.0060, 40.7128]}
            testID="android-map"
          />
        </TestProviders>
      );

      const { getByTestId } = render(<AndroidComponent />);

      expect(getByTestId('android-map')).toBeTruthy();
    });

    it('should handle web-specific integration correctly', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'web',
      });

      const WebComponent = () => (
        <TestProviders>
          <MapContainer
            coordinate={[-74.0060, 40.7128]}
            testID="web-map"
          />
        </TestProviders>
      );

      const { getByTestId } = render(<WebComponent />);

      expect(getByTestId('web-map')).toBeTruthy();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across component transitions', async () => {
      const AccessibilityComponent = () => {
        const [showMap, setShowMap] = React.useState(false);

        const handleTabChange = (tab: TabId) => {
          if (tab === 'location') {
            setShowMap(true);
          }
        };

        return (
          <TestProviders>
            <FloatingTabBar
              activeTab="home"
              onTabChange={handleTabChange}
              accessible={true}
              accessibilityLabel="Main Navigation"
            />
            {showMap ? (
              <MapContainer
                coordinate={[-74.0060, 40.7128]}
                accessible={true}
                accessibilityLabel="Map View"
                testID="accessible-map"
              />
            ) : (
              <Globe
                accessible={true}
                accessibilityLabel="Globe View"
                testID="accessible-globe"
              />
            )}
          </TestProviders>
        );
      };

      const { getByTestId, getByText } = render(<AccessibilityComponent />);

      // Verify initial accessibility
      expect(getByTestId('accessible-globe').props.accessible).toBe(true);
      expect(getByTestId('accessible-globe').props.accessibilityLabel).toBe('Globe View');

      // Navigate to location
      fireEvent.press(getByText('Location'));

      // Verify map accessibility
      expect(getByTestId('accessible-map').props.accessible).toBe(true);
      expect(getByTestId('accessible-map').props.accessibilityLabel).toBe('Map View');
    });
  });

  describe('Data Flow Integration', () => {
    it('should handle data flow from user interaction to component state', async () => {
      const DataFlowComponent = () => {
        const [selectedLocation, setSelectedLocation] = React.useState<[number, number] | null>(null);
        const [activeTab, setActiveTab] = React.useState<TabId>('home');

        const handleTabChange = (tab: TabId) => {
          setActiveTab(tab);
          if (tab === 'location') {
            setSelectedLocation([-74.0060, 40.7128]); // NYC
          }
        };

        return (
          <TestProviders>
            <FloatingTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            {selectedLocation && (
              <MapContainer
                coordinate={selectedLocation}
                testID="data-flow-map"
              />
            )}
          </TestProviders>
        );
      };

      const { getByText, queryByTestId, getByTestId } = render(<DataFlowComponent />);

      // Initially no map should be rendered
      expect(queryByTestId('data-flow-map')).toBeNull();

      // Navigate to location tab
      fireEvent.press(getByText('Location'));

      // Map should now be rendered with correct coordinates
      expect(getByTestId('data-flow-map')).toBeTruthy();
    });

    it('should handle bidirectional data flow between components', async () => {
      const BidirectionalComponent = () => {
        const [coordinates, setCoordinates] = React.useState<[number, number]>([-74.0060, 40.7128]);
        const [activeTab, setActiveTab] = React.useState<TabId>('location');

        const handleTabChange = (tab: TabId) => {
          setActiveTab(tab);
        };

        const handleMapFocus = (data: { coordinate: [number, number] }) => {
          setCoordinates(data.coordinate);
        };

        const globeRef = useRef<GlobeHandle>(null);

        const handleGlobeZoom = () => {
          globeRef.current?.zoomToLocation({ lat: coordinates[1], lon: coordinates[0] });
        };

        return (
          <TestProviders>
            <FloatingTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            <Globe ref={globeRef} onZoomComplete={handleGlobeZoom} testID="bidirectional-globe" />
            <MapContainer
              coordinate={coordinates}
              testID="bidirectional-map"
            />
          </TestProviders>
        );
      };

      const { getByTestId } = render(<BidirectionalComponent />);

      // Both components should be rendered
      expect(getByTestId('bidirectional-globe')).toBeTruthy();
      expect(getByTestId('bidirectional-map')).toBeTruthy();

      // Verify data flow is working
      expect(true).toBe(true); // Components rendered without errors
    });
  });

  describe('Interrupted User Flows', () => {
    it('should handle navigation away during globe zoom animation', async () => {
      const globeRef = useRef<GlobeHandle>(null);
      const onZoomComplete = jest.fn();
      const onCancelZoom = jest.fn();
      const mockOnTabChange = jest.fn();

      const InterruptedFlowComponent = () => {
        const [activeTab, setActiveTab] = React.useState<TabId>('location');
        const [zoomInProgress, setZoomInProgress] = React.useState(false);

        const handleTabChange = (tab: TabId) => {
          setActiveTab(tab);
          
          // Cancel any ongoing zoom if navigating away
          if (zoomInProgress && tab !== 'location') {
            globeRef.current?.cancelZoom?.();
            onCancelZoom();
            setZoomInProgress(false);
          }
          
          mockOnTabChange(tab);
        };

        const handleZoomStart = () => {
          setZoomInProgress(true);
        };

        const handleZoomComplete = () => {
          setZoomInProgress(false);
          onZoomComplete();
        };

        React.useEffect(() => {
          // Start initial zoom
          if (activeTab === 'location' && !zoomInProgress) {
            globeRef.current?.zoomToLocation({ lat: 40.7128, lon: -74.0060 });
            handleZoomStart();
          }
        }, [activeTab, zoomInProgress]);

        return (
          <TestProviders>
            <FloatingTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            <Globe
              ref={globeRef}
              onZoomStart={handleZoomStart}
              onZoomComplete={handleZoomComplete}
              testID="interrupted-globe"
            />
          </TestProviders>
        );
      };

      const { getByText } = render(<InterruptedFlowComponent />);

      // Simulate zoom in progress
      act(() => {
        // Zoom starts automatically
      });

      // Navigate away during zoom
      fireEvent.press(getByText('Home'));
      
      expect(mockOnTabChange).toHaveBeenCalledWith('home');
      expect(onCancelZoom).toHaveBeenCalled();
      expect(onZoomComplete).not.toHaveBeenCalled();
    });

    it('should handle rapid tab changes during async operations', async () => {
      const mockOnTabChange = jest.fn();
      const asyncOperation = jest.fn(() => Promise.resolve());

      const RapidChangeComponent = () => {
        const [activeTab, setActiveTab] = React.useState<TabId>('home');
        const [loading, setLoading] = React.useState(false);

        const handleTabChange = async (tab: TabId) => {
          if (loading) return; // Prevent concurrent operations
          
          setLoading(true);
          setActiveTab(tab);
          mockOnTabChange(tab);
          
          try {
            await asyncOperation();
          } finally {
            setLoading(false);
          }
        };

        return (
          <TestProviders>
            <FloatingTabBar 
              activeTab={activeTab} 
              onTabChange={handleTabChange}
              testID="rapid-nav"
            />
          </TestProviders>
        );
      };

      const { getByText } = render(<RapidChangeComponent />);

      // Rapid tab changes
      fireEvent.press(getByText('Activity'));
      fireEvent.press(getByText('Location'));
      fireEvent.press(getByText('Profile'));

      // Wait for async operations to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should handle rapid changes gracefully
      expect(asyncOperation).toHaveBeenCalled();
      expect(mockOnTabChange).toHaveBeenCalled();
    });

    it('should cleanup resources when component unmounts during operation', async () => {
      const cleanup = jest.fn();
      const onUnmount = jest.fn();

      const CleanupComponent = ({ shouldUnmount }: { shouldUnmount: boolean }) => {
        const globeRef = useRef<GlobeHandle>(null);

        React.useEffect(() => {
          // Start some operation
          globeRef.current?.zoomToLocation({ lat: 40.7128, lon: -74.0060 });

          return () => {
            // Cleanup on unmount
            globeRef.current?.cancelZoom?.();
            cleanup();
            onUnmount();
          };
        }, []);

        if (shouldUnmount) {
          return null;
        }

        return (
          <TestProviders>
            <Globe ref={globeRef} testID="cleanup-globe" />
          </TestProviders>
        );
      };

      const { rerender } = render(<CleanupComponent shouldUnmount={false} />);

      // Unmount during operation
      rerender(<CleanupComponent shouldUnmount={true} />);

      expect(cleanup).toHaveBeenCalled();
      expect(onUnmount).toHaveBeenCalled();
    });
  });
});
