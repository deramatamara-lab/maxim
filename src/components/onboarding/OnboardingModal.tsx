/**
 * Onboarding Modal Container
 * Main modal component that manages the onboarding flow
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { ds } from '../../constants/theme';
import { log } from '../../utils/logger';
import { GlassView } from '../ui/GlassView';
import { useOnboardingStore, ONBOARDING_FLOW } from '../../store/useOnboardingStore';
import { WelcomeStep } from './steps/WelcomeStep';
import { ProfileSetupStep } from './steps/ProfileSetupStep';
import { KYCIntroStep } from './steps/KYCIntroStep';
import { DocumentUploadStep } from './steps/DocumentUploadStep';
import { DocumentReviewStep } from './steps/DocumentReviewStep';
import { CompleteStep } from './steps/CompleteStep';

// Type for React Native Reanimated easing values
// Unused type removed

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  required?: boolean; // If true, modal cannot be dismissed
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85;

const STEP_COMPONENTS = {
  welcome: WelcomeStep,
  profile_setup: ProfileSetupStep,
  kyc_intro: KYCIntroStep,
  document_upload: DocumentUploadStep,
  document_review: DocumentReviewStep,
  complete: CompleteStep,
} as const;

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onClose,
  onComplete,
  required = false,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useState(new Animated.Value(MODAL_HEIGHT))[0];
  const opacity = useState(new Animated.Value(0))[0];
  
  const {
    progress,
    startOnboarding,
    completeOnboarding,
    setCurrentStep,
    completeStep,
    getNextStep,
    canProceedToStep,
  } = useOnboardingStore();

  const [isClosing, setIsClosing] = useState(false);

  // Animation functions
  const showModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: ds.motion.duration.modalIn,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        easing: ds.motion.easing.entrance as any,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: ds.motion.duration.modalIn,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        easing: ds.motion.easing.entrance as any,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  const hideModal = (callback?: () => void) => {
    setIsClosing(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: MODAL_HEIGHT,
        duration: ds.motion.duration.modalOut,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        easing: ds.motion.easing.exit as any,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: ds.motion.duration.modalOut,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        easing: ds.motion.easing.exit as any,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsClosing(false);
      callback?.();
    });
  };

  // Pan gesture for swipe down to close
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.setValue(event.translationY);
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 1000) {
        if (!required) {
          hideModal(onClose);
        }
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 300,
          useNativeDriver: true,
        }).start();
      }
    });

  // Handle modal visibility changes
  useEffect(() => {
    if (visible) {
      startOnboarding();
      showModal();
      StatusBar.setBarStyle('light-content');
    } else {
      StatusBar.setBarStyle('default');
    }
  }, [visible, showModal, startOnboarding]);

  // Handle step completion and navigation
  const handleStepComplete = async (_stepData?: Record<string, unknown>) => {
    const { currentStep } = progress;
    
    // Mark current step as completed
    completeStep(currentStep);
    
    // Navigate to next step or complete onboarding
    const nextStep = getNextStep();
    if (nextStep) {
      // Enforce no-skipping invariants - validate we can proceed to next step
      if (canProceedToStep(nextStep)) {
        setCurrentStep(nextStep);
      } else {
        log.error(`Cannot proceed to step ${nextStep} - dependencies not met`, {
          event: 'onboarding_step_blocked',
          component: 'OnboardingModal',
        });
        // This should not happen with proper store implementation, but we handle it gracefully
        // Find the next valid step we can proceed to
        const validNextStep = findNextValidStep();
        if (validNextStep) {
          setCurrentStep(validNextStep);
        } else {
          // If no valid next step, complete onboarding
          await completeOnboarding();
          hideModal(() => {
            onComplete();
          });
        }
      }
    } else {
      // Onboarding completed
      await completeOnboarding();
      hideModal(() => {
        onComplete();
      });
    }
  };

  // Helper function to find the next valid step when dependencies aren't met
  const findNextValidStep = () => {
    const { progress } = useOnboardingStore.getState();
    const { completedSteps } = progress;
    
    // Find the first step in the flow that can be proceeded to
    for (const step of ONBOARDING_FLOW) {
      if (!completedSteps.includes(step) && canProceedToStep(step)) {
        return step;
      }
    }
    return null;
  };

  const handleStepBack = () => {
    const { currentStep: _currentStep } = progress;
    const prevStep = useOnboardingStore.getState().getPreviousStep();
    
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  };

  const handleClose = () => {
    if (!required && !isClosing) {
      hideModal(onClose);
    }
  };

  // Render current step component
  const renderCurrentStep = () => {
    const { currentStep } = progress;
    const StepComponent = STEP_COMPONENTS[currentStep];
    
    if (!StepComponent) return null;
    
    return (
      <StepComponent
        onComplete={handleStepComplete}
        onBack={handleStepBack}
        canGoBack={currentStep !== 'welcome'}
        isLastStep={currentStep === 'complete'}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: opacity,
          },
        ]}
      >
        <GestureDetector gesture={panGesture}>
          <View style={styles.gestureArea} />
        </GestureDetector>
        
        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY }],
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <GlassView
            elevated={true}
            interactive={false}
            intensity="high"
            tint="dark"
            style={styles.modalCard}
          >
            {/* Handle Bar */}
            {!required && (
              <View style={styles.handleBar}>
                <View style={styles.handleBarIndicator} />
              </View>
            )}
            
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                {ONBOARDING_FLOW.map((step, _index) => (
                  <View
                    key={step}
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor: progress.completedSteps.includes(step)
                          ? ds.colors.primary
                          : progress.currentStep === step
                          ? ds.colors.primary
                          : ds.colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            
            {/* Step Content */}
            <View style={styles.stepContent}>
              {renderCurrentStep()}
            </View>
          </GlassView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  gestureArea: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
  },
  modalCard: {
    flex: 1,
    margin: ds.spacing.sm,
    borderTopLeftRadius: ds.radius.xl,
    borderTopRightRadius: ds.radius.xl,
    overflow: 'hidden',
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: ds.spacing.sm,
  },
  handleBarIndicator: {
    width: 40,
    height: 4,
    backgroundColor: ds.colors.border,
    borderRadius: 2,
  },
  progressContainer: {
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
    overflow: 'hidden',
  },
});
