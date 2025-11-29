import { create, StateCreator } from 'zustand/index.js';

type RideStatus = 'pending' | 'accepted' | 'in_progress' | 'completed';

interface RideHistoryItem {
  id: string;
  date: string;
  destination: string;
  price: number;
}

interface RideDetails {
  id: string;
  status: RideStatus;
  destination: string;
  pickup: string;
}

interface DriverRequest {
  id: string;
  passengerId: string;
  pickup: string;
  destination: string;
  distance: number;
  estimatedEarnings: number;
}

interface AuthSlice {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, userId: string) => void;
  clearAuth: () => void;
}

interface RideSlice {
  currentRide: RideDetails | null;
  rideHistory: RideHistoryItem[];
  selectedRideOptionId: string | null;
  destinationQuery: string;
  setCurrentRide: (ride: RideDetails | null) => void;
  clearCurrentRide: () => void;
  addToHistory: (ride: RideHistoryItem) => void;
  setSelectedRideOption: (rideId: string | null) => void;
  setDestinationQuery: (query: string) => void;
}

interface DriverSlice {
  isOnline: boolean;
  currentRequest: DriverRequest | null;
  earnings: {
    today: number;
    week: number;
    month: number;
  };
  setOnline: (online: boolean) => void;
  setCurrentRequest: (request: DriverRequest | null) => void;
  clearCurrentRequest: () => void;
  updateEarnings: (amount: number) => void;
}

interface UISlice {
  language: 'en' | 'bg';
  theme: 'dark';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  setLanguage: (lang: 'en' | 'bg') => void;
  toggleNotifications: () => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
}

export type Store = AuthSlice & RideSlice & DriverSlice & UISlice;

const createAuthSlice: StateCreator<Store, [], [], AuthSlice> = (set) => ({
  token: null,
  userId: null,
  isAuthenticated: false,
  setAuth: (token, userId) =>
    set(() => ({ token, userId, isAuthenticated: true })),
  clearAuth: () =>
    set(() => ({ token: null, userId: null, isAuthenticated: false })),
});

const createRideSlice: StateCreator<Store, [], [], RideSlice> = (set, get) => ({
  currentRide: null,
  rideHistory: [],
  selectedRideOptionId: null,
  destinationQuery: '',
  setCurrentRide: (ride) => set(() => ({ currentRide: ride })),
  clearCurrentRide: () => set(() => ({ currentRide: null })),
  addToHistory: (ride) =>
    set(() => ({
      rideHistory: [ride, ...get().rideHistory],
    })),
  setSelectedRideOption: (rideId) => set(() => ({ selectedRideOptionId: rideId })),
  setDestinationQuery: (query) => set(() => ({ destinationQuery: query })),
});

const createDriverSlice: StateCreator<Store, [], [], DriverSlice> = (set, get) => ({
  isOnline: false,
  currentRequest: null,
  earnings: {
    today: 0,
    week: 0,
    month: 0,
  },
  setOnline: (online) => set(() => ({ isOnline: online })),
  setCurrentRequest: (request) => set(() => ({ currentRequest: request })),
  clearCurrentRequest: () => set(() => ({ currentRequest: null })),
  updateEarnings: (amount) =>
    set(() => {
      const { earnings } = get();
      return {
        earnings: {
          today: earnings.today + amount,
          week: earnings.week + amount,
          month: earnings.month + amount,
        },
      };
    }),
});

const createUISlice: StateCreator<Store, [], [], UISlice> = (set) => ({
  language: 'en' as const,
  theme: 'dark' as const,
  notificationsEnabled: true,
  soundEnabled: true,
  hapticsEnabled: true,
  setLanguage: (lang) => set(() => ({ language: lang })),
  toggleNotifications: () =>
    set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
});

export const useStore = create<Store>()((set, get, store) => ({
  ...createAuthSlice(set, get, store),
  ...createRideSlice(set, get, store),
  ...createDriverSlice(set, get, store),
  ...createUISlice(set, get, store),
}));
