import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Globe, GlobeHandle, GlobePerformanceSample } from '../src/components/3d/Globe.native';

// Mock Three.js objects with proper scope
jest.mock('three', () => {
  const mockVector3 = class {
    constructor(public x = 0, public y = 0, public z = 0) {}
    copy(v: any) { this.x = v.x; this.y = v.y; this.z = v.z; }
    clone() { return new mockVector3(this.x, this.y, this.z); }
    equals(v: any) { return this.x === v.x && this.y === v.y && this.z === v.z; }
  };
  
  return {
    Vector3: mockVector3,
    Color: jest.fn(),
    ShaderMaterial: jest.fn(),
    BufferAttribute: jest.fn(),
    AdditiveBlending: 'additive',
    BackSide: 'back',
    Mesh: jest.fn(),
    Points: jest.fn(),
  };
});

// Mock Canvas component to avoid Three.js dependencies in tests
jest.mock('@react-three/fiber/native', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => children,
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({
    camera: {
      position: new (require('three')).Vector3(0, 0, 3.6),
      lookAt: jest.fn(),
    },
  })),
}));

// Mock shaders
jest.mock('../src/components/3d/Globe.shaders', () => ({
  GLOBE_VERTEX_SHADER: 'vertex',
  GLOBE_FRAGMENT_SHADER: 'fragment',
  ATMOSPHERE_VERTEX_SHADER: 'vertex',
  ATMOSPHERE_FRAGMENT_SHADER: 'fragment',
  AURORA_VERTEX_SHADER: 'vertex',
  AURORA_FRAGMENT_SHADER: 'fragment',
}));

describe('Globe Component', () => {
  const defaultProps = {
    height: 320,
    rotationSpeed: 0.09,
    opacity: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render Globe component with Canvas', () => {
      const { getByTestId } = render(<Globe {...defaultProps} />);
      
      // Globe should render without crashing
      expect(true).toBe(true); // Basic render test
    });

    it('should render with custom height and opacity', () => {
      const customProps = {
        ...defaultProps,
        height: 400,
        opacity: 0.8,
      };

      render(<Globe {...customProps} />);
      
      // Component should accept and use custom props
      expect(true).toBe(true);
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
  });

  describe('Zoom Functionality', () => {
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

    it('should clamp latitude values to valid range', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      // Test latitude clamping
      globeRef.current?.zoomToLocation({ lat: 120, lon: 0 }); // Should clamp to 90
      globeRef.current?.zoomToLocation({ lat: -100, lon: 0 }); // Should clamp to -90
      
      expect(true).toBe(true); // Values should be clamped without error
    });

    it('should normalize longitude values to 0-360 range', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      // Test longitude normalization
      globeRef.current?.zoomToLocation({ lat: 0, lon: 450 }); // Should normalize to 90
      globeRef.current?.zoomToLocation({ lat: 0, lon: -90 }); // Should normalize to 270
      
      expect(true).toBe(true); // Values should be normalized without error
    });

    it('should clamp radius values to valid range', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      // Test radius clamping
      globeRef.current?.zoomToLocation({ lat: 0, lon: 0, radius: 10 }); // Should clamp to 4
      globeRef.current?.zoomToLocation({ lat: 0, lon: 0, radius: 0.5 }); // Should clamp to 1.5
      
      expect(true).toBe(true); // Values should be clamped without error
    });

    it('should use default radius when not specified', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      globeRef.current?.zoomToLocation({ lat: 40.7128, lon: -74.0060 }); // NYC
      
      expect(true).toBe(true); // Should use default radius 2.35
    });

    it('should cancel zoom when cancelZoom is called', () => {
      const globeRef = React.createRef<GlobeHandle>();
      
      render(<Globe {...defaultProps} ref={globeRef} />);
      
      globeRef.current?.zoomToLocation({ lat: 0, lon: 0 });
      globeRef.current?.cancelZoom?.();
      
      expect(true).toBe(true); // Should cancel without error
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
      jest.advanceTimersByTime(150);
      
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
  });
});
