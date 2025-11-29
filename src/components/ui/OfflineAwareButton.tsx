/**
 * Offline-Aware Button Component
 * Automatically disables network-dependent actions when offline
 * Provides clear feedback and graceful degradation
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { PremiumButton } from './PremiumButton';
import { Icon } from './Icon';
import { ds } from '@/constants/theme';
import { useOfflineUX, COMMON_OFFLINE_ACTIONS } from '@/hooks/useOfflineUX';

interface OfflineAwareButtonProps {
  title: string;
  actionId: string;
  onPress: () => Promise<void> | void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  requiresNetwork?: boolean;
  fallbackAction?: () => void;
  showOfflineIndicator?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export function OfflineAwareButton({
  title,
  actionId,
  onPress,
  variant = 'primary',
  size = 'md',
  requiresNetwork = true,
  fallbackAction,
  showOfflineIndicator = true,
  disabled = false,
  loading = false,
  icon: _icon, // Not used since PremiumButton doesn't support icon prop
  style,
}: OfflineAwareButtonProps) {
  const offlineUX = useOfflineUX();

  // Register the action on mount
  React.useEffect(() => {
    const commonAction = COMMON_OFFLINE_ACTIONS[actionId];
    if (commonAction || requiresNetwork) {
      offlineUX.registerAction({
        // Spread common action properties first
        ...(commonAction || {}),
        // Then override with specific props
        id: actionId,
        label: title,
        requiresNetwork,
        gracefulDegradation: fallbackAction,
      });
    }

    return () => {
      offlineUX.unregisterAction(actionId);
    };
  }, [actionId, title, requiresNetwork, fallbackAction, offlineUX]);

  const canPerform = offlineUX.canPerformAction(actionId);
  const isDisabled = disabled || loading || !canPerform;

  const handlePress = async () => {
    if (isDisabled) return;

    const success = await offlineUX.performAction(
      actionId,
      onPress,
      {
        showOfflineMessage: true,
        fallbackAction,
      }
    );

    if (!success && !offlineUX.isOnline) {
      // Additional offline handling if needed
    }
  };

  const getButtonTitle = () => {
    if (!offlineUX.isOnline && requiresNetwork) {
      return `${title} (Offline)`;
    }
    return title;
  };

  const getButtonVariant = () => {
    if (!offlineUX.isOnline && requiresNetwork) {
      return 'ghost' as const;
    }
    return variant;
  };

  const buttonStyle = !canPerform ? [styles.offlineButton, style] : style;

  return (
    <View style={[styles.container, style]}>
      <PremiumButton
        onPress={handlePress}
        variant={getButtonVariant()}
        size={size}
        disabled={isDisabled}
        loading={loading}
        style={buttonStyle}
      >
        {getButtonTitle()}
      </PremiumButton>
      
      {showOfflineIndicator && !offlineUX.isOnline && requiresNetwork && (
        <View style={styles.offlineIndicator}>
          <Icon name="activity" size={12} color={ds.colors.textSecondary} />
          <Text style={styles.offlineText}>
            Will queue when offline
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  offlineButton: {
    opacity: 0.6,
    borderColor: ds.colors.textSecondary,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.xs,
    marginTop: ds.spacing.xs,
  },
  offlineText: {
    fontSize: ds.typography.size.micro,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
});

export default OfflineAwareButton;
