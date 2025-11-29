
export interface Coordinates {
    lat: number;
    lng: number;
}

export interface RideOption {
    id: string;
    name: string;
    description: string;
    price: number;
    time: string;
    icon: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'system' | 'ai' | 'driver';
    text: string;
    timestamp: number;
}

export interface DriverStats {
    rides: number;
    yearsDriving: number;
    languages: string[];
    compliments: string[]; // e.g., "Great Music", "Smooth Drive"
}

export interface Driver {
    id: string;
    name: string;
    rating: number;
    carModel: string;
    carPlate: string;
    photoUrl?: string;
    stats?: DriverStats;
    bio?: string;
}

export interface RideHistoryItem {
    id: string;
    date: string;
    time: string;
    destination: string;
    price: number;
    carType: string; // 'Aura X' | 'Aura Black' | 'Hyper'
    status: 'completed' | 'cancelled';
    rating?: number;
    coordinates?: Coordinates;
    paymentId?: string;
    driver?: Driver; // Linked driver profile
}

export interface PaymentMethod {
    id: string;
    type: 'card' | 'wallet';
    brand?: 'visa' | 'mastercard' | 'amex';
    last4?: string;
    label?: string;
    expiry?: string;
}

export interface RidePreferences {
    temperature: number; // 0 (Cool) to 100 (Warm)
    lighting: string; // Hex color
    music: 'lofi' | 'jazz' | 'techno' | 'classical' | 'none';
    conversation: 'quiet' | 'normal' | 'chatty';
    luggageAssist: boolean;
}

export enum AppPhase {
    SPLASH = 'SPLASH',
    AUTH = 'AUTH',
    HOME = 'HOME',
    TRANSITION_TO_MAP = 'TRANSITION_TO_MAP',
    RIDE_SELECT = 'RIDE_SELECT',
    ACTIVE_RIDE = 'ACTIVE_RIDE'
}

export enum Tab {
    HOME = 'HOME',
    ACTIVITY = 'ACTIVITY',
    LOCATION = 'LOCATION',
    PROFILE = 'PROFILE'
}

export type RideStatus = 'searching' | 'confirmed' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';

// NEW TYPES FOR DRIVER & ADMIN
export type UserRole = 'rider' | 'driver' | 'admin';

export type DriverPhase = 'offline' | 'online' | 'incoming' | 'pickup' | 'trip' | 'complete';

export interface AdminStat {
    label: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: string;
}

export interface Transaction {
    id: string;
    user: string;
    amount: string;
    // Fix: Added 'cancelled' to status type to support cancelled transactions in history and admin dashboard
    status: 'completed' | 'pending' | 'failed' | 'cancelled';
    time: string;
    type: string;
}
