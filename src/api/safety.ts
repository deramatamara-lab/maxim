/**
 * Safety Service
 * Handles emergency features, trip safety monitoring, and compliance
 */

import { apiClient, ApiResponse } from './client';
import { Location } from './location';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: 'family' | 'friend' | 'partner' | 'other';
  isPrimary: boolean;
}

export interface SafetyAlert {
  id: string;
  rideId: string;
  userId: string;
  type: 'sos' | 'accident' | 'medical' | 'theft' | 'harassment' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: Location;
  timestamp: string;
  description?: string;
  status: 'active' | 'responding' | 'resolved' | 'false_alarm';
  responders: Array<{
    id: string;
    type: 'police' | 'medical' | 'support' | 'driver';
    dispatchedAt: string;
    estimatedArrival: string;
  }>;
}

export interface TripSharing {
  id: string;
  rideId: string;
  sharedWith: Array<{
    contactId: string;
    name: string;
    phone: string;
    email?: string;
    sharedAt: string;
    status: 'sent' | 'viewed' | 'acknowledged';
  }>;
  shareLink: string;
  expiresAt: string;
  isActive: boolean;
}

export interface SafetyPreferences {
  shareTripAutomatically: boolean;
  shareWithContacts: string[]; // Contact IDs
  enableAudioRecording: boolean;
  enableLocationTracking: boolean;
  showSafetyToolkit: boolean;
  emergencySensitivity: 'low' | 'medium' | 'high';
  trustedContactsOnly: boolean;
}

export interface SafetyIncidentReport {
  id: string;
  rideId: string;
  reporterId: string;
  reportedUserId: string;
  incidentType: 'unsafe_driving' | 'harassment' | 'vehicle_condition' | 'route_deviation' | 'other';
  description: string;
  evidence: Array<{
    type: 'photo' | 'video' | 'audio' | 'screenshot';
    url: string;
    timestamp: string;
  }>;
  location: Location;
  timestamp: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  urgency: 'low' | 'medium' | 'high';
}

export interface ComplianceCheck {
  id: string;
  userId: string;
  checkType: 'background_check' | 'drug_test' | 'vehicle_inspection' | 'insurance_verification' | 'safety_training';
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'expired';
  completedAt?: string;
  expiresAt?: string;
  documents: Array<{
    type: string;
    url: string;
    uploadedAt: string;
  }>;
  notes?: string;
}

class SafetyService {
  /**
   * Trigger SOS emergency alert
   */
  async triggerSOS(
    rideId: string,
    location: Location,
    alertType: SafetyAlert['type'],
    description?: string
  ): Promise<ApiResponse<{
    alertId: string;
    emergencyNumber: string;
    respondersDispatched: boolean;
    estimatedResponseTime: number;
  }>> {
    return apiClient.post('/safety/sos', {
      rideId,
      location,
      alertType,
      description,
    });
  }

  /**
   * Share trip status with contacts
   */
  async shareTrip(
    rideId: string,
    contactIds: string[],
    message?: string,
    durationHours: number = 24
  ): Promise<ApiResponse<TripSharing>> {
    return apiClient.post('/safety/share-trip', {
      rideId,
      contactIds,
      message,
      durationHours,
    });
  }

  /**
   * Get emergency contacts
   */
  async getEmergencyContacts(): Promise<ApiResponse<EmergencyContact[]>> {
    return apiClient.get<EmergencyContact[]>('/safety/contacts');
  }

  /**
   * Add emergency contact
   */
  async addEmergencyContact(
    contact: Omit<EmergencyContact, 'id'>
  ): Promise<ApiResponse<EmergencyContact>> {
    return apiClient.post<EmergencyContact>('/safety/contacts', contact);
  }

  /**
   * Update emergency contact
   */
  async updateEmergencyContact(
    id: string,
    updates: Partial<EmergencyContact>
  ): Promise<ApiResponse<EmergencyContact>> {
    return apiClient.put<EmergencyContact>(`/safety/contacts/${id}`, updates);
  }

