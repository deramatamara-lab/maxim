/**
 * Forgot Password Modal
 * Production-ready password reset flow with email validation and API integration
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ds } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { CustomIcon } from '../ui/CustomIcon';
import { authService } from '../../api/auth';
import { log } from '../../utils/logger';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSendResetEmail = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.requestPasswordReset(email.trim());
      
      if (response.success) {
        setIsSuccess(true);
      } else {
        Alert.alert('Error', response.error || 'Failed to send reset email');
      }
    } catch (error) {
      log.error('Password reset request failed', { event: 'password_reset_request_failed', component: 'forgotPasswordModal' }, error);
      Alert.alert('Error', 'Unable to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setEmail('');
    setIsSuccess(false);
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <CustomIcon name="chevronRight" size={24} color={ds.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>Reset Password</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <GlassCard intensity={15} style={styles.card}>
            {!isSuccess ? (
              <>
                <View style={styles.iconContainer}>
                  <CustomIcon name="profile" size={48} color={ds.colors.primary} />
                </View>
                
                <Text style={styles.description}>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={ds.colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isLoading}
                  />
                </View>

                <PremiumButton
                  variant="primary"
                  size="lg"
                  onPress={handleSendResetEmail}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.button}
                >
                  Send Reset Email
                </PremiumButton>
              </>
            ) : (
              <>
                <View style={styles.iconContainer}>
                  <CustomIcon name="profile" size={48} color={ds.colors.success} />
                </View>
                
                <Text style={styles.successTitle}>Email Sent!</Text>
                
                <Text style={styles.successDescription}>
                  We&apos;ve sent a password reset link to {email}. Check your inbox and follow the instructions to reset your password.
                </Text>

                <PremiumButton
                  variant="primary"
                  size="lg"
                  onPress={handleClose}
                  style={styles.button}
                >
                  Got it
                </PremiumButton>
              </>
            )}
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingHorizontal: ds.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ds.spacing.xl,
    paddingHorizontal: ds.spacing.sm,
  },
  closeButton: {
    padding: ds.spacing.sm,
    transform: [{ rotate: '180deg' }],
  },
  title: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  card: {
    padding: ds.spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: ds.spacing.lg,
  },
  description: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    marginBottom: ds.spacing.xl,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: ds.spacing.xl,
  },
  label: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: ds.colors.border,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    fontSize: ds.typography.size.body,
    color: ds.colors.textPrimary,
    backgroundColor: ds.colors.surface,
  },
  button: {
    width: '100%',
    marginTop: ds.spacing.md,
  },
  successTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.success,
    textAlign: 'center',
    marginBottom: ds.spacing.md,
  },
  successDescription: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: ds.spacing.xl,
  },
});
