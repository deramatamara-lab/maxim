/**
 * Cancellation Demo Component
 * Demonstrates the ride cancellation system with different scenarios
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { ds } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { CancellationDialog } from '@/components/ride/CancellationDialog';
import { useCancellationLogic, CancellableRideStatus } from '@/hooks/useCancellationLogic';

interface DemoScenario {
  name: string;
  description: string;
  rideStatus: CancellableRideStatus;
  ridePrice: number;
  driverEnRouteTime: number;
  freeCancellationTimeLeft: number;
  customFee?: number;
}

const demoScenarios: DemoScenario[] = [
  {
    name: 'Searching Ride',
    description: 'Driver hasn\'t accepted yet - always free to cancel',
    rideStatus: 'searching',
    ridePrice: 25.50,
    driverEnRouteTime: 0,
    freeCancellationTimeLeft: 0,
  },
  {
    name: 'Recently Assigned',
    description: 'Driver just assigned - free cancellation window active',
    rideStatus: 'assigned',
    ridePrice: 18.75,
    driverEnRouteTime: 30,
    freeCancellationTimeLeft: 240, // 4 minutes left
  },
  {
    name: 'Driver En Route',
    description: 'Driver confirmed and on the way - fee applies',
    rideStatus: 'driver_en_route',
    ridePrice: 32.00,
    driverEnRouteTime: 180, // 3 minutes
    freeCancellationTimeLeft: 0,
  },
  {
    name: 'Driver Arrived',
    description: 'Driver at pickup location - higher fee applies',
    rideStatus: 'arrived',
    ridePrice: 15.25,
    driverEnRouteTime: 420, // 7 minutes
    freeCancellationTimeLeft: 0,
  },
  {
    name: 'Ride In Progress',
    description: 'Currently on the ride - full price charged',
    rideStatus: 'in_progress',
    ridePrice: 45.00,
    driverEnRouteTime: 600, // 10 minutes
    freeCancellationTimeLeft: 0,
  },
];

export const CancellationDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleScenarioSelect = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setShowDialog(true);
  };

  const handleDismiss = () => {
    setShowDialog(false);
  };

  const handleConfirm = () => {
    setShowDialog(false);
    // TODO: Replace with actual analytics service
    // console.log('Ride cancelled for scenario:', selectedScenario?.name);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride Cancellation Demo</Text>
        <Text style={styles.subtitle}>Test different cancellation scenarios</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scenarios}>
          {demoScenarios.map((scenario, index) => (
            <ScenarioCard
              key={index}
              scenario={scenario}
              onPress={() => handleScenarioSelect(scenario)}
            />
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How Cancellation Works</Text>
          <Text style={styles.infoText}>
            1. Tap any scenario to test the cancellation flow
          </Text>
          <Text style={styles.infoText}>
            2. Wait for the 5-second countdown to complete
          </Text>
          <Text style={styles.infoText}>
            3. Review the fee and consequences
          </Text>
          <Text style={styles.infoText}>
            4. Choose to keep or cancel the ride
          </Text>
        </View>
      </ScrollView>

      <CancellationDialog
        visible={showDialog}
        onDismiss={handleDismiss}
        onConfirm={handleConfirm}
        rideStatus={selectedScenario?.rideStatus || 'searching'}
        ridePrice={selectedScenario?.ridePrice || 0}
        driverEnRouteTime={selectedScenario?.driverEnRouteTime || 0}
        cancellationFee={selectedScenario?.customFee}
      />
    </SafeAreaView>
  );
};

interface ScenarioCardProps {
  scenario: DemoScenario;
  onPress: () => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onPress }) => {
  const cancellationLogic = useCancellationLogic({
    rideStatus: scenario.rideStatus,
    ridePrice: scenario.ridePrice,
    driverEnRouteTime: scenario.driverEnRouteTime,
    customFee: scenario.customFee,
  });

  return (
    <GlassCard elevated style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{scenario.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(scenario.rideStatus) }
        ]}>
          <Text style={styles.statusText}>{scenario.rideStatus}</Text>
        </View>
      </View>

      <Text style={styles.cardDescription}>{scenario.description}</Text>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ride Price:</Text>
          <Text style={styles.detailValue}>${scenario.ridePrice.toFixed(2)}</Text>
        </View>

        {scenario.driverEnRouteTime > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Driver En Route:</Text>
            <Text style={styles.detailValue}>
              {cancellationLogic.getDriverEnRouteTimeFormatted()}
            </Text>
          </View>
        )}

        {scenario.freeCancellationTimeLeft > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Free Time:</Text>
            <Text style={styles.detailValue}>
              {cancellationLogic.formatTimeRemaining(scenario.freeCancellationTimeLeft)}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cancellation Fee:</Text>
          <Text style={[
            styles.detailValue,
            { color: cancellationLogic.fee > 0 ? ds.colors.danger : ds.colors.success }
          ]}>
            {cancellationLogic.fee > 0 ? `$${cancellationLogic.fee.toFixed(2)}` : 'FREE'}
          </Text>
        </View>
      </View>

      <PremiumButton
        onPress={onPress}
        variant="primary"
        size="sm"
        style={styles.testButton}
      >
        Test Cancellation
      </PremiumButton>
    </GlassCard>
  );
};

const getStatusColor = (status: CancellableRideStatus): string => {
  switch (status) {
    case 'searching': return ds.colors.textSecondary;
    case 'assigned': return ds.colors.primary;
    case 'driver_en_route': return ds.colors.warning;
    case 'arrived': return ds.colors.danger;
    case 'in_progress': return ds.colors.danger;
    default: return ds.colors.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.backgroundDeep,
  },
  header: {
    padding: ds.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: ds.typography.size.display,
    fontWeight: ds.typography.weight.bold,
    color: ds.colors.text,
    marginBottom: ds.spacing.xs,
  },
  subtitle: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: ds.spacing.lg,
  },
  scenarios: {
    gap: ds.spacing.lg,
    marginBottom: ds.spacing.xl,
  },
  card: {
    padding: ds.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  cardTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
  },
  statusBadge: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.sm,
  },
  statusText: {
    fontSize: ds.typography.size.caption,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.lg,
    lineHeight: 22,
  },
  cardDetails: {
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
  },
  detailValue: {
    fontSize: ds.typography.size.body,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.text,
  },
  testButton: {
    marginTop: ds.spacing.md,
  },
  infoSection: {
    padding: ds.spacing.lg,
    backgroundColor: `${ds.colors.primary}10`,
    borderRadius: ds.radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: ds.colors.primary,
  },
  infoTitle: {
    fontSize: ds.typography.size.title,
    fontWeight: ds.typography.weight.semibold,
    color: ds.colors.primary,
    marginBottom: ds.spacing.md,
  },
  infoText: {
    fontSize: ds.typography.size.body,
    color: ds.colors.textSecondary,
    marginBottom: ds.spacing.sm,
    paddingLeft: ds.spacing.sm,
  },
});

export default CancellationDemo;
