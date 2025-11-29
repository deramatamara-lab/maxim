
import { RideHistoryItem, PaymentMethod, AdminStat, Transaction, Driver } from './types';

// Source of Truth for Design System
export const ds = {
  colors: {
    primary: '#00F5FF',
    primaryAccent: '#19FBFF',
    secondary: '#00FF73',
    background: '#050607',
    surface: 'rgba(22,22,22,0.95)',
    surfaceElevated: 'rgba(32,32,32,0.96)',
    glass: 'rgba(30,30,30,0.6)',
    textPrimary: '#F7F7F7',
    textSecondary: '#A5A5A5',
    danger: '#FF3366',
    success: '#00FFB3',
    glowCyan: 'rgba(0,245,255,0.25)',
    glowMagenta: 'rgba(255,0,255,0.18)',
    borderSubtle: 'rgba(255,255,255,0.08)',
  },
  radius: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '40px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  shadow: {
    modern: '0 18px 32px -4px rgba(0, 245, 255, 0.15)',
    glow: '0 0 40px rgba(0, 245, 255, 0.4)',
    inner: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
  },
  blur: {
    default: 'backdrop-blur-xl',
  }
} as const;

export const RIDE_OPTIONS = [
    {
        id: 'aura-x',
        name: 'Aura X',
        description: 'Silent electric luxury.',
        price: 24.50,
        time: '3 min',
        icon: 'Zap'
    },
    {
        id: 'aura-black',
        name: 'Aura Black',
        description: 'Professional chauffeurs.',
        price: 38.00,
        time: '5 min',
        icon: 'Star'
    },
    {
        id: 'aura-hyper',
        name: 'Hyper',
        description: 'High-performance sport.',
        price: 55.00,
        time: '8 min',
        icon: 'Activity'
    }
];

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
    { id: 'pm-1', type: 'card', brand: 'visa', last4: '4242', expiry: '12/25' },
    { id: 'pm-2', type: 'wallet', label: 'Apple Pay' },
    { id: 'pm-3', type: 'card', brand: 'mastercard', last4: '8899', expiry: '09/24' },
];

const MOCK_DRIVERS: Record<string, Driver> = {
    d1: {
        id: 'd1', name: 'Marcus Chen', rating: 4.98, carModel: 'Tesla Model S Plaid', carPlate: '8X2-99L',
        bio: 'Professional chauffeur with 5 years of experience in executive transport.',
        stats: { rides: 3482, yearsDriving: 5, languages: ['English', 'Mandarin'], compliments: ['Smooth Drive', 'Immaculate Car'] }
    },
    d2: {
        id: 'd2', name: 'Sarah Jenkins', rating: 4.95, carModel: 'Lucid Air Dream', carPlate: 'AURA-1',
        bio: 'Former racing instructor, prioritizing safety and efficiency.',
        stats: { rides: 1240, yearsDriving: 3, languages: ['English', 'Spanish'], compliments: ['Great Music', 'Expert Navigation'] }
    },
    d3: {
        id: 'd3', name: 'James Wilson', rating: 4.89, carModel: 'Porsche Taycan', carPlate: 'HYPR-SPD',
        stats: { rides: 856, yearsDriving: 2, languages: ['English'], compliments: ['Fast Arrival'] }
    }
};

export const MOCK_RIDE_HISTORY: RideHistoryItem[] = [
    {
        id: 'r-1024',
        date: 'Today',
        time: '9:41 AM',
        destination: 'SoHo House, West Hollywood',
        price: 24.50,
        carType: 'Aura X',
        status: 'completed',
        rating: 5,
        coordinates: { lat: 34.0922, lng: -118.3913 },
        paymentId: 'pm-1',
        driver: MOCK_DRIVERS.d1
    },
    {
        id: 'r-1023',
        date: 'Yesterday',
        time: '6:15 PM',
        destination: 'LAX Terminal 4',
        price: 45.00,
        carType: 'Aura Black',
        status: 'completed',
        rating: 5,
        coordinates: { lat: 33.9416, lng: -118.4085 },
        paymentId: 'pm-2',
        driver: MOCK_DRIVERS.d2
    },
    {
        id: 'r-1022',
        date: 'Oct 24',
        time: '11:30 PM',
        destination: 'Nobu Malibu',
        price: 82.50,
        carType: 'Hyper',
        status: 'completed',
        rating: 4,
        coordinates: { lat: 34.0326, lng: -118.6834 },
        paymentId: 'pm-1',
        driver: MOCK_DRIVERS.d3
    },
    {
        id: 'r-1021',
        date: 'Oct 22',
        time: '2:00 PM',
        destination: 'Santa Monica Pier',
        price: 0.00,
        carType: 'Aura X',
        status: 'cancelled',
        rating: 0,
        coordinates: { lat: 34.0104, lng: -118.4961 }
    }
];

export const MOCK_LOCATIONS = [
    { name: 'Home', lat: 34.0522, lng: -118.2437 },
    { name: 'Work', lat: 34.0620, lng: -118.4065 },
    { name: 'Gym', lat: 34.0430, lng: -118.2673 },
];

export const MOCK_ADMIN_STATS: AdminStat[] = [
    { label: 'Total Revenue', value: '$428.5k', change: '+12.5%', isPositive: true, icon: 'DollarSign' },
    { label: 'Active Rides', value: '1,284', change: '+5.2%', isPositive: true, icon: 'Activity' },
    { label: 'Online Drivers', value: '482', change: '-1.4%', isPositive: false, icon: 'Users' },
    { label: 'Avg Rating', value: '4.92', change: '+0.1%', isPositive: true, icon: 'Star' },
];

export const MOCK_RECENT_TRANSACTIONS: Transaction[] = [
    { id: 't-1', user: 'Alex V.', amount: '$24.50', status: 'completed', time: '2m ago', type: 'Aura X' },
    { id: 't-2', user: 'Sarah M.', amount: '$85.00', status: 'completed', time: '5m ago', type: 'Hyper' },
    { id: 't-3', user: 'James C.', amount: '$12.00', status: 'cancelled', time: '12m ago', type: 'Cancellation' },
    { id: 't-4', user: 'Elena R.', amount: '$45.20', status: 'completed', time: '18m ago', type: 'Aura Black' },
];
