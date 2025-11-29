import { Platform } from 'react-native';
import { Globe as NativeGlobe, type GlobeHandle as NativeGlobeHandle, type GlobePerformanceSample } from './Globe.native';
import { Globe as WebGlobe, type GlobeHandle as WebGlobeHandle } from './Globe.web';

// Re-export types for TypeScript resolution
export type GlobeHandle = NativeGlobeHandle & WebGlobeHandle;
export type { GlobePerformanceSample };

// Platform-specific component export
export const Globe = Platform.select({
  native: NativeGlobe,
  default: WebGlobe,
}) as typeof NativeGlobe | typeof WebGlobe;