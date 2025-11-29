/**
 * Connection Quality Indicator Component
 * Displays real-time connection quality with visual feedback
 * Shows latency, connection status, and queue status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ds } from '@/constants/theme';
import { GlassCard } from './GlassCard';
import { CustomIcon } from './CustomIcon';
import { useHaptics } from '@/hooks/useHaptics';
import { log } from '@/utils/logger';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

interface ConnectionMetrics {
  latency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  lastUpdate: number; // timestamp
}

interface ConnectionQualityIndicatorProps {
  /** Current connection status */
  isConnected: boolean;
  /** Connection quality level */
  quality?: ConnectionQuality;
  /** Latency in milliseconds */
  latency?: number;
  /** Number of queued messages */
  queuedMessages?: number;
  /** Whether to show expanded details */
  showDetails?: boolean;
  /** Callback when indicator is pressed */
  onPress?: () => void;
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Compact mode */
  compact?: boolean;
}

/**
 * Calculate connection quality from metrics
 */
export function calculateConnectionQuality(metrics: ConnectionMetrics): ConnectionQuality {
  const { latency, packetLoss, jitter } = metrics;
  
  // Offline check
  if (latency === -1 || Date.now() - metrics.lastUpdate > 30000) {
    return 'offline';
  }
  
  // Excellent: <50ms latency, <1% packet loss, <10ms jitter
  if (latency < 50 && packetLoss < 1 && jitter < 10) {
    return 'excellent';
  }
  
  // Good: <100ms latency, <3% packet loss, <30ms jitter
  if (latency < 100 && packetLoss < 3 && jitter < 30) {
    return 'good';
  }
  
  // Fair: <200ms latency, <5% packet loss, <50ms jitter
  if (latency < 200 && packetLoss < 5 && jitter < 50) {
    return 'fair';
  }
  
  // Poor: anything else
  return 'poor';
}

/**
 * Get color for connection quality
 */
function getQualityColor(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent':
      return ds.colors.success;
    case 'good':
      return ds.colors.secondary;
    case 'fair':
      return ds.colors.warning;
    case 'poor':
      return ds.colors.error;
    case 'offline':
      return ds.colors.textSecondary;
    default:
      return ds.colors.textSecondary;
  }
}

/**
 * Get label for connection quality
 */
function getQualityLabel(quality: ConnectionQuality): string {
  switch (quality) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'fair':
      return 'Fair';
    case 'poor':
      return 'Poor';
    case 'offline':
      return 'Offline';
    default:
      return 'Unknown';
  }
}

/**
 * Get number of signal bars for quality
 */
function getSignalBars(quality: ConnectionQuality): number {
  switch (quality) {
    case 'excellent':
      return 4;
    case 'good':
      return 3;
    case 'fair':
      return 2;
    case 'poor':
      return 1;
    case 'offline':
      return 0;
    default:
      return 0;
  }
}

