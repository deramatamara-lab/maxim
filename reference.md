'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
  memo,
  type CSSProperties,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

//================================================================
// CONFIGURATION & DESIGN SYSTEM
//================================================================

const MAPTILER_API_KEY = 'YOUR_MAPTILER_API_KEY_HERE';

const ds = {
  colors: {
    primary: 'rgba(0, 245, 255, 1)',
    secondary: 'rgba(0, 255, 115, 1)',
    background: '#0A0A0A',
    surface: 'rgba(22, 22, 22, 0.65)',
    glass: 'rgba(35, 35, 35, 0.7)',
    text: '#EAEAEA',
    textSecondary: 'rgba(234, 234, 234, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)',
    error: '#EF4444',
  },
  fonts: {
    main: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  shadows: {
    soft: '0 8px 32px rgba(0, 0, 0, 0.7)',
    glow: '0 0 25px rgba(0, 245, 255, 0.4)',
  },
  blur: {
    light: 'blur(12px)',
    medium: 'blur(24px)',
    heavy: 'blur(40px)',
    ultra: 'blur(60px)',
  },
  transitions: {
    spring: { type: 'spring', stiffness: 400, damping: 25, mass: 0.8 },
    springBouncy: { type: 'spring', stiffness: 300, damping: 20, mass: 0.6 },
    smooth: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
    snappy: { duration: 0.25, ease: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number] },
    ultraSmooth: { duration: 0.6, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] },
  },
} as const;

const APP_STATES = {
  LOADING_SCRIPTS: 'LOADING_SCRIPTS',
  IDLE: 'IDLE',
  GEOCODING: 'GEOCODING',
  ZOOMING: 'ZOOMING',
  MAP_VIEW: 'MAP_VIEW',
  RIDE_SELECTION: 'RIDE_SELECTION',
  ERROR: 'ERROR',
} as const;

type AppStatus = (typeof APP_STATES)[keyof typeof APP_STATES];

const SCREENS = {
  HOME: 'home',
  DISCOVER: 'discover',
  ACTIVITY: 'activity',
  PROFILE: 'profile',
} as const;

type AppScreen = (typeof SCREENS)[keyof typeof SCREENS];

const EXTERNAL_SCRIPTS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/gsap.min.js',
  'https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.js',
] as const;

//================================================================
// TYPES
//================================================================

interface Coords {
  lat: number;
  lon: number;
}

interface RiderState {
  appState: AppStatus;
  activeScreen: AppScreen;
  destination: string | null;
  coords: Coords | null;
  errorMsg: string | null;
}

type Action =
  | { type: 'SCRIPTS_READY' }
  | { type: 'SCRIPTS_ERROR'; payload: string }
  | { type: 'NAVIGATE'; payload: AppScreen }
  | { type: 'START_GEOCODING'; payload: string }
  | { type: 'GEOCODING_SUCCESS'; payload: Coords }
  | { type: 'GEOCODING_FAILED'; payload: string }
  | { type: 'ZOOM_COMPLETE' }
  | { type: 'MAP_LOADED' };

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface GlobeHandle {
  zoom: (lat: number, lon: number, onComplete?: () => void) => void;
}

interface GlobeProps {
  scriptsReady: boolean;
}

interface DetailedMapProps {
  lat: number;
  lon: number;
  onMapLoad?: () => void;
}

interface IconProps {
  name: 'home' | 'compass' | 'activity' | 'user' | 'settings';
  size?: number;
  color?: string;
}

interface HomeScreenProps {
  onSearch: (destination: string) => void;
  isGeocoding: boolean;
  errorMsg: string | null;
}

interface PlaceholderScreenProps {
  title: string;
}

interface NavBarProps {
  activeScreen: AppScreen;
  onNavClick: (screen: AppScreen) => void;
}

//================================================================
// ERROR BOUNDARY
//================================================================

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: ds.colors.background,
            color: ds.colors.error,
            textAlign: 'center',
            padding: '20px',
            fontFamily: ds.fonts.main,
          }}
        >
          Something went wrong.
          <br />
          Please refresh the app.
        </div>
      );
    }
    return this.props.children;
  }
}

