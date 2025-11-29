/**
 * Admin Dashboard Route
 * Protected admin route with role-based access control
 */

import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ds } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { AdminDashboard } from '../../components/admin/AdminDashboard';
import { useEnhancedAppStore } from '../../store/useEnhancedAppStore';

export default function AdminDashboardScreen() {
  const { user } = useEnhancedAppStore();

  // Role-based access control
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      Alert.alert(
        'Access Denied',
        'You do not have permission to access this area.',
        [{ text: 'OK' }]
      );
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <View style={styles.accessDenied}>
        <GlassCard intensity={20} style={styles.accessDeniedCard}>
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            Admin access required to view this page.
          </Text>
        </GlassCard>
      </View>
    );
  }

  return <AdminDashboard />;
}

const styles = StyleSheet.create({
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ds.colors.background,
    padding: ds.spacing.lg,
  },
  accessDeniedCard: {
    padding: ds.spacing.xl,
    alignItems: 'center',
    maxWidth: 400,
  },
  accessDeniedTitle: {
    fontSize: ds.typography.size.display,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.error,
    textAlign: 'center',
    marginBottom: ds.spacing.md,
  },
  accessDeniedText: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    lineHeight: ds.typography.lineHeight.body,
  },
});
