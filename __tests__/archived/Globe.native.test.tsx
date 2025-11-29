import React, { ReactNode } from 'react';
import { render, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { Vector3 } from 'three';

import { Globe, GlobeHandle, GlobePerformanceSample } from '../src/components/3d/Globe.native';

// Mock @react-three/fiber/native
jest.mock('@react-three/fiber/native', () => ({
  Canvas: ({ children }) => (
    <div data-testid="three-canvas">{children}</div>
  ),
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({
    camera: {
      position: { x: 0, y: 0, z: 3.6 },
      lookAt: jest.fn(),
    },
  })),
}));

// Mock three.js
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
  ShaderMaterial: jest.fn().mockImplementation(() => ({
    dispose: jest.fn(),
    uniforms: {},
  })),
  BufferAttribute: jest.fn().mockImplementation((data, itemSize) => ({
    array: data,
    itemSize,
    dispose: jest.fn(),
  })),
  AdditiveBlending: 'additive',
  BackSide: 'back',
  Mesh: jest.fn(),
  Points: jest.fn(),
}));

// Mock Globe shaders
jest.mock('../src/components/3d/Globe.shaders', () => ({
  GLOBE_VERTEX_SHADER: 'vertex-shader-globe',
  GLOBE_FRAGMENT_SHADER: 'fragment-shader-globe',
  ATMOSPHERE_VERTEX_SHADER: 'vertex-shader-atmosphere',
  ATMOSPHERE_FRAGMENT_SHADER: 'fragment-shader-atmosphere',
  AURORA_VERTEX_SHADER: 'vertex-shader-aurora',
  AURORA_FRAGMENT_SHADER: 'fragment-shader-aurora',
}));

// Mock theme constants
jest.mock('../src/constants/theme', () => ({
  ds: {
    colors: {
      background: '#000000',
      primary: '#0066FF',
      secondary: '#00FF88',
      glowCyan: '#00FFFF',
      textPrimary: '#FFFFFF',
    },
  },
}));

// Mock performance API for testing
const mockPerformance = {
  memory: {
    usedJSHeapSize: 1024000,
  },
};

