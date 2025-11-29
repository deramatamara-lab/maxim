# Driver Earnings Dashboard

## Overview

The Driver Earnings Dashboard provides a comprehensive view of driver earnings, performance metrics, and payout history. It features real-time data updates, beautiful visualizations, and seamless navigation.

## Features

### 📊 Earnings Overview
- **Period Selection**: Daily, weekly, and monthly earnings views
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Detailed Breakdown**: Trips, hours worked, and average ratings
- **Currency Formatting**: Professional USD formatting

### 📈 Performance Metrics
- **Acceptance Rate**: Percentage of ride requests accepted
- **Completion Rate**: Percentage of completed rides
- **On-Time Rate**: Percentage of on-time arrivals
- **Average Rating**: Driver rating with star visualization
- **Progress Bars**: Visual representation of metrics

### 💳 Payout History
- **Status Tracking**: Pending, processing, completed, failed
- **Payment Methods**: Direct deposit, PayPal, bank transfer
- **Transaction Details**: Amounts, dates, and status indicators
- **Quick Actions**: View all payouts and request new payouts

### 🎨 UI Components
- **GlassCard**: Premium glassmorphism design
- **PremiumButton**: Interactive buttons with haptic feedback
- **CustomIcon**: Consistent iconography
- **Animated Transitions**: Smooth period switching and data loading

## Architecture

### File Structure
```
src/
├── app/(driver)/
│   ├── earnings.tsx           # Main dashboard component
│   └── index.tsx              # Driver home with earnings preview
├── hooks/
│   └── useEarnings.ts         # Earnings data management
├── types/
│   └── earnings.ts           # TypeScript type definitions
├── api/
│   └── earnings.ts           # Mock earnings service
└── __tests__/
    └── earnings.test.tsx     # Component tests
```

### Key Components

#### EarningsDashboard (`src/app/(driver)/earnings.tsx`)
Main dashboard component with:
- Period selection (daily/weekly/monthly)
- Earnings summary cards
- Performance metrics visualization
- Payout history display
- Loading and error states

#### useEarnings Hook (`src/hooks/useEarnings.ts`)
Custom hook for:
- Data fetching and caching
- Auto-refresh functionality
- Error handling and retry logic
- Payout request functionality

#### Earnings Service (`src/api/earnings.ts`)
Mock API service providing:
- Comprehensive earnings data
- Performance metrics
- Payout history
- Realistic data generation

#### Type Definitions (`src/types/earnings.ts`)
Complete TypeScript types for:
- Earnings data structures
- Performance metrics
- Payout records
- API responses

## Usage

### Basic Integration
```tsx
import EarningsDashboard from '@/app/(driver)/earnings';

// In your driver app
<EarningsDashboard 
  driverId="driver_123"
  onBack={() => navigation.goBack()}
/>
```

### Using the Hook
```tsx
import { useEarnings } from '@/hooks/useEarnings';

const MyComponent = () => {
  const {
    data,
    loading,
    error,
    refreshing,
    selectedPeriod,
    setSelectedPeriod,
    refresh,
    requestPayout,
  } = useEarnings({ 
    driverId: 'driver_123',
    autoRefresh: true,
    refreshInterval: 30000,
  });

  // Use data in your component
};
```

### Navigation Integration
```tsx
// From driver home screen
const navigateToEarnings = () => {
  router.push('/(driver)/earnings');
};
```

## Data Flow

### 1. Data Loading
```
Component Mount → useEarnings Hook → Earnings Service → Mock Data → UI Update
```

### 2. Period Selection
```
User Selects Period → Hook Triggers → Service Fetches Data → Component Re-renders
```

### 3. Auto Refresh
```
Timer (30s) → Hook Refreshes → Service Updates → UI Reflects Changes
```

### 4. Payout Request
```
User Requests Payout → Service Processes → Data Refreshes → Success Feedback
```

## Mock Data

The earnings service generates realistic mock data:

### Daily Earnings
- Amount: $200-400 per day
- Trips: 8-15 rides
- Hours: 6-12 hours worked
- Rating: 4.0-4.9 stars

