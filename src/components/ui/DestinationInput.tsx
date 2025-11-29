import React, {
  ForwardedRef,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ds } from '../../constants/theme';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';

export interface DestinationInputHandle {
  focus: () => void;
  blur: () => void;
}

interface DestinationInputProps extends Pick<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'onSubmitEditing' | 'returnKeyType'> {
  label: string;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
}

const AnimatedGlass = Animated.createAnimatedComponent(GlassCard);

const DestinationInputComponent = (
  {
    value,
    onChangeText,
    placeholder,
    onSubmitEditing,
    returnKeyType = 'done',
    label,
    onFocus,
    onBlur,
    disabled = false,
    accessibilityHint,
  }: DestinationInputProps,
  ref: ForwardedRef<DestinationInputHandle>
) => {
  const inputRef = useRef<TextInput>(null);
  const focusProgress = useSharedValue(0);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        if (disabled) {
          return;
        }
        inputRef.current?.focus();
      },
      blur: () => {
        inputRef.current?.blur();
      },
    }),
    [disabled]
  );

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + focusProgress.value * 0.02 },
      { translateY: -focusProgress.value * 2 },
    ],
    shadowColor: ds.colors.primary,
    shadowOpacity: 0.16 + focusProgress.value * 0.32,
    shadowRadius: ds.shadow.soft.radius + focusProgress.value * 9,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: focusProgress.value * 0.65,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + focusProgress.value * 0.6,
    transform: [{ scaleX: 1 + focusProgress.value * 0.2 }],
  }));

  return (
    <AnimatedGlass
      style={[styles.wrapper, containerStyle]}
      elevated={!disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]} />
      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <Icon name="location" size={20} color={ds.colors.primary} active />
        </View>
        <View style={styles.inputColumn}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={ds.colors.textMuted}
            style={styles.input}
            cursorColor={ds.colors.primary}
            onFocus={() => {
              if (disabled) {
                return;
              }
              focusProgress.value = withTiming(1, {
                duration: ds.motion.duration.micro,
                easing: Easing.bezier(...ds.motion.easing.micro),
              });
              onFocus?.();
            }}
            onBlur={() => {
              focusProgress.value = withTiming(0, {
                duration: ds.motion.duration.exit,
                easing: Easing.bezier(...ds.motion.easing.exit),
              });
              onBlur?.();
            }}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            editable={!disabled}
            selectionColor={ds.colors.primary}
            accessibilityLabel={label}
            accessibilityHint={accessibilityHint}
          />
          <Animated.View style={[styles.indicator, indicatorStyle]} />
        </View>
      </View>
    </AnimatedGlass>
  );
};

export const DestinationInput = forwardRef<DestinationInputHandle, DestinationInputProps>(
  DestinationInputComponent
);

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: ds.radius.lg,
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.md,
    overflow: 'hidden',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ds.colors.glowCyan,
    opacity: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 32,
    alignItems: 'center',
  },
  inputColumn: {
    flex: 1,
    paddingLeft: ds.spacing.sm,
  },
  label: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: ds.spacing.xs,
  },
  input: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.text,
    paddingVertical: 0,
  },
  indicator: {
    height: 2,
    marginTop: ds.spacing.xs,
    borderRadius: ds.radius.xs,
    backgroundColor: ds.colors.primary,
    opacity: 0.4,
  },
});
