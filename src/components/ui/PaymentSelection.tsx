/**
 * Payment Selection Component
 * Displays available payment methods with selection, addition, and management capabilities
 * Positioned after price confirmation and before ride request in rider journey
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { ds } from '@/constants/theme';
import { GlassCard } from './GlassCard';
import { PremiumButton } from './PremiumButton';
import { Icon, type IconName } from './Icon';
import { useHaptics } from '@/hooks/useHaptics';
import { useSound } from '@/hooks/useSound';
import { type RiderJourneyError } from '@/types/riderJourney';
import { type PaymentMethodInfo } from '@/api/PaymentServiceFactory';
import { CardPaymentMethod, DigitalWalletPaymentMethod } from '@/api/payment';

export interface PaymentSelectionProps {
  // Payment Methods
  paymentMethods: PaymentMethodInfo[];
  selectedPaymentMethodId: string | null;
  
  // Actions
  onSelectPaymentMethod: (id: string) => void;
  onAddPaymentMethod: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onBack?: () => void;
  
  // State
  isLoading?: boolean;
  error?: RiderJourneyError | null;
  
  // Configuration
  allowCash?: boolean;
  allowAddNew?: boolean;
  required?: boolean;
}

export const PaymentSelection: React.FC<PaymentSelectionProps> = ({
  paymentMethods,
  selectedPaymentMethodId,
  onSelectPaymentMethod,
  onAddPaymentMethod,
  onConfirm,
  onCancel,
  onBack,
  isLoading = false,
  error = null,
  allowCash = true,
  allowAddNew = true,
  required = true,
}) => {
  const { trigger: haptics } = useHaptics();
  const { play } = useSound();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ds.motion.duration.entrance,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSelectPaymentMethod = (id: string) => {
    haptics('tap');
    play('tapSoft');
    onSelectPaymentMethod(id);
  };

  const handleAddPaymentMethod = () => {
    haptics('confirm');
    play('success');
    onAddPaymentMethod();
  };

  const handleConfirm = () => {
    if (required && !selectedPaymentMethodId) {
      return;
    }
    haptics('confirm');
    play('success');
    onConfirm();
  };

  const handleCancel = () => {
    haptics('tap');
    play('tapSoft');
    onCancel();
  };

  const handleBack = () => {
    haptics('tap');
    play('tapSoft');
    onBack?.();
  };

  const getPaymentMethodIcon = (type: PaymentMethodInfo['type']): IconName => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        return 'search'; // Use available icon as placeholder
      case 'digital_wallet':
        return 'search'; // Use available icon as placeholder
      case 'cash':
        return 'search'; // Use available icon as placeholder
      default:
        return 'search';
    }
  };

  const getPaymentMethodDisplayName = (method: PaymentMethodInfo) => {
    switch (method.type) {
      case 'credit_card':
      case 'debit_card': {
        const card = method as CardPaymentMethod;
        return `${card.brand?.toUpperCase() || 'CARD'} •••• ${card.last4 || '****'}`;
      }
      case 'digital_wallet': {
        const wallet = method as DigitalWalletPaymentMethod;
        return wallet.provider?.replace('_', ' ').toUpperCase() || 'DIGITAL WALLET';
      }
      case 'cash':
        return 'Cash';
      default:
        return 'Unknown Payment Method';
    }
  };

  const getPaymentMethodSubtitle = (method: PaymentMethodInfo) => {
    switch (method.type) {
      case 'credit_card':
      case 'debit_card': {
        const card = method as CardPaymentMethod;
        if (card.expiryMonth && card.expiryYear) {
          return `Expires ${card.expiryMonth}/${card.expiryYear}`;
        }
        return 'Credit/Debit Card';
      }
      case 'digital_wallet': {
        const wallet = method as DigitalWalletPaymentMethod;
        return wallet.email || 'Digital Wallet';
      }
      case 'cash':
        return 'Pay driver directly';
      default:
        return '';
    }
  };

  const renderPaymentMethod = (method: PaymentMethodInfo) => {
    const isSelected = selectedPaymentMethodId === method.id;
    const isDefault = method.isDefault;

    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentMethodCard,
          isSelected && styles.selectedPaymentMethod,
          !method.isVerified && styles.unverifiedMethod,
        ]}
        onPress={() => handleSelectPaymentMethod(method.id)}
        disabled={!method.isVerified}
      >
        <View style={styles.paymentMethodContent}>
          <View style={styles.paymentMethodInfo}>
            <View style={styles.paymentMethodIcon}>
              <Icon 
                name={getPaymentMethodIcon(method.type)} 
                size={20} 
                color={isSelected ? ds.colors.primary : ds.colors.textSecondary} 
              />
            </View>
            <View style={styles.paymentMethodDetails}>
              <View style={styles.paymentMethodHeader}>
                <Text style={[
                  styles.paymentMethodName,
                  isSelected && styles.selectedPaymentMethodName
                ]}>
                  {getPaymentMethodDisplayName(method)}
                </Text>
                {isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.paymentMethodSubtitle}>
                {getPaymentMethodSubtitle(method)}
              </Text>
            </View>
          </View>
          <View style={styles.paymentMethodStatus}>
            {isSelected && (
              <Icon name="star" size={20} color={ds.colors.primary} />
            )}
            {!method.isVerified && (
              <Text style={styles.unverifiedText}>Unverified</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const canConfirm = !required || selectedPaymentMethodId !== null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <GlassCard elevated interactive style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="chevronRight" size={20} color={ds.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {required ? 'Select Payment Method' : 'Payment Method (Optional)'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Payment Methods List */}
        <ScrollView style={styles.paymentMethodsList} showsVerticalScrollIndicator={false}>
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="search" size={48} color={ds.colors.textMuted} />
              <Text style={styles.emptyStateTitle}>No Payment Methods</Text>
              <Text style={styles.emptyStateSubtitle}>
                Add a payment method to continue
              </Text>
            </View>
          ) : (
            <>
              {paymentMethods.map(renderPaymentMethod)}
              
              {allowCash && (
                <TouchableOpacity
                  style={[
                    styles.paymentMethodCard,
                    selectedPaymentMethodId === 'cash' && styles.selectedPaymentMethod,
                  ]}
                  onPress={() => handleSelectPaymentMethod('cash')}
                >
                  <View style={styles.paymentMethodContent}>
                    <View style={styles.paymentMethodInfo}>
                      <View style={styles.paymentMethodIcon}>
                        <Icon 
                          name="search" 
                          size={20} 
                          color={selectedPaymentMethodId === 'cash' ? ds.colors.primary : ds.colors.textSecondary} 
                        />
                      </View>
                      <View style={styles.paymentMethodDetails}>
                        <Text style={[
                          styles.paymentMethodName,
                          selectedPaymentMethodId === 'cash' && styles.selectedPaymentMethodName
                        ]}>
                          Cash
                        </Text>
                        <Text style={styles.paymentMethodSubtitle}>
                          Pay driver directly
                        </Text>
                      </View>
                    </View>
                    <View style={styles.paymentMethodStatus}>
                      {selectedPaymentMethodId === 'cash' && (
                        <Icon name="star" size={20} color={ds.colors.primary} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}

          {allowAddNew && (
            <TouchableOpacity
              style={styles.addPaymentMethodCard}
              onPress={handleAddPaymentMethod}
            >
              <View style={styles.addPaymentMethodContent}>
                <View style={styles.addPaymentMethodIcon}>
                  <Icon name="search" size={20} color={ds.colors.primary} />
                </View>
                <Text style={styles.addPaymentMethodText}>
                  Add Payment Method
                </Text>
                <Icon name="chevronRight" size={16} color={ds.colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Error Display */}
        {error && (
          <View style={styles.errorSection}>
            <View style={styles.errorContent}>
              <Icon name="settings" size={20} color={ds.colors.error} />
              <Text style={styles.errorMessage}>{error.userMessage}</Text>
            </View>
            {error.retryable && (
              <PremiumButton
                variant="secondary"
                size="sm"
                onPress={error.retryAction || (() => {})}
                loading={isLoading}
              >
                Retry
              </PremiumButton>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PremiumButton
            variant="secondary"
            size="lg"
            onPress={handleCancel}
            disabled={isLoading}
            style={styles.cancelButton}
          >
            Cancel
          </PremiumButton>
          
          <PremiumButton
            variant="primary"
            size="lg"
            onPress={handleConfirm}
            loading={isLoading}
            disabled={!canConfirm}
            style={styles.confirmButton}
          >
            {required ? 'Select Payment' : 'Continue'}
          </PremiumButton>
        </View>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: ds.spacing.lg,
  },
  card: {
    maxWidth: 400,
    alignSelf: 'center',
    maxHeight: '80%',
    padding: ds.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ds.spacing.lg,
  },
  backButton: {
    padding: ds.spacing.xs,
    borderRadius: ds.radius.sm,
    backgroundColor: ds.colors.surfaceElevated,
    transform: [{ rotate: '180deg' }],
  },
  title: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  paymentMethodsList: {
    flex: 1,
    marginBottom: ds.spacing.lg,
  },
  paymentMethodCard: {
    backgroundColor: ds.colors.surfaceElevated,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.sm,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
  },
  selectedPaymentMethod: {
    borderColor: ds.colors.primary,
    backgroundColor: ds.colors.primary + '10',
  },
  unverifiedMethod: {
    opacity: 0.6,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: ds.radius.sm,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ds.spacing.md,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.xs,
  },
  paymentMethodName: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    marginRight: ds.spacing.sm,
  },
  selectedPaymentMethodName: {
    color: ds.colors.primary,
    fontWeight: ds.typography.weight.semibold,
  },
  defaultBadge: {
    backgroundColor: ds.colors.secondary,
    paddingHorizontal: ds.spacing.xs,
    paddingVertical: 2,
    borderRadius: ds.radius.xs,
  },
  defaultBadgeText: {
    fontSize: ds.typography.size.micro,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.backgroundDeep,
  },
  paymentMethodSubtitle: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
  },
  paymentMethodStatus: {
    alignItems: 'center',
  },
  unverifiedText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.warning,
    fontWeight: ds.typography.weight.medium,
  },
  addPaymentMethodCard: {
    backgroundColor: ds.colors.surfaceElevated,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.sm,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    borderStyle: 'dashed',
  },
  addPaymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addPaymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: ds.radius.sm,
    backgroundColor: ds.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ds.spacing.md,
  },
  addPaymentMethodText: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.primary,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginTop: ds.spacing.md,
    marginBottom: ds.spacing.xs,
  },
  emptyStateSubtitle: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  errorSection: {
    backgroundColor: ds.colors.error + '10',
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
    borderWidth: 1,
    borderColor: ds.colors.error + '30',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.sm,
  },
  errorMessage: {
    fontSize: ds.typography.size.body,
    color: ds.colors.error,
    marginLeft: ds.spacing.sm,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: ds.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});
