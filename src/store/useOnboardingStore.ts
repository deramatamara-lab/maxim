/**
 * Onboarding Store
 * Manages onboarding state, progress tracking, and flow control
 */

import { create } from 'zustand/index.js';
import { type KYCDocument } from '../api/auth';

export type OnboardingStep = 
  | 'welcome' 
  | 'profile_setup' 
  | 'kyc_intro' 
  | 'document_upload' 
  | 'document_review' 
  | 'complete';

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isSkipped: boolean;
  startedAt: string | null;
  completedAt: string | null;
}

export interface OnboardingData {
  // Profile data collected during onboarding
  fullName: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  
  // KYC data
  documentsUploaded: KYCDocument[];
  hasAcceptedTerms: boolean;
  hasAcceptedPrivacy: boolean;
  
  // Preferences
  notifications: boolean;
  marketing: boolean;
  dataSharing: boolean;
}

interface OnboardingStore {
  // Progress tracking
  progress: OnboardingProgress;
  data: Partial<OnboardingData>;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startOnboarding: () => void;
  setCurrentStep: (step: OnboardingStep) => void;
  completeStep: (step: OnboardingStep) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  
  // Data management
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  setDocumentsUploaded: (documents: KYCDocument[]) => void;
  acceptTerms: (terms: boolean, privacy: boolean) => void;
  
  // Navigation helpers
  getNextStep: () => OnboardingStep | null;
  getPreviousStep: () => OnboardingStep | null;
  canProceedToStep: (step: OnboardingStep) => boolean;
  
  // Completion
  completeOnboarding: () => Promise<void>;
  isOnboardingRequired: () => boolean;
}

// Define the onboarding flow sequence
export const ONBOARDING_FLOW: OnboardingStep[] = [
  'welcome',
  'profile_setup', 
  'kyc_intro',
  'document_upload',
  'document_review',
  'complete'
];

// Step dependencies - which steps must be completed before proceeding
const STEP_DEPENDENCIES: Record<OnboardingStep, OnboardingStep[]> = {
  welcome: [],
  profile_setup: ['welcome'],
  kyc_intro: ['profile_setup'],
  document_upload: ['kyc_intro'],
  document_review: ['document_upload'],
  complete: ['document_review']
};

export const useOnboardingStore = create<OnboardingStore>()(
  (set, get) => ({
      // Initial state
      progress: {
        currentStep: 'welcome',
        completedSteps: [],
        isSkipped: false,
        startedAt: null,
        completedAt: null,
      },
      data: {},
      isLoading: false,
      error: null,

      // Start onboarding flow
      startOnboarding: () => {
        set(state => ({
          progress: {
            ...state.progress,
            currentStep: 'welcome',
            completedSteps: [],
            isSkipped: false,
            startedAt: new Date().toISOString(),
            completedAt: null,
          },
          error: null,
        }));
      },

      // Set current onboarding step
      setCurrentStep: (step: OnboardingStep) => {
        if (get().canProceedToStep(step)) {
          set(state => ({
            progress: {
              ...state.progress,
              currentStep: step,
            },
          }));
        }
      },

      // Mark a step as completed
      completeStep: (step: OnboardingStep) => {
        set(state => {
          const completedSteps = [...new Set([...state.progress.completedSteps, step])];
          return {
            progress: {
              ...state.progress,
              completedSteps,
            },
          };
        });
      },

      // Skip onboarding entirely
      skipOnboarding: () => {
        set(state => ({
          progress: {
            ...state.progress,
            isSkipped: true,
            completedAt: new Date().toISOString(),
          },
        }));
      },

      // Reset onboarding progress
      resetOnboarding: () => {
        set({
          progress: {
            currentStep: 'welcome',
            completedSteps: [],
            isSkipped: false,
            startedAt: null,
            completedAt: null,
          },
          data: {},
          error: null,
        });
      },

      // Update onboarding data
      updateOnboardingData: (newData: Partial<OnboardingData>) => {
        set(state => ({
          data: {
            ...state.data,
            ...newData,
          },
        }));
      },

      // Set uploaded documents
      setDocumentsUploaded: (documents: KYCDocument[]) => {
        set(state => ({
          data: {
            ...state.data,
            documentsUploaded: documents,
          },
        }));
      },

      // Accept terms and privacy
      acceptTerms: (terms: boolean, privacy: boolean) => {
        set(state => ({
          data: {
            ...state.data,
            hasAcceptedTerms: terms,
            hasAcceptedPrivacy: privacy,
          },
        }));
      },

      // Get next step in flow
      getNextStep: (): OnboardingStep | null => {
        const { currentStep, completedSteps: _completedSteps } = get().progress;
        const currentIndex = ONBOARDING_FLOW.indexOf(currentStep);
        
        for (let i = currentIndex + 1; i < ONBOARDING_FLOW.length; i++) {
          const nextStep = ONBOARDING_FLOW[i];
          if (get().canProceedToStep(nextStep)) {
            return nextStep;
          }
        }
        
        return null;
      },

      // Get previous step in flow
      getPreviousStep: (): OnboardingStep | null => {
        const { currentStep } = get().progress;
        const currentIndex = ONBOARDING_FLOW.indexOf(currentStep);
        
        for (let i = currentIndex - 1; i >= 0; i--) {
          const prevStep = ONBOARDING_FLOW[i];
          if (get().canProceedToStep(prevStep)) {
            return prevStep;
          }
        }
        
        return null;
      },

      // Check if user can proceed to a particular step
      canProceedToStep: (step: OnboardingStep): boolean => {
        const { completedSteps } = get().progress;
        const dependencies = STEP_DEPENDENCIES[step];
        return dependencies.every(dep => completedSteps.includes(dep));
      },

      // Complete onboarding
      completeOnboarding: async () => {
        set(state => ({
          progress: {
            ...state.progress,
            completedAt: new Date().toISOString(),
          },
        }));
      },

      // Check if onboarding is required for current user
      isOnboardingRequired: (): boolean => {
        const { progress } = get();
        return !progress.isSkipped && !progress.completedAt;
      },
    })
);