### Weekly Earnings
- Total: $1,200-2,000 per week
- Trips: 40-70 rides
- Hours: 40-50 hours worked
- Average rating: 4.5-4.8 stars

### Monthly Earnings
- Total: $5,000-8,000 per month
- Trips: 160-250 rides
- Hours: 160-200 hours worked
- Average rating: 4.4-4.7 stars

### Performance Metrics
- Acceptance Rate: 85-97%
- Completion Rate: 90-98%
- On-Time Rate: 88-98%
- Average Rating: 4.2-4.9 stars

## Testing

### Unit Tests
```bash
npm test __tests__/earnings.test.tsx
```

### Coverage Areas
- Component rendering
- Data loading states
- Period selection
- Error handling
- Navigation functionality

### Manual Testing
1. Load dashboard with different driver IDs
2. Test period switching (daily/weekly/monthly)
3. Verify auto-refresh functionality
4. Test error states and retry logic
5. Navigate from driver home to earnings dashboard

## Performance Optimizations

### Data Caching
- Earnings data cached in hook state
- Smart refresh only when needed
- Debounced period changes

### UI Performance
- Animated transitions with Reanimated
- Efficient re-renders with useMemo
- Loading states prevent layout shifts

### Memory Management
- Cleanup intervals on unmount
- Proper error boundaries
- Optimized mock data generation

## Accessibility

### Screen Reader Support
- Proper accessibility labels
- Semantic button roles
- Status announcements
- Navigation hints

### Visual Accessibility
- High contrast colors
- Clear typography
- Focus indicators
- Touch target sizes (44px minimum)

## Internationalization

### Translation Keys
```typescript
// Earnings related keys
{
  'earnings.title': 'Earnings Dashboard',
  'earnings.daily': 'Daily',
  'earnings.weekly': 'Weekly', 
  'earnings.monthly': 'Monthly',
  'earnings.total_earnings': 'Total Earnings',
  'earnings.trips': 'Trips',
  'earnings.hours': 'Hours',
  'earnings.rating': 'Rating',
  'earnings.performance_metrics': 'Performance Metrics',
  'earnings.payout_history': 'Payout History',
  'earnings.loading': 'Loading earnings data...',
  'earnings.error': 'Failed to load earnings data',
}
```

## Future Enhancements

### Planned Features
1. **Analytics Integration**: Real backend API integration
2. **Export Functionality**: CSV/PDF earnings reports
3. **Goal Setting**: Custom earnings and trip goals
4. **Leaderboards**: Driver performance comparisons
5. **Notifications**: Earnings milestones and alerts
6. **Multi-Currency**: Support for different currencies
7. **Advanced Filtering**: Date ranges and custom periods

### Performance Improvements
1. **WebSocket Integration**: Real-time data updates
2. **Offline Support**: Cached data for offline viewing
3. **Background Refresh**: Background data synchronization
4. **Data Compression**: Optimized API responses

### UI Enhancements
1. **Interactive Charts**: Earnings trends visualization
2. **Heat Maps**: Location-based earnings insights
3. **Achievement Badges**: Performance milestones
4. **Dark Mode**: Enhanced dark theme support

## Troubleshooting

### Common Issues

#### Data Not Loading
- Check driver ID parameter
- Verify network connectivity
- Check service response format
- Review error logs in console

#### Navigation Issues
- Verify Expo Router setup
- Check route configuration
- Ensure proper import paths
- Test navigation flow

#### Performance Issues
- Monitor auto-refresh intervals
- Check for memory leaks
- Verify animation performance
- Test on low-end devices

### Debug Tools
```typescript
// Enable debug logging
console.log('Earnings data:', earningsData);

// Check hook state
console.log('Hook state:', {
  loading,
  error,
  selectedPeriod,
  refreshing,
});

// Monitor performance
console.time('earnings-render');
// ... component renders
console.timeEnd('earnings-render');
```

## Support

For issues or questions about the earnings dashboard:
1. Check this documentation
2. Review the component tests
3. Examine the TypeScript types
4. Test with the mock service
5. Check the browser console for errors

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Project Aura Team
