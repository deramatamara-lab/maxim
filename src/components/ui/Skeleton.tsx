/**
 * Skeleton Loading Component
 * Shimmer animation placeholder for loading states
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '@/constants/theme';

export type SkeletonVariant = 'text' | 'rectangular' | 'circular';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  borderRadius,
  style,
}) => {
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, [shimmerPosition]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerPosition.value * 200 }],
  }));

  // Determine dimensions based on variant
  const getDefaultDimensions = (): { width: DimensionValue; height: number } => {
    switch (variant) {
      case 'text':
        return { width: (width ?? '100%') as DimensionValue, height: height ?? 16 };
      case 'circular':
        return { width: (width ?? 48) as DimensionValue, height: height ?? 48 };
      case 'rectangular':
      default:
        return { width: (width ?? '100%') as DimensionValue, height: height ?? 100 };
    }
  };

  // Determine border radius based on variant
  const getBorderRadius = (): number => {
    if (borderRadius !== undefined) return borderRadius;
    switch (variant) {
      case 'text':
        return ds.radius.sm;
      case 'circular':
        return 9999;
      case 'rectangular':
      default:
        return ds.radius.md;
    }
  };

  const dimensions = getDefaultDimensions();
  const radius = getBorderRadius();

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: radius,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255,255,255,0.08)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton Group for common patterns
export const SkeletonText: React.FC<{
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: string;
  style?: ViewStyle;
}> = ({ lines = 3, lineHeight = 16, lastLineWidth = '60%', style }) => (
  <View style={[styles.textGroup, style]}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        width={index === lines - 1 ? lastLineWidth : '100%'}
        height={lineHeight}
        style={index > 0 ? { marginTop: ds.spacing.sm } : undefined}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC<{
  hasImage?: boolean;
  imageHeight?: number;
  lines?: number;
  style?: ViewStyle;
}> = ({ hasImage = true, imageHeight = 120, lines = 2, style }) => (
  <View style={[styles.cardContainer, style]}>
    {hasImage && (
      <Skeleton
        variant="rectangular"
        height={imageHeight}
        style={styles.cardImage}
      />
    )}
    <View style={styles.cardContent}>
      <Skeleton variant="text" width="70%" height={20} />
      <SkeletonText lines={lines} style={{ marginTop: ds.spacing.sm }} />
    </View>
  </View>
);

export const SkeletonAvatar: React.FC<{
  size?: number;
  withText?: boolean;
  style?: ViewStyle;
}> = ({ size = 48, withText = true, style }) => (
  <View style={[styles.avatarContainer, style]}>
    <Skeleton variant="circular" width={size} height={size} />
    {withText && (
      <View style={styles.avatarText}>
        <Skeleton variant="text" width={120} height={16} />
        <Skeleton
          variant="text"
          width={80}
          height={12}
          style={{ marginTop: ds.spacing.xs }}
        />
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: ds.colors.surface,
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: -200,
    right: 0,
    bottom: 0,
    width: 200,
  },
  shimmer: {
    flex: 1,
    width: 200,
  },
  textGroup: {
    width: '100%',
  },
  cardContainer: {
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  cardImage: {
    borderRadius: 0,
  },
  cardContent: {
    padding: ds.spacing.md,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  avatarText: {
    flex: 1,
  },
});

export default Skeleton;
