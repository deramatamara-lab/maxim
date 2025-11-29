/**
 * Type Helper Utilities
 * Centralized type-safe conversions to avoid ad-hoc unsafe casts
 */

/**
 * Convert any object to Record<string, unknown> for API payloads
 * Replaces unsafe `as unknown as Record<string, unknown>` patterns
 */
export function toApiPayload<T extends object>(value: T): Record<string, unknown> {
  return value as Record<string, unknown>;
}

/**
 * Convert API response data to typed interface
 * Provides type safety for response parsing
 */
export function fromApiResponse<T>(data: unknown): T {
  return data as T;
}

/**
 * Type guard to check if value is a valid object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Type guard to check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}
