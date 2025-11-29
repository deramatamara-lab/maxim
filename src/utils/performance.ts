/**
 * Performance Monitoring Utility
 * Custom performance markers for tracking key operations in the Aura Ride App
 * Integrates with Sentry for production monitoring
 */

import { Platform } from 'react-native';
import { log } from './logger';

// Performance marker types
export type PerformanceCategory = 
  | 'app_startup'
  | 'screen_render'
  | 'api_call'
  | 'navigation'
  | 'animation'
  | 'user_interaction'
  | 'data_load'
  | 'cache_operation';

interface PerformanceMarker {
  id: string;
  name: string;
  category: PerformanceCategory;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceBudget {
  category: PerformanceCategory;
  warningThreshold: number; // milliseconds
  errorThreshold: number; // milliseconds
}

// Performance budgets for different operation types
const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  { category: 'app_startup', warningThreshold: 3000, errorThreshold: 5000 },
  { category: 'screen_render', warningThreshold: 100, errorThreshold: 300 },
  { category: 'api_call', warningThreshold: 2000, errorThreshold: 5000 },
  { category: 'navigation', warningThreshold: 300, errorThreshold: 500 },
  { category: 'animation', warningThreshold: 16, errorThreshold: 33 }, // 60fps = 16.67ms
  { category: 'user_interaction', warningThreshold: 100, errorThreshold: 200 },
  { category: 'data_load', warningThreshold: 500, errorThreshold: 1000 },
  { category: 'cache_operation', warningThreshold: 50, errorThreshold: 100 },
];

// Active performance markers
const activeMarkers: Map<string, PerformanceMarker> = new Map();

// Completed performance markers for analysis
const completedMarkers: PerformanceMarker[] = [];
const MAX_COMPLETED_MARKERS = 100;

/**
 * Start a performance marker
 */
