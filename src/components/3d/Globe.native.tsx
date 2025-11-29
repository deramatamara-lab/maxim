import React, {
  ForwardedRef,
  Suspense,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  Color,
  Mesh,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';

import { ds } from '../../constants/theme';
import {
  GLOBE_VERTEX_SHADER,
  GLOBE_FRAGMENT_SHADER,
  ATMOSPHERE_VERTEX_SHADER,
  ATMOSPHERE_FRAGMENT_SHADER,
  AURORA_VERTEX_SHADER,
  AURORA_FRAGMENT_SHADER,
} from './Globe.shaders';

const STAR_COUNT = 1600;

const latLonToVector = (lat: number, lon: number, radius = 3): Vector3 => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new Vector3(-x, y, z);
};

interface GlobeSurfaceProps {
  rotationSpeed: number;
}

const GlobeSurface = ({ rotationSpeed }: GlobeSurfaceProps) => {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const sphereArgs = useMemo<[number, number, number]>(() => [1, 48, 48], []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          baseColor: { value: new Color(ds.colors.background) },
          highlightColor: { value: new Color(ds.colors.primary) },
          accentColor: { value: new Color(ds.colors.secondary) },
        },
        vertexShader: GLOBE_VERTEX_SHADER,
        fragmentShader: GLOBE_FRAGMENT_SHADER,
        transparent: false,
      }),
    []
  );

  // GPU resource disposal - prevent memory leaks
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.05}>
      <sphereGeometry args={sphereArgs} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  );
};

const Atmosphere = () => {
  const sphereArgs = useMemo<[number, number, number]>(() => [1.16, 48, 48], []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          glowColor: { value: new Color(ds.colors.glowCyan) },
        },
        vertexShader: ATMOSPHERE_VERTEX_SHADER,
        fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
        blending: AdditiveBlending,
        side: BackSide,
        transparent: true,
      }),
    []
  );

  // GPU resource disposal - prevent memory leaks
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh scale={1.35}>
      <sphereGeometry args={sphereArgs} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Aurora = () => {
  const sphereArgs = useMemo<[number, number, number]>(() => [1.24, 48, 48], []);
  const materialRef = useRef<ShaderMaterial>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          primaryColor: { value: new Color(ds.colors.primary) },
          secondaryColor: { value: new Color(ds.colors.secondary) },
        },
        vertexShader: AURORA_VERTEX_SHADER,
        fragmentShader: AURORA_FRAGMENT_SHADER,
        blending: AdditiveBlending,
        side: BackSide,
        transparent: true,
      }),
    []
  );

  // GPU resource disposal - prevent memory leaks
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh scale={1.32}>
      <sphereGeometry args={sphereArgs} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  );
};

const Starfield = () => {
  const positions = useMemo(() => {
    const data = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i += 1) {
      const radius = 7 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      const index = i * 3;
      data[index] = x;
      data[index + 1] = y;
      data[index + 2] = z;
    }
    return new BufferAttribute(data, 3);
  }, []);

  // GPU resource disposal - prevent memory leaks
  useEffect(() => {
    return () => {
      positions.array = null as unknown as Float32Array;
    };
  }, [positions]);

  // Memoize Color to prevent object churn
  const starColor = useMemo(() => new Color(ds.colors.textPrimary), []);
  const pointsRef = useRef<Points>(null);
  
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.012;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <primitive attach="attributes-position" object={positions} />
      </bufferGeometry>
      <pointsMaterial
        color={starColor}
        size={0.045}
        sizeAttenuation
        opacity={0.32}
        transparent
      />
    </points>
  );
};

/**
 * Performance monitoring data for Globe component
 */
export interface GlobePerformanceSample {
  /** Frames per second */
  fps: number;
  /** Frame time in milliseconds */
  frameTimeMs: number;
  /** JavaScript heap size in bytes (optional, V8-specific) */
  heapSizeBytes?: number;
  /** Timestamp in seconds */
  timestamp: number;
}

const PerformanceSampler = ({
  onSample,
  samplePeriod = 0.75,
}: {
  onSample?: (sample: GlobePerformanceSample) => void;
  samplePeriod?: number;
}) => {
  const accumulatorRef = useRef({ frames: 0, totalDelta: 0 });
  const lastEmitTimeRef = useRef(0);

  useFrame((state, delta) => {
    if (!onSample) {
      return;
    }

    const elapsed = state.clock.elapsedTime;
    const accumulator = accumulatorRef.current;
    accumulator.frames += 1;
    accumulator.totalDelta += delta;

    if (elapsed - lastEmitTimeRef.current < samplePeriod) {
      return;
    }

    const averageDelta = accumulator.totalDelta / Math.max(accumulator.frames, 1);
    const fps = averageDelta > 0 ? 1 / averageDelta : 0;
    const frameTimeMs = averageDelta * 1000;
    const performanceObj =
      typeof globalThis !== 'undefined'
        ? (globalThis.performance as Performance & { memory?: { usedJSHeapSize: number } })
        : undefined;
    const memoryInfo = performanceObj?.memory;

    // Freeze sample object to prevent accidental mutation
    onSample(Object.freeze({
      fps,
      frameTimeMs,
      heapSizeBytes: memoryInfo?.usedJSHeapSize,
      timestamp: elapsed,
    }));

    accumulatorRef.current = { frames: 0, totalDelta: 0 };
    lastEmitTimeRef.current = elapsed;
  });

  return null;
};

