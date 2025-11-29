import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';

import {
  useSpringAnimation,
  useTimingAnimation,
  useScaleAnimation,
  useFadeAnimation,
  useSlideAnimation,
  usePulseAnimation,
  useTransformAnimation,
  useGestureAnimation,
  useLayoutAnimation,
  usePlatformAnimation,
} from '../src/hooks/useAnimations';

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initialValue: any) => ({ value: initialValue }),
  useAnimatedStyle: (fn: () => any) => fn(),
  withSpring: (value: any, config?: any) => value,
  withTiming: (value: any, config?: any) => value,
  withRepeat: (value: any, count?: number, reverse?: boolean) => value,
  withSequence: (value1: any, value2: any) => value1,
  withDelay: (delay: number, value: any) => value,
  runOnUI: (fn: () => void) => fn,
  Easing: {
    bezier: (x1: number, y1: number, x2: number, y2: number) => `bezier(${x1},${y1},${x2},${y2})`,
  },
}));

// Mock theme constants
jest.mock('../src/constants/theme', () => ({
  ds: {
    motion: {
      spring: {
        micro: { damping: 10, stiffness: 100, mass: 1, overshootClamping: false },
        button: { damping: 15, stiffness: 200, mass: 1, overshootClamping: false },
        card: { damping: 20, stiffness: 300, mass: 1.2, overshootClamping: true },
      },
      easing: {
        smooth: [0.25, 0.1, 0.25, 1],
        sharp: [0.4, 0, 0.6, 1],
        entrance: [0.25, 0.46, 0.45, 0.94],
        exit: [0.55, 0.085, 0.68, 0.53],
      },
      duration: {
        micro: 140,
        fast: 200,
        normal: 300,
        slow: 500,
        entrance: 360,
        exit: 220,
        androidFast: 250,
        iosFast: 280,
      },
      presets: {
        buttonPress: { spring: 'micro', duration: 'fast' },
        cardPress: { spring: 'card', duration: 'normal' },
        modalEnter: { easing: 'entrance', duration: 'entrance' },
        drawerEnter: { easing: 'smooth', duration: 'normal' },
        pulse: { easing: 'smooth', duration: 'slow' },
        listItemEnter: { translateY: 20, opacity: 0, easing: 'entrance', duration: 'entrance' },
        listItemExit: { translateY: -20, opacity: 0, easing: 'exit', duration: 'exit' },
      },
    },
    layout: {
      shellWidth: 375,
      shellHeight: 812,
    },
  },
}));

