import React, { ReactNode } from 'react';
import { AnimationProvider } from '../src/providers/AnimationProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';

// Initialize i18n for testing
i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        'home.tabHome': 'Home',
        'home.tabActivity': 'Activity',
        'home.tabLocation': 'Location',
        'home.tabProfile': 'Profile',
      },
    },
  },
});

interface TestProvidersProps {
  children: ReactNode;
  enablePerformanceMonitoring?: boolean;
}

/**
 * Test wrapper component that provides all necessary contexts
 * for integration testing. This reduces boilerplate and ensures
 * consistent test environment across all integration tests.
 */
export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  enablePerformanceMonitoring = false,
}) => {
  return (
    <I18nextProvider i18n={i18n}>
      <AnimationProvider enablePerformanceMonitoring={enablePerformanceMonitoring}>
        {children}
      </AnimationProvider>
    </I18nextProvider>
  );
};

/**
 * Higher-order component that wraps a test component with all providers
 */
export const withTestProviders = (
  Component: React.ComponentType<any>,
  providerProps?: Omit<TestProvidersProps, 'children'>
) => {
  return (props: any) => (
    <TestProviders {...providerProps}>
      <Component {...props} />
    </TestProviders>
  );
};
