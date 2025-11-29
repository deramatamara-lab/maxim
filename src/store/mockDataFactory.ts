import { Driver, Vehicle, RideHistory, ActiveRide, Location } from '@/api/rides';
import { PaymentMethodInfo } from '@/api/payment';

// Mock vehicle data
const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    color: 'Pearl White',
    licensePlate: 'AURA-123',
    type: 'electric',
  },
  {
    id: 'vehicle-2',
    make: 'BMW',
    model: 'i7',
    year: 2024,
    color: 'Black Sapphire',
    licensePlate: 'AURA-456',
    type: 'luxury',
  },
  {
    id: 'vehicle-3',
    make: 'Audi',
    model: 'Q4 e-tron',
    year: 2023,
    color: 'Navarra Blue',
    licensePlate: 'AURA-789',
    type: 'suv',
  },
];

// Mock driver data
const mockDrivers: Driver[] = [
  {
    id: 'driver-1',
    name: 'Alex Chen',
    phone: '+1-555-0123',
    email: 'alex.chen@aura.com',
    rating: 4.9,
    vehicle: mockVehicles[0],
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    completedRides: 150,
  },
  {
    id: 'driver-2',
    name: 'Maria Rodriguez',
    phone: '+1-555-0124',
    email: 'maria.rodriguez@aura.com',
    rating: 4.8,
    vehicle: mockVehicles[1],
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    completedRides: 200,
  },
  {
    id: 'driver-3',
    name: 'James Wilson',
    phone: '+1-555-0125',
    email: 'james.wilson@aura.com',
    rating: 4.7,
    vehicle: mockVehicles[2],
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    completedRides: 175,
  },
];

// Mock payment methods using proper discriminated union
const mockPaymentMethods: PaymentMethodInfo[] = [
  {
    id: 'payment-1',
    type: 'credit_card',
    isDefault: true,
    isVerified: true,
    addedAt: '2023-01-15T10:00:00Z',
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2025,
    cardholderName: 'John Doe',
    token: 'tok_123456789',
    fingerprint: 'fp_abc123',
  },
  {
    id: 'payment-2',
    type: 'digital_wallet',
    isDefault: false,
    isVerified: true,
    addedAt: '2023-02-20T14:30:00Z',
    provider: 'paypal',
    email: 'john.doe@example.com',
    accountId: 'paypal_12345',
    displayName: 'John Doe',
  },
  {
    id: 'payment-3',
    type: 'cash',
    isDefault: false,
    isVerified: true,
    addedAt: '2023-03-10T09:15:00Z',
    preferredCurrency: 'USD',
    requiresChange: true,
  },
];

// Mock locations - index 0 matches store's dev/test mode default (Sofia, Bulgaria)
const mockLocations = [
  { lat: 42.6977, lon: 23.3219, address: 'Sofia, Bulgaria' },
  { lat: 42.6954, lon: 23.3239, address: 'NDK, Sofia, Bulgaria' },
  { lat: 42.6979, lon: 23.3222, address: 'Vitosha Blvd, Sofia, Bulgaria' },
  { lat: 42.7000, lon: 23.3300, address: 'Sofia University, Bulgaria' },
  { lat: 42.6850, lon: 23.3200, address: 'South Park, Sofia, Bulgaria' },
  { lat: 42.7100, lon: 23.3100, address: 'Business Park Sofia, Bulgaria' },
];

// Factory functions
export const createMockDriver = (index: number = 0): Driver => {
  return {
    ...mockDrivers[index % mockDrivers.length],
    completedRides: 150 + (index * 25), // Add realistic completed rides count
  };
};

export const createMockVehicle = (index: number = 0): Vehicle => {
  return mockVehicles[index % mockVehicles.length];
};

export const createMockPaymentMethod = (index: number = 0): PaymentMethodInfo => {
  return mockPaymentMethods[index % mockPaymentMethods.length];
};

export const createMockLocation = (index: number = 0): Location => {
  return mockLocations[index % mockLocations.length];
};

export const createMockRideHistory = (index: number, riderId: string): RideHistory => {
  const pickup = createMockLocation(index * 2);
  const destination = createMockLocation(index * 2 + 1);
  const driver = createMockDriver(index);
  const paymentMethod = createMockPaymentMethod(index % 2);
  
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - index);
  
  const isCompleted = Math.random() > 0.1; // 90% completed, 10% cancelled
  
  return {
    id: `ride-history-${index}`,
    riderId,
    driverId: driver.id,
    pickup,
    destination,
    status: isCompleted ? 'completed' : 'cancelled',
    price: 15.50 + Math.random() * 40, // €15.50 - €55.50
    duration: Math.round(10 + Math.random() * 30), // 10-40 minutes
    distance: Math.round(2 + Math.random() * 15), // 2-17 miles
    driverRating: isCompleted ? 4.5 + Math.random() * 0.5 : undefined,
    riderRating: isCompleted ? 4.5 + Math.random() * 0.5 : undefined,
    paymentMethod,
    createdAt: baseDate.toISOString(),
    completedAt: isCompleted ? new Date(baseDate.getTime() + 20 * 60 * 1000).toISOString() : undefined,
  };
};

export const createMockActiveRide = (
  pickup: Location,
  destination: Location,
  rideOptionId: string,
  riderId: string,
  notes?: string
): ActiveRide => {
  const driver = createMockDriver(Math.floor(Math.random() * 3));
  
  return {
    id: `active-ride-${Date.now()}`,
    riderId,
    driverId: driver.id,
    driver,
    status: 'pending',
    pickupLocation: pickup,
    dropoffLocation: destination,
    rideOptionId,
    price: 15.50 + Math.random() * 40,
    fare: {
      total: 15.50 + Math.random() * 40,
      base: 8.50,
      distance: (Math.round(2 + Math.random() * 15) * 0.5),
      time: (Math.round(10 + Math.random() * 30) * 0.35),
      surge: Math.random() > 0.7 ? 1.2 + Math.random() * 0.8 : undefined,
    },
    duration: Math.round(10 + Math.random() * 30),
    distance: Math.round(2 + Math.random() * 15) * 1609, // Convert miles to meters
    estimatedPrice: 15.50 + Math.random() * 40,
    estimatedDuration: Math.round((10 + Math.random() * 30) * 60), // Convert minutes to seconds
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pickup: {
      address: pickup.address || 'Current Location',
    },
    destination: {
      address: destination.address || notes || 'Destination',
    },
  };
};

// Generate mock data arrays
export const generateMockRideHistory = (riderId: string, count: number = 5): RideHistory[] => {
  return Array.from({ length: count }, (_, index) => createMockRideHistory(index, riderId));
};

// Mock data getters
export const getMockDrivers = (): Driver[] => mockDrivers;
export const getMockVehicles = (): Vehicle[] => mockVehicles;
export const getMockPaymentMethods = (): PaymentMethodInfo[] => mockPaymentMethods;
export const getMockLocations = (): Location[] => mockLocations;