//================================================================
// UTILITY HOOKS
//================================================================

const useScriptLoader = (
  scriptUrls: readonly string[],
): { scriptsReady: boolean; scriptsError: string | null } => {
  const [scriptsReady, setScriptsReady] = useState(false);
  const [scriptsError, setScriptsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let scriptsLoaded = 0;
    const createdScripts: HTMLScriptElement[] = [];

    const onScriptLoad = () => {
      if (cancelled) return;
      scriptsLoaded += 1;
      if (scriptsLoaded === scriptUrls.length) {
        setScriptsReady(true);
      }
    };

    const onScriptError = (src: string) => {
      if (cancelled) return;
      // eslint-disable-next-line no-console
      console.error(`Failed to load script: ${src}`);
      setScriptsError(
        'Failed to load a required resource. Please check your connection and refresh.',
      );
    };

    scriptUrls.forEach((src) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
      if (existing) {
        // Assume already loaded or being loaded; count it as loaded for simplicity.
        scriptsLoaded += 1;
        if (scriptsLoaded === scriptUrls.length) {
          setScriptsReady(true);
        }
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = onScriptLoad;
      script.onerror = () => onScriptError(src);
      document.body.appendChild(script);
      createdScripts.push(script);
    });

    return () => {
      cancelled = true;
      createdScripts.forEach((script) => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      });
    };
  }, [scriptUrls]);

  return { scriptsReady, scriptsError };
};

const SOUND_PROFILES = {
  click: { f: 800, d: 80, t: 'sine' as OscillatorType },
  transition: { f: 600, d: 150, t: 'sine' as OscillatorType },
  success: { f: 1200, d: 200, t: 'sine' as OscillatorType },
  booking: { f: 1000, d: 250, t: 'triangle' as OscillatorType },
  error: { f: 200, d: 300, t: 'sawtooth' as OscillatorType },
} as const;

type SoundType = keyof typeof SOUND_PROFILES;

type HapticType = 'light' | 'medium' | 'success' | 'booking' | 'error';

const useFeedback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: SoundType) => {
    try {
      if (typeof window === 'undefined') return;

      if (!audioContextRef.current) {
        const AC =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AC();
      }

      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      const profile = SOUND_PROFILES[type] ?? SOUND_PROFILES.click;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = profile.t;
      oscillator.frequency.setValueAtTime(profile.f, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + profile.d / 1000,
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + profile.d / 1000);
    } catch {
      // eslint-disable-next-line no-console
      console.log('Sound playback failed; falling back silently.');
    }
  }, []);

  const hapticFeedback = useCallback((type: HapticType = 'light') => {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

    const patterns: Record<HapticType, number[]> = {
      light: [10],
      medium: [30],
      success: [10, 50, 20],
      booking: [20, 40, 20],
      error: [50, 20, 50],
    };

    const pattern = patterns[type] ?? patterns.light;
    navigator.vibrate?.(pattern);
  }, []);

  return { playSound, hapticFeedback };
};

//================================================================
// SVG ICONS
//================================================================

