/**
 * Cancellation Logic Hook
 * Provides comprehensive cancellation logic including fee calculation,
 * free cancellation timing, and consequences for different ride statuses
 */

import { useMemo, useCallback } from 'react';
import { RideStatus } from '@/types/rideLifecycle';

// Ride statuses that can be cancelled
export type CancellableRideStatus = 
  | 'searching'
  | 'assigned'
  | 'driver_en_route'
  | 'arrived'
  | 'in_progress';

export interface CancellationFeeCalculation {
  fee: number;
  isFree: boolean;
  freeTimeRemaining: number;
  reason: string;
  consequences: string[];
}

export interface CancellationLogicOptions {
  rideStatus: CancellableRideStatus;
  ridePrice?: number;
  acceptedAt?: number;
  driverEnRouteTime?: number;
  freeCancellationWindow?: number; // seconds
  customFee?: number;
}

export interface CancellationThresholds {
  searching: number;
  assigned: number;
  driver_en_route: number;
  arrived: number;
  in_progress: number; // multiplier for ride price
}

const DEFAULT_THRESHOLDS: CancellationThresholds = {
  searching: 0,
  assigned: 2.50,
  driver_en_route: 2.50,
  arrived: 5.00,
  in_progress: 1.0, // Full ride price
};

const DEFAULT_FREE_CANCELLATION_WINDOW = 300; // 5 minutes

/**
 * Helper function to check if a ride status is cancellable
 */
const _isCancellableStatus = (status: RideStatus): status is CancellableRideStatus => {
  return [
    'searching',
    'assigned', 
    'driver_en_route',
    'arrived',
    'in_progress'
  ].includes(status);
};

/**
 * Hook for managing ride cancellation logic
 */
