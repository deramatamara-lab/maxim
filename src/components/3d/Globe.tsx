import { Platform, View } from 'react-native';
import React, { forwardRef } from 'react';

// Re-export types for TypeScript resolution
export interface GlobeHandle {
  zoomToLocation: (coords: { lat: number; lon: number }) => void;
}

export interface GlobePerformanceSample {
  fps: number;
  frameTimeMs: number;
  jsHeapMb?: number;
}

export interface GlobeProps {
  height?: number;
  width?: number;
  opacity?: number;
  onZoomComplete?: () => void;
  onPerformanceSample?: (sample: GlobePerformanceSample) => void;
}

// Platform-specific component loading
let GlobeComponent: React.ForwardRefExoticComponent<GlobeProps & React.RefAttributes<GlobeHandle>>;

if (Platform.OS === 'web') {
  // Web stub - avoids bundling heavy 3D dependencies
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Globe: WebGlobe } = require('./Globe.web');
  GlobeComponent = forwardRef<GlobeHandle, GlobeProps>((props, ref) => {
    return <WebGlobe {...props} />;
  });
} else {
  // Native full 3D implementation
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Globe: NativeGlobe } = require('./Globe.native');
  GlobeComponent = NativeGlobe;
}

export const Globe = GlobeComponent;