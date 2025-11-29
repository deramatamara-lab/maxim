/**
 * KYC Domain Types
 * Consolidated KYC-related interfaces across the application
 */

export interface KYCDocumentConfig {
  type: 'id_card' | 'passport' | 'driver_license' | 'selfie' | 'proof_of_address';
  title: string;
  description: string;
  required: boolean;
  requiredForRoles: ('rider' | 'driver' | 'admin')[];
  examples: string[];
}

export interface KYCConfigurationResponse {
  configurations: KYCDocumentConfig[];
  lastUpdated: string;
  updatedBy: string;
}

export interface UserKYCStatus {
  userId: string;
  status: 'not_started' | 'pending' | 'in_review' | 'verified' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  requiredDocuments: KYCDocumentConfig[];
  uploadedDocuments: Array<{
    id: string;
    type: KYCDocumentConfig['type'];
    url: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
  }>;
  nextSteps?: string[];
}

export interface KYCStepResult {
  step: 'intro' | 'document_upload' | 'review' | 'complete';
  completed: boolean;
  data?: Record<string, unknown>;
  canProceed: boolean;
  errors?: string[];
}
