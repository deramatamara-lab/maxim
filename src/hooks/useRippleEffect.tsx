import React, { useCallback, useState, useRef } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useHaptics } from './useHaptics';
import { useSound } from './useSound';
import { ds } from '@/constants/theme';

interface RippleProps {
  x: number;
  y: number;
  size: number;
  id: number;
}

interface RippleEffectConfig {
  color?: string;
  maxRadius?: number;
  duration?: number;
  opacity?: number;
  enableHaptics?: boolean;
  enableSound?: boolean;
}

const DEFAULT_RIPPLE_CONFIG: Required<Omit<RippleEffectConfig, 'enableHaptics' | 'enableSound'>> = {
  color: ds.colors.primary,
  maxRadius: 100,
  duration: ds.motion.duration.normal,
  opacity: 0.3,
};

export const useRippleEffect = (config: RippleEffectConfig = {}) => {
  const {
    color = DEFAULT_RIPPLE_CONFIG.color,
    maxRadius = DEFAULT_RIPPLE_CONFIG.maxRadius,
    duration = DEFAULT_RIPPLE_CONFIG.duration,
    opacity = DEFAULT_RIPPLE_CONFIG.opacity,
    enableHaptics = true,
    enableSound = true,
  } = config;

  const { trigger } = useHaptics();
  const { play } = useSound();
  const [ripples, setRipples] = useState<RippleProps[]>([]);
  const rippleIdRef = useRef(0);
  const containerSizeRef = useRef({ width: 0, height: 0 });

  const addRipple = useCallback((x: number, y: number) => {
    const newRipple: RippleProps = {
      x,
      y,
      size: maxRadius,
      id: rippleIdRef.current++,
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, duration);

    // Sensory feedback
    if (enableHaptics) {
      trigger('tap');
    }
    if (enableSound) {
      play('tapSoft');
    }
  }, [maxRadius, duration, enableHaptics, enableSound, trigger, play]);

  const gesture = Gesture.Tap()
    .onBegin((event) => {
      const { x, y } = event;
      runOnJS(addRipple)(x, y);
    });

  const RippleComponent = useCallback(({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => {
    return (
      <View
        style={[styles.container, style]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          containerSizeRef.current = { width, height };
        }}
      >
        <GestureDetector gesture={gesture}>
          <View style={styles.content}>
            {children}
            {ripples.map(ripple => (
              <Ripple
                key={ripple.id}
                x={ripple.x}
                y={ripple.y}
                size={ripple.size}
                color={color}
                duration={duration}
                opacity={opacity}
              />
            ))}
          </View>
        </GestureDetector>
      </View>
    );
  }, [ripples, color, duration, opacity, gesture]);

  return {
    RippleComponent,
    addRipple,
    clearRipples: () => setRipples([]),
  };
};

interface RippleComponentProps {
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  opacity: number;
}

const Ripple = React.memo(({ x, y, size, color, duration, opacity }: RippleComponentProps) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(1, { duration });
  }, [duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    );

    const animatedOpacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, opacity, 0],
      Extrapolate.CLAMP
    );

    return {
      position: 'absolute',
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity: animatedOpacity,
      transform: [{ scale }],
    };
  });

  return <Animated.View style={animatedStyle} />;
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
});

// Advanced ripple with multiple expanding rings
export const useAdvancedRippleEffect = (config: RippleEffectConfig & { ringCount?: number } = {}) => {
  const { ringCount = 3, ...rippleConfig } = config;
  const { RippleComponent: BaseRipple, addRipple } = useRippleEffect(rippleConfig);
  const [advancedRipples, setAdvancedRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const advancedIdRef = useRef(0);

  const addAdvancedRipple = useCallback((x: number, y: number) => {
    const newRipple = {
      id: advancedIdRef.current++,
      x,
      y,
    };

    setAdvancedRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setAdvancedRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, rippleConfig.duration || ds.motion.duration.normal);

    addRipple(x, y);
  }, [addRipple, rippleConfig.duration]);

  const AdvancedRippleComponent = useCallback(({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => {
    return (
      <View style={[styles.container, style]}>
        <GestureDetector gesture={Gesture.Tap().onBegin((event) => {
          runOnJS(addAdvancedRipple)(event.x, event.y);
        })}>
          <View style={styles.content}>
            {children}
            {advancedRipples.map(ripple => (
              <AdvancedRipple
                key={ripple.id}
                x={ripple.x}
                y={ripple.y}
                ringCount={ringCount}
                color={rippleConfig.color || DEFAULT_RIPPLE_CONFIG.color}
                duration={rippleConfig.duration || DEFAULT_RIPPLE_CONFIG.duration}
                opacity={rippleConfig.opacity || DEFAULT_RIPPLE_CONFIG.opacity}
              />
            ))}
          </View>
        </GestureDetector>
      </View>
    );
  }, [advancedRipples, ringCount, rippleConfig]);

  return {
    RippleComponent: AdvancedRippleComponent,
    addRipple: addAdvancedRipple,
    clearRipples: () => {
      setAdvancedRipples([]);
    },
  };
};

interface AdvancedRippleProps {
  x: number;
  y: number;
  ringCount: number;
  color: string;
  duration: number;
  opacity: number;
}

const AdvancedRipple = React.memo(({ x, y, ringCount, color, duration, opacity }: AdvancedRippleProps) => {
  return (
    <>
      {Array.from({ length: ringCount }, (_, index) => {
        const progress = useSharedValue(0);
        const delay = index * (duration / ringCount) / 2;

        React.useEffect(() => {
          setTimeout(() => {
            progress.value = withTiming(1, { duration: duration - delay });
          }, delay);
        }, [duration, delay]);

        const animatedStyle = useAnimatedStyle(() => {
          const scale = interpolate(
            progress.value,
            [0, 1],
            [0, 1 + index * 0.3],
            Extrapolate.CLAMP
          );

          const animatedOpacity = interpolate(
            progress.value,
            [0, 0.5, 1],
            [0, opacity / (index + 1), 0],
            Extrapolate.CLAMP
          );

          return {
            position: 'absolute',
            left: x - 50,
            top: y - 50,
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 2,
            borderColor: color,
            opacity: animatedOpacity,
            transform: [{ scale }],
          };
        });

        return <Animated.View key={index} style={animatedStyle} />;
      })}
    </>
  );
});
