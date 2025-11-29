/**
 * KYC Introduction Step
 * Explains the Know Your Customer process and requirements
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ds } from '../../../constants/theme';
import { GlassCard } from '../../ui/GlassCard';
import { PremiumButton } from '../../ui/PremiumButton';
import { CustomIcon, type CustomIconProps } from '../../ui/CustomIcon';
import { useOnboardingStore } from '../../../store/useOnboardingStore';
import { useStepValidation, useContinueButtonMessage } from '../../../hooks/useStepValidation';

interface KYCIntroStepProps {
  onComplete: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
}

export const KYCIntroStep: React.FC<KYCIntroStepProps> = ({
  onComplete,
  onBack,
  canGoBack,
  isLastStep: _isLastStep,
}) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);
  
  const { acceptTerms, updateOnboardingData } = useOnboardingStore();
  const validation = useStepValidation('kyc_intro');
  const continueMessage = useContinueButtonMessage();

  const handleContinue = () => {
    if (hasAcceptedTerms && hasAcceptedPrivacy) {
      acceptTerms(hasAcceptedTerms, hasAcceptedPrivacy);
      onComplete();
    }
  };

  const handleTermsToggle = () => {
    const newValue = !hasAcceptedTerms;
    setHasAcceptedTerms(newValue);
    updateOnboardingData({ hasAcceptedTerms: newValue });
  };
  
  const handlePrivacyToggle = () => {
    const newValue = !hasAcceptedPrivacy;
    setHasAcceptedPrivacy(newValue);
    updateOnboardingData({ hasAcceptedPrivacy: newValue });
  };

  const requirements: Array<{
  icon: CustomIconProps['name'];
  title: string;
  description: string;
  status: 'required' | 'optional';
}> = [
    {
      icon: 'profile',
      title: 'Government ID',
      description: 'Valid driver license, passport, or national ID card',
      status: 'required' as const,
    },
    {
      icon: 'settings',
      title: 'Selfie Photo',
      description: 'Clear photo of your face for identity verification',
      status: 'required' as const,
    },
    {
      icon: 'location',
      title: 'Proof of Address',
      description: 'Recent utility bill or bank statement (optional for now)',
      status: 'optional' as const,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <GlassCard intensity={20} style={styles.iconContainer}>
            <CustomIcon name="settings" size={32} color={ds.colors.primary} />
          </GlassCard>
          
          <Text style={styles.title}>Verify Your Identity</Text>
          <Text style={styles.subtitle}>
            Secure verification keeps our community safe
          </Text>
        </View>

        {/* Why KYC */}
        <GlassCard intensity={15} style={styles.whySection}>
          <Text style={styles.sectionTitle}>Why We Need Verification</Text>
          
          <View style={styles.reasonContainer}>
            <CustomIcon name="activity" size={20} color={ds.colors.secondary} />
            <Text style={styles.reasonText}>
              Ensures safety for all riders and drivers
            </Text>
          </View>
          
          <View style={styles.reasonContainer}>
            <CustomIcon name="location" size={20} color={ds.colors.secondary} />
            <Text style={styles.reasonText}>
              Prevents fraud and unauthorized account use
            </Text>
          </View>
          
          <View style={styles.reasonContainer}>
            <CustomIcon name="profile" size={20} color={ds.colors.secondary} />
            <Text style={styles.reasonText}>
              Required for insurance and regulatory compliance
            </Text>
          </View>
        </GlassCard>

        {/* Requirements */}
        <View style={styles.requirementsSection}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          
          {requirements.map((req, index) => (
            <GlassCard key={index} intensity={15} style={styles.requirementCard}>
              <View style={styles.requirementHeader}>
                <View style={styles.requirementIcon}>
                  <CustomIcon name={req.icon} size={24} color={ds.colors.primary} />
                </View>
                <View style={styles.requirementInfo}>
                  <Text style={styles.requirementTitle}>{req.title}</Text>
                  <Text style={styles.requirementDescription}>{req.description}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  req.status === 'required' ? styles.requiredBadge : styles.optionalBadge,
                ]}>
                  <Text style={[
                    styles.statusText,
                    req.status === 'required' ? styles.requiredText : styles.optionalText,
                  ]}>
                    {req.status === 'required' ? 'Required' : 'Optional'}
                  </Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Security Notice */}
        <GlassCard intensity={15} style={styles.securityNotice}>
          <CustomIcon name="settings" size={20} color={ds.colors.warning} />
          <Text style={styles.securityText}>
            Your documents are encrypted and stored securely. We only share verification status (not documents) with drivers for safety purposes.
          </Text>
        </GlassCard>

        {/* Terms and Privacy */}
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>Terms & Privacy</Text>
          
          <View style={styles.checkboxContainer}>
            <View style={styles.checkbox}>
              <PremiumButton
                variant={hasAcceptedTerms ? 'primary' : 'ghost'}
                size="sm"
                onPress={handleTermsToggle}
                style={styles.checkboxButton}
              >
                {hasAcceptedTerms ? '✓' : ''}
              </PremiumButton>
            </View>
            <Text style={styles.checkboxLabel}>
              I agree to the Terms of Service and Identity Verification Policy
            </Text>
          </View>
          
          <View style={styles.checkboxContainer}>
            <View style={styles.checkbox}>
              <PremiumButton
                variant={hasAcceptedPrivacy ? 'primary' : 'ghost'}
                size="sm"
                onPress={handlePrivacyToggle}
                style={styles.checkboxButton}
              >
                {hasAcceptedPrivacy ? '✓' : ''}
              </PremiumButton>
            </View>
            <Text style={styles.checkboxLabel}>
              I consent to the Privacy Policy and data processing for verification
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {canGoBack && (
          <PremiumButton
            variant="ghost"
            size="lg"
            onPress={onBack}
            style={styles.backButton}
          >
            Back
          </PremiumButton>
        )}
        
        <PremiumButton
          variant="primary"
          size="lg"
          onPress={handleContinue}
          disabled={!validation.canProceed}
          style={!validation.canProceed ? [styles.continueButton, styles.disabledButton] : styles.continueButton}
        >
          {validation.canProceed ? 'Continue to Document Upload' : continueMessage}
        </PremiumButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ds.spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: ds.spacing.lg,
    paddingBottom: ds.spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.lg,
  },
  title: {
    fontSize: ds.typography.size.display,
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
  whySection: {
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.lg,
  },
  sectionTitle: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.md,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.sm,
  },
  reasonText: {
    flex: 1,
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    lineHeight: ds.typography.lineHeight.body,
  },
  requirementsSection: {
    marginBottom: ds.spacing.lg,
  },
  requirementCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.sm,
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.md,
  },
  requirementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementInfo: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  requirementDescription: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    lineHeight: ds.typography.lineHeight.body,
  },
  statusBadge: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.xs,
  },
  requiredBadge: {
    backgroundColor: ds.colors.primary + '20',
  },
  optionalBadge: {
    backgroundColor: ds.colors.border,
  },
  statusText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
  },
  requiredText: {
    color: ds.colors.primary,
  },
  optionalText: {
    color: ds.colors.textSecondary,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
  },
  securityText: {
    flex: 1,
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    lineHeight: ds.typography.lineHeight.caption,
  },
  termsSection: {
    marginBottom: ds.spacing.xl,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.md,
  },
  checkbox: {
    marginTop: ds.spacing.xs,
  },
  checkboxButton: {
    width: 24,
    height: 24,
    borderRadius: ds.radius.xs,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textPrimary,
    lineHeight: ds.typography.lineHeight.body,
  },
  actionSection: {
    padding: ds.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
    gap: ds.spacing.sm,
  },
  backButton: {
    marginBottom: ds.spacing.sm,
  },
  continueButton: {
    // Uses PremiumButton defaults
  },
  disabledButton: {
    opacity: 0.5,
  },
});
