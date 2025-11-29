/**
 * StatusBanner
 * Purpose: Surface inline feedback (error, success, notice) using design system
 * tokens for typography, spacing, and color. Keeps messaging consistent across
 * the Aura shell without bespoke styling per screen.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ds } from '../../constants/theme';

type StatusVariant = 'error';

interface StatusBannerProps {
  message: string;
  variant?: StatusVariant;
  testID?: string;
}

const variantStyles: Record<StatusVariant, { container: object; text: object }> = {
  error: {
    container: {
      borderColor: ds.colors.danger,
      backgroundColor: ds.colors.surface,
    },
    text: {
      color: ds.colors.textPrimary,
    },
  },
};

export const StatusBanner: React.FC<StatusBannerProps> = ({
  message,
  variant = 'error',
  testID,
}) => {
  const palette = variantStyles[variant];

  return (
    <View testID={testID} style={[styles.container, palette.container]}>
      <Text style={[styles.message, palette.text]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.lg,
    borderRadius: ds.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontFamily: ds.typography.family,
    fontSize: ds.typography.size.caption,
    lineHeight: ds.typography.lineHeight.caption,
    textAlign: 'center',
  },
});
