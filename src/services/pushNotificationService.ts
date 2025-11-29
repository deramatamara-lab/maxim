/**
 * Push Notification Service (Stub)
 * Handles APNs (iOS) and FCM (Android) push notifications
 * 
 * SETUP REQUIRED:
 * 1. Install: npx expo install expo-notifications expo-device expo-constants
 * 2. Configure app.json with notification settings
 * 3. Set up FCM for Android and APNs for iOS
 * 
 * API Integration Points (configure via admin panel):
 * - FCM_SERVER_KEY: Firebase Cloud Messaging server key
 * - APNS_KEY_ID: Apple Push Notification service key ID  
 * - APNS_TEAM_ID: Apple Developer Team ID
 * - BACKEND_REGISTER_ENDPOINT: POST /api/notifications/register
 * - BACKEND_UNREGISTER_ENDPOINT: POST /api/notifications/unregister
 */

import { Platform } from 'react-native';
import { log } from '@/utils/logger';
import { apiClient } from '@/api/client';

// Notification types for the app
export type NotificationType = 
  | 'ride_request'      // Driver: new ride request
  | 'ride_accepted'     // Rider: driver accepted
  | 'driver_arrived'    // Rider: driver at pickup
  | 'ride_started'      // Both: ride in progress
  | 'ride_completed'    // Both: ride finished
  | 'ride_cancelled'    // Both: ride cancelled
  | 'payment_received'  // Driver: payment processed
  | 'promo_offer'       // Rider: promotional offer
  | 'safety_alert'      // Both: safety notification
  | 'chat_message';     // Both: new chat message

export interface PushNotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: string;
}

export interface DeviceRegistration {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  userId: string;
}

// Android notification channels configuration
export const NOTIFICATION_CHANNELS = {
  ride_updates: {
    id: 'ride_updates',
    name: 'Ride Updates',
    description: 'Notifications about your ride status',
    importance: 'high',
  },
  chat: {
    id: 'chat', 
    name: 'Messages',
    description: 'Chat messages from drivers/riders',
    importance: 'default',
  },
  promotions: {
    id: 'promotions',
    name: 'Promotions & Offers',
    description: 'Special deals and discounts',
    importance: 'low',
  },
  safety: {
    id: 'safety',
    name: 'Safety Alerts',
    description: 'Important safety notifications',
    importance: 'max',
  },
};

class PushNotificationService {
  private deviceToken: string | null = null;
  private isInitialized = false;

  /**
   * Initialize push notification service
   * TODO: Implement with expo-notifications when packages installed
   */
  async initialize(): Promise<boolean> {
    log.info('Push notification service initialize called', {
      event: 'push_init',
      component: 'pushNotificationService',
      platform: Platform.OS,
      note: 'Stub implementation - install expo-notifications to enable',
    });

    // Stub: Would request permissions and get token here
    this.isInitialized = true;
    return true;
  }

  /**
   * Register device token with backend
   * API: POST /api/notifications/register
   */
  async registerWithBackend(userId: string): Promise<boolean> {
    if (!this.deviceToken) {
      log.warn('No device token available for registration', {
        event: 'push_register_no_token',
        component: 'pushNotificationService',
      });
      return false;
    }

    const registration: DeviceRegistration = {
      token: this.deviceToken,
      platform: Platform.OS as 'ios' | 'android' | 'web',
      deviceId: `${Platform.OS}-${Date.now()}`,
      userId,
    };

    try {
      const response = await apiClient.post('/notifications/register', registration);
      
      if (response.success) {
        log.info('Device registered for push notifications', {
          event: 'push_register_success',
          component: 'pushNotificationService',
          userId,
          platform: registration.platform,
        });
        return true;
      }
      
      log.error('Failed to register device for push notifications', {
        event: 'push_register_failed',
        component: 'pushNotificationService',
        error: response.error,
      });
      return false;
    } catch (error) {
      log.error('Error registering device for push notifications', {
        event: 'push_register_error',
        component: 'pushNotificationService',
      }, error);
      return false;
    }
  }

  /**
   * Unregister device from push notifications
   * API: POST /api/notifications/unregister
   */
  async unregister(userId: string): Promise<void> {
    try {
      const response = await apiClient.post('/notifications/unregister', {
        userId,
        token: this.deviceToken,
      });
      
      if (response.success) {
        log.info('Device unregistered from push notifications', {
          event: 'push_unregister_success',
          component: 'pushNotificationService',
          userId,
        });
        this.deviceToken = null;
      } else {
        log.error('Failed to unregister device from push notifications', {
          event: 'push_unregister_failed',
          component: 'pushNotificationService',
          error: response.error,
        });
      }
    } catch (error) {
      log.error('Error unregistering device from push notifications', {
        event: 'push_unregister_error',
        component: 'pushNotificationService',
      }, error);
    }
  }

  /**
   * Handle incoming notification
   */
  handleNotification(payload: PushNotificationPayload): void {
    log.info('Handling notification', {
      event: 'push_handle',
      component: 'pushNotificationService',
      type: payload.type,
      title: payload.title,
    });

    // Route to appropriate handler based on type
    switch (payload.type) {
      case 'ride_request':
        // Navigate to ride request screen for drivers
        break;
      case 'ride_accepted':
      case 'driver_arrived':
      case 'ride_started':
      case 'ride_completed':
        // Update ride status in store
        break;
      case 'chat_message':
        // Show chat notification / update badge
        break;
      case 'safety_alert':
        // Show prominent alert
        break;
      default:
        break;
    }
  }

  /**
   * Get channel for notification type (Android)
   */
  getChannelForType(type: NotificationType): string {
    switch (type) {
      case 'ride_request':
      case 'ride_accepted':
      case 'driver_arrived':
      case 'ride_started':
      case 'ride_completed':
      case 'ride_cancelled':
        return 'ride_updates';
      case 'chat_message':
        return 'chat';
      case 'promo_offer':
        return 'promotions';
      case 'safety_alert':
        return 'safety';
      default:
        return 'ride_updates';
    }
  }

  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Set device token (for testing or manual setting)
   */
  setDeviceToken(token: string): void {
    this.deviceToken = token;
  }
}

// Export singleton
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
