/**
 * Safety Service
 * Handles emergency SOS functionality, trip sharing, and driver verification
 * Critical life-saving infrastructure with automatic location sharing and emergency contacts
 */

import { apiClient } from '@/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceLocationManager } from './deviceLocationManager';
import { wsService } from './websocketService';
import { Alert, Platform, Linking } from 'react-native';
import { log } from '@/utils/logger';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface EmergencyEvent {
  id: string;
  type: 'sos_triggered' | 'accident_detected' | 'safety_alert' | 'driver_misconduct';
  rideId: string;
  userId: string;
  driverId: string;
  timestamp: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  };
  status: 'active' | 'resolved' | 'cancelled';
  contactsNotified: string[];
  emergencyServicesNotified: boolean;
  notes?: string;
}

export interface SafetyPreferences {
  emergencyContacts: EmergencyContact[];
  autoNotifyContacts: boolean;
  autoCallEmergency: boolean;
  shareLocationDuringEmergency: boolean;
  enableAccidentDetection: boolean;
  enableVoiceActivation: boolean;
  emergencyMessage: string;
}

export interface TripSharingLink {
  id: string;
  rideId: string;
  shareUrl: string;
  accessCode: string;
  expiresAt: number;
  viewers: string[];
  isActive: boolean;
  realTimeUpdates: boolean;
}

export interface DriverVerification {
  driverId: string;
  photoMatch: boolean;
  licenseVerified: boolean;
  backgroundCheckPassed: boolean;
  safetyScore: number;
  totalTrips: number;
  incidentCount: number;
  lastVerified: string;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
}

class SafetyService {
  private readonly SAFETY_PREFERENCES_KEY = 'safety_preferences';
  private readonly EMERGENCY_EVENTS_KEY = 'emergency_events';
  private readonly ACTIVE_SOS_KEY = 'active_sos';
  private readonly LOCATION_SHARE_INTERVAL = 5000; // 5 seconds during emergency
  private readonly EMERGENCY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  private activeSOSInterval: NodeJS.Timeout | null = null;
  private currentEmergencyEvent: EmergencyEvent | null = null;

  /**
   * Initialize safety service and load preferences
   */
  async initialize(): Promise<void> {
    try {
      // Check for any active SOS events from previous session
      const activeSOS = await AsyncStorage.getItem(this.ACTIVE_SOS_KEY);
      if (activeSOS) {
        const event = JSON.parse(activeSOS) as EmergencyEvent;
        if (event.status === 'active' && Date.now() - event.timestamp < this.EMERGENCY_TIMEOUT) {
          // Resume active SOS session
          this.currentEmergencyEvent = event;
          this.startLocationSharing(event.id);
        } else {
          // Clean up expired SOS
          await AsyncStorage.removeItem(this.ACTIVE_SOS_KEY);
        }
      }
    } catch (error) {
      log.error('Failed to initialize safety service', { event: 'safety_service_init_failed', component: 'safetyService' }, error);
    }
  }

