/**
 * Network Status Indicator Component
 * Provides visual feedback for network connectivity and offline queue status
 * Production-ready with animations and accessibility
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ds } from '@/constants/theme';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';
import { useNetworkStatus, formatTimeSinceLastConnection, getConnectionQualityText } from '@/hooks/useNetworkStatus';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';

const _screenWidth = Dimensions.get('window').width;

interface NetworkStatusIndicatorProps {
  position?: 'top' | 'bottom';
  showQueueStatus?: boolean;
  compact?: boolean;
  onRetry?: () => void;
}

export function NetworkStatusIndicator({
  position = 'top',
  showQueueStatus = true,
  compact = false,
  onRetry,
}: NetworkStatusIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useMemo(() => new Animated.Value(-100), []);
  
  const { 
    isOnline, 
    isConnected, 
    connectionType, 
    quality, 
    lastConnected, 
    timeSinceLastConnection,
    retryConnection,
    getQueueStatus 
  } = useNetworkStatus();
  
  const queueStatus = getQueueStatus();
  
  const { trigger } = useHaptics();
  const { play } = useSound();

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    // Define animation functions inside useEffect to avoid dependency issues
    const showIndicator = () => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ds.motion.duration.entrance,
        useNativeDriver: true,
      }).start();
    };

    const hideIndicator = () => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: ds.motion.duration.exit,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    };

    const shouldShow = !isOnline || queueStatus.size > 0;
    
    if (shouldShow && !isVisible) {
      setIsVisible(true);
      showIndicator();
      
      // Auto-hide after 5 seconds if connected and no queue
      if (isOnline && queueStatus.size === 0) {
        timer = setTimeout(() => {
          hideIndicator();
        }, 5000) as unknown as NodeJS.Timeout;
      }
    } else if (!shouldShow && isVisible) {
      hideIndicator();
    }
      
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOnline, queueStatus.size, isVisible]);

  // Queue status is now handled by the hook

  const handleRetry = async () => {
    trigger('tap');
    play('tapSoft');
    
    try {
      await retryConnection();
      if (onRetry) {
        onRetry();
      }
    } catch (error) {
      // Error is logged in the hook
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return ds.colors.error;
    if (connectionType === 'wifi') return ds.colors.secondary;
    if (connectionType === 'cellular') return ds.colors.primary;
    return ds.colors.textSecondary;
  };

  const getStatusText = () => {
    if (!isOnline) {
      const timeSinceConnection = formatTimeSinceLastConnection(timeSinceLastConnection);
      return `Offline • Last seen ${timeSinceConnection}`;
    }
    
    const qualityText = getConnectionQualityText(quality);
    
    switch (connectionType) {
      case 'wifi':
        return `WiFi • ${qualityText}`;
      case 'cellular':
        return `Cellular • ${qualityText}`;
      case 'ethernet':
        return `Ethernet • ${qualityText}`;
      default:
        return qualityText;
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'location'; // Using available icon
    if (connectionType === 'wifi') return 'activity';
    return 'location';
  };

  const getQueueText = () => {
    if (queueStatus.size === 0) return '';
    
    const { size, oldestMessage } = queueStatus;
    if (oldestMessage) {
      const minutesOld = Math.floor((Date.now() - oldestMessage) / 60000);
      return `${size} request${size > 1 ? 's' : ''} queued (${minutesOld}m old)`;
    }
    return `${size} request${size > 1 ? 's' : ''} queued`;
  };

  if (!isVisible) {
    return null;
  }

  const containerStyle = [
    styles.container,
    position === 'top' ? styles.topPosition : styles.bottomPosition,
    {
      transform: [{ translateY: slideAnim }],
    },
  ];

  const contentStyle = [
    styles.content,
    compact && styles.compactContent,
    { borderColor: getStatusColor() + '40' },
  ];

  return (
    <Animated.View style={containerStyle}>
      <GlassCard 
        elevated={true} 
        intensity={30} 
        tint="dark"
        style={contentStyle}
      >
        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <Icon 
              name={getStatusIcon()} 
              size={compact ? 16 : 20} 
              color={getStatusColor()}
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          
          {!isConnected && onRetry && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRetry}
              accessibilityLabel="Retry connection"
              accessibilityRole="button"
            >
              <Icon name="profile" size={16} color={ds.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {showQueueStatus && !compact && queueStatus.size > 0 && (
          <View style={styles.queueRow}>
            <Icon name="activity" size={14} color={ds.colors.textSecondary} />
            <Text style={styles.queueText}>
              {getQueueText()}
            </Text>
            <Text style={styles.queueSubtext}>
              Will send when you&apos;re back online
            </Text>
          </View>
        )}

        {!isConnected && (
          <View style={styles.offlineActions}>
            <Text style={styles.offlineText}>
              {compact 
                ? 'Requests will queue automatically' 
                : 'Your requests are being saved and will be sent automatically when you reconnect.'
              }
            </Text>
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: ds.spacing.lg,
    right: ds.spacing.lg,
    zIndex: 1000,
  },
  topPosition: {
    top: ds.spacing.xl,
  },
  bottomPosition: {
    bottom: ds.spacing.xxl + 80, // Above tab bar
  },
  content: {
    padding: ds.spacing.md,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
  },
  compactContent: {
    padding: ds.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  statusText: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    fontFamily: ds.typography.family,
  },
  retryButton: {
    padding: ds.spacing.xs,
    borderRadius: ds.radius.sm,
    backgroundColor: ds.colors.surface,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginTop: ds.spacing.sm,
    paddingTop: ds.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
  },
  queueText: {
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    flex: 1,
  },
  queueSubtext: {
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  offlineActions: {
    marginTop: ds.spacing.sm,
  },
  offlineText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    lineHeight: 16,
  },
});

export default NetworkStatusIndicator;
