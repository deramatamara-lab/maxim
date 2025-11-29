/**
 * Profile Setup Step
 * Collects basic user profile information during onboarding
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { ds } from '../../../constants/theme';
import { GlassCard } from '../../ui/GlassCard';
import { PremiumButton } from '../../ui/PremiumButton';
import { CustomIcon, type CustomIconProps } from '../../ui/CustomIcon';
import { useOnboardingStore } from '../../../store/useOnboardingStore';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useStepValidation, useContinueButtonMessage } from '../../../hooks/useStepValidation';

interface ProfileSetupStepProps {
  onComplete: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
}

export const ProfileSetupStep: React.FC<ProfileSetupStepProps> = ({
  onComplete,
  onBack,
  canGoBack,
  isLastStep: _isLastStep,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { updateOnboardingData } = useOnboardingStore();
  const validation = useStepValidation('profile_setup');
  const continueMessage = useContinueButtonMessage();

  // Initial form data for unsaved changes detection
  const initialFormData = {
    fullName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
  };

  // Unsaved changes protection
  const unsavedChanges = useUnsavedChanges({
    hasUnsavedChanges: () => {
      return JSON.stringify(formData) !== JSON.stringify(initialFormData);
    },
    onSaveChanges: async () => {
      if (validateForm()) {
        updateOnboardingData(formData);
      }
    },
    message: 'You have unsaved profile information. Do you want to save it before continuing?',
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      // Basic date validation (DD/MM/YYYY or YYYY-MM-DD format)
      const dateRegex = /^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/;
      if (!dateRegex.test(formData.dateOfBirth)) {
        newErrors.dateOfBirth = 'Please enter a valid date (DD/MM/YYYY)';
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Please enter a complete address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Update onboarding store in real-time for validation
    updateOnboardingData(newFormData);
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContinue = () => {
    if (validation.canProceed) {
      // Update onboarding store with profile data
      updateOnboardingData(formData);
      unsavedChanges.markAsSaved();
      onComplete();
    }
  };

  const handleBack = () => {
    unsavedChanges.confirmNavigation(
      () => onBack(),
      () => {
        // User chose to stay - no action needed
      }
    );
  };

  const renderInput = (
    field: string,
    label: string,
    placeholder: string,
    icon: CustomIconProps['name'],
    keyboardType: 'default' | 'phone-pad' = 'default',
    autoCapitalize: 'none' | 'sentences' | 'words' = 'sentences'
  ) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <CustomIcon name={icon} size={20} color={ds.colors.primary} />
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      
      <TextInput
        style={[
          styles.textInput,
          focusedField === field ? styles.textInputFocused : null,
          errors[field] ? styles.textInputError : null,
        ]}
        placeholder={placeholder}
        placeholderTextColor={ds.colors.textSecondary}
        value={formData[field as keyof typeof formData]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocusedField(field)}
        onBlur={() => {
          if (focusedField === field) {
            setFocusedField(null);
          }
        }}
      />
      
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <GlassCard intensity={20} style={styles.iconContainer} enableMicroInteractions>
            <CustomIcon name="profile" size={32} color={ds.colors.primary} />
          </GlassCard>
          
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Help us personalize your experience
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {renderInput(
            'fullName',
            'Full Name',
            'Enter your full name',
            'profile',
            'default',
            'words'
          )}
          
          {renderInput(
            'phone',
            'Phone Number',
            '+1 (555) 123-4567',
            'phone',
            'phone-pad',
            'none'
          )}
          
          {renderInput(
            'dateOfBirth',
            'Date of Birth',
            'DD/MM/YYYY',
            'activity',
            'default',
            'none'
          )}
          
          {renderInput(
            'address',
            'Home Address',
            'Enter your complete address',
            'location',
            'default',
            'sentences'
          )}
        </View>

        {/* Privacy Notice */}
        <GlassCard intensity={15} style={styles.privacyNotice} enableMicroInteractions>
          <CustomIcon name="settings" size={20} color={ds.colors.secondary} />
          <Text style={styles.privacyText}>
            Your information is encrypted and never shared. We only use this to verify your account and improve your experience.
          </Text>
        </GlassCard>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {canGoBack && (
          <PremiumButton
            variant="ghost"
            size="lg"
            onPress={handleBack}
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
          style={styles.continueButton}
        >
          {validation.canProceed ? 'Continue' : continueMessage}
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
  formSection: {
    gap: ds.spacing.lg,
    marginBottom: ds.spacing.xl,
  },
  inputContainer: {
    marginBottom: ds.spacing.md,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.sm,
  },
  inputLabel: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  textInput: {
    backgroundColor: ds.colors.surface,
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.md,
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textPrimary,
  },
  textInputFocused: {
    borderColor: ds.colors.primary,
    shadowColor: ds.colors.primary,
    shadowOffset: {
      width: 0,
      height: ds.shadow.card.offsetY,
    },
    shadowOpacity: ds.shadow.card.opacity,
    shadowRadius: ds.shadow.card.radius,
  },
  textInputError: {
    borderColor: ds.colors.error,
  },
  errorText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.error,
    marginTop: ds.spacing.xs,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.xl,
  },
  privacyText: {
    flex: 1,
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    lineHeight: ds.typography.lineHeight.caption,
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
    // No additional styling needed - uses PremiumButton defaults
  },
});
