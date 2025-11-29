/**
 * Store Migration Adapter
 * Provides backward compatibility while migrating to enhanced store
 * Re-exports from enhanced store with type compatibility
 */

// Import enhanced store as the source of truth
import { useEnhancedAppStore } from './useEnhancedAppStore';

export {
  useEnhancedAppStore as useAppStore,
  useEnhancedNavigationState as useNavigationState,
  useEnhancedAuthState as useAuthState,
  useEnhancedSearchState as useSearchState,
  useEnhancedRideState as useRideState,
} from './useEnhancedAppStore';

// Re-export types with backward compatibility
export type {
  TabId,
  AppState,
  DriverState,
  Location,
  User,
  RideRequest,
  RideOption,
  ActiveRide,
} from './useEnhancedAppStore';

// Legacy selectors for gradual migration
export const useDriverState = () => {
  const { driverState, currentRequest, countdownRemaining, toggleDriverOnline, acceptRideRequest, rejectRideRequest, decrementCountdown, simulateIncomingRequest } = useEnhancedAppStore();
  return {
    driverState,
    currentRequest,
    countdownRemaining,
    toggleDriverOnline,
    acceptRideRequest,
    rejectRideRequest,
    decrementCountdown,
    simulateIncomingRequest,
  };
};

export const useLocationState = () => {
  const { currentLocation, setCurrentLocation, getCurrentLocation } = useEnhancedAppStore();
  return {
    currentLocation,
    setCurrentLocation,
    getCurrentLocation,
  };
};

// For backward compatibility with existing components that expect the old interface
export const useAppStoreLegacy = useEnhancedAppStore;
