/**
 * KYC Configuration Section
 * Admin interface for managing role-based KYC document requirements
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { ds } from '../../../constants/theme';
import { GlassCard } from '../../ui/GlassCard';
import { PremiumButton } from '../../ui/PremiumButton';
import { CustomIcon } from '../../ui/CustomIcon';
import { KYCConfigurationService, type KYCDocumentConfig } from '../../../api/kycConfiguration';
import { log } from '../../../utils/logger';

export const KYCConfigurationSection: React.FC = () => {
  const [configurations, setConfigurations] = useState<KYCDocumentConfig[]>([]);
  const [_isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const roles = ['rider', 'driver', 'admin'] as const;

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await KYCConfigurationService.getConfiguration();
      setConfigurations(response.configurations);
    } catch (error) {
      log.error('Failed to load KYC configuration', { event: 'load_kyc_configuration_failed', component: 'kycConfigurationSection' }, error);
      // Fallback to default configuration
      setConfigurations(KYCConfigurationService.getDefaultConfiguration());
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const response = await KYCConfigurationService.updateConfiguration(configurations);
      setConfigurations(response.configurations);
      Alert.alert('Success', 'KYC configuration updated successfully');
    } catch (error) {
      log.error('Failed to save KYC configuration', { event: 'save_kyc_configuration_failed', component: 'kycConfigurationSection' }, error);
      Alert.alert('Error', 'Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Configuration',
      'Are you sure you want to reset to default KYC requirements?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await KYCConfigurationService.resetToDefaults();
              setConfigurations(response.configurations);
              Alert.alert('Success', 'Configuration reset to defaults');
            } catch (error) {
              log.error('Failed to reset configuration', { event: 'reset_configuration_failed', component: 'kycConfigurationSection' }, error);
              Alert.alert('Error', 'Failed to reset configuration');
            }
          },
        },
      ]
    );
  };

  const toggleRoleRequirement = (docType: string, role: string) => {
    setConfigurations(prev =>
      prev.map(config => {
        if (config.type === docType) {
          const updatedRoles = config.requiredForRoles.includes(role as 'rider' | 'driver' | 'admin')
            ? config.requiredForRoles.filter(r => r !== role)
            : [...config.requiredForRoles, role as 'rider' | 'driver' | 'admin'];
          return { ...config, requiredForRoles: updatedRoles };
        }
        return config;
      })
    );
  };

  const renderRoleToggle = (config: KYCDocumentConfig, role: string) => {
    const isRequired = config.requiredForRoles.includes(role as 'rider' | 'driver' | 'admin');
    
    return (
      <PremiumButton
        variant={isRequired ? 'primary' : 'ghost'}
        size="sm"
        onPress={() => toggleRoleRequirement(config.type, role)}
        style={styles.roleToggle}
      >
        <Text style={[
          styles.roleToggleText,
          { color: isRequired ? ds.colors.background : ds.colors.textSecondary }
        ]}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Text>
      </PremiumButton>
    );
  };

  const renderDocumentConfig = (config: KYCDocumentConfig) => (
    <GlassCard key={config.type} intensity={15} style={styles.documentConfigCard}>
      <View style={styles.documentConfigHeader}>
        <View style={styles.documentConfigInfo}>
          <Text style={styles.documentConfigTitle}>{config.title}</Text>
          <Text style={styles.documentConfigDescription}>{config.description}</Text>
        </View>
        <CustomIcon name="settings" size={20} color={ds.colors.primary} />
      </View>

      <View style={styles.roleTogglesContainer}>
        <Text style={styles.roleTogglesLabel}>Required for:</Text>
        <View style={styles.roleTogglesRow}>
          {roles.map(role => renderRoleToggle(config, role))}
        </View>
      </View>

      {config.examples.length > 0 && (
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesLabel}>Examples:</Text>
          {config.examples.map((example, index) => (
            <Text key={index} style={styles.exampleText}>• {example}</Text>
          ))}
        </View>
      )}
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <GlassCard intensity={15} style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.sectionTitle}>KYC Configuration</Text>
            <Text style={styles.sectionSubtitle}>
              Manage document requirements for each user role
            </Text>
          </View>
          <View style={styles.headerActions}>
            <PremiumButton
              variant="secondary"
              size="sm"
              onPress={resetToDefaults}
              style={styles.headerButton}
            >
              <CustomIcon name="settings" size={16} />
              Reset
            </PremiumButton>
            <PremiumButton
              variant="primary"
              size="sm"
              onPress={saveConfiguration}
              loading={isSaving}
              style={styles.headerButton}
            >
              <CustomIcon name="activity" size={16} />
              Save
            </PremiumButton>
          </View>
        </View>
      </GlassCard>

      {/* Configuration Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {configurations.map(renderDocumentConfig)}
      </ScrollView>

      {/* Info Section */}
      <GlassCard intensity={15} style={styles.infoCard}>
        <View style={styles.infoContent}>
          <CustomIcon name="profile" size={20} color={ds.colors.primary} />
          <Text style={styles.infoText}>
            Changes to KYC requirements will affect new user onboarding. Existing users will not be required to upload additional documents unless their role changes.
          </Text>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: ds.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
  },
  headerButton: {
    // Uses PremiumButton defaults
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: ds.spacing.md,
  },
  documentConfigCard: {
    padding: ds.spacing.md,
  },
  documentConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ds.spacing.md,
  },
  documentConfigInfo: {
    flex: 1,
  },
  documentConfigTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  documentConfigDescription: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
  },
  roleTogglesContainer: {
    marginBottom: ds.spacing.md,
  },
  roleTogglesLabel: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.sm,
  },
  roleTogglesRow: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
  },
  roleToggle: {
    flex: 1,
  },
  roleToggleText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
  },
  examplesContainer: {
    paddingTop: ds.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ds.colors.border,
  },
  examplesLabel: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.sm,
  },
  exampleText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  infoCard: {
    padding: ds.spacing.md,
    marginTop: ds.spacing.md,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textPrimary,
    lineHeight: ds.typography.lineHeight.body,
  },
});
