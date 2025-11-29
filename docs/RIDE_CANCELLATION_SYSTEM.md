# Ride Cancellation System

## Overview

The Ride Cancellation System provides a comprehensive, user-friendly interface for canceling rides with transparent fee structures, countdown timers, and detailed consequences. The system ensures users make informed decisions while preventing accidental cancellations.

## Features

### 🚫 Smart Cancellation Logic
- **Contextual Fees**: Different fees based on ride status and timing
- **Free Cancellation Window**: 5-minute free cancellation after driver acceptance
- **Dynamic Fee Calculation**: Real-time fee calculation based on ride progress
- **Driver Impact Awareness**: Shows how cancellation affects the driver

### ⏱️ Countdown Timer
- **5-Second Confirmation**: Prevents accidental cancellations
- **Visual Progress Bar**: Animated countdown with visual feedback
- **Haptic Feedback**: Tactile feedback during countdown and confirmation
- **Sound Cues**: Audio feedback for user actions

### 💰 Transparent Fee Display
- **Clear Fee Breakdown**: Shows exact cancellation amount
- **Fee Context**: Explains why fees apply
- **Payment Method Info**: Shows which payment method will be charged
- **Full Ride Price Warning**: For in-progress ride cancellations

### 📋 Comprehensive Consequences
- **Driver Notification**: Immediate driver notification
- **Rating Impact**: Warning about rating implications
- **Rebooking Information**: Expected wait time for next ride
- **Driver Status**: Shows driver's current location and status

## Architecture

### File Structure
```
src/
├── components/ride/
│   └── CancellationDialog.tsx    # Main cancellation UI component
├── hooks/
│   └── useCancellationLogic.ts   # Cancellation business logic
├── app/(rider)/
│   └── active-ride.tsx          # Integration point
├── __tests__/
│   └── cancellation-dialog.test.tsx # Component tests
└── docs/
    └── RIDE_CANCELLATION_SYSTEM.md   # This documentation
```

### Key Components

#### CancellationDialog (`src/components/ride/CancellationDialog.tsx`)
Main UI component featuring:
- Animated countdown timer with progress bar
- Fee display with contextual information
- Consequence list with detailed explanations
- Dual-action buttons (Keep/Cancel)
- Glassmorphism design with premium aesthetics

#### useCancellationLogic Hook (`src/hooks/useCancellationLogic.ts`)
Business logic hook providing:
- Fee calculation algorithms
- Free cancellation timing
- Consequence generation
- Policy compliance checks
- Analytics tracking

## Fee Structure

### Fee Thresholds
```typescript
const FEE_THRESHOLDS = {
  pending: 0,           // No fee - driver hasn't accepted
  accepted: 2.50,       // $2.50 after 5-minute window
  confirmed: 2.50,      // $2.50 - driver en route
  arrived: 5.00,        // $5.00 - driver at pickup
  in_progress: 1.0,     // Full ride price multiplier
};
```

### Free Cancellation Window
- **Duration**: 5 minutes (300 seconds) from driver acceptance
- **Applicability**: Only for 'accepted' status rides
- **Display**: Shows remaining time in MM:SS format
- **Behavior**: No fee charged if cancelled within window

### Fee Calculation Logic
```typescript
const calculateFee = (status, price, customFee, freeTimeRemaining) => {
  // 1. Check free cancellation window
  if (freeTimeRemaining > 0) return 0;
  
  // 2. Use custom fee if provided
  if (customFee !== undefined) return customFee;
  
  // 3. Calculate based on status
  const threshold = FEE_THRESHOLDS[status];
  if (status === 'in_progress' && price > 0) {
    return price * threshold; // Full ride price
  }
  return threshold;
};
```

## User Experience Flow

### 1. Cancellation Initiation
```
User taps "Cancel Ride" → Dialog appears → 5-second countdown starts
```

### 2. Countdown Period
```
Timer: 5s → 4s → 3s → 2s → 1s → 0s
Button: "Wait 5s" → "Wait 4s" → ... → "Cancel Ride"
Haptics: Tap on each second → Heavy on completion
```

### 3. Decision Point
```
Option A: "Keep Ride" → Dialog closes → Ride continues
Option B: "Cancel Ride" → Fee charged → Ride cancelled
```

### 4. Post-Cancellation
```
Driver notified → Fee processed → User returned to home → Rebooking available
```

## Integration Guide

### Basic Usage
```tsx
import { CancellationDialog } from '@/components/ride/CancellationDialog';

<CancellationDialog
  visible={showDialog}
  onDismiss={() => setShowDialog(false)}
  onConfirm={handleCancellation}
  rideStatus={currentRide.status}
  ridePrice={currentRide.price}
  driverEnRouteTime={enRouteTime}
  freeCancellationTimeLeft={freeTime}
/>
```

### Advanced Usage with Hook
```tsx
import { useCancellationLogic } from '@/hooks/useCancellationLogic';

const MyComponent = () => {
  const cancellationLogic = useCancellationLogic({
    rideStatus: 'accepted',
    ridePrice: 25.50,
    driverEnRouteTime: 120,
  });

  return (
    <View>
      <Text>Fee: ${cancellationLogic.fee.toFixed(2)}</Text>
      <Text>Free time: {cancellationLogic.formatTimeRemaining(
        cancellationLogic.freeTimeRemaining
      )}</Text>
    </View>
  );
};
```

## Status-Specific Behaviors

### 🟢 Pending Status
- **Fee**: $0.00 (always free)
- **Consequences**: Immediate rebooking available
- **Message**: "No cancellation fee will be charged"
- **Rebooking**: Can immediately request new ride

### 🟡 Accepted Status
- **Fee**: $0.00 (first 5 minutes) → $2.50 (after window)
- **Consequences**: Driver rating may be affected
- **Message**: Shows free cancellation time remaining
- **Rebooking**: May need to wait longer