const Icon = memo<IconProps>(({ name, size = 24, color = ds.colors.textSecondary }) => {
  const icons: Record<IconProps['name'], JSX.Element> = {
    home: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
    compass: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    user: (
      <>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    settings: (
      <path d="M12 6V4m0 16v-2m8-8h2M4 12H2m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414m12.728 0l-1.414 1.414M5.636 18.364l-1.414 1.414M12 18a6 6 0 100-12 6 6 0 000 12z" />
    ),
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
});
Icon.displayName = 'Icon';

//================================================================
// 3D GLOBE
//================================================================

const Globe = memo(
  React.forwardRef<GlobeHandle, GlobeProps>(({ scriptsReady }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      if (!scriptsReady || !canvasRef.current || typeof window === 'undefined') {
        return;
      }

      const THREE = (window as any).THREE;
      const gsap = (window as any).gsap;
      if (!THREE || !gsap) return;

      const container = canvasRef.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000,
      );
      camera.position.set(0, 0, 15);

      const renderer = new THREE.WebGLRenderer({
        canvas: container,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // Starfield
      const starGeometry = new THREE.BufferGeometry();
      const starCount = 4000; // reduced for perf, still dense
      const positions = new Float32Array(starCount * 3);

      for (let i = 0; i < starCount; i += 1) {
        const i3 = i * 3;
        const radius = 120 + Math.random() * 160;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
      }

      starGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3),
      );

      const starMaterial = new THREE.PointsMaterial({
        size: 0.35,
        transparent: true,
        opacity: 0.8,
      });
      const starField = new THREE.Points(starGeometry, starMaterial);
      scene.add(starField);

      const textureLoader = new THREE.TextureLoader();
      const earthDayTexture = textureLoader.load(
        'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
      );
      const earthNightTexture = textureLoader.load(
        'https://threejs.org/examples/textures/planets/earth_lights_2048.jpg',
      );
      const cloudTexture = textureLoader.load(
        'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
      );

      const earthMaterial = new THREE.ShaderMaterial({
        uniforms: {
          dayTexture: { value: earthDayTexture },
          nightTexture: { value: earthNightTexture },
          sunDirection: {
            value: new THREE.Vector3(1, 0, 0.5).normalize(),
          },
        },
        vertexShader:
          'varying vec2 vUv; varying vec3 vNormal; void main() { vUv = uv; vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader:
          'uniform sampler2D dayTexture; uniform sampler2D nightTexture; uniform vec3 sunDirection; varying vec2 vUv; varying vec3 vNormal; void main() { vec3 dayColor = texture2D(dayTexture, vUv).rgb; vec3 nightColor = texture2D(nightTexture, vUv).rgb; float NdotL = dot(vNormal, sunDirection); float dayNightMix = smoothstep(-0.1, 0.2, NdotL); vec3 color = mix(nightColor * 1.5, dayColor, dayNightMix); gl_FragColor = vec4(color, 1.0); }',
      });

      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(5, 64, 32),
        earthMaterial,
      );
      earth.rotation.y = Math.PI;
      scene.add(earth);

      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(5.05, 64, 32),
        new THREE.MeshStandardMaterial({
          map: cloudTexture,
          transparent: true,
          opacity: 0.25,
          blending: THREE.AdditiveBlending,
        }),
      );
      scene.add(clouds);

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(5.2, 64, 32),
        new THREE.ShaderMaterial({
          vertexShader:
            'varying vec3 vertexNormal; void main() { vertexNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader:
            'varying vec3 vertexNormal; void main() { float intensity = pow(0.5 - dot(vertexNormal, vec3(0, 0, 1.0)), 2.0); gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity; }',
          blending: (THREE as any).AdditiveBlending,
          side: THREE.BackSide,
        }),
      );
      scene.add(atmosphere);

      const locationMarker = new THREE.Group();
      const markerPin = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        new THREE.MeshBasicMaterial({ color: ds.colors.primary }),
      );
      const markerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.1, 0.12, 32),
        new THREE.MeshBasicMaterial({
          color: ds.colors.primary,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        }),
      );
      markerRing.rotation.x = Math.PI / 2;
      locationMarker.add(markerPin, markerRing);
      locationMarker.visible = false;
      scene.add(locationMarker);

      scene.add(new THREE.AmbientLight(0xffffff, 0.2));
      const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
      sunLight.position.set(15, 10, 5);
      scene.add(sunLight);

      let animationFrameId: number;

      const animate = () => {
        animationFrameId = window.requestAnimationFrame(animate);
        earth.rotation.y += 0.00022;
        clouds.rotation.y += 0.00026;
        if (locationMarker.visible) {
          markerRing.rotation.z += 0.02;
        }
        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!canvasRef.current) return;
        const { clientWidth, clientHeight } = canvasRef.current;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
      };

      window.addEventListener('resize', handleResize);

      const latLonToVector3 = (lat: number, lon: number, radius: number) => {
        const phi = ((90 - lat) * Math.PI) / 180;
        const theta = ((lon + 180) * Math.PI) / 180;
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
      };

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      const api: GlobeHandle = {
        zoom: (lat, lon, onComplete) => {
          const targetPosition = latLonToVector3(lat, lon, 8.5);
          const markerPosition = latLonToVector3(lat, lon, 5.1);

          locationMarker.position.copy(markerPosition);
          locationMarker.lookAt(earth.position);
          locationMarker.visible = true;

          if (prefersReducedMotion) {
            camera.position.copy(targetPosition);
            camera.lookAt(locationMarker.position);
            locationMarker.visible = false;
            onComplete?.();
            return;
          }

          gsap.fromTo(
            locationMarker.scale,
            { x: 0, y: 0, z: 0 },
            {
              x: 1,
              y: 1,
              z: 1,
              duration: 1,
              ease: 'back.out(1.7)',
            },
          );

          gsap.to(camera.position, {
            duration: 2.5,
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            ease: 'power3.inOut',
            onUpdate: () => camera.lookAt(locationMarker.position),
            onComplete: () => {
              gsap.to(locationMarker.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 0.5,
                ease: 'back.in(1.7)',
                onComplete: () => {
                  locationMarker.visible = false;
                  onComplete?.();
                },
              });
            },
          });
        },
      };

      if (ref) {
        if (typeof ref === 'function') {
          ref(api);
        } else {
          // eslint-disable-next-line no-param-reassign
          (ref as React.MutableRefObject<GlobeHandle | null>).current = api;
        }
      }

      return () => {
        window.cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);

        renderer.dispose();
        starGeometry.dispose();
        starMaterial.dispose();

        earthDayTexture.dispose();
        earthNightTexture.dispose();
        cloudTexture.dispose();

        scene.traverse((object: any) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material: any) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      };
    }, [scriptsReady, ref]);

    return <canvas ref={canvasRef} style={styles.canvas} />;
  }),
);
Globe.displayName = 'Globe';