export function ConnectionQualityIndicator({
  isConnected,
  quality = isConnected ? 'good' : 'offline',
  latency = 0,
  queuedMessages = 0,
  showDetails = false,
  onPress,
  position = 'top-right',
  compact = false,
}: ConnectionQualityIndicatorProps) {
  const [expanded, setExpanded] = useState(showDetails);
  const haptics = useHaptics();
  
  // Animation values
  const pulseOpacity = useSharedValue(1);
  const signalScale = useSharedValue(1);
  
  // Pulse animation for poor/offline connection
  useEffect(() => {
    if (quality === 'poor' || quality === 'offline') {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [quality, pulseOpacity]);
  
  // Scale animation on quality change
  useEffect(() => {
    signalScale.value = withSequence(
      withTiming(1.2, { duration: 150, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) })
    );
  }, [quality, signalScale]);
  
  const handlePress = useCallback(() => {
    haptics.trigger('selection');
    if (onPress) {
      onPress();
    } else {
      setExpanded(prev => !prev);
    }
    
    log.debug('Connection quality indicator pressed', {
      event: 'connection_indicator_pressed',
      component: 'ConnectionQualityIndicator',
      quality,
      latency,
      queuedMessages,
    });
  }, [haptics, onPress, quality, latency, queuedMessages]);
  
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));
  
  const signalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: signalScale.value }],
  }));
  
  const qualityColor = getQualityColor(quality);
  const signalBars = getSignalBars(quality);
  
  const positionStyle = {
    'top-left': { top: ds.spacing.md, left: ds.spacing.md },
    'top-right': { top: ds.spacing.md, right: ds.spacing.md },
    'bottom-left': { bottom: ds.spacing.md, left: ds.spacing.md },
    'bottom-right': { bottom: ds.spacing.md, right: ds.spacing.md },
  }[position];
  
  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityLabel={`Connection quality: ${getQualityLabel(quality)}`}
        accessibilityRole="button"
        accessibilityHint="Tap to see connection details"
      >
        <Animated.View style={[styles.compactContainer, pulseStyle]}>
          <Animated.View style={[styles.signalBars, signalStyle]}>
            {[1, 2, 3, 4].map((bar) => (
              <View
                key={bar}
                style={[
                  styles.signalBar,
                  { height: 4 + bar * 3 },
                  bar <= signalBars
                    ? { backgroundColor: qualityColor }
                    : { backgroundColor: ds.colors.glassBorder },
                ]}
              />
            ))}
          </Animated.View>
        </Animated.View>
      </Pressable>
    );
  }
  
  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, positionStyle]}
      accessibilityLabel={`Connection quality: ${getQualityLabel(quality)}. Latency: ${latency}ms`}
      accessibilityRole="button"
      accessibilityHint="Tap to see connection details"
    >
      <GlassCard style={styles.card} elevated intensity={20}>
        <Animated.View style={[styles.content, pulseStyle]}>
          {/* Signal Bars */}
          <Animated.View style={[styles.signalBars, signalStyle]}>
            {[1, 2, 3, 4].map((bar) => (
              <View
                key={bar}
                style={[
                  styles.signalBar,
                  { height: 4 + bar * 3 },
                  bar <= signalBars
                    ? { backgroundColor: qualityColor }
                    : { backgroundColor: ds.colors.glassBorder },
                ]}
              />
            ))}
          </Animated.View>
          
          {/* Status Text */}
          <View style={styles.statusContainer}>
            <Text style={[styles.qualityText, { color: qualityColor }]}>
              {getQualityLabel(quality)}
            </Text>
            {latency > 0 && (
              <Text style={styles.latencyText}>{latency}ms</Text>
            )}
          </View>
          
          {/* Queue Indicator */}
          {queuedMessages > 0 && (
            <View style={styles.queueBadge}>
              <CustomIcon name="activity" size={12} color={ds.colors.warning} />
              <Text style={styles.queueText}>{queuedMessages}</Text>
            </View>
          )}
        </Animated.View>
        
        {/* Expanded Details */}
        {expanded && (
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { color: qualityColor }]}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Latency</Text>
              <Text style={styles.detailValue}>{latency}ms</Text>
            </View>
            {queuedMessages > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Queued</Text>
                <Text style={[styles.detailValue, { color: ds.colors.warning }]}>
                  {queuedMessages} messages
                </Text>
              </View>
            )}
          </View>
        )}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  card: {
    padding: ds.spacing.sm,
    minWidth: 80,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  compactContainer: {
    padding: ds.spacing.xs,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  signalBar: {
    width: 4,
    borderRadius: 1,
  },
  statusContainer: {
    flexDirection: 'column',
  },
  qualityText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
  },
  latencyText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
  },
  queueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: ds.colors.warning + '20',
    paddingHorizontal: ds.spacing.xs,
    paddingVertical: 2,
    borderRadius: ds.radius.sm,
  },
  queueText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.micro,
    color: ds.colors.warning,
    fontWeight: ds.typography.weight.medium,
  },
  details: {
    marginTop: ds.spacing.sm,
    paddingTop: ds.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ds.colors.glassBorder,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ds.spacing.xs,
  },
  detailLabel: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  detailValue: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textPrimary,
    fontWeight: ds.typography.weight.medium,
  },
});

export default ConnectionQualityIndicator;
