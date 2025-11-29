/**
 * KYC Configuration API Service
 * Manages role-based KYC document requirements
 * 
 * NOTE: Types are consolidated in src/types/kyc.ts
 */

import { apiClient } from './client';
import type { KYCDocumentConfig, KYCConfigurationResponse } from '../types/kyc';

// Re-export types for convenience
export type { KYCDocumentConfig, KYCConfigurationResponse } from '../types/kyc';

export class KYCConfigurationService {
  /**
   * Get current KYC configuration for all roles
   */
  static async getConfiguration(): Promise<KYCConfigurationResponse> {
    const response = await apiClient.get<KYCConfigurationResponse>('/admin/kyc/configuration');
    if (!response.data) {
      throw new Error('Failed to load KYC configuration');
    }
    return response.data;
  }

  /**
   * Update KYC configuration for specific document types
   */
  static async updateConfiguration(
    configurations: KYCDocumentConfig[]
  ): Promise<KYCConfigurationResponse> {
    const response = await apiClient.put<KYCConfigurationResponse>(
      '/admin/kyc/configuration',
      { configurations }
    );
    if (!response.data) {
      throw new Error('Failed to update KYC configuration');
    }
    return response.data;
  }

  /**
   * Get KYC requirements for a specific role
   */
  static async getRequirementsForRole(
    role: 'rider' | 'driver' | 'admin'
  ): Promise<KYCDocumentConfig[]> {
    const response = await apiClient.get<KYCDocumentConfig[]>(
      `/admin/kyc/requirements/${role}`
    );
    if (!response.data) {
      throw new Error('Failed to load role requirements');
    }
    return response.data;
  }

  /**
   * Reset KYC configuration to defaults
   */
  static async resetToDefaults(): Promise<KYCConfigurationResponse> {
    const response = await apiClient.post<KYCConfigurationResponse>(
      '/admin/kyc/configuration/reset'
    );
    if (!response.data) {
      throw new Error('Failed to reset configuration');
    }
    return response.data;
  }

  /**
   * Get default KYC configuration (fallback)
   */
  static getDefaultConfiguration(): KYCDocumentConfig[] {
    return [
      {
        type: 'id_card',
        title: 'ID Card',
        description: 'Front and back of national ID',
        required: true,
        requiredForRoles: ['rider', 'driver', 'admin'],
        examples: ['Front of ID', 'Back of ID'],
      },
      {
        type: 'passport',
        title: 'Passport',
        description: 'Photo page of your passport',
        required: false,
        requiredForRoles: [],
        examples: ['Photo page'],
      },
      {
        type: 'driver_license',
        title: 'Driver License',
        description: 'Front and back of license',
        required: true,
        requiredForRoles: ['driver'],
        examples: ['Front of license', 'Back of license'],
      },
      {
        type: 'selfie',
        title: 'Selfie',
        description: 'Clear photo of your face',
        required: true,
        requiredForRoles: ['rider', 'driver', 'admin'],
        examples: ['Selfie holding ID'],
      },
      {
        type: 'proof_of_address',
        title: 'Proof of Address',
        description: 'Recent utility bill or bank statement',
        required: false,
        requiredForRoles: [],
        examples: ['Utility bill', 'Bank statement'],
      },
    ];
  }
}
