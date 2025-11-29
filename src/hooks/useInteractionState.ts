import { useCallback, useEffect } from 'react';
import { useSharedValue, withSpring, withTiming, runOnJS, useAnimatedStyle, Easing, SharedValue } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useHaptics, HapticPattern } from './useHaptics';
import { useSound, SoundEffect } from './useSound';
import { ds } from '@/constants/theme';
import { ViewStyle } from 'react-native';

export interface InteractionStateConfig {
  // Visual feedback
  scale?: number;
  opacity?: number;
  glowIntensity?: number;
  translateX?: number;
  translateY?: number;
  
  // Timing and easing
  pressDuration?: number;
  releaseDuration?: number;
  pressEasing?: [number, number, number, number];
  releaseEasing?: [number, number, number, number];
  
  // Spring physics
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  
  // Sensory feedback
  hapticPattern?: HapticPattern;
  soundEffect?: SoundEffect;
  successHaptic?: HapticPattern;
  successSound?: SoundEffect;
  errorHaptic?: HapticPattern;
  errorSound?: SoundEffect;
  
  // States
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
}

export interface InteractionStateReturn {
  // Animated values
  pressProgress: SharedValue<number>;
  glowProgress: SharedValue<number>;
  successProgress: SharedValue<number>;
  errorProgress: SharedValue<number>;
  
  // Animated styles
  pressStyle: ViewStyle;
  glowStyle: ViewStyle;
  successStyle: ViewStyle;
  errorStyle: ViewStyle;
  
  // Gesture handler
  gesture: ReturnType<typeof Gesture.Tap>;
  
  // Control methods
  triggerSuccess: () => void;
  triggerError: () => void;
  reset: () => void;
}

const DEFAULT_CONFIG: Required<Omit<InteractionStateConfig, 'disabled' | 'loading' | 'success' | 'error'>> = {
  scale: 0.95,
  opacity: 0.8,
  glowIntensity: 0.5,
  translateX: 0,
  translateY: 2,
  pressDuration: ds.motion.duration.micro,
  releaseDuration: ds.motion.duration.fast,
  pressEasing: ds.motion.easing.micro as [number, number, number, number],
  releaseEasing: ds.motion.easing.smooth as [number, number, number, number],
  springConfig: ds.motion.spring.micro,
  hapticPattern: 'tap',
  soundEffect: 'tapSoft',
  successHaptic: 'confirm',
  successSound: 'success',
  errorHaptic: 'error',
  errorSound: 'warning',
};

