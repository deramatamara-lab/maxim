/**
 * Register Screen
 * Integrates with enhanced authentication store and API services
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useEnhancedAuthState } from '../../store/useEnhancedAppStore';
import { ds } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { CustomIcon } from '../ui/CustomIcon';
import { validatePassword, validateEmail, validateName, validatePhoneNumber } from '../../utils/validation';

export interface RegisterScreenProps {
  onSuccess?: () => void;
  onLoginPress?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onSuccess,
  onLoginPress,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const { register, isLoading, authError } = useEnhancedAuthState();

  const validateInputs = (): boolean => {
    // Validate name
    const nameValidation = validateName(name, 'Full name');
    if (!nameValidation.valid) {
      Alert.alert('Error', nameValidation.error || 'Invalid name');
      return false;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      Alert.alert('Error', emailValidation.error || 'Invalid email');
      return false;
    }

    // Validate phone (optional field)
    if (phone && phone.trim()) {
      const phoneValidation = validatePhoneNumber(phone);
      if (!phoneValidation.valid) {
        Alert.alert('Error', phoneValidation.error || 'Invalid phone number');
        return false;
      }
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Alert.alert('Weak Password', passwordValidation.error || 'Password does not meet requirements');
      return false;
    }

    // Show password strength feedback
    if (passwordValidation.strength === 'weak') {
      Alert.alert('Weak Password', 'Your password is weak. Consider making it stronger with more characters and variety.');
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Error', 'Please confirm your password');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (!acceptTerms) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) {
      return;
    }

    const success = await register(
      name.trim(),
      email.trim(),
      password.trim(),
      phone.trim() || undefined
    );
    
    if (success && onSuccess) {
      onSuccess();
    } else if (!success && authError) {
      Alert.alert('Registration Failed', authError);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo and Welcome Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <CustomIcon name="location" size={48} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Aura and start your journey</Text>
          </View>

          {/* Registration Form */}
          <GlassCard elevated style={styles.formCard}>
            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <CustomIcon name="user" size={20} />
                  <Text style={styles.inputLabelText}>Full Name</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  placeholderTextColor={ds.colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <CustomIcon name="search" size={20} />
                  <Text style={styles.inputLabelText}>Email Address</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email"
                  placeholderTextColor={ds.colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <CustomIcon name="phone" size={20} />
                  <Text style={styles.inputLabelText}>Phone Number (Optional)</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your phone number"
                  placeholderTextColor={ds.colors.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <CustomIcon name="lock" size={20} />
                  <Text style={styles.inputLabelText}>Password</Text>
                </View>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="Create a password"
                    placeholderTextColor={ds.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    <CustomIcon 
                      name={showPassword ? "eye" : "eye-off"} 
                      size={20} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <CustomIcon name="lock" size={20} />
                  <Text style={styles.inputLabelText}>Confirm Password</Text>
                </View>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="Confirm your password"
                    placeholderTextColor={ds.colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    <CustomIcon 
                      name={showConfirmPassword ? "eye" : "eye-off"} 
                      size={20} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message */}
              {authError && (
                <View style={styles.errorContainer}>
                  <CustomIcon name="alert" size={16} />
                  <Text style={styles.errorText}>{authError}</Text>
                </View>
              )}

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  disabled={isLoading}
                >
                  <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                    {acceptTerms && (
                      <CustomIcon name="check" size={12} />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms and Conditions</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              {/* Register Button */}
              <PremiumButton
                onPress={handleRegister}
                loading={isLoading}
                disabled={
                  isLoading || 
                  !name.trim() || 
                  !email.trim() || 
                  !password.trim() || 
                  !confirmPassword.trim() ||
                  !acceptTerms
                }
                variant="primary"
                size="lg"
                style={styles.registerButton}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </PremiumButton>
            </View>
          </GlassCard>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={onLoginPress}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: ds.spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: ds.spacing.xxxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ds.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.lg,
  },
  title: {
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.sm,
    fontFamily: ds.typography.family,
  },
  subtitle: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    fontFamily: ds.typography.family,
  },
  formCard: {
    padding: ds.spacing.xl,
    marginBottom: ds.spacing.lg,
  },
  form: {
    gap: ds.spacing.lg,
  },
  inputContainer: {
    gap: ds.spacing.sm,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
  },
  inputLabelText: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    fontFamily: ds.typography.family,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: ds.colors.glassBorder,
    borderRadius: ds.radius.md,
    paddingHorizontal: ds.spacing.md,
    fontSize: ds.typography.size.body,
    color: ds.colors.textPrimary,
    backgroundColor: ds.colors.background,
    fontFamily: ds.typography.family,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  passwordToggle: {
    position: 'absolute',
    right: ds.spacing.md,
    padding: ds.spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    padding: ds.spacing.md,
    backgroundColor: `${ds.colors.error}20`,
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: `${ds.colors.error}40`,
  },
  errorText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.error,
    fontFamily: ds.typography.family,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
  },
  checkboxContainer: {
    marginTop: ds.spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: ds.colors.glassBorder,
    borderRadius: ds.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.background,
  },
  checkboxChecked: {
    backgroundColor: ds.colors.primary,
    borderColor: ds.colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  termsLink: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
  registerButton: {
    marginTop: ds.spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  loginLink: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
});