  /**
   * Delete emergency contact
   */
  async deleteEmergencyContact(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/safety/contacts/${id}`);
  }

  /**
   * Report safety incident
   */
  async reportIncident(
    incident: Omit<SafetyIncidentReport, 'id' | 'timestamp' | 'status'>
  ): Promise<ApiResponse<SafetyIncidentReport>> {
    return apiClient.post<SafetyIncidentReport>('/safety/incidents', incident);
  }

  /**
   * Get user's safety preferences
   */
  async getSafetyPreferences(): Promise<ApiResponse<SafetyPreferences>> {
    return apiClient.get<SafetyPreferences>('/safety/preferences');
  }

  /**
   * Update safety preferences
   */
  async updateSafetyPreferences(
    preferences: Partial<SafetyPreferences>
  ): Promise<ApiResponse<SafetyPreferences>> {
    return apiClient.put<SafetyPreferences>('/safety/preferences', preferences);
  }

  /**
   * Get safety alerts for ride
   */
  async getRideSafetyAlerts(rideId: string): Promise<ApiResponse<SafetyAlert[]>> {
    return apiClient.get<SafetyAlert[]>(`/safety/ride/${rideId}/alerts`);
  }

  /**
   * Update safety alert status
   */
  async updateAlertStatus(
    alertId: string,
    status: SafetyAlert['status'],
    resolution?: string
  ): Promise<ApiResponse<SafetyAlert>> {
    return apiClient.put<SafetyAlert>(`/safety/alerts/${alertId}`, {
      status,
      resolution,
    });
  }

  /**
   * Get compliance checks for user
   */
  async getComplianceChecks(userId: string): Promise<ApiResponse<ComplianceCheck[]>> {
    return apiClient.get<ComplianceCheck[]>(`/safety/compliance/${userId}`);
  }

  /**
   * Submit compliance documents
   */
  async submitComplianceDocuments(
    userId: string,
    checkType: ComplianceCheck['checkType'],
    documents: Array<{
      type: string;
      file: File | Blob;
      filename: string;
    }>
  ): Promise<ApiResponse<ComplianceCheck>> {
    const formData = new FormData();
    formData.append('checkType', checkType);
    
    documents.forEach((doc, index) => {
      formData.append(`documents[${index}].type`, doc.type);
      formData.append(`documents[${index}].file`, doc.file, doc.filename);
    });

    return apiClient.post<ComplianceCheck, FormData>(`/safety/compliance/${userId}/submit`, formData, 'medium');
  }

  /**
   * Get safety statistics for area
   */
  async getAreaSafetyStats(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<{
    totalIncidents: number;
    incidentTypes: Record<string, number>;
    averageResponseTime: number;
    safetyScore: number; // 0-100
    trends: {
      period: string;
      incidents: number;
      responseTime: number;
    }[];
  }>> {
    const params = { ...bounds, period };
    return apiClient.get('/safety/stats', params);
  }

  /**
   * Verify phone number for emergency contact
   */
  async verifyPhoneNumber(
    phoneNumber: string,
    code: string
  ): Promise<ApiResponse<{
    verified: boolean;
    canReceiveEmergencyAlerts: boolean;
  }>> {
    return apiClient.post('/safety/verify-phone', {
      phoneNumber,
      code,
    });
  }

  /**
   * Send test safety alert
   */
  async sendTestAlert(
    contactIds: string[],
    message: string = 'This is a test safety alert from Aura Ride'
  ): Promise<ApiResponse<{
    sent: number;
    failed: number;
    deliveryReport: Array<{
      contactId: string;
      status: 'sent' | 'delivered' | 'failed';
      error?: string;
    }>;
  }>> {
    return apiClient.post('/safety/test-alert', {
      contactIds,
      message,
    });
  }

  /**
   * Get nearby emergency services
   */
  async getNearbyEmergencyServices(
    location: Location,
    radius: number = 5000
  ): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    type: 'police' | 'hospital' | 'fire_station' | 'urgent_care';
    address: string;
    phone: string;
    distance: number; // in meters
    estimatedResponseTime: number; // in minutes
    isOpen24Hours: boolean;
    coordinates: Location;
  }>>> {
    const params = {
      lat: location.lat,
      lon: location.lon,
      radius,
    };
    
    return apiClient.get('/safety/emergency-services', params);
  }

  /**
   * Validate safety incident report
   */
  validateIncidentReport(incident: Omit<SafetyIncidentReport, 'id' | 'timestamp' | 'status'>): string[] {
    const errors: string[] = [];
    
    if (!incident.rideId) {
      errors.push('Ride ID is required');
    }
    
    if (!incident.reporterId) {
      errors.push('Reporter ID is required');
    }
    
    if (!incident.reportedUserId) {
      errors.push('Reported user ID is required');
    }
    
    if (!incident.incidentType) {
      errors.push('Incident type is required');
    }
    
    if (!incident.description || incident.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    }
    
    if (!incident.location.lat || !incident.location.lon) {
      errors.push('Valid location is required');
    }
    
    if (incident.evidence && incident.evidence.length > 10) {
      errors.push('Maximum 10 evidence files allowed');
    }
    
    return errors;
  }

  /**
   * Generate safety report for ride
   */
  async generateSafetyReport(rideId: string): Promise<ApiResponse<{
    rideId: string;
    safetyScore: number;
    incidents: SafetyIncidentReport[];
    alerts: SafetyAlert[];
    complianceStatus: 'compliant' | 'warning' | 'non_compliant';
    recommendations: string[];
    generatedAt: string;
  }>> {
    return apiClient.get(`/safety/ride/${rideId}/report`);
  }

  /**
   * Simulate SOS trigger for demo
   */
  async simulateSOSTrigger(
    _rideId: string,
    _location: Location
  ): Promise<{
    alertId: string;
    emergencyNumber: string;
    respondersDispatched: boolean;
    estimatedResponseTime: number;
  }> {
    // Simulate emergency response
    return {
      alertId: `alert-${Date.now()}`,
      emergencyNumber: '911',
      respondersDispatched: true,
      estimatedResponseTime: 8, // 8 minutes average
    };
  }
}

export const safetyService = new SafetyService();