/**
 * Enhanced zoom controller with interruptible animations and configurable duration
 */
const ZoomController = ({
  targetRef,
  onZoomComplete,
  onZoomStart,
  durationMs = 2400,
}: {
  targetRef: React.MutableRefObject<Vector3 | null>;
  onZoomComplete?: () => void;
  onZoomStart?: () => void;
  durationMs?: number;
}) => {
  const { camera } = useThree();
  const hasStartedRef = useRef(false);
  const startTimeRef = useRef(0);
  const startPosRef = useRef(new Vector3());
  const endPosRef = useRef<Vector3 | null>(null);

  useFrame((state) => {
    if (!targetRef.current) {
      hasStartedRef.current = false;
      endPosRef.current = null;
      return;
    }

    // Allow interruptible zoom - restart if target changes
    if (!hasStartedRef.current || !targetRef.current.equals(endPosRef.current ?? new Vector3(1,1,1))) {
      hasStartedRef.current = true;
      startTimeRef.current = state.clock.elapsedTime;
      startPosRef.current.copy(camera.position);
      endPosRef.current = targetRef.current.clone();
      onZoomStart?.();
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const duration = durationMs / 1000;
    const t = Math.min(elapsed / duration, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.lerpVectors(startPosRef.current, targetRef.current, eased);
    camera.lookAt(0, 0, 0);

    if (t >= 1) {
      targetRef.current = null;
      endPosRef.current = null;
      onZoomComplete?.();
    }
  });

  return null;
};

/**
 * Globe component imperative handle for external control
 */
export interface GlobeHandle {
  /**
   * Zoom to a specific geographic location
   * @param input - Location coordinates and optional zoom radius
   */
  zoomToLocation: (input: { lat: number; lon: number; radius?: number }) => void;
  /**
   * Cancel any ongoing zoom animation
   */
  cancelZoom?: () => void;
}

/**
 * Globe component props
 */
export interface GlobeProps {
  /** Height of the Globe component in pixels */
  height?: number;
  /** Rotation speed multiplier */
  rotationSpeed?: number;
  /** Callback when zoom animation completes */
  onZoomComplete?: () => void;
  /** Callback when zoom animation starts */
  onZoomStart?: () => void;
  /** Global opacity for the component */
  opacity?: number;
  /** Performance monitoring callback */
  onPerformanceSample?: (sample: GlobePerformanceSample) => void;
  /** Performance sample period in seconds */
  samplePeriod?: number;
  /** Zoom animation duration in milliseconds */
  zoomDurationMs?: number;
}

const GlobeComponent = (
  {
    height = 320,
    rotationSpeed = 0.09,
    onZoomComplete,
    onZoomStart,
    opacity = 1,
    onPerformanceSample,
    samplePeriod = 0.75,
    zoomDurationMs = 2400,
  }: GlobeProps,
  ref: ForwardedRef<GlobeHandle>
) => {
  const zoomTarget = useRef<Vector3 | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      zoomToLocation: ({ lat, lon, radius = 2.35 }) => {
        // Validate and clamp lat/lon inputs
        const clampedLat = Math.max(-90, Math.min(90, lat));
        const clampedLon = ((lon % 360) + 360) % 360; // Normalize to 0-360
        const clampedRadius = Math.max(1.5, Math.min(4, radius));
        
        zoomTarget.current = latLonToVector(clampedLat, clampedLon, clampedRadius);
      },
      cancelZoom: () => {
        zoomTarget.current = null;
      },
    }),
    []
  );

  return (
    <View pointerEvents="none" style={[styles.wrapper, { height, opacity }]}>
      <Canvas 
        camera={{ position: [0, 0, 3.6], fov: 42 }}
        gl={{ antialias: false }}      // MSAA is expensive on mobile
        frameloop="always"             // Keep 'always' since we animate every frame
      >
        <ambientLight intensity={0.18} />
        <directionalLight position={[12, 8, 8]} intensity={1.15} color={ds.colors.primary} />
        <directionalLight position={[-10, -6, -12]} intensity={0.35} color={ds.colors.secondary} />
        <Suspense fallback={null}>
          <Starfield />
          <GlobeSurface rotationSpeed={rotationSpeed} />
          <Atmosphere />
          <Aurora />
          <PerformanceSampler onSample={onPerformanceSample} samplePeriod={samplePeriod} />
        </Suspense>
        <ZoomController 
          targetRef={zoomTarget} 
          onZoomComplete={onZoomComplete} 
          onZoomStart={onZoomStart}
          durationMs={zoomDurationMs}
        />
      </Canvas>
    </View>
  );
};

export const Globe = forwardRef<GlobeHandle, GlobeProps>(GlobeComponent);

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
});
