# Crash & Error Tracking Implementation Guide

## Overview

This guide explains the comprehensive crash and error tracking system implemented for OBS-02, which provides enterprise-grade error monitoring with PII protection, structured context, and React integration.

## Architecture

### Core Components

1. **CrashTrackingService** (`src/services/crashTracking.ts`)
   - Sentry wrapper with PII sanitization
   - Automatic context injection from structured logging
   - Performance monitoring and session tracking

2. **ErrorBoundary** (`src/components/ui/ErrorBoundary.tsx`)
   - React error boundary with crash reporting
   - Retry mechanisms with exponential backoff
   - Customizable fallback UI

3. **useCrashTracking Hook** (`src/hooks/useCrashTracking.ts`)
   - Easy integration for React components
   - Automatic context management
   - Performance tracking utilities

4. **Initialization** (`src/app/crashTrackingInit.ts`)
   - App startup configuration
   - User and route context management
   - Critical error reporting

## Quick Start

### 1. Initialize in App Entry Point

```typescript
// App.tsx or index.ts
import { initializeCrashTracking } from './app/crashTrackingInit';

export default function App() {
  // Initialize crash tracking early
  initializeCrashTracking();
  
  // ... rest of app setup
}
```

### 2. Wrap Components with Error Boundary

```typescript
import { ErrorBoundaryWrapper } from '@/components/ui/ErrorBoundary';

function RideBookingScreen() {
  return (
    <ErrorBoundaryWrapper
      componentName="RideBookingScreen"
      route="/rider/book"
      showRetry={true}
    >
      <RideBookingContent />
    </ErrorBoundaryWrapper>
  );
}
```

### 3. Use Crash Tracking Hook

```typescript
import { useCrashTracking } from '@/hooks/useCrashTracking';

function PaymentProcessor({ rideId }: { rideId: string }) {
  const crashTracking = useCrashTracking({
    component: 'PaymentProcessor',
    route: '/rider/payment',
    trackPerformance: true,
  });

  const handlePayment = async () => {
    const result = await crashTracking.trackAsyncOperation(
      'process_payment',
      () => processPayment(rideId),
      { rideId }
    );
    
    if (!result) {
      // Error already reported to crash tracking
      crashTracking.reportMessage('Payment processing failed', 'error');
    }
  };

  return (
    <Pressable onPress={handlePayment}>
      <Text>Process Payment</Text>
    </Pressable>
  );
}
```

## Advanced Usage

### User Context Management

```typescript
import { setUserContext, clearUserContext } from '@/app/crashTrackingInit';

// After login
setUserContext({
  id: 'user_123',
  email: 'john@example.com',
  name: 'John Doe',
  role: 'rider',
});

// After logout
clearUserContext();
```

### Route Context Tracking

```typescript
import { setRouteContext } from '@/app/crashTrackingInit';

// In navigation handlers
setRouteContext('/rider/book', { 
  rideId: 'ride_456',
  step: 'destination_input' 
});
```

### API Error Tracking

```typescript
import { useApiErrorTracking } from '@/hooks/useCrashTracking';

function RideService() {
  const { trackApiError, trackApiCall } = useApiErrorTracking('RideService');

  const bookRide = async (rideData: RideData) => {
    const startTime = Date.now();
    
    try {
      const response = await api.post('/rides', rideData);
      const duration = Date.now() - startTime;
      
      trackApiCall('/rides', 'POST', response.status, duration);
      return response.data;
      
    } catch (error) {
      trackApiError(error as Error, '/rides', 'POST', error.response?.status);
      throw error;
    }
  };
}
```

### Performance Monitoring

```typescript
function MapComponent() {
  const crashTracking = useCrashTracking({
    component: 'MapComponent',
    trackPerformance: true,
  });

  const handleMapLoad = () => {
    const transaction = crashTracking.startPerformanceTracking('map_render');
    
    // Heavy map rendering work
    renderMapLayers().then(() => {
      crashTracking.stopPerformanceTracking('map_render');
    });
  };

  return <Map onReady={handleMapLoad} />;
}
```

## Configuration

### Environment Variables

```bash
# .env
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
NODE_ENV=production
```

### Custom Configuration

```typescript
import { crashTracking } from '@/services/crashTracking';

// Override default configuration
crashing.initialize({
  dsn: 'https://your-dsn@sentry.io/project-id',
  environment: 'production',
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
  enableSessionTracking: true,
  sampleRate: 1.0,
});
```

## PII Protection

The system automatically sanitizes sensitive information:

- **Emails**: `john.doe@example.com` → `jo***@example.com`
- **Phones**: `+1234567890` → `+123****7890`
- **Credit Cards**: `1234-5678-9012-3456` → `****-****-****-3456`
- **Addresses**: `123 Main St, NY 10001` → `*** NY 10001`
- **Names**: `John Doe` → `J***e`

### Custom PII Handling

```typescript
// The sanitization is applied automatically in beforeSend
// No manual intervention needed for most cases
```

## Error Boundary Features

### Retry Mechanisms

```typescript
<ErrorBoundaryWrapper
  componentName="CriticalComponent"
  showRetry={true}
  customMessage="This component failed to load. Please try again."
>
  <CriticalComponent />
</ErrorBoundaryWrapper>
```

