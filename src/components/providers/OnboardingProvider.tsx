import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEnhancedAppStore } from '../../store/useEnhancedAppStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { OnboardingModal } from '../onboarding/OnboardingModal';

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, isAuthenticated, updateProfile } = useEnhancedAppStore();
  const { isOnboardingRequired, startOnboarding } = useOnboardingStore();

  useEffect(() => {
    // Check if onboarding should be shown
    const checkOnboarding = async () => {
      if (isAuthenticated && user) {
        const needsOnboarding = !user.hasCompletedOnboarding && isOnboardingRequired();
        
        // Check if user previously dismissed onboarding
        const dismissedAt = await AsyncStorage.getItem('onboarding_dismissed_at');
        if (dismissedAt) {
          const dismissedTime = new Date(dismissedAt).getTime();
          const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          
          // Don't show if dismissed within last week
          if (dismissedTime > oneWeekAgo) {
            return;
          }
        }
        
        if (needsOnboarding) {
          startOnboarding();
          // Use setTimeout to avoid cascading renders
          setTimeout(() => setShowOnboarding(true), 0);
        }
      }
    };

    checkOnboarding();
  }, [isAuthenticated, user, isOnboardingRequired, startOnboarding]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    
    // Clear any previous dismissal
    await AsyncStorage.removeItem('onboarding_dismissed_at');
    
    // Update user profile to mark onboarding as complete
    if (user) {
      await updateProfile({
        hasCompletedOnboarding: true,
      });
    }
  };

  const handleOnboardingClose = async () => {
    setShowOnboarding(false);
    
    // Store dismissal timestamp to prevent repeat prompts
    await AsyncStorage.setItem('onboarding_dismissed_at', new Date().toISOString());
  };

  return (
    <>
      {children}
      <OnboardingModal
        visible={showOnboarding}
        onClose={handleOnboardingClose}
        onComplete={handleOnboardingComplete}
        required={false} // Allow dismissal for better UX
      />
    </>
  );
};
