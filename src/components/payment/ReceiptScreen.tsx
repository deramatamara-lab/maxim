/**
 * Receipt Screen Component
 * Displays detailed payment receipts with email functionality
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ds } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { Icon } from '../ui/Icon';
import { RideRating } from '../ride/RideRating';
import { Receipt } from '../../services/paymentService';
import { log } from '../../utils/logger';

interface ReceiptScreenProps {
  receipt: Receipt;
  onClose?: () => void;
  onEmailReceipt?: (email: string) => Promise<void>;
  onRefund?: (amount?: number, reason?: string) => Promise<void>;
  onRatingSubmit?: (rating: number, tags: string[]) => Promise<void>;
}

export default function ReceiptScreen({ 
  receipt, 
  onClose, 
  onEmailReceipt,
  onRefund,
  onRatingSubmit 
}: ReceiptScreenProps) {
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackTags, setFeedbackTags] = useState<string[]>([]);
  const [showRating, setShowRating] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeValue = useSharedValue(0);

  useEffect(() => {
    fadeValue.value = withTiming(1, { duration: 400 });
  }, [fadeValue]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  const handleEmailReceipt = async () => {
    if (!emailInput.trim()) {
      Alert.alert('Email Required', 'Please enter a valid email address');
      return;
    }

    setIsEmailing(true);
    
    try {
      await onEmailReceipt?.(emailInput.trim());
      Alert.alert('Success', 'Receipt has been emailed to you');
      setShowEmailForm(false);
      setEmailInput('');
    } catch {
      Alert.alert('Error', 'Failed to email receipt. Please try again.');
    } finally {
      setIsEmailing(false);
    }
  };

  const handleShareReceipt = async () => {
    try {
      const receiptText = generateReceiptText();
      await Share.share({
        message: receiptText,
        title: 'Aura Ride Receipt',
      });
    } catch (error) {
      log.error('Failed to share receipt', { event: 'share_receipt_failed', component: 'receiptScreen' }, error);
    }
  };

  const handleRefund = () => {
    Alert.alert(
      'Request Refund',
      'Are you sure you want to request a refund for this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Refund', 
          style: 'destructive',
          onPress: () => onRefund?.()
        },
      ]
    );
  };

  const handleRatingChange = useCallback((newRating: number, tags: string[]) => {
    setRating(newRating);
    setFeedbackTags(tags);
  }, []);

  const handleRatingSubmit = useCallback(async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please rate your ride before continuing');
      return;
    }

    try {
      await onRatingSubmit?.(rating, feedbackTags);
      setShowRating(false);
      Alert.alert('Thank You!', 'Your feedback helps us improve our service.');
    } catch (error) {
      log.error('Failed to submit rating', { event: 'rating_submit_failed', component: 'receiptScreen' }, error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
  }, [rating, feedbackTags, onRatingSubmit]);

  const generateReceiptText = () => {
    return `
Aura Ride Receipt
================
Date: ${formatDate(receipt.createdAt)}
Time: ${formatTime(receipt.createdAt)}

Ride Details:
- From: ${receipt.pickupAddress}
- To: ${receipt.destinationAddress}
- Duration: ${formatDuration(receipt.duration)}
- Distance: ${receipt.distance.toFixed(1)} mi

Fare Breakdown:
${receipt.fare.breakdown?.map((item: { description: string; amount: number }) => 
  `- ${item.description}: ${formatCurrency(item.amount)}`
).join('\n') || `
- Base Fare: ${formatCurrency(receipt.fare.base)}
- Distance: ${formatCurrency(receipt.fare.distance)}
- Time: ${formatCurrency(receipt.fare.time)}
${receipt.fare.surge ? `- Surge: ${formatCurrency(receipt.fare.surge)}` : ''}
${receipt.fare.tolls ? `- Tolls: ${formatCurrency(receipt.fare.tolls)}` : ''}
${receipt.fare.taxes ? `- Taxes: ${formatCurrency(receipt.fare.taxes)}` : ''}
${receipt.fare.tip ? `- Tip: ${formatCurrency(receipt.fare.tip)}` : ''}
`.trim()}

Total: ${formatCurrency(receipt.fare.total)}
Payment Method: ${receipt.paymentMethod.brand} •••• ${receipt.paymentMethod.last4}

Thank you for riding with Aura!
    `.trim();
  };

  const downloadPDF = () => {
    // In a real implementation, this would generate and download a PDF
    Alert.alert('Download PDF', 'PDF receipt would be downloaded here');
  };

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Icon name="chevronRight" size={24} color={ds.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Receipt</Text>
          <Pressable style={styles.moreButton} onPress={handleShareReceipt}>
            <Icon name="menu" size={24} color={ds.colors.text} />
          </Pressable>
        </View>

        {/* Receipt Card */}
        <GlassCard elevated style={styles.receiptCard}>
          {/* Status Badge */}
          <View style={[
            styles.statusBadge,
            receipt.status === 'completed' ? styles.completedBadge : styles.cancelledBadge,
          ]}>
            <Icon 
              name={receipt.status === 'completed' ? 'location' : 'profile'} 
              size={16} 
              color={receipt.status === 'completed' ? ds.colors.secondary : ds.colors.error} 
            />
            <Text style={[
              styles.statusText,
              receipt.status === 'completed' ? styles.completedText : styles.cancelledText,
            ]}>
              {receipt.status === 'completed' ? 'Completed' : 'Cancelled'}
            </Text>
          </View>

          {/* Ride Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ride Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(receipt.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formatTime(receipt.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{formatDuration(receipt.duration)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{receipt.distance.toFixed(1)} mi</Text>
            </View>
          </View>

          {/* Route */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route</Text>
            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <Icon name="location" size={16} color={ds.colors.secondary} />
                <Text style={styles.routeText}>{receipt.pickupAddress}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <Icon name="location" size={16} color={ds.colors.primary} />
                <Text style={styles.routeText}>{receipt.destinationAddress}</Text>
              </View>
            </View>
          </View>

          {/* Driver Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver</Text>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Icon name="profile" size={24} color={ds.colors.textSecondary} />
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{receipt.driverName}</Text>
                <Text style={styles.riderName}>Rider: {receipt.riderName}</Text>
              </View>
            </View>
          </View>

          {/* Fare Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fare Breakdown</Text>
            {receipt.fare.breakdown?.map((item: { description: string; amount: number }, index: number) => (
              <View key={index} style={styles.fareRow}>
                <Text style={styles.fareLabel}>{item.description}</Text>
                <Text style={styles.fareAmount}>
                  {item.amount > 0 ? formatCurrency(item.amount) : '—'}
                </Text>
              </View>
            )) || (
              <>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Base Fare</Text>
                  <Text style={styles.fareAmount}>{formatCurrency(receipt.fare.base)}</Text>
                </View>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Distance</Text>
                  <Text style={styles.fareAmount}>{formatCurrency(receipt.fare.distance)}</Text>
                </View>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Time</Text>
                  <Text style={styles.fareAmount}>{formatCurrency(receipt.fare.time)}</Text>
                </View>
                {receipt.fare.surge && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Surge</Text>
                    <Text style={styles.fareAmount}>{formatCurrency(receipt.fare.surge)}</Text>
                  </View>
                )}
                {receipt.fare.tolls && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Tolls</Text>
                    <Text style={styles.fareAmount}>{formatCurrency(receipt.fare.tolls)}</Text>
                  </View>
                )}
                {receipt.fare.taxes && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Taxes</Text>
                    <Text style={styles.fareAmount}>{formatCurrency(receipt.fare.taxes)}</Text>
                  </View>
                )}
                {receipt.fare.tip && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Tip</Text>
                    <Text style={styles.fareAmount}>{formatCurrency(receipt.fare.tip)}</Text>
                  </View>
                )}
              </>
            )}
            <View style={styles.fareDivider} />
            <View style={styles.fareRow}>
              <Text style={styles.fareTotalLabel}>Total</Text>
              <Text style={styles.fareTotalAmount}>{formatCurrency(receipt.fare.total)}</Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentMethod}>
              <Icon name="location" size={20} color={ds.colors.textSecondary} />
              <Text style={styles.paymentText}>
                {receipt.paymentMethod.brand} •••• {receipt.paymentMethod.last4}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Rating Section */}
        {showRating && receipt.status === 'completed' && (
          <RideRating 
            onRatingChange={handleRatingChange}
            initialRating={rating}
            initialTags={feedbackTags}
          />
        )}

        {/* Rating Submit Button */}
        {showRating && receipt.status === 'completed' && rating > 0 && (
          <PremiumButton
            onPress={handleRatingSubmit}
            variant="primary"
            size="lg"
            style={styles.submitButton}
          >
            Submit Feedback
          </PremiumButton>
        )}

        {/* Email Form */}
        {showEmailForm && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <GlassCard elevated style={styles.emailCard}>
              <Text style={styles.emailTitle}>Email Receipt</Text>
              <View style={styles.emailInputContainer}>
                <TextInput
                  style={styles.emailInput}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="Enter email address"
                  placeholderTextColor={ds.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.emailActions}>
                <PremiumButton
                  variant="secondary"
                  size="md"
                  onPress={() => setShowEmailForm(false)}
                  style={styles.emailCancelButton}
                >
                  Cancel
                </PremiumButton>
                <PremiumButton
                  variant="primary"
                  size="md"
                  onPress={handleEmailReceipt}
                  loading={isEmailing}
                  style={styles.emailSendButton}
                >
                  Send
                </PremiumButton>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PremiumButton
            variant="secondary"
            size="lg"
            onPress={() => setShowEmailForm(true)}
            style={styles.actionButton}
          >
            <Icon name="profile" size={16} color={ds.colors.primary} />
            Email Receipt
          </PremiumButton>
          
          <PremiumButton
            variant="secondary"
            size="lg"
            onPress={downloadPDF}
            style={styles.actionButton}
          >
            <Icon name="location" size={16} color={ds.colors.primary} />
            Download PDF
          </PremiumButton>
          
          {receipt.status === 'completed' && onRefund && (
            <PremiumButton
              variant="ghost"
              size="lg"
              onPress={handleRefund}
              style={styles.refundButton}
            >
              Request Refund
            </PremiumButton>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// Add missing import
import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ds.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.glassBorder,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptCard: {
    margin: ds.spacing.lg,
    padding: ds.spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.md,
    marginBottom: ds.spacing.lg,
  },
  completedBadge: {
    backgroundColor: ds.colors.secondary + '20',
  },
  cancelledBadge: {
    backgroundColor: ds.colors.error + '20',
  },
  statusText: {
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.medium,
    fontFamily: ds.typography.family,
    marginLeft: ds.spacing.xs,
  },
  completedText: {
    color: ds.colors.secondary,
  },
  cancelledText: {
    color: ds.colors.error,
  },
  section: {
    marginBottom: ds.spacing.lg,
  },
  sectionTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing.sm,
  },
  infoLabel: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  infoValue: {
    fontSize: ds.typography.size.body,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
  },
  routeContainer: {
    gap: ds.spacing.md,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  routeText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: ds.spacing.lg,
    backgroundColor: ds.colors.glassBorder,
    marginLeft: ds.spacing.xs,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  riderName: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
    marginTop: ds.spacing.xs,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing.xs,
  },
  fareLabel: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  fareAmount: {
    fontSize: ds.typography.size.body,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
  },
  fareDivider: {
    height: 1,
    backgroundColor: ds.colors.glassBorder,
    marginVertical: ds.spacing.sm,
  },
  fareTotalLabel: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  fareTotalAmount: {
    fontSize: ds.typography.size.bodyLg,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  paymentText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
  },
  emailCard: {
    margin: ds.spacing.lg,
    padding: ds.spacing.lg,
  },
  emailTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    marginBottom: ds.spacing.md,
  },
  emailInputContainer: {
    marginBottom: ds.spacing.md,
  },
  emailInput: {
    backgroundColor: ds.colors.backgroundAlt,
    borderRadius: ds.radius.md,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    fontSize: ds.typography.size.body,
    color: ds.colors.text,
    fontFamily: ds.typography.family,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
  },
  emailActions: {
    flexDirection: 'row',
    gap: ds.spacing.md,
  },
  emailCancelButton: {
    flex: 1,
  },
  emailSendButton: {
    flex: 2,
  },
  submitButton: {
    margin: ds.spacing.lg,
  },
  actions: {
    padding: ds.spacing.lg,
    gap: ds.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  refundButton: {
    marginTop: ds.spacing.lg,
  },
});