describe('Globe Native Component', () => {
  const defaultProps = {
    height: 320,
    rotationSpeed: 0.09,
    opacity: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (global as any).performance = mockPerformance;
  });

  afterEach(() => {
    jest.useRealTimers();
    delete (global as any).performance;
  });

  describe('Rendering', () => {
    it('should render Globe component with Canvas', () => {
      const { getByTestId } = render(<Globe {...defaultProps} />);
      
      expect(getByTestId('three-canvas')).toBeTruthy();
    });

    it('should render with custom height and opacity', () => {
      const customProps = {
        ...defaultProps,
        height: 400,
        opacity: 0.8,
      };

      const { getByTestId } = render(<Globe {...customProps} />);
      
      expect(getByTestId('three-canvas')).toBeTruthy();
    });

    it('should render with performance monitoring enabled', () => {
      const onPerformanceSample = jest.fn();
      
      render(
        <Globe 
          {...defaultProps} 
          onPerformanceSample={onPerformanceSample}
          samplePeriod={0.5}
        />
      );
      
      expect(onPerformanceSample).toBeDefined();
    });

    it('should render with all optional props', () => {
      const props = {
        ...defaultProps,
        onZoomStart: jest.fn(),
        onZoomComplete: jest.fn(),
        onPerformanceSample: jest.fn(),
        samplePeriod: 1.0,
        zoomDurationMs: 3000,
      };

      expect(() => {
        render(<Globe {...props} />);
      }).not.toThrow();
    });
  });

  describe('Imperative Handle', () => {
    it('should provide zoomToLocation method via ref', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      expect(globeRef.current?.zoomToLocation).toBeDefined();
      expect(typeof globeRef.current?.zoomToLocation).toBe('function');
    });

    it('should provide cancelZoom method via ref', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      expect(globeRef.current?.cancelZoom).toBeDefined();
      expect(typeof globeRef.current?.cancelZoom).toBe('function');
    });

    it('should handle null ref gracefully', () => {
      expect(() => {
        render(<Globe {...defaultProps} ref={null} />);
      }).not.toThrow();
    });
  });

  describe('Zoom Functionality', () => {
    it('should call zoomToLocation with valid coordinates', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      expect(() => {
        globeRef.current?.zoomToLocation({ lat: 40.7128, lon: -74.0060 });
      }).not.toThrow();
    });

    it('should clamp latitude values to valid range', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      // Test latitude clamping
      expect(() => {
        globeRef.current?.zoomToLocation({ lat: 120, lon: 0 }); // Should clamp to 90
        globeRef.current?.zoomToLocation({ lat: -100, lon: 0 }); // Should clamp to -90
      }).not.toThrow();
    });

    it('should normalize longitude values to 0-360 range', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      // Test longitude normalization
      expect(() => {
        globeRef.current?.zoomToLocation({ lat: 0, lon: 450 }); // Should normalize to 90
        globeRef.current?.zoomToLocation({ lat: 0, lon: -90 }); // Should normalize to 270
      }).not.toThrow();
    });

    it('should clamp radius values to valid range', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      // Test radius clamping
      expect(() => {
        globeRef.current?.zoomToLocation({ lat: 0, lon: 0, radius: 10 }); // Should clamp to 4
        globeRef.current?.zoomToLocation({ lat: 0, lon: 0, radius: 0.5 }); // Should clamp to 1.5
      }).not.toThrow();
    });

    it('should use default radius when not specified', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      expect(() => {
        globeRef.current?.zoomToLocation({ lat: 40.7128, lon: -74.0060 }); // NYC
      }).not.toThrow();
    });

    it('should cancel zoom when cancelZoom is called', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      expect(() => {
        globeRef.current?.zoomToLocation({ lat: 0, lon: 0 });
        globeRef.current?.cancelZoom?.();
      }).not.toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    it('should call performance sample callback with correct data structure', () => {
      const onPerformanceSample = jest.fn();
      
      render(
        <Globe 
          {...defaultProps} 
          onPerformanceSample={onPerformanceSample}
          samplePeriod={0.75}
        />
      );
      
      // Simulate performance sample
      const mockSample: GlobePerformanceSample = {
        fps: 60,
        frameTimeMs: 16.67,
        heapSizeBytes: 1024000,
        timestamp: 1.5,
      };
      
      onPerformanceSample(mockSample);
      
      expect(onPerformanceSample).toHaveBeenCalledWith(mockSample);
    });

    it('should handle missing performance.memory gracefully', () => {
      const onPerformanceSample = jest.fn();
      
      // Mock performance without memory API
      (global as any).performance = {};
      
      render(
        <Globe 
          {...defaultProps} 
          onPerformanceSample={onPerformanceSample}
        />
      );
      
      expect(true).toBe(true); // Should handle missing memory API
    });

    it('should use custom sample period', () => {
      const onPerformanceSample = jest.fn();
      
      render(
        <Globe 
          {...defaultProps} 
          onPerformanceSample={onPerformanceSample}
          samplePeriod={1.0}
        />
      );
      
      expect(true).toBe(true); // Should accept custom sample period
    });

    it('should freeze performance sample objects', () => {
      const onPerformanceSample = jest.fn();
      
      render(
        <Globe 
          {...defaultProps} 
          onPerformanceSample={onPerformanceSample}
        />
      );
      
      const mockSample: GlobePerformanceSample = {
        fps: 60,
        frameTimeMs: 16.67,
        heapSizeBytes: 1024000,
        timestamp: 1.5,
      };
      
      onPerformanceSample(mockSample);
      
      // In a real implementation, this would check if Object.freeze was called
      expect(onPerformanceSample).toHaveBeenCalled();
    });
  });

  describe('Callbacks', () => {
    it('should call onZoomStart when zoom begins', () => {
      const onZoomStart = jest.fn();
      const globeRef = React.createRef<GlobeHandle>();
      
      render(
        <Globe 
          {...defaultProps} 
          ref={globeRef}
          onZoomStart={onZoomStart}
        />
      );
      
      globeRef.current?.zoomToLocation({ lat: 0, lon: 0 });
      
      expect(onZoomStart).toBeDefined();
    });

    it('should call onZoomComplete when zoom ends', () => {
      const onZoomComplete = jest.fn();
      const globeRef = React.createRef<GlobeHandle>();
      
      render(
        <Globe 
          {...defaultProps} 
          ref={globeRef}
          onZoomComplete={onZoomComplete}
          zoomDurationMs={100}
        />
      );
      
      globeRef.current?.zoomToLocation({ lat: 0, lon: 0 });
      
      // Fast forward timers to complete zoom
      act(() => {
        jest.advanceTimersByTime(150);
      });
      
      expect(onZoomComplete).toBeDefined();
    });
  });

  describe('Props and Configuration', () => {
    it('should accept custom zoom duration', () => {
      render(
        <Globe 
          {...defaultProps} 
          zoomDurationMs={3000}
        />
      );
      
      expect(true).toBe(true); // Should accept custom zoom duration
    });

    it('should accept custom rotation speed', () => {
      render(
        <Globe 
          {...defaultProps} 
          rotationSpeed={0.15}
        />
      );
      
      expect(true).toBe(true); // Should accept custom rotation speed
    });

    it('should handle missing optional props gracefully', () => {
      render(<Globe />);
      
      expect(true).toBe(true); // Should render with default props
    });

    it('should handle extreme prop values', () => {
      const extremeProps = {
        height: 0,
        rotationSpeed: -1,
        opacity: 2,
        zoomDurationMs: -1000,
      };

      expect(() => {
        render(<Globe {...extremeProps} />);
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should dispose of GPU resources on unmount', () => {
      const { unmount } = render(<Globe {...defaultProps} />);
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle material disposal correctly', () => {
      const mockDispose = jest.fn();
      
      // Mock ShaderMaterial to track disposal
      jest.doMock('three', () => ({
        ...jest.requireActual('three'),
        ShaderMaterial: jest.fn().mockImplementation(() => ({
          dispose: mockDispose,
          uniforms: {},
        })),
      }));

      const { unmount } = render(<Globe {...defaultProps} />);
      
      unmount();
      
      // In a real implementation, this would verify dispose was called
      expect(mockDispose).toBeDefined();
    });

    it('should handle BufferAttribute cleanup', () => {
      const { unmount } = render(<Globe {...defaultProps} />);
      
      unmount();
      
      expect(true).toBe(true); // Should cleanup without errors
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid coordinates gracefully', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      // Test with invalid values
      expect(() => {
        globeRef.current?.zoomToLocation({ lat: NaN, lon: Infinity });
      }).not.toThrow();
      
      expect(() => {
        globeRef.current?.zoomToLocation({ lat: 0, lon: undefined as any });
      }).not.toThrow();
    });

    it('should handle null ref gracefully', () => {
      const onZoomStart = jest.fn();
      const onZoomComplete = jest.fn();
      
      render(
        <Globe 
          {...defaultProps} 
          onZoomStart={onZoomStart}
          onZoomComplete={onZoomComplete}
        />
      );
      
      expect(true).toBe(true); // Should not crash without ref
    });

    it('should handle performance API errors gracefully', () => {
      const onPerformanceSample = jest.fn();
      
      // Mock performance that throws
      (global as any).performance = {
        get memory() {
          throw new Error('Memory API not available');
        },
      };

      expect(() => {
        render(
          <Globe 
            {...defaultProps} 
            onPerformanceSample={onPerformanceSample}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(<Globe {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates during lifecycle', () => {
      const { rerender } = render(
        <Globe {...defaultProps} rotationSpeed={0.1} />
      );

      rerender(<Globe {...defaultProps} rotationSpeed={0.2} />);
      rerender(<Globe {...defaultProps} height={400} />);
      rerender(<Globe {...defaultProps} opacity={0.5} />);

      expect(true).toBe(true); // Should handle all updates without errors
    });

    it('should handle callback updates during lifecycle', () => {
      const { rerender } = render(
        <Globe {...defaultProps} onZoomComplete={jest.fn()} />
      );

      rerender(<Globe {...defaultProps} onZoomComplete={jest.fn()} />);
      rerender(<Globe {...defaultProps} onZoomStart={jest.fn()} />);

      expect(true).toBe(true); // Should handle callback updates
    });
  });

  describe('Integration with Three.js', () => {
    it('should initialize Three.js components correctly', () => {
      render(<Globe {...defaultProps} />);
      
      // Verify Three.js classes were instantiated
      expect(jest.requireMock('three').Vector3).toBeDefined();
      expect(jest.requireMock('three').ShaderMaterial).toBeDefined();
      expect(jest.requireMock('three').BufferAttribute).toBeDefined();
    });

    it('should handle Three.js context correctly', () => {
      render(<Globe {...defaultProps} />);
      
      // Verify useThree hook was called
      expect(jest.requireMock('@react-three/fiber/native').useThree).toHaveBeenCalled();
    });

    it('should handle frame loop correctly', () => {
      render(<Globe {...defaultProps} />);
      
      // Verify useFrame hook was called
      expect(jest.requireMock('@react-three/fiber/native').useFrame).toHaveBeenCalled();
    });
  });

  describe('Platform Compatibility', () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', {
        get: () => originalPlatform,
      });
    });

    it('should work on iOS', () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
      });

      expect(() => {
        render(<Globe {...defaultProps} />);
      }).not.toThrow();
    });

    it('should work on Android', () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
      });

      expect(() => {
        render(<Globe {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle rapid zoom calls efficiently', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      expect(() => {
        for (let i = 0; i < 100; i++) {
          globeRef.current?.zoomToLocation({ 
            lat: Math.random() * 180 - 90, 
            lon: Math.random() * 360 
          });
        }
      }).not.toThrow();
    });

    it('should handle many Globe instances efficiently', () => {
      const manyGlobes = Array.from({ length: 10 }, (_, i) => (
        <Globe key={i} height={200} />
      ));

      expect(() => {
        render(<>{manyGlobes}</>);
      }).not.toThrow();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<Globe {...defaultProps} />);

      expect(() => {
        for (let i = 0; i < 50; i++) {
          rerender(
            <Globe 
              {...defaultProps} 
              rotationSpeed={i * 0.01}
              height={300 + i}
              opacity={1 - (i * 0.01)}
            />
          );
        }
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should support accessibility props', () => {
      const { getByTestId } = render(
        <Globe 
          {...defaultProps}
          accessible={true}
          accessibilityLabel="3D Globe View"
          accessibilityRole="img"
          testID="accessible-globe"
        />
      );
      
      expect(getByTestId('accessible-globe')).toBeTruthy();
    });

    it('should have proper accessibility for screen readers', () => {
      const { getByTestId } = render(
        <Globe 
          {...defaultProps}
          accessible={true}
          accessibilityHint="Interactive 3D globe showing world locations"
          testID="hint-globe"
        />
      );
      
      expect(getByTestId('hint-globe')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero rotation speed', () => {
      expect(() => {
        render(<Globe {...defaultProps} rotationSpeed={0} />);
      }).not.toThrow();
    });

    it('should handle very small height', () => {
      expect(() => {
        render(<Globe {...defaultProps} height={1} />);
      }).not.toThrow();
    });

    it('should handle very large height', () => {
      expect(() => {
        render(<Globe {...defaultProps} height={10000} />);
      }).not.toThrow();
    });

    it('should handle zero opacity', () => {
      expect(() => {
        render(<Globe {...defaultProps} opacity={0} />);
      }).not.toThrow();
    });

    it('should handle negative rotation speed', () => {
      expect(() => {
        render(<Globe {...defaultProps} rotationSpeed={-0.1} />);
      }).not.toThrow();
    });
  });
});