export function startPerformanceMarker(
  name: string,
  category: PerformanceCategory,
  metadata?: Record<string, unknown>
): string {
  const id = `${category}-${name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  
  const marker: PerformanceMarker = {
    id,
    name,
    category,
    startTime: performance.now(),
    metadata,
  };
  
  activeMarkers.set(id, marker);
  
  log.debug('Performance marker started', {
    event: 'perf_marker_start',
    component: 'performance',
    markerId: id,
    name,
    category,
  });
  
  return id;
}

/**
 * End a performance marker and record the duration
 */
export function endPerformanceMarker(id: string): PerformanceMarker | null {
  const marker = activeMarkers.get(id);
  
  if (!marker) {
    log.warn('Performance marker not found', {
      event: 'perf_marker_not_found',
      component: 'performance',
      markerId: id,
    });
    return null;
  }
  
  marker.endTime = performance.now();
  marker.duration = marker.endTime - marker.startTime;
  
  // Remove from active markers
  activeMarkers.delete(id);
  
  // Add to completed markers (with rotation)
  completedMarkers.push(marker);
  if (completedMarkers.length > MAX_COMPLETED_MARKERS) {
    completedMarkers.shift();
  }
  
  // Check against performance budget
  checkPerformanceBudget(marker);
  
  log.debug('Performance marker ended', {
    event: 'perf_marker_end',
    component: 'performance',
    markerId: id,
    name: marker.name,
    category: marker.category,
    duration: marker.duration,
  });
  
  return marker;
}

/**
 * Check if a marker violates performance budgets
 */
function checkPerformanceBudget(marker: PerformanceMarker): void {
  if (!marker.duration) return;
  
  const budget = PERFORMANCE_BUDGETS.find(b => b.category === marker.category);
  if (!budget) return;
  
  if (marker.duration >= budget.errorThreshold) {
    log.error('Performance budget exceeded', {
      event: 'perf_budget_exceeded',
      component: 'performance',
      name: marker.name,
      category: marker.category,
      duration: marker.duration,
      threshold: budget.errorThreshold,
    });
  } else if (marker.duration >= budget.warningThreshold) {
    log.warn('Performance budget warning', {
      event: 'perf_budget_warning',
      component: 'performance',
      name: marker.name,
      category: marker.category,
      duration: marker.duration,
      threshold: budget.warningThreshold,
    });
  }
}

/**
 * Measure a function's execution time
 */
export async function measureAsync<T>(
  name: string,
  category: PerformanceCategory,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const markerId = startPerformanceMarker(name, category, metadata);
  try {
    return await fn();
  } finally {
    endPerformanceMarker(markerId);
  }
}

/**
 * Measure a synchronous function's execution time
 */
export function measureSync<T>(
  name: string,
  category: PerformanceCategory,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const markerId = startPerformanceMarker(name, category, metadata);
  try {
    return fn();
  } finally {
    endPerformanceMarker(markerId);
  }
}

/**
 * Get performance statistics for a category
 */
export function getPerformanceStats(category?: PerformanceCategory): {
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  budgetViolations: number;
} {
  const filtered = category 
    ? completedMarkers.filter(m => m.category === category)
    : completedMarkers;
  
  if (filtered.length === 0) {
    return {
      count: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      budgetViolations: 0,
    };
  }
  
  const durations = filtered.map(m => m.duration || 0);
  const budget = category 
    ? PERFORMANCE_BUDGETS.find(b => b.category === category)
    : null;
  
  return {
    count: filtered.length,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    budgetViolations: budget 
      ? filtered.filter(m => (m.duration || 0) >= budget.errorThreshold).length
      : 0,
  };
}

/**
 * Get app startup metrics
 */
export function getAppStartupMetrics(): {
  coldStartTime?: number;
  warmStartTime?: number;
  platform: string;
} {
  const startupMarkers = completedMarkers.filter(m => m.category === 'app_startup');
  
  return {
    coldStartTime: startupMarkers.find(m => m.name === 'cold_start')?.duration,
    warmStartTime: startupMarkers.find(m => m.name === 'warm_start')?.duration,
    platform: Platform.OS,
  };
}

/**
 * Clear all completed markers (for testing)
 */
export function clearPerformanceMarkers(): void {
  activeMarkers.clear();
  completedMarkers.length = 0;
}

/**
 * Get all completed markers (for debugging)
 */
export function getCompletedMarkers(): PerformanceMarker[] {
  return [...completedMarkers];
}

/**
 * Performance monitoring hook for React components
 * Use this to track screen render times
 */
export function usePerformanceMarker(
  name: string,
  category: PerformanceCategory = 'screen_render'
): { startMarker: () => string; endMarker: (id: string) => void } {
  return {
    startMarker: () => startPerformanceMarker(name, category),
    endMarker: (id: string) => { endPerformanceMarker(id); },
  };
}

// Pre-defined markers for common operations
export const PerformanceMarkers = {
  // App lifecycle
  APP_COLD_START: 'cold_start',
  APP_WARM_START: 'warm_start',
  APP_READY: 'app_ready',
  
  // Authentication
  AUTH_LOGIN: 'auth_login',
  AUTH_REGISTER: 'auth_register',
  AUTH_LOGOUT: 'auth_logout',
  AUTH_TOKEN_REFRESH: 'auth_token_refresh',
  
  // Ride operations
  RIDE_SEARCH: 'ride_search',
  RIDE_ESTIMATE: 'ride_estimate',
  RIDE_BOOK: 'ride_book',
  RIDE_CANCEL: 'ride_cancel',
  RIDE_TRACK: 'ride_track',
  
  // Navigation
  NAV_HOME_TO_SEARCH: 'nav_home_to_search',
  NAV_SEARCH_TO_CONFIRM: 'nav_search_to_confirm',
  NAV_CONFIRM_TO_ACTIVE: 'nav_confirm_to_active',
  
  // Screen renders
  SCREEN_HOME: 'screen_home',
  SCREEN_SEARCH: 'screen_search',
  SCREEN_RIDE_ACTIVE: 'screen_ride_active',
  SCREEN_DRIVER_DASHBOARD: 'screen_driver_dashboard',
  
  // API calls
  API_RIDE_OPTIONS: 'api_ride_options',
  API_PAYMENT_METHODS: 'api_payment_methods',
  API_DRIVER_EARNINGS: 'api_driver_earnings',
  
  // Animations
  ANIM_GLOBE_RENDER: 'anim_globe_render',
  ANIM_MAP_TRANSITION: 'anim_map_transition',
  ANIM_CARD_ENTRANCE: 'anim_card_entrance',
};

export default {
  startPerformanceMarker,
  endPerformanceMarker,
  measureAsync,
  measureSync,
  getPerformanceStats,
  getAppStartupMetrics,
  clearPerformanceMarkers,
  getCompletedMarkers,
  usePerformanceMarker,
  PerformanceMarkers,
};
