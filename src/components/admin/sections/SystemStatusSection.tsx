/**
 * System Status Section
 * Admin interface for monitoring system health and performance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { ds } from '../../../constants/theme';
import { GlassCard } from '../../ui/GlassCard';
import { PremiumButton } from '../../ui/PremiumButton';
import { CustomIcon, type CustomIconProps } from '../../ui/CustomIcon';
import { CircularProgress } from '../../ui/CircularProgress';

 
interface SystemStatusSectionProps {
  // Props can be added later for real-time monitoring
}

export const SystemStatusSection: React.FC<SystemStatusSectionProps> = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    overall: 'healthy' as 'healthy' | 'warning' | 'critical',
    uptime: 99.9,
    responseTime: 145,
    activeConnections: 1247,
    databaseStatus: 'healthy' as 'healthy' | 'warning' | 'critical',
    apiStatus: 'healthy' as 'healthy' | 'warning' | 'critical',
    storageStatus: 'warning' as 'healthy' | 'warning' | 'critical',
  });

  useEffect(() => {
    // Simulate real-time status updates
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        responseTime: Math.floor(Math.random() * 200) + 100,
        activeConnections: Math.floor(Math.random() * 500) + 1000,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate system check
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSystemStatus(prev => ({
      ...prev,
      uptime: Math.random() * 0.5 + 99.5,
    }));
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return ds.colors.success;
      case 'warning': return ds.colors.warning;
      case 'critical': return ds.colors.error;
      default: return ds.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string): CustomIconProps['name'] => {
    switch (status) {
      case 'healthy': return 'activity';
      case 'warning': return 'settings';
      case 'critical': return 'settings';
      default: return 'location';
    }
  };

  const renderStatusCard = (title: string, status: string, value?: string | number, subtitle?: string) => (
    <GlassCard intensity={15} style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusTitle}>{title}</Text>
        <View style={styles.statusIndicator}>
          <CustomIcon 
            name={getStatusIcon(status)} 
            size={16} 
            color={getStatusColor(status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
            {status.toUpperCase()}
          </Text>
        </View>
      </View>
      {value !== undefined && (
        <Text style={styles.statusValue}>{value}</Text>
      )}
      {subtitle && (
        <Text style={styles.statusSubtitle}>{subtitle}</Text>
      )}
    </GlassCard>
  );

  const renderMetricRow = (label: string, value: string | number, unit?: string, status?: 'good' | 'warning' | 'bad') => (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricValueContainer}>
        <Text style={[
          styles.metricValue,
          status === 'warning' && { color: ds.colors.warning },
          status === 'bad' && { color: ds.colors.error }
        ]}>
          {value}{unit}
        </Text>
      </View>
    </View>
  );

  const overallStatus = systemStatus.overall;
  const statusColor = getStatusColor(overallStatus);

  return (
    <View style={styles.container}>
      {/* Overall Status */}
      <GlassCard intensity={20} style={styles.overallStatusCard}>
        <View style={styles.overallStatusContent}>
          <View style={styles.statusIconContainer}>
            <CircularProgress
              size={80}
              progress={systemStatus.uptime / 100}
              color={statusColor}
            />
          <View style={styles.centerIcon}>
            <CustomIcon 
              name={getStatusIcon(overallStatus)} 
              size={32} 
              color={statusColor}
            />
          </View>
          </View>
          <View style={styles.overallStatusText}>
            <Text style={styles.overallStatusTitle}>
              System {overallStatus.toUpperCase()}
            </Text>
            <Text style={styles.uptimeText}>
              {systemStatus.uptime.toFixed(1)}% Uptime
            </Text>
            <Text style={styles.lastUpdatedText}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          </View>
          <PremiumButton
            variant="secondary"
            size="sm"
            onPress={handleRefresh}
            loading={isRefreshing}
          >
            <CustomIcon name="activity" size={16} />
          </PremiumButton>
        </View>
      </GlassCard>

      {/* Service Status */}
      <GlassCard intensity={15} style={styles.servicesCard}>
        <Text style={styles.sectionTitle}>Service Status</Text>
        {renderStatusCard('API Gateway', systemStatus.apiStatus, '145ms', 'Response time')}
        {renderStatusCard('Database', systemStatus.databaseStatus, '99.9%', 'Availability')}
        {renderStatusCard('Storage', systemStatus.storageStatus, '78%', 'Used capacity')}
      </GlassCard>

      {/* Performance Metrics */}
      <GlassCard intensity={15} style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        {renderMetricRow('Response Time', systemStatus.responseTime, 'ms', 
          systemStatus.responseTime > 200 ? 'bad' : systemStatus.responseTime > 150 ? 'warning' : 'good')}
        {renderMetricRow('Active Connections', systemStatus.activeConnections, '', 'good')}
        {renderMetricRow('CPU Usage', '23', '%', 'good')}
        {renderMetricRow('Memory Usage', '67', '%', 'warning')}
        {renderMetricRow('Disk I/O', '145', 'MB/s', 'good')}
        {renderMetricRow('Network Throughput', '2.3', 'GB/s', 'good')}
      </GlassCard>

      {/* Recent Activity */}
      <GlassCard intensity={15} style={styles.activityCard}>
        <Text style={styles.sectionTitle}>Recent System Activity</Text>
        <View style={styles.activityItem}>
          <CustomIcon name="activity" size={16} color={ds.colors.success} />
          <Text style={styles.activityText}>
            Database backup completed successfully
          </Text>
          <Text style={styles.activityTime}>2 min ago</Text>
        </View>
        <View style={styles.activityItem}>
          <CustomIcon name="profile" size={16} color={ds.colors.warning} />
          <Text style={styles.activityText}>
            High memory usage detected on server-3
          </Text>
          <Text style={styles.activityTime}>15 min ago</Text>
        </View>
        <View style={styles.activityItem}>
          <CustomIcon name="location" size={16} color={ds.colors.primary} />
          <Text style={styles.activityText}>
            API rate limits adjusted for peak hours
          </Text>
          <Text style={styles.activityTime}>1 hour ago</Text>
        </View>
        <View style={styles.activityItem}>
          <CustomIcon name="settings" size={16} color={ds.colors.success} />
          <Text style={styles.activityText}>
            Security patches applied to all servers
          </Text>
          <Text style={styles.activityTime}>3 hours ago</Text>
        </View>
      </GlassCard>

      {/* Quick Actions */}
      <GlassCard intensity={15} style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>System Actions</Text>
        <View style={styles.actionButtons}>
          <PremiumButton
            variant="secondary"
            size="md"
            onPress={() => {}}
            style={styles.actionButton}
          >
            <CustomIcon name="activity" size={16} />
            Restart Services
          </PremiumButton>
          <PremiumButton
            variant="secondary"
            size="md"
            onPress={() => {}}
            style={styles.actionButton}
          >
            <CustomIcon name="settings" size={16} />
            Clear Cache
          </PremiumButton>
          <PremiumButton
            variant="primary"
            size="md"
            onPress={() => {}}
            style={styles.actionButton}
          >
            <CustomIcon name="profile" size={16} />
            View Logs
          </PremiumButton>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overallStatusCard: {
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.md,
  },
  overallStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.lg,
  },
  statusIconContainer: {
    position: 'relative',
  },
  centerIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -16,
  },
  overallStatusText: {
    flex: 1,
  },
  overallStatusTitle: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.xs,
  },
  uptimeText: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.primary,
    marginBottom: ds.spacing.xs,
  },
  lastUpdatedText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textMuted,
  },
  servicesCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  sectionTitle: {
    fontSize: ds.typography.size.title,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.textPrimary,
    marginBottom: ds.spacing.md,
  },
  statusCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.sm,
  },
  statusTitle: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
  },
  statusText: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
  },
  statusValue: {
    fontSize: ds.typography.size.display,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.primary,
    marginBottom: ds.spacing.xs,
  },
  statusSubtitle: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textSecondary,
  },
  metricsCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
  },
  metricLabel: {
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.medium,
    color: ds.colors.textPrimary,
  },
  metricValueContainer: {
    alignItems: 'flex-end',
  },
  metricValue: {
    fontSize: ds.typography.size.bodyLg,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.primary,
  },
  activityCard: {
    padding: ds.spacing.md,
    marginBottom: ds.spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    paddingVertical: ds.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.border,
  },
  activityText: {
    flex: 1,
    fontSize: ds.typography.size.body,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textPrimary,
  },
  activityTime: {
    fontSize: ds.typography.size.caption,
    fontFamily: ds.typography.family,
    fontWeight: ds.typography.weight.regular,
    color: ds.colors.textMuted,
  },
  actionsCard: {
    padding: ds.spacing.md,
  },
  actionButtons: {
    gap: ds.spacing.sm,
  },
  actionButton: {
    // Uses PremiumButton defaults
  },
});
