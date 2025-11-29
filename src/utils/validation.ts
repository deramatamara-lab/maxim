/**
 * Input Validation and Sanitization Utilities
 * Provides security-focused validation for user inputs
 */

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
  strength?: 'weak' | 'medium' | 'strong';
}

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain an uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain a lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, error: 'Password must contain a special character (!@#$%^&* etc.)' };
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty123', 'abc123456',
    'password1', 'Password1', 'Password123', '123456789', 'password!',
  ];

  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    return { valid: false, error: 'Password is too common. Please choose a stronger password' };
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'medium';
  
  const hasMultipleUppercase = (password.match(/[A-Z]/g) || []).length >= 2;
  const hasMultipleNumbers = (password.match(/[0-9]/g) || []).length >= 2;
  const hasMultipleSpecial = (password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g) || []).length >= 2;
  const isLongEnough = password.length >= 12;

  if (isLongEnough && hasMultipleUppercase && hasMultipleNumbers && hasMultipleSpecial) {
    strength = 'strong';
  } else if (password.length < 10) {
    strength = 'weak';
  }

  return { valid: true, strength };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): EmailValidationResult => {
  if (!email || email.length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email address is too long' };
  }

  // Check for common typos in popular domains
  const _commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain) {
    const typos: Record<string, string> = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
    };

    if (typos[domain]) {
      return { valid: false, error: `Did you mean ${email.split('@')[0]}@${typos[domain]}?` };
    }
  }

  return { valid: true };
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers (onclick=, onload=, etc.)
    .slice(0, 1000); // Limit length
};

/**
 * Validate phone number (international format)
 */
export const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  if (!phone || phone.length === 0) {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Check if it starts with + and has 10-15 digits
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;

  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: 'Please enter a valid phone number (e.g., +1234567890)' };
  }

  return { valid: true };
};

/**
 * Validate name (first name, last name)
 */
export const validateName = (name: string, fieldName: string = 'Name'): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }

  if (name.length > 50) {
    return { valid: false, error: `${fieldName} must be less than 50 characters` };
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;

  if (!nameRegex.test(name)) {
    return { valid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }

  return { valid: true };
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();

  /**
   * Check if action is rate limited
   * @param key Unique identifier for the action (e.g., 'login:user@email.com')
   * @param maxAttempts Maximum number of attempts allowed
   * @param windowMs Time window in milliseconds
   */
  check(key: string, maxAttempts: number = 5, windowMs: number = 60000): { allowed: boolean; remainingAttempts: number; resetAt?: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now >= record.resetAt) {
      // First attempt or window expired
      this.attempts.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    if (record.count >= maxAttempts) {
      // Rate limit exceeded
      return { allowed: false, remainingAttempts: 0, resetAt: record.resetAt };
    }

    // Increment count
    record.count++;
    return { allowed: true, remainingAttempts: maxAttempts - record.count };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
