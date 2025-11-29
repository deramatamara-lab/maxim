import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  runOnUI,
  Easing,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

import { ds } from '../constants/theme';

// Platform detection utilities
const isAndroid = Platform.OS === 'android';

// Utility to get animation preset
const getPreset = (presetName: keyof typeof ds.motion.presets) => {
  return ds.motion.presets[presetName];
};

// Utility to get spring config
const getSpringConfig = (configName: keyof typeof ds.motion.spring): WithSpringConfig => {
  const config = ds.motion.spring[configName];
  return {
    damping: config.damping,
    stiffness: config.stiffness,
    mass: config.mass,
    overshootClamping: config.overshootClamping,
  };
};

// Utility to get timing config
const getTimingConfig = (easingName: keyof typeof ds.motion.easing, durationName?: keyof typeof ds.motion.duration): WithTimingConfig => {
  const easing = ds.motion.easing[easingName];
  const duration = durationName ? ds.motion.duration[durationName] : ds.motion.duration.normal;
  
  return {
    duration,
    easing: Easing.bezier(easing[0], easing[1], easing[2], easing[3]),
  };
};

// Core spring animation hook
export const useSpringAnimation = (
  initialValue: number = 0,
  configName: keyof typeof ds.motion.spring = 'micro'
) => {
  const value = useSharedValue(initialValue);
  const springConfig = getSpringConfig(configName);

  const animateTo = useCallback((toValue: number, customConfig?: Partial<WithSpringConfig>) => {
    'worklet';
    const config = customConfig || springConfig;
    value.value = withSpring(toValue, config);
  }, [value, springConfig]);

  const reset = useCallback(() => {
    'worklet';
    value.value = initialValue;
  }, [value, initialValue]);

  return { value, animateTo, reset };
};

// Core timing animation hook
export const useTimingAnimation = (
  initialValue: number = 0,
  easingName: keyof typeof ds.motion.easing = 'smooth',
  durationName?: keyof typeof ds.motion.duration
) => {
  const value = useSharedValue(initialValue);
  const timingConfig = getTimingConfig(easingName, durationName);

  const animateTo = useCallback((toValue: number, customConfig?: Partial<WithTimingConfig>) => {
    'worklet';
    value.value = withTiming(toValue, { ...timingConfig, ...customConfig });
  }, [value, timingConfig]);

  const reset = useCallback(() => {
    'worklet';
    value.value = initialValue;
  }, [value, initialValue]);

  return { value, animateTo, reset };
};

// Scale animation hook for buttons and interactive elements
export const useScaleAnimation = (_presetName: keyof typeof ds.motion.presets = 'buttonPress') => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const press = useCallback(() => {
    'worklet';
    scale.value = withSpring(0.95, getSpringConfig('micro'));
  }, [scale]);

  const release = useCallback(() => {
    'worklet';
    scale.value = withSpring(1, getSpringConfig('button'));
  }, [scale]);

  return { scale, animatedStyle, press, release };
};

// Fade animation hook for entrance/exit
export const useFadeAnimation = (_presetName: keyof typeof ds.motion.presets = 'modalEnter') => {
  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animateIn = useCallback(() => {
    'worklet';
    opacity.value = withTiming(1, getTimingConfig('entrance', 'entrance'));
  }, [opacity]);

  const animateOut = useCallback(() => {
    'worklet';
    opacity.value = withTiming(0, getTimingConfig('exit', 'exit'));
  }, [opacity]);

  return { opacity, animatedStyle, animateIn, animateOut };
};

// Slide animation hook for drawers and modals
export const useSlideAnimation = (
  direction: 'left' | 'right' | 'up' | 'down' = 'right',
  _presetName: keyof typeof ds.motion.presets = 'drawerEnter'
) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const slideIn = useCallback(() => {
    'worklet';
    const config = getTimingConfig('smooth', 'normal');
    
    if (direction === 'right') {
      translateX.value = withTiming(0, config);
    } else if (direction === 'left') {
      translateX.value = withTiming(0, config);
    } else if (direction === 'up') {
      translateY.value = withTiming(0, config);
    } else if (direction === 'down') {
      translateY.value = withTiming(0, config);
    }
  }, [translateX, translateY, direction]);

  const slideOut = useCallback(() => {
    'worklet';
    const config = getTimingConfig('sharp', 'fast');
    const screenWidth = 375; // Should come from ds.layout.shellWidth
    
    if (direction === 'right') {
      translateX.value = withTiming(screenWidth, config);
    } else if (direction === 'left') {
      translateX.value = withTiming(-screenWidth, config);
    } else if (direction === 'up') {
      translateY.value = withTiming(-ds.layout.shellHeight, config);
    } else if (direction === 'down') {
      translateY.value = withTiming(ds.layout.shellHeight, config);
    }
  }, [translateX, translateY, direction]);

  return { translateX, translateY, animatedStyle, slideIn, slideOut };
};

