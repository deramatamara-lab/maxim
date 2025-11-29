/**
 * GlassCard Component Tests
 * Smoke tests to ensure component renders without crashing
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { TestProviders } from '../TestProviders';

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock hooks to avoid native module complexity
jest.mock('@/hooks/useInteractionState', () => ({
  useInteractionState: () => ({
    pressStyle: {},
    glowStyle: {},
    gesture: {},
  }),
}));

jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    trigger: jest.fn(),
  }),
}));

jest.mock('@/hooks/useSound', () => ({
  useSound: () => ({
    play: jest.fn(),
  }),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('GlassCard', () => {
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
    it('renders correctly with default props', () => {
      const { toJSON } = renderWithProviders(
        <GlassCard><Text>Test Content</Text></GlassCard>
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders children correctly', () => {
      const { toJSON } = renderWithProviders(
        <GlassCard><Text>Test Content</Text></GlassCard>
      );
      // Verify component renders with children
      const tree = toJSON();
      expect(tree).toBeTruthy();
      expect(JSON.stringify(tree)).toContain('Test Content');
    });

    it('renders with elevated prop', () => {
      const { toJSON } = renderWithProviders(
        <GlassCard elevated><Text>Elevated Card</Text></GlassCard>
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders with custom styles', () => {
      const { toJSON } = renderWithProviders(
        <GlassCard style={{ backgroundColor: 'red' }}><Text>Styled Card</Text></GlassCard>
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Props', () => {
    it('handles different intensity values', () => {
      const { toJSON } = renderWithProviders(
        <GlassCard intensity={50}><Text>High Intensity</Text></GlassCard>
      );
      expect(toJSON()).toBeTruthy();
    });

    it('handles different tint values', () => {
      const { toJSON } = renderWithProviders(
        <GlassCard tint="light"><Text>Light Tint</Text></GlassCard>
      );
      expect(toJSON()).toBeTruthy();
    });

    it('handles interactive prop', () => {
      const { toJSON } = renderWithProviders(
        <GlassCard interactive><Text>Interactive</Text></GlassCard>
      );
      expect(toJSON()).toBeTruthy();
    });

    it('handles disabled prop', () => {
      const { toJSON } = renderWithProviders(
        <GlassCard disabled><Text>Disabled</Text></GlassCard>
      );
      expect(toJSON()).toBeTruthy();
    });

    it('handles enableMicroInteractions prop', () => {
      const { toJSON } = renderWithProviders(
        <GlassCard enableMicroInteractions><Text>Micro</Text></GlassCard>
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('renders with null children', () => {
      const { toJSON } = renderWithProviders(
        <GlassCard>{null}</GlassCard>
      );
      expect(toJSON()).toBeTruthy();
    });

    it('renders with undefined style', () => {
      const { toJSON } = renderWithProviders(
        <GlassCard style={undefined}><Text>No Style</Text></GlassCard>
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});