### Custom Fallback UI

```typescript
const CustomFallback = () => (
  <View style={styles.fallback}>
    <Text>Something went wrong</Text>
    <Button onPress={() => navigation.navigate('Home')}>
      Go Home
    </Button>
  </View>
);

<ErrorBoundaryWrapper fallback={<CustomFallback />}>
  <RiskyComponent />
</ErrorBoundaryWrapper>
```

### Error Handler Callbacks

```typescript
const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
  // Custom error handling logic
  analytics.track('component_error', {
    error: error.message,
    component: errorInfo.componentStack,
  });
};

<ErrorBoundaryWrapper onError={handleError}>
  <Component />
</ErrorBoundaryWrapper>
```

## Best Practices

### 1. Component-Level Tracking

```typescript
// Good: Specific component context
const crashTracking = useCrashTracking({
  component: 'UserProfile',
  route: '/rider/profile',
});

// Bad: Generic context
const crashTracking = useCrashTracking({
  component: 'Screen',
});
```

### 2. Async Operation Tracking

```typescript
// Good: Use trackAsyncOperation for automatic error handling
const result = await crashTracking.trackAsyncOperation(
  'save_user_data',
  () => api.saveUserData(data),
  { userId: user.id }
);

// Bad: Manual try/catch without crash tracking
try {
  await api.saveUserData(data);
} catch (error) {
  console.error('Save failed:', error);
}
```

### 3. User Action Tracking

```typescript
// Good: Track user actions for debugging
const handleBookRide = () => {
  crashTracking.trackUserAction('book_ride_clicked', {
    rideType: 'premium',
    estimatedCost: fare,
  });
  
  bookRide();
};
```

### 4. Performance Monitoring

```typescript
// Good: Track performance for critical operations
const transaction = crashTracking.startPerformanceTracking('ride_calculation');

try {
  const fare = calculateRideFare(pickup, dropoff);
  crashTracking.stopPerformanceTracking('ride_calculation');
  return fare;
} catch (error) {
  crashTracking.reportError(error);
  throw error;
}
```

## Debugging

### Development Mode

In development mode, additional debug information is shown:

- Full error messages and stack traces
- Component names and error boundaries
- Performance transaction details
- Breadcrumb history

### Local Testing

```typescript
// Test crash tracking locally
if (__DEV__) {
  crashTracking.captureException(new Error('Test error'), {
    component: 'TestComponent',
    test: true,
  });
}
```

### Breadcrumb Inspection

```typescript
// Add custom breadcrumbs for debugging
crashTracking.addBreadcrumb({
  message: 'User completed onboarding step 3',
  category: 'user',
  level: 'info',
  data: {
    step: 3,
    completedAt: new Date().toISOString(),
  },
});
```

## Migration Checklist

### Phase 1: Core Setup ✅
- [x] Install Sentry SDK (`sentry-expo`)
- [x] Create CrashTrackingService
- [x] Add PII sanitization
- [x] Initialize in app entry point

### Phase 2: React Integration ✅
- [x] Create ErrorBoundary component
- [x] Build useCrashTracking hook
- [x] Add screen-level tracking
- [x] Implement retry mechanisms

### Phase 3: Application Integration
- [ ] Wrap critical screens with ErrorBoundary
- [ ] Add crash tracking to API services
- [ ] Implement user context management
- [ ] Add route context tracking

### Phase 4: Advanced Features
- [ ] Enable performance monitoring
- [ ] Add custom breadcrumbs
- [ ] Implement session tracking
- [ ] Configure alerts and notifications

## Troubleshooting

### Common Issues

1. **Sentry not receiving events**
   - Check DSN configuration
   - Verify network connectivity
   - Ensure initialization is called early

2. **PII still showing in reports**
   - Verify sanitization function is working
   - Check beforeSend hook configuration
   - Test with sample data

3. **Error boundaries not catching errors**
   - Ensure proper component hierarchy
   - Check for async errors (use trackAsyncOperation)
   - Verify error boundary is not in development mode

### Debug Commands

```typescript
// Test crash tracking functionality
crashTracking.captureException(new Error('Test exception'));
crashTracking.captureMessage('Test message', 'warning');
crashTracking.addBreadcrumb({ message: 'Test breadcrumb' });
```

## Production Deployment

### Environment Configuration

```typescript
// Production configuration
const config = {
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: 'production',
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
  sampleRate: 1.0,
};
```

### Release Tracking

```typescript
// Set release version for better error grouping
Sentry.init({
  release: `maxim@${appConfig.appVersion}+${appConfig.buildNumber}`,
  // ... other config
});
```

### Monitoring and Alerts

- Set up alerts for error spikes
- Monitor crash-free user percentage
- Track performance metrics
- Review error trends and patterns

## Support

For questions about crash tracking implementation:
- Check the service documentation in `src/services/crashTracking.ts`
- Review error boundary examples in `src/components/ui/ErrorBoundary.tsx`
- Test with the hook examples in `src/hooks/useCrashTracking.ts`
- Verify initialization in `src/app/crashTrackingInit.ts`

## Next Steps

1. Wrap critical application screens with ErrorBoundary
2. Add crash tracking to all API services
3. Implement comprehensive user context management
4. Set up production monitoring and alerts
5. Review and optimize performance tracking