//================================================================
// MAP VIEW
//================================================================

const DetailedMap = memo<DetailedMapProps>(({ lat, lon, onMapLoad }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    const maplibre = (window as any).maplibregl;
    if (!maplibre) return;

    maplibre.workerUrl =
      'https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl-worker.js';

    const isApiKeyMissing = MAPTILER_API_KEY === 'YOUR_MAPTILER_API_KEY_HERE';

    let mapStyle: any;
    if (isApiKeyMissing) {
      // eslint-disable-next-line no-console
      console.warn(
        'MapTiler API key is missing. Using fallback 2D map. For 3D buildings, provide an API key.',
      );
      mapStyle = {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
          },
        ],
      } as const;
    } else {
      mapStyle = `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_API_KEY}`;
    }

    const map = new maplibre.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [lon, lat],
      zoom: 15,
      pitch: 60,
      bearing: -30,
      antialias: true,
    });

    map.on('load', () => {
      if (!isApiKeyMissing) {
        map.addLayer({
          id: '3d-buildings',
          source: 'openmaptiles',
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': 'rgba(20, 20, 20, 0.8)',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['get', 'height'],
              0,
              0,
              10,
              10,
              50,
              50,
              100,
              100,
            ],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.9,
          },
        });
      }

      onMapLoad?.();
    });

    return () => {
      map.remove();
    };
  }, [lat, lon, onMapLoad]);

  return <div ref={mapContainerRef} style={styles.canvas} />;
});
DetailedMap.displayName = 'DetailedMap';

//================================================================
// UI COMPONENTS
//================================================================

const uiAnimationProps = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
  transition: { duration: 0.5, ease: 'easeInOut' as const },
};

