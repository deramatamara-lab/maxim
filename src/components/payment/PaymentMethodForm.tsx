/**
 * Payment Method Form - Web Stub
 * Payment functionality not available on web platform
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ds } from '@/constants/theme';

export interface PaymentMethodFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Payment Method</Text>
        <Text style={styles.subtitle}>Not available on web platform</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>💳 Payment Form</Text>
          <Text style={styles.placeholderSubtext}>Use mobile app for payment management</Text>
        </View>
        {onCancel && (
          <Text style={styles.cancelText} onPress={onCancel}>
            Cancel
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.spacing.xl,
  },
  title: {
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    marginBottom: ds.spacing.sm,
  },
  subtitle: {
    fontSize: ds.typography.size.bodyLg,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xl,
  },
  placeholder: {
    padding: ds.spacing.xxl,
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderRadius: ds.radius.xl,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: ds.typography.size.title,
    color: ds.colors.textPrimary,
    textAlign: 'center',
    marginBottom: ds.spacing.sm,
  },
  placeholderSubtext: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  cancelText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.primary,
    marginTop: ds.spacing.lg,
    textDecorationLine: 'underline',
  },
});

export default PaymentMethodForm;
