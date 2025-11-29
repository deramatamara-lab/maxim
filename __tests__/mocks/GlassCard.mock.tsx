/**
 * Test-specific GlassCard wrapper that bypasses gesture-handler
 */

// Placeholder test to satisfy Jest
describe('GlassCard Mock', () => {
  it('exists', () => expect(true).toBe(true));
});

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { ds } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  interactive?: boolean;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  // Add all other props that GlassCard accepts
  [key: string]: any;
}

// Test-specific GlassCard that doesn't use gesture-handler
export const TestGlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style, 
  elevated = false, 
  interactive = false,
  intensity = 30,
  tint = 'dark',
  ...props 
}) => {
  return (
    <View 
      style={[
        {
          backgroundColor: ds.colors.glassBackground,
          borderRadius: ds.radius.lg,
          borderWidth: 1,
          borderColor: ds.colors.glassBorder,
          overflow: 'hidden',
        },
        elevated && {
          shadowColor: ds.shadow.modern.shadowColor,
          shadowOffset: ds.shadow.modern.shadowOffset,
          shadowOpacity: ds.shadow.modern.shadowOpacity,
          shadowRadius: ds.shadow.modern.shadowRadius,
          elevation: 8,
        },
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

// Mock the GlassCard module
jest.mock('@/components/ui/GlassCard', () => ({
  GlassCard: TestGlassCard,
}));
