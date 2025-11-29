import React, { ReactNode, useCallback, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  Layout,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { ds } from '../../constants/theme';
import { GlassCard } from './GlassCard';
import { AccentLine } from './AccentLine';
import { useHaptics, HapticPattern } from '../../hooks/useHaptics';
import { SoundEffect, useSound } from '../../hooks/useSound';
import { useInteractionState } from '../../hooks/useInteractionState';

export type AuraAccent = 'primary' | 'secondary';

const accentFromVariant = (variant: AuraAccent) =>
  variant === 'primary' ? ds.colors.primary : ds.colors.secondary;

const glowFromVariant = (variant: AuraAccent) =>
  variant === 'primary' ? ds.colors.glowCyan : ds.colors.glowMagenta;

export interface AuraCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accentColor?: AuraAccent;
  elevated?: boolean;
  delay?: number;
  disabled?: boolean;
  onPress?: () => void;
  soundEffect?: SoundEffect;
  hapticPattern?: HapticPattern;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  // Enhanced micro-interaction props
  enableMicroInteractions?: boolean;
  interactionConfig?: {
    scale?: number;
    glowIntensity?: number;
    hapticPattern?: 'tap' | 'confirm' | 'error';
    soundEffect?: 'tapSoft' | 'success' | 'warning';
  };
}

export const AuraCard = ({
  children,
  style,
  accentColor = 'primary',
  elevated = true,
  delay = 0,
  disabled = false,
  onPress,
  soundEffect = 'click',
  hapticPattern = 'selection',
  accessibilityLabel,
  accessibilityHint,
  enableMicroInteractions = true,
  interactionConfig = {},
}: AuraCardProps) => {
  const {
    scale = 0.98,
    glowIntensity = 0.5,
    hapticPattern: enhancedHapticPattern = 'tap',
    soundEffect: enhancedSoundEffect = 'tapSoft',
  } = interactionConfig;

  // Always call the hook unconditionally to satisfy React hooks rules
  const interactionState = useInteractionState({
    scale,
    glowIntensity,
    hapticPattern: enhancedHapticPattern,
    soundEffect: enhancedSoundEffect,
    disabled: !enableMicroInteractions || disabled,
    successHaptic: 'confirm',
    successSound: 'success',
  });

  // Legacy interaction system for backward compatibility
  const { trigger } = useHaptics();
  const { play } = useSound();

  const pressProgress = useSharedValue(0);
  const glowProgress = useSharedValue(0);

  const accent = accentFromVariant(accentColor);
  const glow = glowFromVariant(accentColor);

  const handlePress = useCallback(() => {
    if (disabled) {
      return;
    }
    if (enableMicroInteractions) {
      // Use enhanced interaction system
      interactionState.triggerSuccess();
      onPress?.();
    } else {
      // Use legacy system
      trigger(hapticPattern);
      play(soundEffect);
      onPress?.();
    }
  }, [disabled, enableMicroInteractions, interactionState, hapticPattern, soundEffect, onPress, trigger, play]);

  // Enhanced gesture system that integrates with interactionState
  const gesture = useMemo(() => {
    if (enableMicroInteractions) {
      return interactionState.gesture;
    }

    // Legacy gesture implementation
    return Gesture.Tap()
      .enabled(!disabled && Boolean(onPress))
      .onBegin(() => {
        pressProgress.value = withTiming(1, {
          duration: ds.motion.duration.micro,
          easing: Easing.bezier(...ds.motion.easing.micro),
        });
        glowProgress.value = withTiming(1, {
          duration: ds.motion.duration.micro,
          easing: Easing.bezier(...ds.motion.easing.micro),
        });
      })
      .onFinalize(() => {
        pressProgress.value = withSpring(0, {
          damping: 20,
          stiffness: 320,
        });
        glowProgress.value = withTiming(0, {
          duration: ds.motion.duration.exit,
          easing: Easing.bezier(...ds.motion.easing.exit),
        });
      })
      .onEnd(() => {
        if (onPress) {
          runOnJS(handlePress)();
        }
      });
  }, [disabled, onPress, pressProgress, glowProgress, handlePress, enableMicroInteractions, interactionState]);

  const containerStyle = useAnimatedStyle(() => {
    if (enableMicroInteractions) {
      return interactionState.pressStyle;
    }

    // Legacy animation style
    return {
      transform: [
        { translateY: pressProgress.value * 4 },
        { scale: 1 - pressProgress.value * 0.02 },
      ],
      shadowColor: accent,
      shadowOpacity: disabled ? 0 : 0.18 + glowProgress.value * 0.18,
      shadowRadius: ds.shadow.soft.radius + glowProgress.value * 6,
    };
  });

  const accentStyle = useAnimatedStyle(() => ({
    opacity: disabled ? 0.4 : 0.6 + (enableMicroInteractions ? interactionState.glowProgress.value : glowProgress.value) * 0.4,
    transform: [{ scaleY: 1 + (enableMicroInteractions ? interactionState.glowProgress.value : glowProgress.value) * 0.15 }],
    backgroundColor: accent,
  }));

  const glowStyle = useAnimatedStyle(() => {
    if (enableMicroInteractions) {
      return interactionState.glowStyle;
    }

    return {
      opacity: disabled ? 0 : glowProgress.value * 0.5,
      backgroundColor: glow,
    };
  });

  const wrapperEntering = FadeInDown.duration(ds.motion.duration.entrance)
    .delay(delay)
    .easing(Easing.bezier(...ds.motion.easing.entrance));

  const interactiveAccessibility = onPress
    ? ({ accessibilityRole: 'button' as const, accessibilityState: { disabled } })
    : undefined;

  const CardContent = (
    <Animated.View style={containerStyle}>
      <GlassCard
        elevated={elevated && !disabled}
        style={styles.container}
        intensity={30}
        tint="dark"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        {...(interactiveAccessibility ?? {})}
      >
        <Animated.View pointerEvents="none" style={[styles.accentStripe, accentStyle]} />
        <Animated.View pointerEvents="none" style={[styles.glowOverlay, glowStyle]} />
        <View style={styles.content}>
          <View style={styles.accentLineWrapper}>
            <AccentLine height={4} width={64} />
          </View>
          {children}
        </View>
      </GlassCard>
    </Animated.View>
  );

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        entering={wrapperEntering}
        layout={Layout.springify().damping(20).stiffness(280)}
        style={style}
      >
        {CardContent}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: ds.spacing.lg,
    paddingHorizontal: ds.spacing.xl,
    borderRadius: ds.radius.lg,
    overflow: 'hidden',
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  glowOverlay: {
    position: 'absolute',
    top: -ds.spacing.md,
    left: -ds.spacing.md,
    right: -ds.spacing.md,
    bottom: -ds.spacing.md,
    opacity: 0,
    borderRadius: ds.radius.lg,
  },
  content: {
    paddingLeft: ds.spacing.xl + ds.spacing.md,
    paddingRight: ds.spacing.xl,
    paddingVertical: ds.spacing.lg,
  },
  accentLineWrapper: {
    marginBottom: ds.spacing.sm,
  },
});
