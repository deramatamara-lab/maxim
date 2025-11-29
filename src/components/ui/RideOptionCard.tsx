import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ds } from '../../constants/theme';
import { RideOptionConfig } from '../../constants/rides';
import { AuraCard, AuraCardProps, AuraAccent } from './AuraCard';

export interface RideOptionCardProps {
  config: RideOptionConfig;
  name: string;
  description: string;
  eta: string;
  price: string;
  surgeLabel?: string;
  selected: boolean;
  onPress: NonNullable<AuraCardProps['onPress']>;
  accessibilityLabel: string;
  accessibilityHint: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const glowFromAccent = (accent: AuraAccent) =>
  accent === 'primary' ? ds.colors.glowCyan : ds.colors.glowMagenta;

const RideOptionCardComponent = ({
  config,
  name,
  description,
  eta,
  price,
  surgeLabel,
  selected,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: RideOptionCardProps) => {
  const selection = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    selection.value = withTiming(selected ? 1 : 0, {
      duration: ds.motion.duration.micro,
      easing: Easing.bezier(...ds.motion.easing.micro),
    });
  }, [selected, selection]);

  const accentGlow = useMemo(() => glowFromAccent(config.accent), [config.accent]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + selection.value * 0.6,
    transform: [{ scale: 0.92 + selection.value * 0.08 }],
    backgroundColor: accentGlow,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + selection.value * 0.8,
    transform: [{ scaleX: 0.95 + selection.value * 0.1 }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    color: selection.value > 0.5 ? ds.colors.textPrimary : ds.colors.text,
  }));

  return (
    <AuraCard
      accentColor={config.accent}
      onPress={onPress}
      delay={config.delayMs}
      soundEffect="click"
      hapticPattern="selection"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Animated.Text style={[styles.title, titleStyle]}>{name}</Animated.Text>
          <AnimatedView pointerEvents="none" style={[styles.badge, badgeStyle]} />
        </View>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.metaRow}>
          <Animated.View style={[styles.metaIndicator, indicatorStyle]} />
          <Text style={styles.metaLabel}>{eta}</Text>
          <View style={styles.metaSpacer} />
          <Text style={styles.metaLabel}>{price}</Text>
        </View>
        {surgeLabel ? <Text style={styles.surge}>{surgeLabel}</Text> : null}
      </View>
    </AuraCard>
  );
};

const propsAreEqual = (prev: RideOptionCardProps, next: RideOptionCardProps) =>
  prev.selected === next.selected &&
  prev.name === next.name &&
  prev.description === next.description &&
  prev.eta === next.eta &&
  prev.price === next.price &&
  prev.surgeLabel === next.surgeLabel &&
  prev.config.id === next.config.id &&
  prev.config.accent === next.config.accent &&
  prev.config.delayMs === next.config.delayMs &&
  prev.config.surgeMultiplier === next.config.surgeMultiplier &&
  prev.accessibilityLabel === next.accessibilityLabel &&
  prev.accessibilityHint === next.accessibilityHint;

export const RideOptionCard = React.memo(RideOptionCardComponent, propsAreEqual);

const styles = StyleSheet.create({
  content: {
    gap: ds.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.lg,
  },
  description: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  metaIndicator: {
    height: 2,
    flex: 1,
    borderRadius: ds.radius.xs,
    backgroundColor: ds.colors.outlineSubtle,
  },
  metaLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  metaSpacer: {
    flex: 1,
  },
  surge: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