describe('useAnimations Hook Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSpringAnimation', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useSpringAnimation());
      
      expect(result.current.value.value).toBe(0);
      expect(typeof result.current.animateTo).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should initialize with custom initial value', () => {
      const { result } = renderHook(() => useSpringAnimation(50));
      
      expect(result.current.value.value).toBe(50);
    });

    it('should use custom spring config', () => {
      const { result } = renderHook(() => useSpringAnimation(0, 'button'));
      
      expect(typeof result.current.animateTo).toBe('function');
    });

    it('should animate to new value', () => {
      const { result } = renderHook(() => useSpringAnimation(0, 'micro'));
      
      act(() => {
        result.current.animateTo(100);
      });
      
      expect(result.current.value.value).toBe(100);
    });

    it('should accept custom config in animateTo', () => {
      const { result } = renderHook(() => useSpringAnimation(0, 'micro'));
      const customConfig = { damping: 20, stiffness: 150 };
      
      act(() => {
        result.current.animateTo(100, customConfig);
      });
      
      expect(result.current.value.value).toBe(100);
    });

    it('should reset to initial value', () => {
      const { result } = renderHook(() => useSpringAnimation(25, 'micro'));
      
      act(() => {
        result.current.animateTo(100);
        result.current.reset();
      });
      
      expect(result.current.value.value).toBe(25);
    });
  });

  describe('useTimingAnimation', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useTimingAnimation());
      
      expect(result.current.value.value).toBe(0);
      expect(typeof result.current.animateTo).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should initialize with custom initial value', () => {
      const { result } = renderHook(() => useTimingAnimation(75));
      
      expect(result.current.value.value).toBe(75);
    });

    it('should use custom easing and duration', () => {
      const { result } = renderHook(() => useTimingAnimation(0, 'sharp', 'fast'));
      
      expect(typeof result.current.animateTo).toBe('function');
    });

    it('should animate to new value', () => {
      const { result } = renderHook(() => useTimingAnimation(0, 'smooth', 'normal'));
      
      act(() => {
        result.current.animateTo(50);
      });
      
      expect(result.current.value.value).toBe(50);
    });

    it('should accept custom config in animateTo', () => {
      const { result } = renderHook(() => useTimingAnimation(0, 'smooth', 'normal'));
      const customConfig = { duration: 500 };
      
      act(() => {
        result.current.animateTo(100, customConfig);
      });
      
      expect(result.current.value.value).toBe(100);
    });

    it('should reset to initial value', () => {
      const { result } = renderHook(() => useTimingAnimation(33, 'smooth'));
      
      act(() => {
        result.current.animateTo(100);
        result.current.reset();
      });
      
      expect(result.current.value.value).toBe(33);
    });
  });

  describe('useScaleAnimation', () => {
    it('should initialize with scale 1', () => {
      const { result } = renderHook(() => useScaleAnimation());
      
      expect(result.current.scale.value).toBe(1);
      expect(typeof result.current.animatedStyle).toBe('function');
      expect(typeof result.current.press).toBe('function');
      expect(typeof result.current.release).toBe('function');
    });

    it('should press animation (scale down)', () => {
      const { result } = renderHook(() => useScaleAnimation());
      
      act(() => {
        result.current.press();
      });
      
      expect(result.current.scale.value).toBe(0.95);
    });

    it('should release animation (scale up)', () => {
      const { result } = renderHook(() => useScaleAnimation());
      
      act(() => {
        result.current.release();
      });
      
      expect(result.current.scale.value).toBe(1);
    });

    it('should generate correct animated style', () => {
      const { result } = renderHook(() => useScaleAnimation());
      const style = result.current.animatedStyle();
      
      expect(style).toEqual({
        transform: [{ scale: 1 }],
      });
    });
  });

  describe('useFadeAnimation', () => {
    it('should initialize with opacity 0', () => {
      const { result } = renderHook(() => useFadeAnimation());
      
      expect(result.current.opacity.value).toBe(0);
      expect(typeof result.current.animatedStyle).toBe('function');
      expect(typeof result.current.animateIn).toBe('function');
      expect(typeof result.current.animateOut).toBe('function');
    });

    it('should animate in (opacity to 1)', () => {
      const { result } = renderHook(() => useFadeAnimation());
      
      act(() => {
        result.current.animateIn();
      });
      
      expect(result.current.opacity.value).toBe(1);
    });

    it('should animate out (opacity to 0)', () => {
      const { result } = renderHook(() => useFadeAnimation());
      
      act(() => {
        result.current.animateOut();
      });
      
      expect(result.current.opacity.value).toBe(0);
    });

    it('should generate correct animated style', () => {
      const { result } = renderHook(() => useFadeAnimation());
      const style = result.current.animatedStyle();
      
      expect(style).toEqual({
        opacity: 0,
      });
    });
  });

  describe('useSlideAnimation', () => {
    it('should initialize with zero translation', () => {
      const { result } = renderHook(() => useSlideAnimation());
      
      expect(result.current.translateX.value).toBe(0);
      expect(result.current.translateY.value).toBe(0);
      expect(typeof result.current.slideIn).toBe('function');
      expect(typeof result.current.slideOut).toBe('function');
    });

    it('should slide in from right', () => {
      const { result } = renderHook(() => useSlideAnimation('right'));
      
      act(() => {
        result.current.slideIn();
      });
      
      expect(result.current.translateX.value).toBe(0);
    });

    it('should slide out to right', () => {
      const { result } = renderHook(() => useSlideAnimation('right'));
      
      act(() => {
        result.current.slideOut();
      });
      
      expect(result.current.translateX.value).toBe(375);
    });

    it('should slide in from left', () => {
      const { result } = renderHook(() => useSlideAnimation('left'));
      
      act(() => {
        result.current.slideIn();
      });
      
      expect(result.current.translateX.value).toBe(0);
    });

    it('should slide out to left', () => {
      const { result } = renderHook(() => useSlideAnimation('left'));
      
      act(() => {
        result.current.slideOut();
      });
      
      expect(result.current.translateX.value).toBe(-375);
    });

    it('should slide in from up', () => {
      const { result } = renderHook(() => useSlideAnimation('up'));
      
      act(() => {
        result.current.slideIn();
      });
      
      expect(result.current.translateY.value).toBe(0);
    });

    it('should slide out to down', () => {
      const { result } = renderHook(() => useSlideAnimation('down'));
      
      act(() => {
        result.current.slideOut();
      });
      
      expect(result.current.translateY.value).toBe(812);
    });

    it('should generate correct animated style', () => {
      const { result } = renderHook(() => useSlideAnimation());
      const style = result.current.animatedStyle();
      
      expect(style).toEqual({
        transform: [
          { translateX: 0 },
          { translateY: 0 },
        ],
      });
    });
  });

  describe('usePulseAnimation', () => {
    it('should initialize with scale 1 and opacity 1', () => {
      const { result } = renderHook(() => usePulseAnimation());
      
      expect(result.current.scale.value).toBe(1);
      expect(result.current.opacity.value).toBe(1);
      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.stop).toBe('function');
    });

    it('should start pulse animation', () => {
      const { result } = renderHook(() => usePulseAnimation());
      
      act(() => {
        result.current.start();
      });
      
      expect(result.current.scale.value).toBe(1.05);
      expect(result.current.opacity.value).toBe(0.8);
    });

    it('should stop pulse animation', () => {
      const { result } = renderHook(() => usePulseAnimation());
      
      act(() => {
        result.current.start();
        result.current.stop();
      });
      
      expect(result.current.scale.value).toBe(1);
      expect(result.current.opacity.value).toBe(1);
    });

    it('should auto-start when autoPlay is true', () => {
      const { result } = renderHook(() => usePulseAnimation('pulse', true));
      
      expect(result.current.scale.value).toBe(1.05);
      expect(result.current.opacity.value).toBe(0.8);
    });

    it('should generate correct animated style', () => {
      const { result } = renderHook(() => usePulseAnimation());
      const style = result.current.animatedStyle();
      
      expect(style).toEqual({
        transform: [{ scale: 1 }],
        opacity: 1,
      });
    });
  });

  describe('useTransformAnimation', () => {
    it('should initialize with default transform values', () => {
      const { result } = renderHook(() => useTransformAnimation());
      
      expect(result.current.scale.value).toBe(1);
      expect(result.current.translateX.value).toBe(0);
      expect(result.current.translateY.value).toBe(0);
      expect(result.current.rotate.value).toBe('0deg');
    });

    it('should initialize with custom transform values', () => {
      const { result } = renderHook(() => useTransformAnimation({
        scale: 1.5,
        translateX: 50,
        translateY: -30,
        rotate: '45deg',
      }));
      
      expect(result.current.scale.value).toBe(1.5);
      expect(result.current.translateX.value).toBe(50);
      expect(result.current.translateY.value).toBe(-30);
      expect(result.current.rotate.value).toBe('45deg');
    });

    it('should animate to new transform values', () => {
      const { result } = renderHook(() => useTransformAnimation());
      
      act(() => {
        result.current.animateTo({
          scale: 1.2,
          translateX: 100,
          translateY: 50,
          rotate: '90deg',
        });
      });
      
      expect(result.current.scale.value).toBe(1.2);
      expect(result.current.translateX.value).toBe(100);
      expect(result.current.translateY.value).toBe(50);
      expect(result.current.rotate.value).toBe('90deg');
    });

    it('should reset to default values', () => {
      const { result } = renderHook(() => useTransformAnimation());
      
      act(() => {
        result.current.animateTo({ scale: 2 });
        result.current.reset();
      });
      
      expect(result.current.scale.value).toBe(1);
      expect(result.current.translateX.value).toBe(0);
      expect(result.current.translateY.value).toBe(0);
      expect(result.current.rotate.value).toBe('0deg');
    });

    it('should generate correct animated style', () => {
      const { result } = renderHook(() => useTransformAnimation());
      const style = result.current.animatedStyle();
      
      expect(style).toEqual({
        transform: [
          { scale: 1 },
          { translateX: 0 },
          { translateY: 0 },
          { rotate: '0deg' },
        ],
      });
    });
  });

  describe('useGestureAnimation', () => {
    it('should initialize with scale 1 and inactive state', () => {
      const { result } = renderHook(() => useGestureAnimation());
      
      expect(typeof result.current.animatedStyle).toBe('function');
      expect(typeof result.current.handlePress).toBe('function');
      expect(result.current.isActive.value).toBe(false);
    });

    it('should handle press animation', () => {
      const mockOnPress = jest.fn();
      const { result } = renderHook(() => useGestureAnimation(mockOnPress));
      
      act(() => {
        result.current.handlePress();
      });
      
      expect(mockOnPress).toHaveBeenCalled();
      expect(result.current.isActive.value).toBe(true);
    });

    it('should use cardPress preset when specified', () => {
      const { result } = renderHook(() => useGestureAnimation(undefined, 'cardPress'));
      
      expect(typeof result.current.handlePress).toBe('function');
    });

    it('should generate correct animated style', () => {
      const { result } = renderHook(() => useGestureAnimation());
      const style = result.current.animatedStyle();
      
      expect(style).toEqual({
        transform: [{ scale: 1 }],
      });
    });
  });

  describe('useLayoutAnimation', () => {
    it('should initialize with preset values', () => {
      const { result } = renderHook(() => useLayoutAnimation());
      
      expect(result.current.translateY.value).toBe(20);
      expect(result.current.opacity.value).toBe(0);
      expect(typeof result.current.enter).toBe('function');
      expect(typeof result.current.exit).toBe('function');
    });

    it('should enter animation with delay', () => {
      const { result } = renderHook(() => useLayoutAnimation());
      
      act(() => {
        result.current.enter(100);
      });
      
      expect(result.current.translateY.value).toBe(0);
      expect(result.current.opacity.value).toBe(1);
    });

    it('should exit animation', () => {
      const { result } = renderHook(() => useLayoutAnimation());
      
      act(() => {
        result.current.exit();
      });
      
      expect(result.current.translateY.value).toBe(-20);
      expect(result.current.opacity.value).toBe(0);
    });

    it('should use listItemExit preset', () => {
      const { result } = renderHook(() => useLayoutAnimation('listItemExit'));
      
      expect(typeof result.current.exit).toBe('function');
    });

    it('should generate correct animated style', () => {
      const { result } = renderHook(() => useLayoutAnimation());
      const style = result.current.animatedStyle();
      
      expect(style).toEqual({
        transform: [{ translateY: 20 }],
        opacity: 0,
      });
    });
  });

  describe('usePlatformAnimation', () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', {
        get: () => originalPlatform,
      });
    });

    it('should return spring animation on Android', () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
      });

      const { result } = renderHook(() => usePlatformAnimation('spring', 'micro'));
      
      expect(typeof result.current.value).toBe('object');
      expect(typeof result.current.animateTo).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should return timing animation on iOS', () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
      });

      const { result } = renderHook(() => usePlatformAnimation('timing', 'smooth'));
      
      expect(typeof result.current.value).toBe('object');
      expect(typeof result.current.animateTo).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should use platform-specific duration for timing animations', () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
      });

      const { result } = renderHook(() => usePlatformAnimation('timing', 'smooth'));
      
      expect(typeof result.current.animateTo).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid preset names gracefully', () => {
      expect(() => {
        renderHook(() => useScaleAnimation('invalid' as any));
      }).not.toThrow();
    });

    it('should handle invalid config names gracefully', () => {
      expect(() => {
        renderHook(() => useSpringAnimation(0, 'invalid' as any));
      }).not.toThrow();
    });

    it('should handle null/undefined callbacks', () => {
      const { result } = renderHook(() => useGestureAnimation(undefined));
      
      act(() => {
        result.current.handlePress();
      });
      
      expect(typeof result.current.handlePress).toBe('function');
    });
  });

  describe('Performance Considerations', () => {
    it('should not cause memory leaks when hooks are unmounted', () => {
      const { unmount } = renderHook(() => useSpringAnimation());
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid animation calls', () => {
      const { result } = renderHook(() => useScaleAnimation());
      
      expect(() => {
        for (let i = 0; i < 100; i++) {
          act(() => {
            result.current.press();
            result.current.release();
          });
        }
      }).not.toThrow();
    });

    it('should handle concurrent animations', () => {
      const { result: springResult } = renderHook(() => useSpringAnimation());
      const { result: timingResult } = renderHook(() => useTimingAnimation());
      const { result: scaleResult } = renderHook(() => useScaleAnimation());
      
      act(() => {
        springResult.current.animateTo(100);
        timingResult.current.animateTo(50);
        scaleResult.current.press();
      });
      
      expect(springResult.current.value.value).toBe(100);
      expect(timingResult.current.value.value).toBe(50);
      expect(scaleResult.current.scale.value).toBe(0.95);
    });
  });
});
