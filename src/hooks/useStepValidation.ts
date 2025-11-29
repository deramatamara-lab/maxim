/**
 * Step Validation Hook
 * Validates onboarding step data against StepContract requirements
 */

import { useMemo } from 'react';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { OnboardingStep, validateStepData } from '../types/onboardingStep';
import type { OnboardingData } from '../store/useOnboardingStore';

export interface StepValidationResult {
  isValid: boolean;
  errors: string[];
  canProceed: boolean;
  requiredFields: string[];
  missingFields: string[];
  fieldErrors: Record<string, string>;
}

export function useStepValidation(stepId?: OnboardingStep): StepValidationResult {
  const { progress, data } = useOnboardingStore();
  const currentStep = stepId || progress.currentStep;

  return useMemo(() => {
    // Get current step data
    const stepData: Partial<OnboardingData> = data || {};

    // Validate against step contract
    const validation = validateStepData(currentStep, stepData);

    // Get required fields for this step
    const stepContracts: Record<OnboardingStep, { requiredFields: string[] }> = {
      welcome: { requiredFields: [] },
      profile_setup: { requiredFields: ['fullName', 'phone', 'dateOfBirth'] },
      kyc_intro: { requiredFields: ['hasAcceptedTerms', 'hasAcceptedPrivacy'] },
      document_upload: { requiredFields: ['documentsUploaded'] },
      document_review: { requiredFields: [] },
      complete: { requiredFields: [] },
    };

    const stepContract = stepContracts[currentStep];
    const requiredFields = stepContract?.requiredFields || [];
    
    // Check which required fields are missing
    const missingFields = requiredFields.filter((field: string) => {
      const value = stepData[field as keyof OnboardingData];
      return value === undefined || value === null || value === '' || 
             (Array.isArray(value) && value.length === 0);
    });

    // Create field-specific error mapping
    const fieldErrors: Record<string, string> = {};
    validation.errors.forEach(error => {
      // Map error messages to fields
      if (error.includes('name')) fieldErrors.fullName = error;
      else if (error.includes('phone')) fieldErrors.phone = error;
      else if (error.includes('date of birth')) fieldErrors.dateOfBirth = error;
      else if (error.includes('terms')) fieldErrors.hasAcceptedTerms = error;
      else if (error.includes('privacy')) fieldErrors.hasAcceptedPrivacy = error;
      else if (error.includes('document')) fieldErrors.documentsUploaded = error;
    });

    // Can proceed if valid and no missing required fields
    const canProceed = validation.valid && missingFields.length === 0;

    return {
      isValid: validation.valid,
      errors: validation.errors,
      canProceed,
      requiredFields,
      missingFields,
      fieldErrors,
    };
  }, [currentStep, data]);
}

/**
 * Hook to validate if user can proceed to next step
 */
export function useCanProceedToNextStep(): boolean {
  const validation = useStepValidation();
  return validation.canProceed;
}

/**
 * Hook to get error message for Continue button
 */
export function useContinueButtonMessage(): string {
  const validation = useStepValidation();
  
  if (validation.canProceed) {
    return 'Continue';
  }
  
  if (validation.missingFields.length > 0) {
    const fieldNames = {
      fullName: 'Full name',
      phone: 'Phone number',
      dateOfBirth: 'Date of birth',
      hasAcceptedTerms: 'Terms of service',
      hasAcceptedPrivacy: 'Privacy policy',
      documentsUploaded: 'Document upload',
    };
    
    const missing = validation.missingFields
      .map(field => fieldNames[field as keyof typeof fieldNames] || field)
      .join(', ');
    
    return `Please complete: ${missing}`;
  }
  
  if (validation.errors.length > 0) {
    return validation.errors[0];
  }
  
  return 'Please complete all required fields';
}
