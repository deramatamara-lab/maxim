# Structured Logging Migration Guide

## Overview

This guide explains how to migrate from ad-hoc `console.log/warn/error` statements to the new structured logging system that provides better debugging, PII protection, and production observability.

## Why Migrate?

- **Structured Data**: Logs include context like component, rideId, userId, timestamps
- **PII Protection**: Automatic sanitization of emails, phones, cards, addresses, names
- **Production Ready**: Configurable log levels and output destinations
- **Better Debugging**: Event-based logging with searchable context
- **Performance Tracking**: Built-in performance and user action logging

## Quick Start

### 1. Import the Logger

```typescript
import { log } from '@/utils/logger';
// OR for React components
import { useLogger } from '@/hooks/useLogger';
```

### 2. Replace Console Statements

**Before:**
```typescript
console.warn('WebSocket heartbeat timeout');
console.error('Failed to send message:', error);
```

**After:**
```typescript
log.warn('WebSocket heartbeat timeout', {
  event: 'websocket_heartbeat_timeout',
  component: 'useWebSocketConnection',
});

log.error('Failed to send message', {
  event: 'message_send_failed',
  component: 'MessageSender',
  messageId: 'msg_123',
}, error);
```

## Migration Patterns

### Pattern 1: Basic Error/Warning Logging

**Before:**
```typescript
console.error('API request failed:', error);
console.warn('User action not allowed');
```

**After:**
```typescript
log.error('API request failed', {
  event: 'api_request_failed',
  component: 'ApiClient',
  endpoint: '/rides/book',
}, error);

log.warn('User action not allowed', {
  event: 'unauthorized_action',
  component: 'RideBooking',
  action: 'book_ride',
  userId: 'user_123',
});
```

### Pattern 2: React Component Logging

**Before:**
```typescript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    console.log('Loading user profile:', userId);
    // ... load user
  }, [userId]);
}
```

**After:**
```typescript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const logger = useLogger({ component: 'UserProfile', userId });
  
  useEffect(() => {
    logger.info('Loading user profile', {
      event: 'profile_load_start',
      userId,
    });
    // ... load user
  }, [userId, logger]);
}
```

### Pattern 3: Performance Logging

**Before:**
```typescript
const startTime = Date.now();
await processPayment();
console.log(`Payment processed in ${Date.now() - startTime}ms`);
```

**After:**
```typescript
const startTime = Date.now();
await processPayment();
log.performance('payment_processing', Date.now() - startTime, {
  component: 'PaymentService',
  paymentMethod: 'credit_card',
});
```

### Pattern 4: User Action Logging

**Before:**
```typescript
console.log('User clicked book ride button');
```

**After:**
```typescript
log.userAction('book_ride_clicked', {
  component: 'RideBooking',
  userId: 'user_123',
  pickupLocation: '40.7128,-74.006',
}, {
  timestamp: Date.now(),
  buttonVariant: 'primary',
});
```

### Pattern 5: API Call Logging

**Before:**
```typescript
try {
  const response = await fetch('/api/rides', { method: 'POST' });
  if (!response.ok) {
    console.error('API call failed:', response.status);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

**After:**
```typescript
const startTime = Date.now();
try {
  const response = await fetch('/api/rides', { method: 'POST' });
  const duration = Date.now() - startTime;
  
  log.apiCall('POST', '/api/rides', response.status, duration, {
    component: 'RideService',
    userId: 'user_123',
  });
  
  if (!response.ok) {
    log.error('API call failed', {
      event: 'api_call_failed',
      component: 'RideService',
      status: response.status,
      endpoint: '/api/rides',
    });
  }
} catch (error) {
  log.error('Network error', {
    event: 'network_error',
    component: 'RideService',
    endpoint: '/api/rides',
  }, error);
}
```

## Event Naming Conventions

Use consistent event naming for better searchability:

- `component_action` (e.g., `websocket_connect`, `payment_process`)
- `component_state` (e.g., `ride_confirmed`, `user_authenticated`)
- `component_error` (e.g., `api_error`, `validation_failed`)
- `performance_metric` (e.g., `render_time`, `api_duration`)
- `user_action` (e.g., `button_click`, `form_submit`)

## Context Guidelines

Always include relevant context:

### Required Context
- `component`: The component or service name
- `event`: Specific event identifier
- `severity`: Automatically set by log level

### Optional Context (when applicable)
- `userId`: Current user ID
- `rideId`: Current ride ID
- `sessionId`: Current session identifier
- `requestId`: API request identifier
- `duration`: Performance timing
- `status`: Status codes or states

## PII Protection

The logger automatically sanitizes:

- **Emails**: `john.doe@example.com` → `jo***@example.com`
- **Phones**: `+1234567890` → `+123****7890`
- **Credit Cards**: `1234-5678-9012-3456` → `****-****-****-3456`
- **Addresses**: `123 Main St, NY 10001` → `*** NY 10001`
- **Names**: `John Doe` → `J***e`

## Configuration

### Environment-based Configuration

```typescript
// In app initialization
import { logger } from '@/utils/logger';

