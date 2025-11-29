import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, ViewProps, StyleProp, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { ds } from '@/constants/theme';
import { useInteractionState } from '@/hooks/useInteractionState';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  onPress?: () => void;
  disabled?: boolean;
  /** Accessibility label for screen readers (when interactive) */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
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

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  elevated = false,
  interactive = false,
  style,
  intensity = 30,
  tint = 'dark',
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  enableMicroInteractions = false,
  interactionConfig = {},
  testID,
  ...restProps
}) => {
  const {
    scale = 0.98,
    glowIntensity = 0.3,
    hapticPattern = 'tap',
    soundEffect = 'tapSoft',
  } = interactionConfig;

  // Always call the hook unconditionally to satisfy React hooks rules
  const interactionState = useInteractionState({
    scale,
    glowIntensity,
    hapticPattern,
    soundEffect,
    disabled: !enableMicroInteractions || disabled,
    loading: false,
  });

  // Memoize animated styles to prevent unnecessary recalculations
  const memoizedStyles = useMemo(() => [
    styles.container, 
    elevated && styles.elevated, 
    style,
    enableMicroInteractions ? interactionState.pressStyle : undefined
  ], [elevated, style, enableMicroInteractions, interactionState.pressStyle]);

  const memoizedGlowStyles = useMemo(() => [
    styles.glowOverlay, 
    interactionState.glowStyle
  ], [interactionState.glowStyle]);

  const CardContent = (
    <Animated.View style={memoizedStyles} testID={testID} {...restProps}>
      {enableMicroInteractions && (
        <Animated.View style={memoizedGlowStyles} />
      )}
      <BlurView
        intensity={intensity}
        tint={tint}
        style={styles.blurView}
      >
        <View style={[styles.content, interactive && styles.interactive]}>
          {children}
        </View>
      </BlurView>
    </Animated.View>
  );

  if (onPress) {
    if (enableMicroInteractions) {
      return (
        <GestureDetector gesture={interactionState.gesture}>
          <Animated.View 
            style={style}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled }}
          >
            {CardContent}
          </Animated.View>
        </GestureDetector>
      );
    }
    return (
      <TouchableOpacity 
        onPress={onPress} 
        style={style}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: ds.radius.lg,
    overflow: 'hidden',
    backgroundColor: ds.colors.glass,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: ds.shadow.card.offsetY,
    },
    shadowOpacity: ds.shadow.card.opacity,
    shadowRadius: ds.shadow.card.radius,
    elevation: 8,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: ds.shadow.modern.offsetY,
    },
    shadowOpacity: ds.shadow.modern.opacity,
    shadowRadius: ds.shadow.modern.radius,
    elevation: 12,
  },
  glowOverlay: {
    position: 'absolute',
    top: -ds.spacing.md,
    left: -ds.spacing.md,
    right: -ds.spacing.md,
    bottom: -ds.spacing.md,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.primary,
    opacity: 0,
  },
  blurView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: ds.spacing.lg,
  },
  interactive: {
    // Additional styling for interactive elements
  },
});
