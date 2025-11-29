/**
 * Dev Portal - Quick access to all app modes for development
 * Access at: http://localhost:8097/dev-portal
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { useRouter } from 'expo-router';
import { useEnhancedAppStore } from '@/store/useEnhancedAppStore';

const createDevUser = (role: 'rider' | 'driver' | 'admin') => ({
  id: '999',
  name: 'Developer Mode',
  email: 'dev@aura.app',
  phone: '+1234567890',
  isDriver: role === 'driver',
  isVerified: true,
  role,
  kycStatus: 'verified' as const,
  hasCompletedOnboarding: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function DevPortal() {
  const router = useRouter();

  const autoLogin = (userType: 'rider' | 'driver' | 'admin') => {
    // Set mock authenticated state directly in store
    useEnhancedAppStore.setState({
      user: createDevUser(userType),
      isAuthenticated: true,
      isLoading: false,
      authError: null,
    });
  };

  const openApp = (mode: 'rider' | 'driver' | 'admin') => {
    autoLogin(mode);
    
    if (Platform.OS === 'web') {
      // Open in new tab for web
      const baseUrl = window.location.origin;
      const path = mode === 'rider' ? '/(rider)' : mode === 'driver' ? '/(driver)' : '/(admin)/dashboard';
      window.open(`${baseUrl}${path}`, '_blank');
    } else {
      // Navigate for native
      if (mode === 'rider') router.push('/(rider)');
      else if (mode === 'driver') router.push('/(driver)');
      else router.push('/(admin)/dashboard');
    }
  };

  const openInCurrentTab = (mode: 'rider' | 'driver' | 'admin') => {
    autoLogin(mode);
    if (mode === 'rider') router.replace('/(rider)');
    else if (mode === 'driver') router.replace('/(driver)');
    else router.replace('/(admin)/dashboard');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[ds.colors.backgroundDeep, '#0a0a12', ds.colors.backgroundDeep]}
        style={StyleSheet.absoluteFill}
      />
      <NoiseOverlay opacity={ds.effects.noiseOpacity} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Aura Dev Portal</Text>
        <Text style={styles.subtitle}>Quick access to all app modes</Text>
        
        <View style={styles.grid}>
          {/* Rider App */}
          <GlassCard style={styles.card}>
            <Text style={styles.cardEmoji}>🚗</Text>
            <Text style={styles.cardTitle}>Rider App</Text>
            <Text style={styles.cardDesc}>Book rides, track drivers, manage payments</Text>
            <View style={styles.buttonRow}>
              <Pressable 
                style={[styles.button, styles.primaryButton]}
                onPress={() => openInCurrentTab('rider')}
              >
                <Text style={styles.buttonText}>Open Here</Text>
              </Pressable>
              <Pressable 
                style={[styles.button, styles.secondaryButton]}
                onPress={() => openApp('rider')}
              >
                <Text style={styles.buttonTextSecondary}>New Tab</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* Driver App */}
          <GlassCard style={styles.card}>
            <Text style={styles.cardEmoji}>🚕</Text>
            <Text style={styles.cardTitle}>Driver App</Text>
            <Text style={styles.cardDesc}>Accept rides, track earnings, go online</Text>
            <View style={styles.buttonRow}>
              <Pressable 
                style={[styles.button, styles.primaryButton]}
                onPress={() => openInCurrentTab('driver')}
              >
                <Text style={styles.buttonText}>Open Here</Text>
              </Pressable>
              <Pressable 
                style={[styles.button, styles.secondaryButton]}
                onPress={() => openApp('driver')}
              >
                <Text style={styles.buttonTextSecondary}>New Tab</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* Admin Dashboard */}
          <GlassCard style={styles.card}>
            <Text style={styles.cardEmoji}>⚙️</Text>
            <Text style={styles.cardTitle}>Admin Dashboard</Text>
            <Text style={styles.cardDesc}>Manage users, view analytics, configure settings</Text>
            <View style={styles.buttonRow}>
              <Pressable 
                style={[styles.button, styles.primaryButton]}
                onPress={() => openInCurrentTab('admin')}
              >
                <Text style={styles.buttonText}>Open Here</Text>
              </Pressable>
              <Pressable 
                style={[styles.button, styles.secondaryButton]}
                onPress={() => openApp('admin')}
              >
                <Text style={styles.buttonTextSecondary}>New Tab</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            Tip: Use New Tab to open multiple apps side by side
          </Text>
          <Text style={styles.infoTextSmall}>
            Auth is bypassed in dev mode. User type changes based on selected app.
          </Text>
        </View>

        <Pressable 
          style={styles.backButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.backButtonText}>← Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  content: {
    flex: 1,
    padding: ds.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: ds.typography.size.hero,
    fontWeight: ds.typography.weight.bold as '700',
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: ds.typography.size.bodyLg,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xxl,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: ds.spacing.lg,
    width: '100%',
  },
  card: {
    padding: ds.spacing.xl,
    minWidth: 260,
    maxWidth: 280,
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: ds.spacing.md,
  },
  cardTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold as '600',
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.sm,
  },
  cardDesc: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    marginBottom: ds.spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
  },
  button: {
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.md,
  },
  primaryButton: {
    backgroundColor: ds.colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ds.colors.primary,
  },
  buttonText: {
    color: '#000',
    fontWeight: ds.typography.weight.semibold as '600',
    fontSize: ds.typography.size.body,
  },
  buttonTextSecondary: {
    color: ds.colors.primary,
    fontWeight: ds.typography.weight.semibold as '600',
    fontSize: ds.typography.size.body,
  },
  info: {
    marginTop: ds.spacing.xxl,
    alignItems: 'center',
  },
  infoText: {
    color: ds.colors.textSecondary,
    fontSize: ds.typography.size.body,
    marginBottom: ds.spacing.xs,
  },
  infoTextSmall: {
    color: ds.colors.textSecondary,
    fontSize: ds.typography.size.caption,
    opacity: 0.7,
  },
  backButton: {
    marginTop: ds.spacing.xl,
    padding: ds.spacing.md,
  },
  backButtonText: {
    color: ds.colors.textSecondary,
    fontSize: ds.typography.size.body,
  },
});