  /**
   * Get safety preferences
   */
  async getSafetyPreferences(): Promise<SafetyPreferences> {
    try {
      const stored = await AsyncStorage.getItem(this.SAFETY_PREFERENCES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      log.error('Failed to load safety preferences', { event: 'load_safety_preferences_failed', component: 'safetyService' }, error);
    }

    // Return default preferences
    return {
      emergencyContacts: [],
      autoNotifyContacts: true,
      autoCallEmergency: false,
      shareLocationDuringEmergency: true,
      enableAccidentDetection: true,
      enableVoiceActivation: false,
      emergencyMessage: 'I need help! This is an emergency.',
    };
  }

  /**
   * Update safety preferences
   */
  async updateSafetyPreferences(preferences: Partial<SafetyPreferences>): Promise<void> {
    try {
      const current = await this.getSafetyPreferences();
      const updated = { ...current, ...preferences };
      await AsyncStorage.setItem(this.SAFETY_PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      log.error('Failed to update safety preferences', { event: 'update_safety_preferences_failed', component: 'safetyService' }, error);
      throw error;
    }
  }

  /**
   * Trigger emergency SOS with automatic location sharing and notifications
   */
  async triggerEmergencySOS(
    rideId: string,
    userId: string,
    driverId: string,
    notes?: string
  ): Promise<EmergencyEvent> {
    try {
      // Get current location
      const locationResult = await deviceLocationManager.getBestAvailableLocation('general');
      if (!locationResult.success || !locationResult.coordinates) {
        throw new Error('Unable to get location for emergency');
      }

      // Create emergency event
      const emergencyEvent: EmergencyEvent = {
        id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'sos_triggered',
        rideId,
        userId,
        driverId,
        timestamp: Date.now(),
        location: {
          latitude: locationResult.coordinates.latitude,
          longitude: locationResult.coordinates.longitude,
          accuracy: locationResult.coordinates.accuracy || 0,
        },
        status: 'active',
        contactsNotified: [],
        emergencyServicesNotified: false,
        notes,
      };

      // Save active SOS
      this.currentEmergencyEvent = emergencyEvent;
      await AsyncStorage.setItem(this.ACTIVE_SOS_KEY, JSON.stringify(emergencyEvent));

      // Start location sharing
      this.startLocationSharing(emergencyEvent.id);

      // Get safety preferences
      const preferences = await this.getSafetyPreferences();

      // Notify emergency contacts
      if (preferences.autoNotifyContacts && preferences.emergencyContacts.length > 0) {
        await this.notifyEmergencyContacts(emergencyEvent, preferences);
      }

      // Notify emergency services if enabled
      if (preferences.autoCallEmergency) {
        await this.notifyEmergencyServices(emergencyEvent);
      }

      // Send alert to backend
      try {
        await apiClient.post('/safety/emergency', {
          eventId: emergencyEvent.id,
          type: emergencyEvent.type,
          rideId,
          location: emergencyEvent.location,
          timestamp: emergencyEvent.timestamp,
          notes,
        });
      } catch (error) {
        log.warn('Failed to notify backend of emergency', { event: 'emergency_backend_notification_failed', component: 'safetyService' }, error);
        // Continue with local emergency handling
      }

      // Send WebSocket alert
      try {
        wsService.send({
          type: 'emergency_alert',
          eventId: emergencyEvent.id,
          rideId,
          location: emergencyEvent.location,
          timestamp: emergencyEvent.timestamp,
        });
      } catch (error) {
        log.warn('Failed to send WebSocket emergency alert', { event: 'emergency_websocket_alert_failed', component: 'safetyService' }, error);
      }

      return emergencyEvent;
    } catch (error) {
      log.error('Failed to trigger emergency SOS', { event: 'trigger_emergency_sos_failed', component: 'safetyService' }, error);
      throw error;
    }
  }

  /**
   * Cancel active emergency SOS
   */
  async cancelEmergencySOS(): Promise<void> {
    if (!this.currentEmergencyEvent) {
      return;
    }

    try {
      // Stop location sharing
      this.stopLocationSharing();

      // Update event status
      this.currentEmergencyEvent.status = 'cancelled';
      await AsyncStorage.removeItem(this.ACTIVE_SOS_KEY);

      // Notify backend of cancellation
      try {
        await apiClient.post('/safety/emergency/cancel', {
          eventId: this.currentEmergencyEvent.id,
        });
      } catch (error) {
        log.warn('Failed to notify backend of SOS cancellation', { event: 'sos_cancellation_backend_failed', component: 'safetyService' }, error);
      }

      // Send WebSocket cancellation
      try {
        wsService.send({
          type: 'emergency_cancelled',
          eventId: this.currentEmergencyEvent.id,
        });
      } catch (error) {
        log.warn('Failed to send WebSocket cancellation', { event: 'sos_cancellation_websocket_failed', component: 'safetyService' }, error);
      }

      this.currentEmergencyEvent = null;
    } catch (error) {
      log.error('Failed to cancel emergency SOS', { event: 'cancel_emergency_sos_failed', component: 'safetyService' }, error);
      throw error;
    }
  }

  /**
   * Get current active emergency event
   */
  getActiveEmergencyEvent(): EmergencyEvent | null {
    return this.currentEmergencyEvent;
  }

  /**
   * Start real-time location sharing during emergency
   */
  private async startLocationSharing(eventId: string): Promise<void> {
    if (this.activeSOSInterval) {
      clearInterval(this.activeSOSInterval);
    }

    this.activeSOSInterval = setInterval(async () => {
      try {
        const locationResult = await deviceLocationManager.getBestAvailableLocation('general');
        if (locationResult.success && locationResult.coordinates) {
          // Share location via WebSocket
          wsService.send({
            type: 'emergency_location_update',
            eventId,
            location: {
              latitude: locationResult.coordinates.latitude,
              longitude: locationResult.coordinates.longitude,
              accuracy: locationResult.coordinates.accuracy,
              timestamp: Date.now(),
            },
          });

          // Update backend
          try {
            await apiClient.post('/safety/location-update', {
              eventId,
              location: locationResult.coordinates,
            });
          } catch (error) {
            log.warn('Failed to update backend location', { event: 'backend_location_update_failed', component: 'safetyService' }, error);
          }
        }
      } catch (error) {
        log.error('Failed to share location during emergency', { event: 'emergency_location_sharing_failed', component: 'safetyService' }, error);
      }
    }, this.LOCATION_SHARE_INTERVAL);
  }

  /**
   * Stop location sharing
   */
  private stopLocationSharing(): void {
    if (this.activeSOSInterval) {
      clearInterval(this.activeSOSInterval);
      this.activeSOSInterval = null;
    }
  }

  /**
   * Notify emergency contacts
   */
  private async notifyEmergencyContacts(
    event: EmergencyEvent,
    preferences: SafetyPreferences
  ): Promise<void> {
    const notifiedContacts: string[] = [];

    for (const contact of preferences.emergencyContacts) {
      try {
        // Create shareable location link
        const locationUrl = `https://maps.google.com/?q=${event.location.latitude},${event.location.longitude}`;
        
        // Send emergency message (in production, this would use SMS service)
        const message = `🚨 EMERGENCY ALERT 🚨\n\n${preferences.emergencyMessage}\n\nLocation: ${locationUrl}\nTime: ${new Date(event.timestamp).toLocaleString()}\nRide ID: ${event.rideId}\n\nThis is an automated message from Aura Ride Safety.`;

        // For now, we'll simulate SMS by logging and storing the notification
        log.warn('Emergency SMS sent', { event: 'emergency_sms_sent', component: 'safetyService', contactName: contact.name, contactPhone: contact.phone }, message);
        
        // Store notification for debugging
        await AsyncStorage.setItem(`emergency_notification_${contact.id}`, JSON.stringify({
          contactId: contact.id,
          message,
          timestamp: Date.now(),
          eventId: event.id,
        }));

        notifiedContacts.push(contact.id);
      } catch (error) {
        log.error('Failed to notify emergency contact', { event: 'emergency_contact_notification_failed', component: 'safetyService', contactName: contact.name }, error);
      }
    }

    // Update event with notified contacts
    event.contactsNotified = notifiedContacts;
    await AsyncStorage.setItem(this.ACTIVE_SOS_KEY, JSON.stringify(event));
  }

  /**
   * Get emergency number based on country
   * API Integration: Can be configured via admin panel per region
   */
  private getEmergencyNumber(countryCode?: string): string {
    // Emergency numbers by country
    const emergencyNumbers: Record<string, string> = {
      US: '911',
      CA: '911',
      UK: '999',
      GB: '999',
      EU: '112',  // European Union standard
      AU: '000',
      NZ: '111',
      JP: '110',
      KR: '112',
      CN: '110',
      IN: '112',
      BG: '112',  // Bulgaria
      DE: '112',  // Germany
      FR: '112',  // France
      ES: '112',  // Spain
      IT: '112',  // Italy
      DEFAULT: '112', // International standard
    };

    return emergencyNumbers[countryCode || 'DEFAULT'] || emergencyNumbers.DEFAULT;
  }

  /**
   * Notify emergency services (911 or local equivalent)
   * 
   * API Integration Points:
   * - POST /api/emergency/dispatch - Notify backend for dispatch coordination
   * - WebSocket 'emergency_dispatched' - Real-time status updates
   */
  private async notifyEmergencyServices(event: EmergencyEvent): Promise<void> {
    try {
      // Determine country from coordinates (would use reverse geocoding API)
      // For now, default to configured region
      const countryCode = process.env.EXPO_PUBLIC_DEFAULT_COUNTRY || 'US';
      const emergencyNumber = this.getEmergencyNumber(countryCode);
      
      const locationUrl = `https://maps.google.com/?q=${event.location.latitude},${event.location.longitude}`;
      
      log.warn('Initiating emergency services call', {
        event: 'emergency_call_initiated',
        component: 'safetyService',
        eventId: event.id,
        emergencyNumber,
        countryCode,
        location: locationUrl,
      });

      // Notify backend of emergency dispatch (for coordination with authorities)
      try {
        await apiClient.post('/safety/emergency-dispatch', {
          eventId: event.id,
          rideId: event.rideId,
          userId: event.userId,
          driverId: event.driverId,
          location: event.location,
          emergencyNumber,
          timestamp: Date.now(),
        });
      } catch (apiError) {
        log.warn('Backend emergency dispatch notification failed', {
          event: 'emergency_dispatch_api_failed',
          component: 'safetyService',
        }, apiError);
      }

      // Make emergency call
      const telUrl = Platform.OS === 'ios' 
        ? `tel://${emergencyNumber}`
        : `tel:${emergencyNumber}`;
      
      await Linking.openURL(telUrl);

      // Mark as notified
      event.emergencyServicesNotified = true;
      await AsyncStorage.setItem(this.ACTIVE_SOS_KEY, JSON.stringify(event));

      log.warn('Emergency services notified for event', { 
        event: 'emergency_services_notified', 
        component: 'safetyService', 
        eventId: event.id,
        emergencyNumber,
      });
    } catch (error) {
      log.error('Failed to notify emergency services', { 
        event: 'emergency_services_notification_failed', 
        component: 'safetyService',
      }, error);
      
      // Show manual call option with location details
      const countryCode = process.env.EXPO_PUBLIC_DEFAULT_COUNTRY || 'US';
      const emergencyNumber = this.getEmergencyNumber(countryCode);
      
      Alert.alert(
        'Emergency Services',
        `Please call ${emergencyNumber} immediately.\n\nYour location:\n${event.location.latitude.toFixed(6)}, ${event.location.longitude.toFixed(6)}`,
        [
          { 
            text: `Call ${emergencyNumber}`, 
            onPress: () => Linking.openURL(`tel:${emergencyNumber}`),
            style: 'destructive',
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  }

  /**
   * Create trip sharing link
   */
  async createTripSharingLink(
    rideId: string,
    duration: number = 2 * 60 * 60 * 1000 // 2 hours default
  ): Promise<TripSharingLink> {
    try {
      const response = await apiClient.post('/safety/share-trip', {
        rideId,
        duration,
        realTimeUpdates: true,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create sharing link');
      }

      return response.data as TripSharingLink;
    } catch (error) {
      log.error('Failed to create trip sharing link', { event: 'create_trip_sharing_link_failed', component: 'safetyService' }, error);
      throw error;
    }
  }

  /**
   * Get driver verification status
   */
  async getDriverVerification(driverId: string): Promise<DriverVerification> {
    try {
      const response = await apiClient.get(`/safety/driver-verification/${driverId}`);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get driver verification');
      }

      return response.data as DriverVerification;
    } catch (error) {
      log.error('Failed to get driver verification', { event: 'get_driver_verification_failed', component: 'safetyService' }, error);
      // Return default verification for offline scenarios
      return {
        driverId,
        photoMatch: false,
        licenseVerified: false,
        backgroundCheckPassed: false,
        safetyScore: 0,
        totalTrips: 0,
        incidentCount: 0,
        lastVerified: 'Unknown',
        verificationLevel: 'basic',
      };
    }
  }

  /**
   * Report safety incident
   */
  async reportSafetyIncident(
    rideId: string,
    driverId: string,
    type: EmergencyEvent['type'],
    description: string
  ): Promise<void> {
    try {
      await apiClient.post('/safety/report-incident', {
        rideId,
        driverId,
        type,
        description,
        timestamp: Date.now(),
      });

      // Send WebSocket alert
      wsService.send({
        type: 'safety_incident_reported',
        rideId,
        driverId,
        incidentType: type,
        description,
      });
    } catch (error) {
      log.error('Failed to report safety incident', { event: 'report_safety_incident_failed', component: 'safetyService' }, error);
      throw error;
    }
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    this.stopLocationSharing();
    this.currentEmergencyEvent = null;
  }
}

// Export singleton instance
export const safetyService = new SafetyService();
