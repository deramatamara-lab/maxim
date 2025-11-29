// TypeScript strict mode enabled - production ready implementation
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { Icon } from '@/components/ui/Icon';
import { useTranslation } from '@/providers/LanguageProvider';
import ChatInterface from '@/components/chat/ChatInterface';
import { CancellationDialog } from '@/components/ride/CancellationDialog';
import { CancellableRideStatus } from '@/hooks/useCancellationLogic';
import { useSound } from '@/hooks/useSound';
import { useHaptics } from '@/hooks/useHaptics';
import { useFadeAnimation, usePulseAnimation } from '@/hooks/useAnimations';
import { useRideStatusSocket } from '@/hooks/useRideStatusSocket';
import { useTheme } from '@/providers/ThemeLocaleProvider';
import { useEnhancedRideState } from '@/store/useEnhancedAppStore';
import { log } from '@/utils/logger';

const SEARCH_PULSE_SIZE = ds.layout.cardMaxWidth;

interface ActiveRideScreenProps {
  onRideComplete: () => void;
  onRideCancel: () => void;
}

export default function ActiveRideScreen({ onRideComplete: _onRideComplete, onRideCancel }: ActiveRideScreenProps) {
  const { trigger } = useHaptics();
  const { play } = useSound();
  const router = useRouter();
  const { currentRide, isLoadingRide, cancelRide } = useEnhancedRideState();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  
  // Real-time WebSocket updates
  const { isConnected, connectionStatus, refreshRideStatus } = useRideStatusSocket({
    rideId: currentRide?.id,
    onStatusChange: (status, _data) => {
      // Trigger haptic feedback for status changes
      switch (status) {
        case 'confirmed':
          trigger('confirm');
          play('success');
          break;
        case 'arrived':
          trigger('heavy');
          play('warning');
          break;
        case 'in_progress':
          trigger('tap');
          play('tapSoft');
          break;
        case 'completed':
          trigger('confirm');
          play('success');
          handleRideComplete();
          break;
        case 'cancelled':
          trigger('error');
          play('warning');
          onRideCancel();
          break;
      }
    },
    onLocationUpdate: (location) => {
      // Update local driver location for smooth animations
      setDriverLocation(location);
    },
    onError: (error) => {
      log.error('Real-time update error', { event: 'websocket_error', component: 'activeRide' }, error);
    },
    onDriverCancelled: (reason) => {
      // Show driver cancellation dialog
      trigger('error');
      play('warning');
      setShowDriverCancelledDialog(true);
      log.warn('Driver cancelled ride', { event: 'driver_cancelled', component: 'activeRide', reason });
    },
    _onNetworkInterruption: (actions: unknown[]) => {
      // Queue pending actions during network interruption
      const actionsWithTimestamp = (actions as { type: string; data: unknown; }[]).map(action => ({
        ...action,
        timestamp: Date.now(),
      }));
      setPendingActions(actionsWithTimestamp);
      setConnectionError('Network interrupted. Actions will be queued.');
    },
  });
  
  // Unified animations using centralized hooks
  const { animatedStyle: cardAnimatedStyle, animateIn: animateCardIn } = useFadeAnimation('modalEnter');
  const { animatedStyle: pulseAnimatedStyle, start: startPulse, stop: stopPulse } = usePulseAnimation('pulse', true);
  const progress = useSharedValue(0);
  
  // Helper function to map old status to new cancellable status
  const mapToCancellableStatus = (status: string): CancellableRideStatus | null => {
    const statusMapping: Record<string, CancellableRideStatus> = {
      'pending': 'searching',
      'accepted': 'assigned', 
      'confirmed': 'driver_en_route',
      'arrived': 'arrived',
      'in_progress': 'in_progress'
    };
    
    return statusMapping[status] || null;
  };

  // Helper function to validate and convert ride status
  const getCancellableStatus = (status: string): CancellableRideStatus | null => {
    return mapToCancellableStatus(status);
  };

  // Local state for driver location, chat, and cancellation dialog
  const [_driverLocation, setDriverLocation] = useState({ lat: 40.7589, lon: -73.9851 });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showDriverCancelledDialog, setShowDriverCancelledDialog] = useState(false);
  const [_pendingActions, setPendingActions] = useState<Array<{type: string, data: unknown, timestamp: number}>>([]);

  // Derived ETA value instead of state to avoid synchronous setState
  const eta = Math.round((currentRide?.tracking?.estimatedArrival || 300) / 60); // Convert seconds to minutes

  // Connection status indicator
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return ds.colors.success;
      case 'connecting': return ds.colors.warning;
      case 'reconnecting': return ds.colors.warning;
      case 'disconnected': return ds.colors.danger;
      default: return ds.colors.textSecondary;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live Tracking';
      case 'connecting': return 'Connecting...';
      case 'reconnecting': return 'Reconnecting...';
      case 'disconnected': return 'Offline';
      default: return 'Unknown';
    }
  };

  // Handle ride completion - defined before useEffect that uses it
  const handleRideComplete = useCallback(() => {
    trigger('confirm');
    play('success');
    
    // Navigate to ride completion screen
    // Cleanup will be handled by the completion screen when user dismisses it
    router.push('/(rider)/ride-completion');
  }, [trigger, play, router]);

  // Update ETA progress animation from real-time tracking data
  useEffect(() => {
    if (currentRide?.tracking?.estimatedArrival) {
      const etaMinutes = Math.round(currentRide.tracking.estimatedArrival / 60);
      
      // Animate progress based on ETA
      const progressDuration = Math.max(etaMinutes * 60000, 10000); // At least 10 seconds
      progress.value = withTiming(1, { duration: progressDuration, easing: Easing.linear });
    }
  }, [currentRide?.tracking?.estimatedArrival, progress]);

  // Process pending actions when connection is restored
  const processPendingActions = useCallback(() => {
    // Use functional update to access current state without recreating callback
    setPendingActions(currentActions => {
      if (currentActions.length === 0) return [];
      
      const now = Date.now();
      const ACTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      log.info('Processing pending actions after reconnection', {
        event: 'process_pending_actions',
        component: 'activeRide',
        actionCount: currentActions.length,
      });
      
      // Filter and process valid (non-stale) actions
      const validActions = currentActions.filter(action => {
        const age = now - action.timestamp;
        if (age > ACTION_TIMEOUT) {
          log.warn('Discarding stale pending action', {
            event: 'discard_stale_action',
            component: 'activeRide',
            actionType: action.type,
            age: Math.round(age / 1000), // age in seconds
          });
          return false;
        }
        return true;
      });
      
      // Process each valid action
      validActions.forEach(action => {
        switch (action.type) {
          case 'cancel_ride':
            // Retry ride cancellation
            if (currentRide?.id) {
              cancelRide(currentRide.id, 'Network interruption - retrying cancellation');
            }
            break;
          case 'refresh_status':
            // Refresh ride status
            refreshRideStatus();
            break;
          default:
            log.warn('Unknown pending action type', {
              event: 'unknown_pending_action',
              component: 'activeRide',
              actionType: action.type,
            });
        }
      });
      
      // Return empty array to clear all actions (processed and stale)
      return [];
    });
  }, [currentRide, cancelRide, refreshRideStatus, setPendingActions]);

  // Handle connection status changes
  useEffect(() => {
    if (connectionStatus === 'disconnected' && currentRide) {
      setConnectionError('Connection lost. Showing last known location.');
    } else if (connectionStatus === 'connected') {
      setConnectionError(null);
      // Request fresh data when reconnected
      refreshRideStatus();
      // Process any pending actions from network interruption
      processPendingActions();
    }
  }, [connectionStatus, currentRide, refreshRideStatus, processPendingActions]);

  // Initialize animations and real-time tracking
  useEffect(() => {
    if (currentRide) {
      // Animate card entrance
      animateCardIn();
      
      // Start pulse animation for live tracking when connected
      if (isConnected) {
        startPulse();
      }

      return () => {
        stopPulse();
      };
    }
    return undefined;
  }, [currentRide, animateCardIn, startPulse, stopPulse, isConnected]);

  const progressFillAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleCallDriver = () => {
    trigger('tap');
    play('tapSoft');
    if (currentRide?.driver?.phone) {
      Alert.alert(
        'Call Driver',
        `Would you like to call ${currentRide.driver.name} at ${currentRide.driver.phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              trigger('confirm');
              play('success');
              // In a real app, this would open the phone dialer
              log.info('Calling driver', { event: 'call_driver', component: 'activeRide', driverPhone: currentRide.driver?.phone || 'N/A' });
            }
          }
        ]
      );
    }
  };

  const handleOpenChat = () => {
    if (!currentRide) return;
    trigger('tap');
    play('tapSoft');
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    trigger('tap');
    play('tapSoft');
    setIsChatOpen(false);
  };

  const handleCancelRide = () => {
    trigger('tap');
    play('tapSoft');
    setShowCancellationDialog(true);
  };

  const handleConfirmCancellation = async () => {
    setShowCancellationDialog(false);
    try {
      trigger('error');
      play('warning');
      await cancelRide(currentRide?.id || '');
      onRideCancel();
    } catch (error) {
      log.error('Failed to cancel ride', { event: 'cancel_ride_failed', component: 'activeRide' }, error);
      Alert.alert('Error', 'Failed to cancel ride. Please try again.');
    }
  };

  const handleDismissCancellation = () => {
    setShowCancellationDialog(false);
  };

  const handleDriverCancelledDismiss = () => {
    setShowDriverCancelledDialog(false);
    // Navigate back to home to rebook
    onRideCancel();
  };

  const getStatusText = () => {
    if (!currentRide) return 'Loading...';
    switch (currentRide.status) {
      case 'accepted':
        return 'Driver Assigned';
      case 'confirmed':
        return 'Driver Confirmed';
      case 'arrived':
        return 'Driver Arriving';
      case 'in_progress':
        return 'En Route';
      case 'completed':
        return 'Trip Complete';
      case 'cancelled':
        return 'Trip Cancelled';
      default:
        return 'Preparing';
    }
  };

  const getStatusConfig = () => {
    if (!currentRide) {
      return {
        label: 'Preparing ride',
        accentColor: ds.colors.textSecondary,
      };
    }

    switch (currentRide.status) {
      case 'pending':
      case 'accepted':
        return {
          label: 'CONNECTING TO FLEET',
          accentColor: ds.colors.primary,
        };
      case 'confirmed':
        return {
          label: `DRIVER CONFIRMED${eta ? ` • ${eta} MIN` : ''}`,
          accentColor: ds.colors.success,
        };
      case 'arrived':
        return {
          label: eta === 0 ? 'DRIVER HERE' : `ARRIVING IN ${eta} MIN`,
          accentColor: ds.colors.secondary,
        };
      case 'in_progress':
        return {
          label: 'HEADING TO DESTINATION',
          accentColor: ds.colors.primary,
        };
      case 'completed':
        return {
          label: 'DESTINATION REACHED',
          accentColor: ds.colors.textPrimary,
        };
      case 'cancelled':
        return {
          label: 'RIDE CANCELLED',
          accentColor: ds.colors.danger,
        };
      default:
        return {
          label: 'RIDE ACTIVE',
          accentColor: ds.colors.textPrimary,
        };
    }
  };

  if (isChatOpen && currentRide) {
    return (
      <ChatInterface
        rideId={currentRide.id}
        driverName={currentRide.driver?.name}
        onClose={handleCloseChat}
      />
    );
  }

  if (isLoadingRide || !currentRide) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <LinearGradient
          colors={[colors.backgroundDeep, colors.background]}
          style={styles.background}
        />
        <View 
          style={styles.loadingContainer}
          accessibilityLabel="Loading ride details"
          accessibilityRole="progressbar"
        >
          <CircularProgress size={60} progress={0.5} />
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={[colors.backgroundDeep, colors.background]}
        style={styles.background}
      />
      
      <Animated.View style={[styles.content, cardAnimatedStyle]}>
        {(currentRide.status === 'pending' || currentRide.status === 'accepted') && (
          <Animated.View
            style={[styles.searchingOverlay, pulseAnimatedStyle]}
            pointerEvents="none"
          >
            <View style={styles.searchingCircleOuter} />
            <View style={styles.searchingCircleInner} />
          </Animated.View>
        )}
        
        {/* Header */}
        <View style={styles.header} accessibilityRole="header">
          {/* Connection Status */}
          <View 
            style={styles.connectionStatus}
            accessibilityLabel={`Connection status: ${getConnectionStatusText()}`}
            accessibilityRole="text"
          >
            <View style={[styles.connectionDot, { backgroundColor: getConnectionStatusColor() }]} />
            <Text style={[styles.connectionText, { color: getConnectionStatusColor() }]}>
              {getConnectionStatusText()}
            </Text>
          </View>
          
          {(() => {
            const { label, accentColor } = getStatusConfig();
            return (
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.statusLabel, { color: accentColor }]}>
                  {label}
                </Text>
              </View>
            );
          })()}
          <Text style={styles.title}>{getStatusText()}</Text>
          <Text style={styles.subtitle}>{eta} min away</Text>
        </View>

        {/* Connection Error Alert */}
        {connectionError && (
          <GlassCard elevated style={styles.errorCard}>
            <View style={styles.errorContent}>
              <Icon name="activity" size={20} color={ds.colors.warning} />
              <Text style={styles.errorText}>{connectionError}</Text>
              <TouchableOpacity 
                onPress={() => refreshRideStatus()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* Driver Info Card */}
        <GlassCard elevated interactive style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Icon name="profile" size={32} color={ds.colors.textSecondary} />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{currentRide.driver?.name || 'Unknown Driver'}</Text>
              <View style={styles.ratingContainer}>
                <Icon name="location" size={14} color={ds.colors.secondary} />
                <Text style={styles.driverRating}>{currentRide.driver?.rating || 0} • Premium</Text>
              </View>
              <Text style={styles.driverVehicle}>
                {currentRide.driver?.vehicle?.make || 'Unknown'} {currentRide.driver?.vehicle?.model || 'Vehicle'}
              </Text>
              <Text style={styles.plateText}>{currentRide.driver?.vehicle?.licensePlate || 'N/A'}</Text>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
              <Icon name="profile" size={20} color={ds.colors.primary} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Route Progress Card */}
        <GlassCard elevated interactive style={styles.progressCard}>
          <View style={styles.routeInfo}>
            <View style={styles.locationPoint}>
              <Icon name="location" size={20} color={ds.colors.primary} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationAddress}>{currentRide.pickup.address}</Text>
              </View>
            </View>
            
            <View style={styles.progressLine}>
              <Animated.View style={[styles.progressFill, progressFillAnimatedStyle]} />
            </View>
            
            <View style={styles.locationPoint}>
              <Icon name="location" size={20} color={ds.colors.secondary} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationAddress}>{currentRide.destination.address}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.rideStats} accessibilityRole="list" accessibilityLabel="Ride statistics">
            <View style={styles.stat} accessibilityLabel={`Duration: ${currentRide.duration} minutes`}>
              <Text style={styles.statValue}>{currentRide.duration} min</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.stat} accessibilityLabel={`Distance: ${currentRide.distance} miles`}>
              <Text style={styles.statValue}>{currentRide.distance} mi</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.stat} accessibilityLabel={`Price: $${currentRide.price.toFixed(2)}`}>
              <Text style={styles.statValue}>${currentRide.price.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Price</Text>
            </View>
          </View>
        </GlassCard>

        {/* Live Tracking Indicator */}
        <Animated.View 
          style={[styles.trackingIndicator, pulseAnimatedStyle]}
          accessibilityLabel="Live tracking active"
          accessibilityRole="text"
        >
          <Icon name="location" size={24} color={ds.colors.primary} />
          <Text style={styles.trackingText}>Live tracking active</Text>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actions} accessibilityRole="toolbar" accessibilityLabel="Ride actions">
          <PremiumButton
            variant="secondary"
            size="lg"
            onPress={handleOpenChat}
            style={styles.messageButton}
            disabled={!currentRide.driver}
            accessibilityLabel={t('active_ride.message')}
            accessibilityHint="Open chat with your driver"
            accessibilityRole="button"
          >
            {t('active_ride.message')}
          </PremiumButton>
          <PremiumButton
            variant="ghost"
            size="lg"
            onPress={handleCancelRide}
            style={styles.cancelButton}
            disabled={
              currentRide.status === 'in_progress' ||
              currentRide.status === 'completed' ||
              currentRide.status === 'cancelled'
            }
            accessibilityLabel={t('active_ride.cancel_ride')}
            accessibilityHint="Cancel your current ride request"
            accessibilityRole="button"
          >
            {t('active_ride.cancel_ride')}
          </PremiumButton>
        </View>
      </Animated.View>

      {/* Cancellation Confirmation Dialog */}
      {(() => {
        const cancellableStatus = getCancellableStatus(currentRide.status || '');
        if (!cancellableStatus) return null;
        
        return (
          <CancellationDialog
            visible={showCancellationDialog}
            onDismiss={handleDismissCancellation}
            onConfirm={handleConfirmCancellation}
            rideStatus={cancellableStatus}
            cancellationFee={
              cancellableStatus === 'arrived' ? 5 : 
              cancellableStatus === 'driver_en_route' ? 2.50 : 
              cancellableStatus === 'assigned' ? 2.50 : 0
            }
            ridePrice={currentRide.price || 0}
            driverEnRouteTime={0} // TODO: Calculate from actual driver tracking data
          />
        );
      })()}

      {/* Driver Cancellation Dialog */}
      <Modal
        visible={showDriverCancelledDialog}
        transparent
        animationType="fade"
        onRequestClose={handleDriverCancelledDismiss}
      >
        <Pressable style={styles.overlay} onPress={handleDriverCancelledDismiss}>
          <Animated.View 
            style={styles.dialogContainer}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <GlassCard elevated style={styles.dialog}>
                <View style={styles.iconContainer}>
                  <View style={styles.errorIcon}>
                    <Icon name="activity" size={32} color={ds.colors.danger} />
                  </View>
                </View>

                <Text style={styles.title}>Driver Cancelled</Text>
                <Text style={styles.subtitle}>
                  Your driver had to cancel this ride. We apologize for the inconvenience.
                </Text>

                <View style={styles.reasonContainer}>
                  <Text style={styles.reasonTitle}>What happened?</Text>
                  <Text style={styles.reasonText}>
                    Drivers may cancel due to emergencies, vehicle issues, or unexpected circumstances.
                  </Text>
                </View>

                <View style={styles.actions}>
                  <PremiumButton
                    onPress={handleDriverCancelledDismiss}
                    variant="primary"
                    size="md"
                    style={styles.rebookButton}
                  >
                    Find New Driver
                  </PremiumButton>
                </View>
              </GlassCard>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ds.spacing.lg,
  },
  loadingText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  content: {
    flex: 1,
    padding: ds.spacing.lg,
    gap: ds.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: ds.spacing.xl,
    paddingBottom: ds.spacing.lg,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.surface,
    marginBottom: ds.spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: ds.spacing.xs,
  },
  statusLabel: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    letterSpacing: ds.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.xs,
  },
  subtitle: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  driverCard: {
    padding: ds.spacing.lg,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ds.spacing.md,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ds.spacing.xs,
    marginBottom: ds.spacing.xs,
  },
  plateText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    marginTop: ds.spacing.xs,
  },
  driverRating: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    marginLeft: ds.spacing.xs,
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.lg,
    backgroundColor: ds.colors.primary + '20',
    borderRadius: ds.radius.lg,
    marginBottom: ds.spacing.lg,
  },
  trackingText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.primary,
    marginLeft: ds.spacing.sm,
    fontWeight: ds.typography.weight.medium,
  },
  searchingOverlay: {
    position: 'absolute',
    top: ds.spacing.xxxl,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingCircleOuter: {
    width: SEARCH_PULSE_SIZE,
    height: SEARCH_PULSE_SIZE,
    borderRadius: SEARCH_PULSE_SIZE / 2,
    borderWidth: 1,
    borderColor: ds.colors.glowCyan,
    opacity: 0.25,
  },
  searchingCircleInner: {
    position: 'absolute',
    width: SEARCH_PULSE_SIZE * 0.7,
    height: SEARCH_PULSE_SIZE * 0.7,
    borderRadius: (SEARCH_PULSE_SIZE * 0.7) / 2,
    borderWidth: 1,
    borderColor: ds.colors.glowMagenta,
    opacity: 0.4,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  driverVehicle: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  progressCard: {
    padding: ds.spacing.lg,
  },
  routeInfo: {
    gap: ds.spacing.lg,
  },
  locationPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    textTransform: 'uppercase',
  },
  locationAddress: {
    fontSize: ds.typography.size.body,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  progressLine: {
    height: 2,
    backgroundColor: ds.colors.border,
    marginLeft: ds.spacing.xxxl,
    width: '80%',
    alignSelf: 'center',
    borderRadius: ds.radius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ds.colors.primary,
    borderRadius: ds.radius.sm,
  },
  rideStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: ds.spacing.lg,
    paddingTop: ds.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  statLabel: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: ds.spacing.md,
    marginTop: 'auto',
    paddingBottom: ds.spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  messageButton: {
    flex: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.sm,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: ds.spacing.xs,
  },
  connectionText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.semibold,
  },
  errorCard: {
    backgroundColor: `${ds.colors.warning}10`,
    borderColor: ds.colors.warning,
    borderWidth: 1,
    marginBottom: ds.spacing.md,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  errorText: {
    flex: 1,
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  retryButton: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    backgroundColor: ds.colors.warning,
    borderRadius: ds.radius.sm,
  },
  retryText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing.lg,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 380,
  },
  dialog: {
    padding: ds.spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: ds.spacing.lg,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${ds.colors.danger}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonContainer: {
    backgroundColor: `${ds.colors.surface}50`,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
  },
  reasonTitle: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.sm,
  },
  reasonText: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    lineHeight: 18,
  },
  rebookButton: {
    flex: 1,
  },
});