export const useInteractionState = (config: InteractionStateConfig = {}): InteractionStateReturn => {
  const {
    scale = DEFAULT_CONFIG.scale,
    opacity = DEFAULT_CONFIG.opacity,
    glowIntensity = DEFAULT_CONFIG.glowIntensity,
    translateX = DEFAULT_CONFIG.translateX,
    translateY = DEFAULT_CONFIG.translateY,
    pressDuration = DEFAULT_CONFIG.pressDuration,
    releaseDuration = DEFAULT_CONFIG.releaseDuration,
    pressEasing = DEFAULT_CONFIG.pressEasing,
    releaseEasing = DEFAULT_CONFIG.releaseEasing,
    springConfig = DEFAULT_CONFIG.springConfig,
    hapticPattern = DEFAULT_CONFIG.hapticPattern,
    soundEffect = DEFAULT_CONFIG.soundEffect,
    successHaptic = DEFAULT_CONFIG.successHaptic,
    successSound = DEFAULT_CONFIG.successSound,
    errorHaptic = DEFAULT_CONFIG.errorHaptic,
    errorSound = DEFAULT_CONFIG.errorSound,
    disabled = false,
    loading = false,
    success = false,
    error = false,
  } = config;

  const { trigger } = useHaptics();
  const { play } = useSound();

  // Animated values
  const pressProgress = useSharedValue(0);
  const glowProgress = useSharedValue(0);
  const successProgress = useSharedValue(success ? 1 : 0);
  const errorProgress = useSharedValue(error ? 1 : 0);

  // Control methods
  const triggerSuccess = useCallback(() => {
    if (disabled) return;
    trigger(successHaptic);
    play(successSound);
    successProgress.value = withTiming(1, {
      duration: ds.motion.duration.fast,
      easing: Easing.bezier(...ds.motion.easing.smooth),
    });
    setTimeout(() => {
      successProgress.value = withTiming(0, {
        duration: ds.motion.duration.exit,
        easing: Easing.bezier(...ds.motion.easing.exit),
      });
    }, 1500);
  }, [disabled, trigger, play, successHaptic, successSound]);

  const triggerError = useCallback(() => {
    if (disabled) return;
    trigger(errorHaptic);
    play(errorSound);
    errorProgress.value = withTiming(1, {
      duration: ds.motion.duration.fast,
      easing: Easing.bezier(...ds.motion.easing.sharp),
    });
    setTimeout(() => {
      errorProgress.value = withTiming(0, {
        duration: ds.motion.duration.exit,
        easing: Easing.bezier(...ds.motion.easing.exit),
      });
    }, 1500);
  }, [disabled, trigger, play, errorHaptic, errorSound]);

  const reset = useCallback(() => {
    pressProgress.value = withTiming(0, {
      duration: releaseDuration,
      easing: Easing.bezier(...releaseEasing),
    });
    glowProgress.value = withTiming(0, {
      duration: ds.motion.duration.exit,
      easing: Easing.bezier(...ds.motion.easing.exit),
    });
    successProgress.value = 0;
    errorProgress.value = 0;
  }, [pressProgress, glowProgress, releaseDuration, releaseEasing]);

  // Press animation handler
  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    trigger(hapticPattern);
    play(soundEffect);
    
    pressProgress.value = withTiming(1, {
      duration: pressDuration,
      easing: Easing.bezier(...pressEasing),
    });
    
    glowProgress.value = withTiming(glowIntensity, {
      duration: pressDuration,
      easing: Easing.bezier(...pressEasing),
    });
  }, [disabled, loading, trigger, play, hapticPattern, soundEffect, pressDuration, pressEasing, glowIntensity]);

  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;
    
    pressProgress.value = withSpring(0, springConfig);
    glowProgress.value = withTiming(0, {
      duration: ds.motion.duration.exit,
      easing: Easing.bezier(...ds.motion.easing.exit),
    });
  }, [disabled, loading, springConfig]);

  // Gesture handler
  const gesture = Gesture.Tap()
    .enabled(!disabled && !loading)
    .onBegin(() => {
      runOnJS(handlePressIn)();
    })
    .onFinalize(() => {
      runOnJS(handlePressOut)();
    });

  // Animated styles
  const pressStyle = useAnimatedStyle(() => {
    const scaleValue = 1 - (1 - scale) * pressProgress.value;
    const opacityValue = disabled ? 0.5 : loading ? 0.7 : 1 - (1 - opacity) * pressProgress.value;
    
    return {
      transform: [
        { scale: scaleValue },
        { translateX: translateX * pressProgress.value },
        { translateY: translateY * pressProgress.value },
      ],
      opacity: opacityValue,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: disabled ? 0 : glowProgress.value,
      shadowColor: ds.colors.primary,
      shadowOpacity: glowProgress.value * 0.8,
      shadowRadius: ds.shadow.glow.radius + glowProgress.value * 8,
      shadowOffset: {
        width: 0,
        height: ds.shadow.glow.offsetY || 0,
      },
    };
  });

  const successStyle = useAnimatedStyle(() => {
    return {
      opacity: successProgress.value,
      transform: [{ scale: 0.8 + successProgress.value * 0.2 }],
      backgroundColor: ds.colors.success,
      shadowColor: ds.colors.success,
      shadowOpacity: successProgress.value * 0.6,
      shadowRadius: ds.shadow.glow.radius + successProgress.value * 12,
    };
  });

  const errorStyle = useAnimatedStyle(() => {
    return {
      opacity: errorProgress.value,
      transform: [{ scale: 0.9 + errorProgress.value * 0.1 }],
      backgroundColor: ds.colors.error,
      shadowColor: ds.colors.error,
      shadowOpacity: errorProgress.value * 0.6,
      shadowRadius: ds.shadow.glow.radius + errorProgress.value * 8,
    };
  });

  // Update success/error states when config changes
  useEffect(() => {
    if (success) {
      triggerSuccess();
    } else if (error) {
      triggerError();
    }
  }, [success, error, triggerSuccess, triggerError]);

  return {
    pressProgress,
    glowProgress,
    successProgress,
    errorProgress,
    pressStyle,
    glowStyle,
    successStyle,
    errorStyle,
    gesture,
    triggerSuccess,
    triggerError,
    reset,
  };
};
