export type TabId = 'home' | 'activity' | 'location' | 'profile';
export type ThemeMode = 'dark' | 'light';
export type Locale = 'en' | 'bg';

// Animation preset interface for type safety
interface AnimationPreset {
  scale?: number | number[];
  translateX?: string | number | number[];
  translateY?: number;
  opacity?: number | number[];
  duration?: string;
  easing?: string;
  spring?: string;
  rotate?: string;
}

// Light mode color palette
const lightColors = {
  // Core palette aligned to web reference
  primary: 'rgba(0,122,255,1)', // iOS blue
  secondary: 'rgba(52,199,89,1)', // iOS green
  background: '#FFFFFF', // Pure white
  backgroundDeep: '#F2F2F7', // System background
  backgroundAlt: '#FFFFFF', // Secondary background
  frameBorder: '#C6C6C8', // Light frame edge
  surface: 'rgba(255,255,255,0.85)',
  surfaceElevated: 'rgba(255,255,255,0.96)',
  // Glass surface used for nav bar / cards
  glass: 'rgba(255,255,255,0.72)',

  textPrimary: '#000000',
  textSecondary: 'rgba(60,60,67,0.6)',
  text: '#000000', // Legacy alias
  textMuted: 'rgba(60,60,67,0.8)', // Legacy alias

  // Status / feedback
  danger: '#FF3B30',
  error: '#FF3B30', // Alias for web reference naming
  success: '#34C759',
  warning: '#FF9500', // Orange warning color for surge pricing

  // Glows & outlines
  glowCyan: 'rgba(0,122,255,0.25)',
  glowMagenta: 'rgba(255,0,255,0.18)',
  outlineSubtle: 'rgba(0,0,0,0.05)',
  border: 'rgba(60,60,67,0.12)',
  borderSubtle: 'rgba(0,0,0,0.05)',
  glassBorder: 'rgba(60,60,67,0.12)',
  glassScrim: 'rgba(255,255,255,0.72)',
};

// Dark mode color palette (aligned to web prototype)
const darkColors = {
  // Core palette from web prototype
  primary: '#00F5FF', // Cyber blue
  primaryAccent: '#19FBFF', // Lighter cyber blue
  secondary: '#00FF73', // Neon green
  background: '#050607', // Web prototype background
  backgroundDeep: '#000000', // Pure black for frame
  backgroundAlt: '#050505', // Secondary background
  frameBorder: '#1A1A1A', // Frame edge color
  surface: 'rgba(22,22,22,0.95)', // Web prototype surface
  surfaceElevated: 'rgba(32,32,32,0.96)', // Web prototype elevated surface
  // Glass surface used for nav bar / cards
  glass: 'rgba(30,30,30,0.6)', // Web prototype glass

  textPrimary: '#F7F7F7', // Web prototype text primary
  textSecondary: '#A5A5A5', // Web prototype text secondary
  text: '#F7F7F7', // Legacy alias updated
  textMuted: 'rgba(255,255,255,0.7)', // Legacy alias

  // Status / feedback from web prototype
  danger: '#FF3366', // Web prototype danger
  error: '#FF3366', // Alias for web reference naming
  success: '#00FFB3', // Web prototype success
  warning: '#FF9500', // Orange warning color for surge pricing

  // Glows & outlines from web prototype
  glowCyan: 'rgba(0,245,255,0.25)', // Web prototype glow cyan
  glowMagenta: 'rgba(255,0,255,0.18)', // Web prototype glow magenta
  outlineSubtle: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  borderSubtle: 'rgba(255,255,255,0.08)', // Web prototype border subtle
  glassBorder: 'rgba(255,255,255,0.08)',
  glassScrim: 'rgba(30,30,30,0.6)',
};

// Layout tokens for consistent sizing
const layout = {
  shellWidth: 375,
  shellHeight: 812,
  headerHeight: 88,
  tabBarHeight: 80,
  cardMaxWidth: 340,
  cardPadding: 20,
  buttonHeight: 56,
  inputHeight: 48,
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  maxContentWidth: 560,
  minHorizontalPadding: 16,
};