// Pulse animation hook for loading states
export const usePulseAnimation = (
  _presetName: keyof typeof ds.motion.presets = 'pulse',
  autoPlay: boolean = false
) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const start = useCallback(() => {
    'worklet';
    const config = getTimingConfig('smooth', 'slow');
    
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, config),
        withTiming(1, config)
      ),
      -1,
      true
    );
    
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, config),
        withTiming(1, config)
      ),
      -1,
      true
    );
  }, [scale, opacity]);

  const stop = useCallback(() => {
    'worklet';
    scale.value = withTiming(1, getTimingConfig('smooth'));
    opacity.value = withTiming(1, getTimingConfig('smooth'));
  }, [scale, opacity]);

  useEffect(() => {
    if (autoPlay) {
      start();
    }
  }, [autoPlay, start]);

  return { scale, opacity, animatedStyle, start, stop };
};

// Combined transform animation hook for complex animations
export const useTransformAnimation = (
  initialTransform: {
    scale?: number;
    translateX?: number;
    translateY?: number;
    rotate?: string;
  } = {}
) => {
  const scale = useSharedValue(initialTransform.scale || 1);
  const translateX = useSharedValue(initialTransform.translateX || 0);
  const translateY = useSharedValue(initialTransform.translateY || 0);
  const rotate = useSharedValue(initialTransform.rotate || '0deg');

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: rotate.value },
    ],
  }));

  const animateTo = useCallback((
    transforms: Partial<typeof initialTransform>,
    presetName: keyof typeof ds.motion.presets = 'buttonPress'
  ) => {
    'worklet';
    const preset = getPreset(presetName);
    const config = preset.spring ? 
      getSpringConfig(preset.spring as keyof typeof ds.motion.spring) :
      getTimingConfig(
        preset.easing as keyof typeof ds.motion.easing, 
        preset.duration as keyof typeof ds.motion.duration
      );

    if (transforms.scale !== undefined) {
      scale.value = preset.spring ? 
        withSpring(transforms.scale, config) :
        withTiming(transforms.scale, config);
    }
    if (transforms.translateX !== undefined) {
      translateX.value = preset.spring ? 
        withSpring(transforms.translateX, config) :
        withTiming(transforms.translateX, config);
    }
    if (transforms.translateY !== undefined) {
      translateY.value = preset.spring ? 
        withSpring(transforms.translateY, config) :
        withTiming(transforms.translateY, config);
    }
    if (transforms.rotate !== undefined) {
      rotate.value = preset.spring ? 
        withSpring(transforms.rotate, config) :
        withTiming(transforms.rotate, config);
    }
  }, [scale, translateX, translateY, rotate]);

  const reset = useCallback(() => {
    'worklet';
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    rotate.value = withSpring('0deg');
  }, [scale, translateX, translateY, rotate]);

  return {
    scale,
    translateX,
    translateY,
    rotate,
    animatedStyle,
    animateTo,
    reset,
  };
};

// Gesture animation hook for interactive elements
export const useGestureAnimation = (
  onPress?: () => void,
  presetName: 'buttonPress' | 'cardPress' = 'buttonPress'
) => {
  const { animatedStyle, press, release } = useScaleAnimation(presetName);
  const isActive = useSharedValue(false);

  const handlePress = useCallback(() => {
    'worklet';
    isActive.value = true;
    press();
    
    // Auto release after a short delay
    setTimeout(() => {
      runOnUI(() => {
        isActive.value = false;
        release();
      })();
    }, 150);
    
    onPress?.();
  }, [press, release, isActive, onPress]);

  return { animatedStyle, handlePress, isActive };
};

// Layout animation hook for list items and cards
export const useLayoutAnimation = (
  presetName: 'listItemEnter' | 'listItemExit' = 'listItemEnter'
) => {
  const preset = getPreset(presetName);
  const translateY = useSharedValue((preset.translateY as number) || 20);
  const opacity = useSharedValue((preset.opacity as number) || 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const enter = useCallback((delay: number = 0) => {
    'worklet';
    const config = getTimingConfig('entrance', 'entrance');
    
    translateY.value = withDelay(
      delay,
      withTiming(0, config)
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, config)
    );
  }, [translateY, opacity]);

  const exit = useCallback(() => {
    'worklet';
    const config = getTimingConfig('exit', 'exit');
    
    translateY.value = withTiming(-20, config);
    opacity.value = withTiming(0, config);
  }, [translateY, opacity]);

  return { translateY, opacity, animatedStyle, enter, exit };
};

// Platform-optimized animation hook
export const usePlatformAnimation = (
  animationType: 'spring' | 'timing',
  configName: keyof typeof ds.motion.spring | keyof typeof ds.motion.easing
) => {
  // Call all hooks unconditionally to avoid React rules violation
  const springResult = useSpringAnimation(0, configName as keyof typeof ds.motion.spring);
  const platformDuration = isAndroid ? 'androidFast' : 'iosFast';
  const timingResult = useTimingAnimation(0, configName as keyof typeof ds.motion.easing, platformDuration);
  
  // Return appropriate result based on animationType
  return animationType === 'spring' ? springResult : timingResult;
};