const LoadingScreen: React.FC = () => (
  <div style={styles.loadingContainer}>
    <motion.div
      style={styles.loadingIndicator}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
    <p>Initializing Aura...</p>
  </div>
);

const Header: React.FC<{ name: string }> = memo(({ name }) => (
  <header style={styles.header}>
    <div style={styles.headerContent}>
      <motion.p
        style={styles.headerLabel}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Welcome Back
      </motion.p>
      <motion.p
        style={styles.headerText}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {name}
      </motion.p>
    </div>
    <motion.button
      type="button"
      style={styles.headerButton}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label="Open settings"
    >
      <Icon name="settings" />
    </motion.button>
  </header>
));
Header.displayName = 'Header';

const HomeScreen: React.FC<HomeScreenProps> = ({
  onSearch,
  isGeocoding,
  errorMsg,
}) => {
  const [destination, setDestination] = useState('');

  return (
    <motion.div style={styles.contentWrapper} {...uiAnimationProps}>
      <Header name="Sarah Johnson" />
      <main style={styles.mainContent}>
        <motion.div
          style={styles.inputPanel}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        >
          <input
            type="text"
            placeholder="Your current location"
            style={styles.destinationField}
            aria-label="Current location"
          />
          <div
            style={{
              height: '1px',
              background: ds.colors.border,
              margin: '10px 0',
            }}
          />
          <input
            type="text"
            placeholder="Where to?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            style={styles.destinationField}
            aria-label="Destination"
          />
        </motion.div>
        {errorMsg && <p style={styles.errorText}>{errorMsg}</p>}
        <motion.button
          type="button"
          style={{
            ...styles.button,
            ...((!destination || isGeocoding) ? styles.buttonDisabled : {}),
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          whileHover={{ scale: 1.02, boxShadow: ds.shadows.glow }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSearch(destination)}
          disabled={!destination || isGeocoding}
        >
          {isGeocoding ? 'Locating...' : 'Confirm Destination'}
        </motion.button>
      </main>
    </motion.div>
  );
};

const RideSelectionScreen: React.FC = () => {
  const rideTypes = [
    {
      id: 'standard',
      name: 'Aura Standard',
      eta: '5 min away',
      price: '$12.50',
      icon: '🚗',
    },
    {
      id: 'premium',
      name: 'Aura Premium',
      eta: '8 min away',
      price: '$22.00',
      icon: '🚘',
    },
    {
      id: 'xl',
      name: 'Aura XL',
      eta: '7 min away',
      price: '$18.75',
      icon: '🚙',
    },
  ] as const;

  const [selected, setSelected] = useState<(typeof rideTypes)[number]['id']>(
    'standard',
  );
  const { playSound, hapticFeedback } = useFeedback();

  const handleRequestRide = () => {
    playSound('booking');
    hapticFeedback('booking');
    // Future: transition to "finding driver" state
  };

  return (
    <motion.div
      style={{
        ...styles.contentWrapper,
        background: 'transparent',
        justifyContent: 'flex-end',
      }}
      {...uiAnimationProps}
    >
      <main style={styles.mainContent}>
        <motion.div
          style={styles.rideOptionsPanel}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h3 style={styles.rideOptionsHeader}>Choose your ride</h3>
          {rideTypes.map((ride) => (
            <motion.div
              key={ride.id}
              style={{
                ...styles.rideCard,
                ...(selected === ride.id ? styles.rideCardSelected : {}),
              }}
              onClick={() => setSelected(ride.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              layout
              role="button"
              aria-pressed={selected === ride.id}
            >
              <div style={{ fontSize: '32px' }}>{ride.icon}</div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontWeight: 600,
                    color: ds.colors.text,
                    margin: 0,
                  }}
                >
                  {ride.name}
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    color: ds.colors.textSecondary,
                    margin: 0,
                  }}
                >
                  {ride.eta}
                </p>
              </div>
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: ds.colors.text,
                  margin: 0,
                }}
              >
                {ride.price}
              </p>
            </motion.div>
          ))}
          <motion.button
            type="button"
            style={{ ...styles.button, marginTop: '20px' }}
            whileHover={{ scale: 1.02, boxShadow: ds.shadows.glow }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRequestRide}
          >
            Request {rideTypes.find((r) => r.id === selected)?.name}
          </motion.button>
        </motion.div>
      </main>
    </motion.div>
  );
};