export const useCancellationLogic = (options: CancellationLogicOptions) => {
  const {
    rideStatus,
    ridePrice = 0,
    acceptedAt,
    driverEnRouteTime = 0,
    freeCancellationWindow = DEFAULT_FREE_CANCELLATION_WINDOW,
    customFee,
  } = options;

  /**
   * Calculate free cancellation time remaining
   */
  const getFreeCancellationTimeRemaining = useCallback((): number => {
    if (rideStatus !== 'assigned' || !acceptedAt) {
      return 0;
    }

    const elapsed = Math.floor((Date.now() - acceptedAt) / 1000);
    return Math.max(0, freeCancellationWindow - elapsed);
  }, [rideStatus, acceptedAt, freeCancellationWindow]);

  /**
   * Calculate cancellation fee
   */
  const calculateCancellationFee = useCallback((): number => {
    // Check if free cancellation applies
    const freeTimeRemaining = getFreeCancellationTimeRemaining();
    if (freeTimeRemaining > 0) {
      return 0;
    }

    // Use custom fee if provided
    if (customFee !== undefined) {
      return customFee;
    }

    // Calculate based on ride status with safe fallback
    const threshold = DEFAULT_THRESHOLDS[rideStatus] || 0;
    
    if (rideStatus === 'in_progress' && ridePrice > 0) {
      return ridePrice * threshold; // Full ride price
    }
    
    return threshold;
  }, [rideStatus, ridePrice, customFee, getFreeCancellationTimeRemaining]);

  /**
   * Get cancellation reason/message
   */
  const getCancellationReason = useCallback((): string => {
    const freeTimeRemaining = getFreeCancellationTimeRemaining();
    const fee = calculateCancellationFee();

    if (freeTimeRemaining > 0) {
      const mins = Math.floor(freeTimeRemaining / 60);
      const secs = freeTimeRemaining % 60;
      return `Free cancellation available for ${mins}:${secs.toString().padStart(2, '0')}`;
    }

    switch (rideStatus) {
      case 'searching':
        return 'No cancellation fee will be charged.';
      case 'assigned':
        return fee > 0 
          ? `A cancellation fee of $${fee.toFixed(2)} will be charged.`
          : 'A small cancellation fee may apply.';
      case 'driver_en_route':
        return fee > 0 
          ? `A cancellation fee of $${fee.toFixed(2)} will be charged.`
          : 'A small cancellation fee may apply.';
      case 'arrived':
        return `Driver has arrived. Cancellation fee of $${fee.toFixed(2)} applies.`;
      case 'in_progress':
        return `Cancellation during ride will result in full fare charge ($${fee.toFixed(2)}).`;
      default:
        return 'This ride cannot be cancelled at this time.';
    }
  }, [rideStatus, calculateCancellationFee, getFreeCancellationTimeRemaining]);

  /**
   * Get cancellation consequences
   */
  const getCancellationConsequences = useCallback((): string[] => {
    const fee = calculateCancellationFee();
    const items = [
      'Your driver will be notified immediately',
      getCancellationReason(),
    ];

    // Add status-specific consequences
    if (rideStatus === 'searching') {
      items.push('You can immediately request a new ride after cancellation');
    } else if (rideStatus === 'assigned' || rideStatus === 'driver_en_route') {
      items.push('Driver rating may be affected by frequent cancellations');
      
      if (driverEnRouteTime > 60) {
        const mins = Math.floor(driverEnRouteTime / 60);
        items.push(`Driver has been en route for ${mins} minute${mins > 1 ? 's' : ''}`);
      }
    } else if (rideStatus === 'arrived') {
      items.push('Driver has already traveled to your location');
      items.push('Driver will need to wait for their next ride request');
    } else if (rideStatus === 'in_progress') {
      items.push('You will be charged the full ride fare');
      items.push('Trip will end at your current location');
    } else {
      // Unknown status - provide generic information
      items.push('This ride cannot be cancelled at this time');
      return items; // Return early for unknown status
    }

    // Add fee-related information
    if (fee > 0) {
      items.push(`The fee will be charged to your original payment method`);
    }

    // Add rebooking information
    if (rideStatus !== 'searching') {
      items.push('You may need to wait longer for your next ride');
    }

    return items;
  }, [rideStatus, calculateCancellationFee, getCancellationReason, driverEnRouteTime]);

  /**
   * Check if cancellation is allowed
   */
  const isCancellationAllowed = useCallback((): boolean => {
    // Cancellation is always allowed, but fees may apply
    // Some platforms might restrict cancellation after certain points
    return true;
  }, []);

  /**
   * Get comprehensive cancellation calculation
   */
  const cancellationCalculation = useMemo((): CancellationFeeCalculation => {
    const fee = calculateCancellationFee();
    const freeTimeRemaining = getFreeCancellationTimeRemaining();
    
    return {
      fee,
      isFree: fee === 0,
      freeTimeRemaining,
      reason: getCancellationReason(),
      consequences: getCancellationConsequences(),
    };
  }, [
    calculateCancellationFee,
    getFreeCancellationTimeRemaining,
    getCancellationReason,
    getCancellationConsequences,
  ]);

  /**
   * Format time remaining for display
   */
  const formatTimeRemaining = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Get driver en route time formatted
   */
  const getDriverEnRouteTimeFormatted = useCallback((): string => {
    if (driverEnRouteTime < 60) {
      return `${driverEnRouteTime} second${driverEnRouteTime !== 1 ? 's' : ''}`;
    }
    
    const mins = Math.floor(driverEnRouteTime / 60);
    const secs = driverEnRouteTime % 60;
    
    if (secs === 0) {
      return `${mins} minute${mins > 1 ? 's' : ''}`;
    }
    
    return `${mins} minute${mins > 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
  }, [driverEnRouteTime]);

  /**
   * Check if ride is in critical phase (higher fees)
   */
  const isCriticalPhase = useCallback((): boolean => {
    return rideStatus === 'arrived' || rideStatus === 'in_progress';
  }, [rideStatus]);

  /**
   * Get cancellation severity level
   */
  const getCancellationSeverity = useCallback((): 'low' | 'medium' | 'high' | 'critical' => {
    const fee = calculateCancellationFee();
    const freeTimeRemaining = getFreeCancellationTimeRemaining();
    
    if (freeTimeRemaining > 0) return 'low';
    if (fee === 0) return 'low';
    if (fee <= 2.50) return 'medium';
    if (fee <= 5.00) return 'high';
    return 'critical';
  }, [calculateCancellationFee, getFreeCancellationTimeRemaining]);

  return {
    // Core calculation
    cancellationCalculation,
    
    // Individual components
    fee: calculateCancellationFee(),
    isFree: calculateCancellationFee() === 0,
    freeTimeRemaining: getFreeCancellationTimeRemaining(),
    reason: getCancellationReason(),
    consequences: getCancellationConsequences(),
    
    // Status checks
    isCancellationAllowed: isCancellationAllowed(),
    isCriticalPhase: isCriticalPhase(),
    severity: getCancellationSeverity(),
    
    // Formatted helpers
    formatTimeRemaining,
    getDriverEnRouteTimeFormatted,
  };
};

/**
 * Hook for cancellation analytics tracking
 */
export const useCancellationAnalytics = () => {
  const trackCancellationAttempt = useCallback((_options: {
    rideStatus: RideStatus;
    fee: number;
    timeToDecision: number; // seconds from dialog open to decision
    decision: 'confirmed' | 'dismissed';
  }) => {
    // Track cancellation attempt for analytics
    // TODO: Replace with actual analytics service
    // console.log('Cancellation attempt tracked:', {
    //   event: 'cancellation_attempt',
    //   ...options,
    //   timestamp: Date.now(),
    // });
  }, []);

  const trackCancellationCompleted = useCallback((_options: {
    rideStatus: RideStatus;
    feeCharged: number;
    cancellationReason: string;
  }) => {
    // Track completed cancellation
    // TODO: Replace with actual analytics service
    // console.log('Cancellation completed:', {
    //   event: 'cancellation_completed',
    //   ...options,
    //   timestamp: Date.now(),
    // });
  }, []);

  return {
    trackCancellationAttempt,
    trackCancellationCompleted,
  };
};

/**
 * Hook for cancellation policy information
 */
export const useCancellationPolicy = () => {
  const getPolicyText = useCallback((rideStatus: RideStatus): string => {
    switch (rideStatus) {
      case 'searching':
        return 'Free cancellation - no fees apply';
      case 'assigned':
        return 'Free cancellation for first 5 minutes, then $2.50 fee';
      case 'driver_en_route':
        return '$2.50 cancellation fee applies';
      case 'arrived':
        return '$5.00 cancellation fee applies - driver has arrived';
      case 'in_progress':
        return 'Full ride price charged - ride is in progress';
      default:
        return 'Standard cancellation policy applies';
    }
  }, []);

  const getPolicyDetails = useCallback((): Array<{
    status: RideStatus;
    policy: string;
    fee: string;
  }> => {
    return [
      {
        status: 'searching',
        policy: 'Before driver accepts',
        fee: 'Free',
      },
      {
        status: 'assigned',
        policy: 'After driver accepts (5 min window)',
        fee: 'Free → $2.50',
      },
      {
        status: 'driver_en_route',
        policy: 'Driver en route',
        fee: '$2.50',
      },
      {
        status: 'arrived',
        policy: 'Driver at pickup location',
        fee: '$5.00',
      },
      {
        status: 'in_progress',
        policy: 'Ride in progress',
        fee: 'Full price',
      },
    ];
  }, []);

  return {
    getPolicyText,
    getPolicyDetails,
  };
};

export default useCancellationLogic;
