/**
 * Onboarding Step Engine Contracts
 * Defines strict contracts for each onboarding step
 */

import { OnboardingStep } from '../store/useOnboardingStore';

// Re-export for use in other modules
export type { OnboardingStep };

export interface StepContract {
  id: OnboardingStep;
  title: string;
  subtitle?: string;
  description?: string;
  
  // Navigation
  canGoBack: boolean;
  isLastStep: boolean;
  nextStep: OnboardingStep | null;
  previousStep: OnboardingStep | null;
  
  // Requirements
  requiredFields: string[];
  optionalFields: string[];
  
  // Validation
  validationRules: StepValidationRule[];
  
  // UI hints
  estimatedTime: number; // seconds
  progressWeight: number; // 0-1, contribution to overall progress
  icon?: string;
  
  // Persistence
  persistOnExit: boolean;
  resumable: boolean;
}

export interface StepValidationRule {
  field: string;
  type: 'required' | 'format' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number | RegExp;
  message: string;
}

export interface StepResult {
  stepId: OnboardingStep;
  completed: boolean;
  skipped: boolean;
  data: Record<string, unknown>;
  errors: string[];
  completedAt?: string;
}

/**
 * Step contracts for all onboarding steps
 */
export const STEP_CONTRACTS: Record<OnboardingStep, StepContract> = {
  welcome: {
    id: 'welcome',
    title: 'Welcome to Aura',
    subtitle: 'Premium rides, elevated experience',
    canGoBack: false,
    isLastStep: false,
    nextStep: 'profile_setup',
    previousStep: null,
    requiredFields: [],
    optionalFields: [],
    validationRules: [],
    estimatedTime: 10,
    progressWeight: 0.05,
    icon: 'home',
    persistOnExit: false,
    resumable: true,
  },
  
  profile_setup: {
    id: 'profile_setup',
    title: 'Set Up Your Profile',
    subtitle: 'Tell us about yourself',
    canGoBack: true,
    isLastStep: false,
    nextStep: 'kyc_intro',
    previousStep: 'welcome',
    requiredFields: ['fullName', 'phone', 'dateOfBirth'],
    optionalFields: ['address'],
    validationRules: [
      { field: 'fullName', type: 'required', message: 'Full name is required' },
      { field: 'fullName', type: 'minLength', value: 2, message: 'Name must be at least 2 characters' },
      { field: 'phone', type: 'required', message: 'Phone number is required' },
      { field: 'phone', type: 'pattern', value: /^\+?[\d\s-]{10,}$/, message: 'Invalid phone number format' },
      { field: 'dateOfBirth', type: 'required', message: 'Date of birth is required' },
    ],
    estimatedTime: 60,
    progressWeight: 0.2,
    icon: 'profile',
    persistOnExit: true,
    resumable: true,
  },
  
  kyc_intro: {
    id: 'kyc_intro',
    title: 'Identity Verification',
    subtitle: 'Quick and secure verification',
    description: 'We need to verify your identity to ensure safety for all users.',
    canGoBack: true,
    isLastStep: false,
    nextStep: 'document_upload',
    previousStep: 'profile_setup',
    requiredFields: ['hasAcceptedTerms', 'hasAcceptedPrivacy'],
    optionalFields: [],
    validationRules: [
      { field: 'hasAcceptedTerms', type: 'required', message: 'You must accept the terms of service' },
      { field: 'hasAcceptedPrivacy', type: 'required', message: 'You must accept the privacy policy' },
    ],
    estimatedTime: 30,
    progressWeight: 0.1,
    icon: 'settings',
    persistOnExit: true,
    resumable: true,
  },
  
  document_upload: {
    id: 'document_upload',
    title: 'Upload Documents',
    subtitle: 'Verify your identity',
    canGoBack: true,
    isLastStep: false,
    nextStep: 'document_review',
    previousStep: 'kyc_intro',
    requiredFields: ['documentsUploaded'],
    optionalFields: [],
    validationRules: [
      { field: 'documentsUploaded', type: 'required', message: 'At least one document is required' },
    ],
    estimatedTime: 120,
    progressWeight: 0.35,
    icon: 'activity',
    persistOnExit: true,
    resumable: true,
  },
  
  document_review: {
    id: 'document_review',
    title: 'Review & Submit',
    subtitle: 'Confirm your information',
    canGoBack: true,
    isLastStep: false,
    nextStep: 'complete',
    previousStep: 'document_upload',
    requiredFields: [],
    optionalFields: [],
    validationRules: [],
    estimatedTime: 30,
    progressWeight: 0.15,
    icon: 'search',
    persistOnExit: true,
    resumable: true,
  },
  
  complete: {
    id: 'complete',
    title: 'All Set!',
    subtitle: 'Your account is ready',
    canGoBack: false,
    isLastStep: true,
    nextStep: null,
    previousStep: 'document_review',
    requiredFields: [],
    optionalFields: ['notifications', 'marketing', 'dataSharing'],
    validationRules: [],
    estimatedTime: 10,
    progressWeight: 0.15,
    icon: 'home',
    persistOnExit: false,
    resumable: false,
  },
};

/**
 * Get step contract by ID
 */
export function getStepContract(stepId: OnboardingStep): StepContract {
  return STEP_CONTRACTS[stepId];
}

/**
 * Validate step data against contract
 */
export function validateStepData(
  stepId: OnboardingStep,
  data: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const contract = STEP_CONTRACTS[stepId];
  const errors: string[] = [];
  
  for (const rule of contract.validationRules) {
    const value = data[rule.field];
    
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          errors.push(rule.message);
        }
        break;
        
      case 'minLength':
        if (typeof value === 'string' && value.length < (rule.value as number)) {
          errors.push(rule.message);
        }
        break;
        
      case 'maxLength':
        if (typeof value === 'string' && value.length > (rule.value as number)) {
          errors.push(rule.message);
        }
        break;
        
      case 'pattern':
        if (typeof value === 'string' && !(rule.value as RegExp).test(value)) {
          errors.push(rule.message);
        }
        break;
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Calculate overall progress percentage
 */
export function calculateProgress(completedSteps: OnboardingStep[]): number {
  let totalWeight = 0;
  let completedWeight = 0;
  
  for (const [stepId, contract] of Object.entries(STEP_CONTRACTS)) {
    totalWeight += contract.progressWeight;
    if (completedSteps.includes(stepId as OnboardingStep)) {
      completedWeight += contract.progressWeight;
    }
  }
  
  return Math.round((completedWeight / totalWeight) * 100);
}

/**
 * Check if step can proceed based on requirements
 */
export function canProceedFromStep(
  stepId: OnboardingStep,
  data: Record<string, unknown>
): boolean {
  const validation = validateStepData(stepId, data);
  return validation.valid;
}
