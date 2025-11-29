/**
 * Driver Location Tracking Hook
 * Provides real-time GPS updates during active rides using WebSocket infrastructure
 * Optimized for battery efficiency with configurable update intervals
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { wsService, LocationUpdate } from '../services/websocketService';
import { deviceLocationManager } from '../services/deviceLocationManager';
import { log } from '../utils/logger';
import { useEnhancedDriverState } from '../store/useEnhancedAppStore';
import * as ExpoLocation from 'expo-location';
import { Location as RideLocation } from '../api/rides';

// Configuration for location tracking
const LOCATION_CONFIG = {
  updateInterval: 5000, // 5 seconds during active rides
  accuracy: ExpoLocation.Accuracy.High,
  distanceFilter: 10, // meters
  maxRetryAttempts: 3,
  retryDelay: 2000,
  batteryOptimization: {
    disableDuringOffline: true,
    reduceFrequencyInLowBattery: true,
    lowBatteryThreshold: 0.2, // 20%
    lowBatteryInterval: 10000, // 10 seconds
  }
};

interface DriverLocationState {
  currentLocation: RideLocation | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  isTracking: boolean;
  lastUpdate: number | null;
  error: string | null;
}

interface LocationTrackingMetrics {
  totalUpdates: number;
  averageAccuracy: number;
  maxSpeed: number;
  distanceTraveled: number;
  trackingDuration: number;
}

export function useDriverLocationTracking() {
  const { currentRide, driverState } = useEnhancedDriverState();
  
  const [locationState, setLocationState] = useState<DriverLocationState>({
    currentLocation: null,
    heading: null,
    speed: null,
    accuracy: null,
    isTracking: false,
    lastUpdate: null,
    error: null,
  });

  const [metrics, setMetrics] = useState<LocationTrackingMetrics>({
    totalUpdates: 0,
    averageAccuracy: 0,
    maxSpeed: 0,
    distanceTraveled: 0,
    trackingDuration: 0,
  });

  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocationRef = useRef<RideLocation | null>(null);
  const trackingStartTimeRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  // Start location tracking for active rides
  const startTracking = useCallback(async () => {
    if (!currentRide || driverState !== 'accepted') {
      log.warn('Cannot start tracking: no active ride or driver not online', {
        event: 'location_tracking_start_failed',
        component: 'useDriverLocationTracking',
        hasRide: !!currentRide,
        driverState,
      });
      return;
    }

    try {
      // Request location permissions
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      setLocationState(prev => ({
        ...prev,
        isTracking: true,
        error: null,
      }));

      trackingStartTimeRef.current = Date.now();
      retryCountRef.current = 0;

      // Start periodic location updates
      const updateLocation = async () => {
        try {
          const locationResult = await deviceLocationManager.getCurrentLocation({
            accuracy: LOCATION_CONFIG.accuracy,
            timeout: 5000,
          });

          if (locationResult.success && locationResult.coordinates) {
            const location: RideLocation = {
              lat: locationResult.coordinates.latitude,
              lon: locationResult.coordinates.longitude,
            };

            const heading = locationResult.coordinates.heading || 0;
            const speed = locationResult.coordinates.speed || 0;
            const accuracy = locationResult.coordinates.accuracy || 0;

            // Calculate distance traveled
            let distanceDelta = 0;
            if (lastLocationRef.current) {
              distanceDelta = calculateDistance(
                lastLocationRef.current,
                location
              );
            }

            // Update metrics
            setMetrics(prev => {
              const newTotal = prev.totalUpdates + 1;
              const newAverageAccuracy = (prev.averageAccuracy * prev.totalUpdates + accuracy) / newTotal;
              const newMaxSpeed = Math.max(prev.maxSpeed, speed);
              const newDistance = prev.distanceTraveled + distanceDelta;
              const newDuration = trackingStartTimeRef.current ? Date.now() - trackingStartTimeRef.current : 0;

              return {
                totalUpdates: newTotal,
                averageAccuracy: newAverageAccuracy,
                maxSpeed: newMaxSpeed,
                distanceTraveled: newDistance,
                trackingDuration: newDuration,
              };
            });

            // Send location update via WebSocket
            const locationUpdate: LocationUpdate = {
              rideId: currentRide.id,
              driverId: currentRide.driverId || 'unknown',
              location,
              timestamp: new Date().toISOString(),
              heading,
              speed,
            };

            wsService.sendLocationUpdate(locationUpdate);

            // Update local state
            setLocationState(prev => ({
              ...prev,
              currentLocation: location,
              heading,
              speed,
              accuracy,
              lastUpdate: Date.now(),
            }));

            lastLocationRef.current = location;
            retryCountRef.current = 0;

            log.debug('Location update sent', {
              event: 'location_update_sent',
              component: 'useDriverLocationTracking',
              rideId: currentRide.id,
              accuracy,
              speed,
              heading,
            });

          } else {
            throw new Error(locationResult.error?.message || 'Failed to get location');
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Location update failed';
          log.error('Location update error', {
            event: 'location_update_error',
            component: 'useDriverLocationTracking',
            error: errorMessage,
            retryCount: retryCountRef.current,
          });

          // Retry logic
          if (retryCountRef.current < LOCATION_CONFIG.maxRetryAttempts) {
            retryCountRef.current++;
            setTimeout(updateLocation, LOCATION_CONFIG.retryDelay);
          } else {
            setLocationState(prev => ({
              ...prev,
              error: errorMessage,
              isTracking: false,
            }));
            stopTracking();
          }
        }
      };

      // Initial location update
      await updateLocation();

      // Set up periodic updates
      trackingIntervalRef.current = setInterval(updateLocation, LOCATION_CONFIG.updateInterval);

      log.info('Location tracking started', {
        event: 'location_tracking_started',
        component: 'useDriverLocationTracking',
        rideId: currentRide.id,
        updateInterval: LOCATION_CONFIG.updateInterval,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start tracking';
      log.error('Failed to start location tracking', {
        event: 'location_tracking_start_error',
        component: 'useDriverLocationTracking',
        error: errorMessage,
      });
      
      setLocationState(prev => ({
        ...prev,
        error: errorMessage,
        isTracking: false,
      }));
    }
  }, [currentRide, driverState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    setLocationState(prev => ({
      ...prev,
      isTracking: false,
    }));

    trackingStartTimeRef.current = null;
    lastLocationRef.current = null;

    log.info('Location tracking stopped', {
      event: 'location_tracking_stopped',
      component: 'useDriverLocationTracking',
    });
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((point1: RideLocation, point2: RideLocation): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lon - point1.lon) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Auto-start/stop tracking based on ride state
  useEffect(() => {
    if (currentRide && driverState === 'accepted' && !locationState.isTracking) {
      startTracking();
    } else if ((!currentRide || driverState !== 'accepted') && locationState.isTracking) {
      stopTracking();
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [currentRide, driverState, locationState.isTracking, startTracking, stopTracking]);

  return {
    locationState,
    metrics,
    startTracking,
    stopTracking,
    isTrackingActive: locationState.isTracking,
  };
}
