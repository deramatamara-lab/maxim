/**
 * Shared API types
 * Common interfaces used across API services to avoid circular dependencies
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  isOffline?: boolean; // Indicates if request was queued due to offline mode
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Network status interface
export interface NetworkStatus {
  isConnected: boolean;
  connectionType: string;
  isInternetReachable: boolean | null;
  lastChecked: number;
}