### 🟠 Confirmed Status
- **Fee**: $2.50 (always applies)
- **Consequences**: Driver en route, rating impact
- **Message**: "A cancellation fee of $2.50 will be charged"
- **Rebooking**: Longer wait time expected

### 🔴 Arrived Status
- **Fee**: $5.00 (always applies)
- **Consequences**: Driver at pickup location
- **Message**: "Driver has arrived. Cancellation fee of $5.00 applies"
- **Rebooking**: Significant wait time

### ⚫ In-Progress Status
- **Fee**: Full ride price
- **Consequences**: Trip ends at current location
- **Message**: "Cancellation during ride will result in full fare charge"
- **Rebooking**: Not recommended

## Accessibility Features

### Screen Reader Support
- **Semantic Labels**: Proper accessibility labels for all elements
- **Status Announcements**: Countdown progress announced
- **Button Roles**: Clear button purposes (confirm/dismiss)
- **Fee Information**: Fee amounts properly announced

### Visual Accessibility
- **High Contrast**: Clear visual hierarchy with good contrast
- **Large Touch Targets**: 44px minimum touch targets
- **Color Coding**: Consistent color use (green=free, red=fee)
- **Text Scaling**: Supports dynamic text sizing

### Motor Accessibility
- **Dismiss Options**: Multiple ways to dismiss (overlay, button, back)
- **Timeout Handling**: No automatic timeouts that prevent interaction
- **Confirmation Required**: Prevents accidental cancellations
- **Clear Feedback**: Visual and haptic feedback for actions

## Testing

### Unit Tests
```bash
npm test __tests__/cancellation-dialog.test.tsx
```

### Test Coverage
- ✅ Component rendering
- ✅ Countdown timer functionality
- ✅ Fee calculation accuracy
- ✅ Button state management
- ✅ Haptic/sound feedback
- ✅ Accessibility compliance
- ✅ Edge cases and error handling

### Manual Testing Checklist
- [ ] Countdown timer counts down correctly
- [ ] Confirm button enables after countdown
- [ ] Fees display correctly for each status
- [ ] Free cancellation window works
- [ ] Consequences are accurate and helpful
- [ ] Haptic feedback triggers appropriately
- [ ] Sound effects play at right times
- [ ] Dialog dismisses correctly
- [ ] Accessibility labels work properly

## Analytics and Tracking

### Events Tracked
```typescript
// Cancellation attempt
{
  event: 'cancellation_attempt',
  rideStatus: 'accepted',
  fee: 2.50,
  timeToDecision: 3.2,
  decision: 'confirmed'
}

// Cancellation completed
{
  event: 'cancellation_completed',
  rideStatus: 'accepted',
  feeCharged: 2.50,
  cancellationReason: 'Driver rating may be affected'
}
```

### Metrics to Monitor
- **Cancellation Rate**: By ride status and timing
- **Time to Decision**: How long users take to decide
- **Fee Impact**: How fees affect cancellation decisions
- **User Satisfaction**: Post-cancellation rebooking behavior

## Performance Considerations

### Optimization Strategies
- **Memoized Calculations**: Fee calculations cached with useMemo
- **Efficient Re-renders**: Minimal state updates
- **Animation Performance**: 60fps animations with Reanimated
- **Memory Management**: Proper cleanup of timers and listeners

### Bundle Size Impact
- **Component Size**: ~8KB gzipped
- **Hook Size**: ~3KB gzipped
- **Dependencies**: Minimal external dependencies
- **Tree Shaking**: Unused code eliminated

## Future Enhancements

### Planned Features
1. **Dynamic Pricing**: Surge-based cancellation fees
2. **Loyalty Benefits**: Reduced fees for frequent users
3. **Driver Preferences**: Driver-specific cancellation policies
4. **Multi-stop Support**: Cancellation fees for multi-stop rides
5. **Scheduled Rides**: Different policies for scheduled rides

### Improvements
1. **Better Animations**: More sophisticated countdown animations
2. **Voice Support**: Voice commands for cancellation
3. **Gesture Support**: Swipe gestures to dismiss
4. **Localization**: Multi-language support
5. **Custom Policies**: Business-specific cancellation rules

## Troubleshooting

### Common Issues

#### Countdown Not Working
- Verify timer is properly started on dialog open
- Check for timer cleanup on unmount
- Ensure proper dependency array in useEffect

#### Fee Calculation Incorrect
- Verify ride status is correctly passed
- Check custom fee parameter precedence
- Validate free cancellation time calculation

#### Haptics Not Working
- Ensure haptic hook is properly called
- Check device compatibility
- Verify haptic trigger timing

#### Animation Issues
- Check Reanimated installation
- Verify animation values are shared
- Ensure proper cleanup on unmount

### Debug Tools
```typescript
// Enable debug logging
console.log('Cancellation state:', {
  rideStatus,
  calculatedFee,
  freeTimeRemaining,
  consequences,
});

// Monitor performance
console.time('cancellation-render');
// ... component renders
console.timeEnd('cancellation-render');
```

## Security Considerations

### Fee Manipulation Prevention
- **Server Validation**: All fees validated on backend
- **Client Calculation**: For UI only, not authoritative
- **Tamper Detection**: Client state validation
- **Audit Trail**: All cancellations logged

### Data Protection
- **User Privacy**: Minimal data collection
- **Secure Storage**: Sensitive data encrypted
- **Compliance**: GDPR and privacy law compliance
- **Data Retention**: Limited data retention policies

## Support

For issues or questions about the cancellation system:
1. Check this documentation
2. Review the component tests
3. Examine the hook implementation
4. Test with different ride statuses
5. Check browser console for errors

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Maintainer**: Project Aura Team