if (__DEV__) {
  logger.updateConfig({
    level: 'debug',
    enableConsole: true,
    sanitizePII: false, // Show full data in development
  });
} else {
  logger.updateConfig({
    level: 'info',
    enableConsole: true,
    sanitizePII: true,
  });
}
```

### Global Context

```typescript
// Set app-wide context
logger.setGlobalContext({
  appVersion: '1.0.0',
  buildNumber: '123',
  environment: __DEV__ ? 'development' : 'production',
});
```

## Migration Checklist

### Phase 1: Critical Paths ✅
- [x] WebSocket connections (`useWebSocket.ts`)
- [ ] Payment processing (`payment.ts`)
- [ ] Ride booking flow (`rides.ts`)
- [ ] Authentication (`auth.ts`)

### Phase 2: User-Facing Components
- [ ] Ride booking screens
- [ ] Payment screens
- [ ] Profile screens
- [ ] Map/navigation components

### Phase 3: Background Services
- [ ] Location tracking
- [ ] Push notifications
- [ ] Background sync
- [ ] Analytics tracking

### Phase 4: Utility Functions
- [ ] API client
- [ ] Storage utilities
- [ ] Validation helpers
- [ ] Error boundaries

## Testing Migration

After migrating logging in a component:

1. **Verify Log Output**: Check console shows structured format
2. **Test PII Sanitization**: Ensure sensitive data is masked
3. **Check Context**: Verify component/event context is included
4. **Performance Impact**: Ensure no performance regression

## ESLint Rule (Future)

Add this to `.eslintrc.js` to prevent future console usage:

```javascript
rules: {
  'no-console': ['warn', { allow: ['warn', 'error'] }], // Temporary during migration
  // Later: 'no-console': 'error'
}
```

## Examples

### Complete Component Migration

**Before:**
```typescript
export function RideBooking() {
  const [loading, setLoading] = useState(false);
  
  const handleBookRide = async () => {
    setLoading(true);
    try {
      console.log('Booking ride...');
      const result = await bookRide();
      console.log('Ride booked successfully:', result.id);
    } catch (error) {
      console.error('Failed to book ride:', error);
    } finally {
      setLoading(false);
    }
  };
}
```

**After:**
```typescript
export function RideBooking() {
  const [loading, setLoading] = useState(false);
  const logger = useLogger({ component: 'RideBooking' });
  
  const handleBookRide = async () => {
    const startTime = Date.now();
    setLoading(true);
    
    logger.info('Starting ride booking', {
      event: 'ride_booking_start',
    });
    
    try {
      const result = await bookRide();
      const duration = Date.now() - startTime;
      
      logger.info('Ride booked successfully', {
        event: 'ride_booking_success',
        rideId: result.id,
      });
      
      logger.performance('ride_booking', duration, {
        paymentMethod: result.paymentMethod,
      });
      
    } catch (error) {
      logger.error('Failed to book ride', {
        event: 'ride_booking_failed',
      }, error);
    } finally {
      setLoading(false);
    }
  };
}
```

## Support

For questions about logging migration:
- Check existing examples in `useWebSocket.ts`
- Review the Logger class in `src/utils/logger.ts`
- Test PII sanitization with sample data
- Verify log levels are appropriate for your use case

## Next Steps

1. Migrate payment processing services
2. Add ESLint rule for console usage
3. Set up log aggregation in production
4. Add performance monitoring dashboards
5. Implement error tracking integration