const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ title }) => (
  <motion.div style={styles.contentWrapper} {...uiAnimationProps}>
    <Header name={title} />
    <main style={{ ...styles.mainContent, justifyContent: 'center' }}>
      <p style={{ textAlign: 'center', color: ds.colors.textSecondary }}>
        {title} screen coming soon.
      </p>
    </main>
  </motion.div>
);

const NavBar: React.FC<NavBarProps> = memo(({ activeScreen, onNavClick }) => {
  const navItems: { id: AppScreen; icon: IconProps['name'] }[] = [
    { id: SCREENS.HOME, icon: 'home' },
    { id: SCREENS.DISCOVER, icon: 'compass' },
    { id: SCREENS.ACTIVITY, icon: 'activity' },
    { id: SCREENS.PROFILE, icon: 'user' },
  ];

  return (
    <nav style={styles.navBar} aria-label="Main navigation">
      {navItems.map((item) => (
        <motion.button
          key={item.id}
          type="button"
          onClick={() => onNavClick(item.id)}
          style={styles.navButton}
          aria-label={item.id}
        >
          {activeScreen === item.id && (
            <motion.div
              style={styles.navActiveIndicator}
              layoutId="activeIndicator"
            />
          )}
          <Icon
            name={item.icon}
            color={
              activeScreen === item.id
                ? ds.colors.text
                : ds.colors.textSecondary
            }
          />
        </motion.button>
      ))}
    </nav>
  );
});
NavBar.displayName = 'NavBar';

//================================================================
// STATE MANAGEMENT
//================================================================

const initialState: RiderState = {
  appState: APP_STATES.LOADING_SCRIPTS,
  activeScreen: SCREENS.HOME,
  destination: null,
  coords: null,
  errorMsg: null,
};

const appReducer = (state: RiderState, action: Action): RiderState => {
  switch (action.type) {
    case 'SCRIPTS_READY':
      return { ...state, appState: APP_STATES.IDLE };
    case 'SCRIPTS_ERROR':
      return { ...state, appState: APP_STATES.ERROR, errorMsg: action.payload };
    case 'NAVIGATE':
      return {
        ...initialState,
        appState: APP_STATES.IDLE,
        activeScreen: action.payload,
      };
    case 'START_GEOCODING':
      return {
        ...state,
        appState: APP_STATES.GEOCODING,
        destination: action.payload,
        errorMsg: null,
      };
    case 'GEOCODING_SUCCESS':
      return {
        ...state,
        appState: APP_STATES.ZOOMING,
        coords: action.payload,
      };
    case 'GEOCODING_FAILED':
      return {
        ...state,
        appState: APP_STATES.IDLE,
        errorMsg: action.payload,
      };
    case 'ZOOM_COMPLETE':
      return { ...state, appState: APP_STATES.MAP_VIEW };
    case 'MAP_LOADED':
      return { ...state, appState: APP_STATES.RIDE_SELECTION };
    default:
      return state;
  }
};

//================================================================
// MAIN APP COMPONENT
//================================================================

