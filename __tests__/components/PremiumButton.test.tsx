/**
 * PremiumButton Component Tests
 * Smoke tests to ensure component renders without crashing across variants/sizes/states
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { TestProviders } from '../TestProviders';

// Mock hooks
jest.mock('../../src/hooks/useHaptics', () => ({
  useHaptics: () => ({
    trigger: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useSound', () => ({
  useSound: () => ({
    play: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useInteractionState', () => ({
  useInteractionState: () => ({
    pressStyle: {},
    glowStyle: {},
  }),
}));

describe('PremiumButton', () => {
  const defaultProps = {
    children: 'Test Button',
    onPress: jest.fn(),
  };

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <TestProviders>
        {component}
      </TestProviders>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders with primary variant', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} variant="primary" />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders with secondary variant', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} variant="secondary" />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders with ghost variant', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} variant="ghost" />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders with small size', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} size="sm" />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders with medium size', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} size="md" />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders with large size', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} size="lg" />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('States', () => {
    it('renders disabled state', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} disabled />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders loading state', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} loading />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders with micro interactions disabled', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} enableMicroInteractions={false} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('renders with accessibility props', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton
          {...defaultProps}
          accessibilityLabel="Test Button Label"
          accessibilityHint="Press to perform test action"
          accessible={true}
        />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('renders with empty children', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} children="" />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders with invalid variant gracefully', () => {
      const { toJSON } = renderWithProviders(
        <PremiumButton {...defaultProps} variant={'invalid' as any} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});