export const ds = {
  colors: darkColors, // Default to dark mode
  lightColors,
  darkColors,
  layout,
  getColors: (mode: ThemeMode = 'dark') => (mode === 'light' ? lightColors : darkColors),
  radius: {
    xs: 8,   // Web prototype xs: '8px'
    sm: 12,  // Web prototype sm: '12px'
    md: 16,  // Web prototype md: '16px' (updated from 20)
    lg: 24,  // Web prototype lg: '24px' (updated from 30)
    xl: 32,  // Web prototype xl: '32px' (updated from 40)
    '2xl': 40, // Web prototype '2xl': '40px' (updated from 48)
    frame: 48, // Explicit frame radius for shell (kept for compatibility)
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  typography: {
    family: 'Poppins',
    size: {
      micro: 10,
      caption: 12,
      body: 14,
      bodyLg: 16,
      title: 20,
      display: 32,
      hero: 38,
    },
    weight: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      caption: 16,
      body: 22,
      title: 30,
      display: 40,
      hero: 48,
    },
    tracking: {
      tight: -0.2,
      normal: 0,
      wide: 1.4,
      ultraWide: 2.2,
    },
  },
  shadow: {
    // Numeric shadow tokens for React Native usage (aligned to web prototype).
    modern: {
      radius: 32,
      offsetY: 18,
      opacity: 0.15, // Web prototype: 0 18px 32px -4px rgba(0, 245, 255, 0.15)
      color: 'rgba(0, 245, 255, 0.15)',
    },
    innerGlow: {
      radius: 18,
      offsetY: -4,
      opacity: 0.35,
    },
    soft: {
      radius: 24,
      offsetY: 10,
      opacity: 0.4,
    },
    card: {
      radius: 24,
      offsetY: 4,
      opacity: 0.4,
    },
    glow: {
      radius: 40, // Web prototype: 0 0 40px rgba(0, 245, 255, 0.4)
      offsetY: 0,
      opacity: 0.4,
      color: 'rgba(0, 245, 255, 0.4)',
    },
    inner: {
      radius: 1,
      offsetY: 1,
      opacity: 0.1,
      color: 'rgba(255, 255, 255, 0.1)',
    },
  },
  // Web-style shadow descriptors from the reference (for documentation).
  shadows: {
    modern: '0 18px 32px -4px rgba(0, 245, 255, 0.15)', // Web prototype modern
    glow: '0 0 40px rgba(0, 245, 255, 0.4)', // Web prototype glow
    inner: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)', // Web prototype inner
    soft: '0 10px 40px rgba(0, 0, 0, 0.8)',
    card: '0 4px 24px rgba(0, 0, 0, 0.4)',
  },
  effects: {
    blurIntensity: 60, // Web prototype: backdrop-blur-xl equivalent
    noiseOpacity: 0.03, // Web prototype noise texture opacity
    neonStrokeWidth: 1.6,
    parallaxTiltMaxDeg: 6,
    // Glass effect intensities from web prototype
    glass: {
      low: 0.6,   // bg-[#161616]/60
      medium: 0.8, // bg-[#161616]/80  
      high: 0.95,  // bg-[#161616]/95
    },
    // Noise texture for glass effects
    noiseTexture: 'data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E',
  },
  motion: {
    duration: {
      entrance: 360,
      exit: 220,
      micro: 140,
      modalIn: 320,
      modalOut: 220,
      tabSwitch: 220,
      toastIn: 200,
      toastOut: 180,
      crossFade: 500,
      // Advanced animation durations
      quick: 120,
      fast: 200,
      normal: 300,
      slow: 500,
      slower: 800,
      // Platform-specific optimizations
      androidFast: 180,
      iosFast: 220,
      androidSlow: 600,
      iosSlow: 700,
    },
    easing: {
      entrance: [0.22, 1, 0.36, 1],
      exit: [0.4, 0, 0.2, 1],
      micro: [0.18, 0.89, 0.32, 1.28],
      // Advanced easing curves
      smooth: [0.25, 0.46, 0.45, 0.94],
      bouncy: [0.68, -0.55, 0.265, 1.55],
      elastic: [0.175, 0.885, 0.32, 1.275],
      sharp: [0.4, 0, 0.6, 1],
      gentle: [0.23, 1, 0.32, 1],
      // Platform-specific easing
      androidSmooth: [0.2, 0, 0.2, 1],
      iosSmooth: [0.25, 0.46, 0.45, 0.94],
    },
    spring: {
      // Spring configurations for different interactions
      micro: {
        damping: 20,
        stiffness: 300,
        mass: 1,
        overshootClamping: false,
        restDisplacementThreshold: 0.001,
        restSpeedThreshold: 0.001,
      },
      button: {
        damping: 15,
        stiffness: 400,
        mass: 1,
        overshootClamping: false,
        restDisplacementThreshold: 0.001,
        restSpeedThreshold: 0.001,
      },
      card: {
        damping: 25,
        stiffness: 300,
        mass: 1,
        overshootClamping: false,
        restDisplacementThreshold: 0.001,
        restSpeedThreshold: 0.001,
      },
      modal: {
        damping: 30,
        stiffness: 250,
        mass: 1,
        overshootClamping: false,
        restDisplacementThreshold: 0.001,
        restSpeedThreshold: 0.001,
      },
      drawer: {
        damping: 35,
        stiffness: 400,
        mass: 1,
        overshootClamping: true,
        restDisplacementThreshold: 0.001,
        restSpeedThreshold: 0.001,
      },
      // Platform-specific spring configs
      androidOptimized: {
        damping: 28,
        stiffness: 350,
        mass: 1,
        overshootClamping: false,
        restDisplacementThreshold: 0.001,
        restSpeedThreshold: 0.001,
      },
      iosOptimized: {
        damping: 25,
        stiffness: 300,
        mass: 1,
        overshootClamping: false,
        restDisplacementThreshold: 0.001,
        restSpeedThreshold: 0.001,
      },
    },
    // Animation presets for consistent interactions
    presets: {
      // Button interactions
      buttonPress: {
        scale: 0.95,
        duration: 'micro',
        easing: 'sharp',
        spring: 'micro',
      },
      buttonRelease: {
        scale: 1,
        duration: 'fast',
        easing: 'smooth',
        spring: 'button',
      },
      // Card animations
      cardHover: {
        scale: 1.02,
        duration: 'fast',
        easing: 'smooth',
      },
      cardPress: {
        scale: 0.98,
        duration: 'micro',
        easing: 'sharp',
        spring: 'micro',
      },
      // List item animations
      listItemEnter: {
        translateY: 20,
        opacity: 0,
        duration: 'entrance',
        easing: 'entrance',
      },
      listItemExit: {
        translateY: -20,
        opacity: 0,
        duration: 'exit',
        easing: 'exit',
      },
      // Modal animations
      modalEnter: {
        scale: 0.8,
        opacity: 0,
        duration: 'modalIn',
        easing: 'bouncy',
        spring: 'modal',
      },
      modalExit: {
        scale: 1,
        opacity: 0,
        duration: 'modalOut',
        easing: 'sharp',
      },
      // Drawer/Menu animations
      drawerEnter: {
        translateX: '100%',
        duration: 'normal',
        easing: 'smooth',
        spring: 'drawer',
      },
      drawerExit: {
        translateX: 0,
        duration: 'fast',
        easing: 'sharp',
      },
      // Tab animations
      tabSwitch: {
        scale: 0.9,
        opacity: 0.5,
        duration: 'tabSwitch',
        easing: 'smooth',
      },
      // Loading animations
      pulse: {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        duration: 'slow',
        easing: 'smooth',
      },
      shimmer: {
        translateX: [-100, 100],
        opacity: [0, 1, 0],
        duration: 'slower',
        easing: 'linear',
      },
    } as Record<string, AnimationPreset>,
    // Performance optimization settings
    performance: {
      useNativeDriver: true,
      reduceMotion: false,
      enableGestures: true,
      enableHaptics: true,
      enableSound: true,
      // Platform-specific optimizations
      android: {
        useNativeDriver: true,
        enableHardwareAcceleration: true,
        maxConcurrentAnimations: 8,
        enableLayoutAnimations: true,
      },
      ios: {
        useNativeDriver: true,
        enableHardwareAcceleration: true,
        maxConcurrentAnimations: 12,
        enableLayoutAnimations: true,
        enableSpringAnimations: true,
      },
    },
  },
} as const;