const RiderApp: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { appState, activeScreen, coords, errorMsg } = state;

  const globeRef = useRef<GlobeHandle | null>(null);
  const { playSound, hapticFeedback } = useFeedback();

  const { scriptsReady, scriptsError } = useScriptLoader(EXTERNAL_SCRIPTS);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.title = 'Aura Ride';

    const fontLink = document.createElement('link');
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';

    const cssLink = document.createElement('link');
    cssLink.href = 'https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.css';
    cssLink.rel = 'stylesheet';

    document.head.appendChild(fontLink);
    document.head.appendChild(cssLink);

    return () => {
      if (document.head.contains(fontLink)) document.head.removeChild(fontLink);
      if (document.head.contains(cssLink)) document.head.removeChild(cssLink);
    };
  }, []);

  useEffect(() => {
    if (scriptsError) {
      dispatch({ type: 'SCRIPTS_ERROR', payload: scriptsError });
    } else if (scriptsReady) {
      dispatch({ type: 'SCRIPTS_READY' });
    }
  }, [scriptsReady, scriptsError]);

  const handleSearch = useCallback(
    async (destination: string) => {
      if (!destination) return;

      dispatch({ type: 'START_GEOCODING', payload: destination });
      hapticFeedback('medium');
      playSound('click');

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          destination,
        )}&limit=1`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'AuraRideDemo/1.0 (+https://example.com)',
          },
        });

        if (!res.ok) throw new Error('Geocoding service failed.');

        const data: Array<{ lat: string; lon: string }> = await res.json();
        if (!data || data.length === 0) throw new Error('Address not found.');

        const coords: Coords = {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        };

        dispatch({ type: 'GEOCODING_SUCCESS', payload: coords });

        globeRef.current?.zoom(coords.lat, coords.lon, () => {
          dispatch({ type: 'ZOOM_COMPLETE' });
          playSound('transition');
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error.';
        dispatch({ type: 'GEOCODING_FAILED', payload: message });
        playSound('error');
        hapticFeedback('error');
      }
    },
    [hapticFeedback, playSound],
  );

  const handleMapLoad = useCallback(() => {
    window.setTimeout(() => dispatch({ type: 'MAP_LOADED' }), 400);
  }, []);

  const handleNavClick = useCallback(
    (screen: AppScreen) => {
      playSound('click');
      hapticFeedback('light');
      dispatch({ type: 'NAVIGATE', payload: screen });
    },
    [playSound, hapticFeedback],
  );

  const renderScreenContent = () => {
    switch (activeScreen) {
      case SCREENS.HOME:
        return (
          <HomeScreen
            onSearch={handleSearch}
            isGeocoding={appState === APP_STATES.GEOCODING}
            errorMsg={errorMsg}
          />
        );
      case SCREENS.DISCOVER:
        return <PlaceholderScreen title="Discover" />;
      case SCREENS.ACTIVITY:
        return <PlaceholderScreen title="Activity" />;
      case SCREENS.PROFILE:
        return <PlaceholderScreen title="Profile" />;
      default:
        return (
          <HomeScreen
            onSearch={handleSearch}
            isGeocoding={appState === APP_STATES.GEOCODING}
            errorMsg={errorMsg}
          />
        );
    }
  };

  if (appState === APP_STATES.LOADING_SCRIPTS) {
    return (
      <div style={styles.body}>
        <div style={styles.appContainer}>
          <LoadingScreen />
        </div>
      </div>
    );
  }

  if (appState === APP_STATES.ERROR) {
    return (
      <div style={styles.body}>
        <div style={styles.appContainer}>
          <div style={styles.errorOverlay}>{state.errorMsg}</div>
        </div>
      </div>
    );
  }

  const showGlobe = [
    APP_STATES.IDLE,
    APP_STATES.GEOCODING,
    APP_STATES.ZOOMING,
  ].includes(appState);

  const showMap = [APP_STATES.MAP_VIEW, APP_STATES.RIDE_SELECTION].includes(
    appState,
  );

  return (
    <ErrorBoundary>
      <div style={styles.body}>
        <div style={styles.appContainer}>
          <div style={styles.noiseOverlay} />

          <AnimatePresence>
            {showGlobe && (
              <motion.div
                key="globe"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <Globe scriptsReady={scriptsReady} ref={globeRef} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showMap && coords && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <DetailedMap
                  lat={coords.lat}
                  lon={coords.lon}
                  onMapLoad={handleMapLoad}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div
            style={{
              position: 'relative',
              zIndex: 10,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {renderScreenContent()}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {appState === APP_STATES.RIDE_SELECTION && <RideSelectionScreen />}
            </AnimatePresence>
          </div>

          <NavBar activeScreen={activeScreen} onNavClick={handleNavClick} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

//================================================================
// STYLES
//================================================================

const styles: Record<string, CSSProperties> = {
  body: {
    backgroundColor: ds.colors.background,
    color: ds.colors.text,
    fontFamily: ds.fonts.main,
    margin: 0,
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    overflow: 'hidden',
  },
  appContainer: {
    width: '375px',
    height: '812px',
    backgroundColor: '#111',
    borderRadius: '40px',
    boxShadow: '0 0 50px rgba(0,0,0,0.8)',
    overflow: 'hidden',
    position: 'relative',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  noiseOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'url(https://media.sidefx.com/uploads/post/thumbnail/236/noise.jpg)',
    backgroundSize: '150px',
    opacity: 0.03,
    pointerEvents: 'none',
    zIndex: 1,
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
    height: '100%',
  },
  mainContent: {
    flex: 1,
    padding: '0 20px 120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  header: {
    padding: '40px 20px 20px',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {},
  headerLabel: {
    fontSize: '16px',
    color: ds.colors.textSecondary,
    margin: 0,
  },
  headerText: {
    fontSize: '28px',
    fontWeight: 600,
    color: ds.colors.text,
    lineHeight: 1.2,
    margin: 0,
  },
  headerButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    color: ds.colors.textSecondary,
  },
  inputPanel: {
    background: ds.colors.surface,
    border: `1px solid ${ds.colors.border}`,
    borderRadius: '20px',
    padding: '10px',
    marginBottom: '20px',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    boxShadow: ds.shadows.soft,
  },
  destinationField: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: '15px',
    color: ds.colors.text,
    fontSize: '16px',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '18px',
    border: 'none',
    borderRadius: '15px',
    background: `linear-gradient(90deg, ${ds.colors.primary}, ${ds.colors.secondary})`,
    color: '#0A0A0A',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 5px 20px rgba(0, 245, 255, 0.2)',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  rideOptionsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    background: ds.colors.surface,
    borderTop: `1px solid ${ds.colors.border}`,
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    padding: '20px',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    boxShadow: ds.shadows.soft,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  rideOptionsHeader: {
    margin: '0 0 10px 0',
    fontWeight: 600,
  },
  rideCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    background: ds.colors.glass,
    borderRadius: '15px',
    border: `1px solid ${ds.colors.border}`,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  rideCardSelected: {
    background: 'rgba(0, 245, 255, 0.1)',
    borderColor: ds.colors.primary,
    boxShadow: '0 0 15px rgba(0, 245, 255, 0.2)',
  },
  navBar: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    right: '20px',
    background: ds.colors.surface,
    borderRadius: '30px',
    padding: '10px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: ds.shadows.soft,
    zIndex: 100,
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: `1px solid ${ds.colors.border}`,
  },
  navButton: {
    background: 'transparent',
    border: 'none',
    color: ds.colors.textSecondary,
    cursor: 'pointer',
    padding: '10px',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActiveIndicator: {
    position: 'absolute',
    bottom: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: ds.colors.primary,
    boxShadow: `0 0 15px 2px ${ds.colors.primary}`,
  },
  loadingContainer: {
    textAlign: 'center',
    color: ds.colors.textSecondary,
  },
  loadingIndicator: {
    width: '30px',
    height: '30px',
    border: `3px solid ${ds.colors.border}`,
    borderTopColor: ds.colors.primary,
    borderRadius: '50%',
    margin: '0 auto 15px',
  },
  errorText: {
    color: ds.colors.error,
    textAlign: 'center',
    marginBottom: '15px',
    fontSize: '14px',
  },
  errorOverlay: {
    color: ds.colors.error,
    textAlign: 'center',
    padding: '20px',
    fontSize: '16px',
    margin: 'auto',
  },
};

export default RiderApp;
