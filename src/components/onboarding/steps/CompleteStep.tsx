/**
 * Complete Step
 * Final step of onboarding - success state and next steps
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ds } from '../../../constants/theme';
import { GlassCard } from '../../ui/GlassCard';
import { PremiumButton } from '../../ui/PremiumButton';
import { CustomIcon } from '../../ui/CustomIcon';

interface CompleteStepProps {
  onComplete: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
}

export const CompleteStep: React.FC<CompleteStepProps> = ({
  onComplete,
  onBack: _onBack,
  canGoBack: _canGoBack,
  isLastStep: _isLastStep,
}) => {
  const [scaleValue] = useState(new Animated.Value(0));
  const [opacityValue] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate success icon
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in content
    Animated.timing(opacityValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [scaleValue, opacityValue]);

  const handleGetStarted = () => {
    onComplete();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: opacityValue }]}>
        {/* Success Animation */}
        <View style={styles.successSection}>
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <GlassCard intensity={20} style={styles.successIcon}>
              <CustomIcon name="activity" size={48} color={ds.colors.success} />
            </GlassCard>
          </Animated.View>
          
          <Text style={styles.title}>Welcome to Aura!</Text>
          <Text style={styles.subtitle}>
            Your account is set up and ready to go
          </Text>
        </View>

        {/* What's Next */}
        <View style={styles.nextSection}>
          <Text style={styles.sectionTitle}>What&apos;s Next?</Text>
          
          <View style={styles.nextItem}>
            <GlassCard intensity={15} style={styles.nextIcon}>
              <CustomIcon name="location" size={24} color={ds.colors.primary} />
            </GlassCard>
            <View style={styles.nextText}>
              <Text style={styles.nextTitle}>Book Your First Ride</Text>
              <Text style={styles.nextDescription}>
                Enter your destination and choose your ride type
              </Text>
            </View>
          </View>
          
          <View style={styles.nextItem}>
            <GlassCard intensity={15} style={styles.nextIcon}>
              <CustomIcon name="profile" size={24} color={ds.colors.primary} />
            </GlassCard>
            <View style={styles.nextText}>
              <Text style={styles.nextTitle}>Complete Profile</Text>
              <Text style={styles.nextDescription}>
                Add payment methods and preferences anytime
              </Text>
            </View>
          </View>
          
          <View style={styles.nextItem}>
            <GlassCard intensity={15} style={styles.nextIcon}>
              <CustomIcon name="activity" size={24} color={ds.colors.primary} />
            </GlassCard>
            <View style={styles.nextText}>
              <Text style={styles.nextTitle}>Track Your Rides</Text>
              <Text style={styles.nextDescription}>
                View ride history and manage your account
              </Text>
            </View>
          </View>
        </View>

        {/* Verification Status */}
        <GlassCard intensity={15} style={styles.verificationCard}>
          <View style={styles.verificationHeader}>
            <CustomIcon name="settings" size={20} color={ds.colors.warning} />
            <Text style={styles.verificationTitle}>Verification Status</Text>
          </View>
          <Text style={styles.verificationText}>
            Your documents have been submitted for review. You&apos;ll receive a notification within 1-2 business days once verification is complete. You can still book rides in the meantime!
          </Text>
        </GlassCard>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          
          <View style={styles.tip}>
            <CustomIcon name="activity" size={16} color={ds.colors.secondary} />
            <Text style={styles.tipText}>
              Enable location services for accurate pickup
            </Text>
          </View>
          
          <View style={styles.tip}>
            <CustomIcon name="activity" size={16} color={ds.colors.secondary} />
            <Text style={styles.tipText}>
              Add a payment method for seamless booking
            </Text>
          </View>
          
          <View style={styles.tip}>
            <CustomIcon name="activity" size={16} color={ds.colors.secondary} />
            <Text style={styles.tipText}>
              Rate your drivers to help improve our service
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Action Button */}
      <View style={styles.actionSection}>
        <PremiumButton
          variant="primary"
          size="lg"
          onPress={handleGetStarted}
          style={styles.getStartedButton}
        >
          Start Riding
        </PremiumButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: ds.spacing.lg,
  },
  successSection: {
    alignItems: 'center',
    paddingTop: ds.spacing.xl,
    paddingBottom: ds.spacing.xxxl,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.xl,
  },
  title: {
    fontSize: ds.typography.size.hero,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    textAlign: 'center',
    marginBottom: ds.spacing.sm,
  },
  subtitle: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    lineHeight: ds.typography.lineHeight.body,
  },
  nextSection: {
    marginBottom: ds.spacing.xl,
  },
  sectionTitle: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.md,
  },
  nextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
    marginBottom: ds.spacing.lg,
  },
  nextIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    flex: 1,
  },
  nextTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  nextDescription: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    lineHeight: ds.typography.lineHeight.body,
  },
  verificationCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.xl,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.sm,
  },
  verificationTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  verificationText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    lineHeight: ds.typography.lineHeight.body,
  },
  tipsSection: {
    marginBottom: ds.spacing.xl,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    lineHeight: ds.typography.lineHeight.body,
  },
  actionSection: {
    padding: ds.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
  },
  getStartedButton: {
    // Uses PremiumButton defaults
  },
});
