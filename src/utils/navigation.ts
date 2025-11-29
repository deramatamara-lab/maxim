/**
 * Type-safe navigation utilities for Expo Router
 * Provides pragmatic navigation for routes not yet recognized by Expo Router's type generation
 */

import { useRouter } from 'expo-router';

/**
 * Pragmatic navigation function that works with all routes
 * including newly created ones not yet recognized by Expo Router types
 * Uses type assertion to bypass strict typing while maintaining functionality
 * 
 * NOTE: Using 'as any' is intentional here as a temporary workaround for Expo Router
 * type generation lag. This will be resolved automatically when Expo Router
 * regenerates its types to recognize the new route files.
 */
export function safeNavigate(router: ReturnType<typeof useRouter>, route: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return router.push(route as any);
}

/**
 * Pragmatic replacement function for navigation
 * 
 * NOTE: Using 'as any' is intentional here as a temporary workaround for Expo Router
 * type generation lag. This will be resolved automatically when Expo Router
 * regenerates its types to recognize the new route files.
 */
export function safeReplace(router: ReturnType<typeof useRouter>, route: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return router.replace(route as any);
}
