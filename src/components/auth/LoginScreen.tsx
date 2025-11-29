/**
 * Login Screen
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

export interface LoginScreenProps {
  onSuccess?: () => void;
  onRegisterPress?: () => void;
  onForgotPasswordPress?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onRegisterPress,
  onForgotPasswordPress,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, authError } = useEnhancedAuthState();

  const handleLogin = async () => {
    // Basic validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Note: Password strength validation is enforced during registration
    // Login only checks if password is provided

    const success = await login(email.trim(), password.trim());
    
    if (success && onSuccess) {
      onSuccess();
    } else if (!success && authError) {
      Alert.alert(`Login Failed`, authError);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Clear error when user starts typing
    if (authError) {
      // Could add error clearing logic here if needed
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // Clear error when user starts typing
    if (authError) {
      // Could add error clearing logic here if needed
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          {/* Login Form */}
          <GlassCard elevated style={styles.formCard}>
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <CustomIcon name="user" size={20} />
                  <Text style={styles.inputLabelText}>Email Address</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email"
                  placeholderTextColor={ds.colors.textSecondary}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <CustomIcon name="search" size={20} />
                  <Text style={styles.inputLabelText}>Password</Text>
                </View>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor={ds.colors.textSecondary}
                    value={password}
                    onChangeText={handlePasswordChange}
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

              {/* Error Message */}
              {authError && (
                <View style={styles.errorContainer}>
                  <CustomIcon name="alert" size={16} />
                  <Text style={styles.errorText}>{authError}</Text>
                </View>
              )}

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={onForgotPasswordPress}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <PremiumButton
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading || !email.trim() || !password.trim()}
                variant="primary"
                size="lg"
                style={styles.loginButton}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </PremiumButton>
            </View>
          </GlassCard>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity
              onPress={onRegisterPress}
              disabled={isLoading}
            >
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Demo Account Info */}
          {process.env.EXPO_PUBLIC_ENV === 'development' && (
            <GlassCard style={styles.demoCard}>
              <Text style={styles.demoTitle}>Demo Account</Text>
              <Text style={styles.demoText}>Email: demo@aura.com</Text>
              <Text style={styles.demoText}>Password: demo123</Text>
            </GlassCard>
          )}
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
  loginButton: {
    marginTop: ds.spacing.lg,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
  registerLink: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.primary,
    fontFamily: ds.typography.family,
  },
  demoCard: {
    padding: ds.spacing.md,
    marginTop: ds.spacing.lg,
  },
  demoTitle: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.sm,
    fontFamily: ds.typography.family,
  },
  demoText: {
    fontSize: ds.typography.size.caption,
    color: ds.colors.textSecondary,
    fontFamily: ds.typography.family,
  },
});
