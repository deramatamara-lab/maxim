/**
 * Ride Routes
 * Handles ride estimation, booking, tracking, and management
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const winston = require('winston');

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Mock rides database
const rides = new Map();
let rideIdCounter = 1;

// Mock drivers database
const drivers = new Map([
  [1, { id: 1, name: 'Sarah Johnson', rating: 4.9, vehicle: 'Tesla Model 3', plate: 'ABC-123', location: { lat: 40.7128, lng: -74.0060 }, status: 'available' }],
  [2, { id: 2, name: 'Mike Chen', rating: 4.8, vehicle: 'Toyota Camry', plate: 'XYZ-789', location: { lat: 40.7589, lng: -73.9851 }, status: 'available' }],
  [3, { id: 3, name: 'Emily Davis', rating: 4.95, vehicle: 'Honda Accord', plate: 'DEF-456', location: { lat: 40.7489, lng: -73.9680 }, status: 'busy' }]
]);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Calculate fare based on distance, time, and demand
const calculateFare = (distanceKm, durationMinutes, surgeMultiplier = 1.0) => {
  const baseFare = 2.50;
  const perKmRate = 1.75;
  const perMinuteRate = 0.35;
  
  const distanceFare = distanceKm * perKmRate;
  const timeFare = durationMinutes * perMinuteRate;
  const subtotal = baseFare + distanceFare + timeFare;
  const total = subtotal * surgeMultiplier;
  
  return {
    baseFare,
    distanceFare: Math.round(distanceFare * 100) / 100,
    timeFare: Math.round(timeFare * 100) / 100,
    surgeFare: Math.round((subtotal * (surgeMultiplier - 1)) * 100) / 100,
    total: Math.round(total * 100) / 100,
    currency: 'USD'
  };
};

// Get ride estimate
router.post('/estimate', [
  body('pickup.latitude').isFloat({ min: -90, max: 90 }),
  body('pickup.longitude').isFloat({ min: -180, max: 180 }),
  body('pickup.address').notEmpty(),
  body('dropoff.latitude').isFloat({ min: -90, max: 90 }),
  body('dropoff.longitude').isFloat({ min: -180, max: 180 }),
  body('dropoff.address').notEmpty(),
  body('rideOptionId').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { pickup, dropoff, rideOptionId = 'standard' } = req.body;

    // Calculate distance and estimated duration
    const distanceKm = calculateDistance(
      pickup.latitude, pickup.longitude,
      dropoff.latitude, dropoff.longitude
    );
    
    // Estimate duration (average speed of 30 km/h in city)
    const durationMinutes = Math.round((distanceKm / 30) * 60);
    
    // Simulate surge pricing (random multiplier between 1.0 and 2.5)
    const surgeMultiplier = Math.random() > 0.7 ? (Math.random() * 1.5 + 1.0) : 1.0;
    
    // Calculate fare for different ride options
    const rideOptions = [
      {
        id: 'standard',
        name: 'Aura Standard',
        capacity: 4,
        estimatedDuration: durationMinutes,
        estimatedDistance: Math.round(distanceKm * 10) / 10,
        pricing: calculateFare(distanceKm, durationMinutes, surgeMultiplier),
        etaMinutes: Math.floor(Math.random() * 8) + 3, // 3-10 minutes
        surgeMultiplier: surgeMultiplier > 1.0 ? surgeMultiplier : undefined
      },
      {
        id: 'comfort',
        name: 'Aura Comfort',
        capacity: 4,
        estimatedDuration: durationMinutes,
        estimatedDistance: Math.round(distanceKm * 10) / 10,
        pricing: calculateFare(distanceKm, durationMinutes, surgeMultiplier * 1.3),
        etaMinutes: Math.floor(Math.random() * 10) + 5, // 5-15 minutes
        surgeMultiplier: surgeMultiplier > 1.0 ? surgeMultiplier : undefined
      },
      {
        id: 'xl',
        name: 'Aura XL',
        capacity: 6,
        estimatedDuration: durationMinutes,
        estimatedDistance: Math.round(distanceKm * 10) / 10,
        pricing: calculateFare(distanceKm, durationMinutes, surgeMultiplier * 1.5),
        etaMinutes: Math.floor(Math.random() * 12) + 7, // 7-19 minutes
        surgeMultiplier: surgeMultiplier > 1.0 ? surgeMultiplier : undefined
      }
    ];

    logger.info('Ride estimate calculated', {
      pickup: pickup.address,
      dropoff: dropoff.address,
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMinutes,
      surgeMultiplier
    });

    res.json({
      success: true,
      estimate: {
        pickup,
        dropoff,
        rideOptions,
        surgeMultiplier: surgeMultiplier > 1.0 ? surgeMultiplier : undefined,
        estimatedDuration: durationMinutes,
        estimatedDistance: Math.round(distanceKm * 10) / 10
      }
    });

  } catch (error) {
    logger.error('Ride estimate error', { error: error.message });
    res.status(500).json({
      error: 'Failed to calculate ride estimate',
      code: 'ESTIMATE_ERROR'
    });
  }
});

// Book a ride
router.post('/book', [
  body('pickup.latitude').isFloat({ min: -90, max: 90 }),
  body('pickup.longitude').isFloat({ min: -180, max: 180 }),
  body('pickup.address').notEmpty(),
  body('dropoff.latitude').isFloat({ min: -90, max: 90 }),
  body('dropoff.longitude').isFloat({ min: -180, max: 180 }),
  body('dropoff.address').notEmpty(),
  body('rideOptionId').notEmpty(),
  body('paymentMethodId').optional().isInt(),
  body('notes').optional().isString(),
  body('passengerCount').optional().isInt({ min: 1, max: 6 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { 
      pickup, dropoff, rideOptionId, paymentMethodId, 
      notes, passengerCount = 1 
    } = req.body;

    // Find available driver
    const availableDrivers = Array.from(drivers.values())
      .filter(driver => driver.status === 'available');
    
    if (availableDrivers.length === 0) {
      return res.status(503).json({
        error: 'No drivers available',
        code: 'NO_DRIVERS_AVAILABLE'
      });
    }

    const assignedDriver = availableDrivers[0];
    
    // Calculate ride details
    const distanceKm = calculateDistance(
      pickup.latitude, pickup.longitude,
      dropoff.latitude, dropoff.longitude
    );
    const durationMinutes = Math.round((distanceKm / 30) * 60);
    const surgeMultiplier = Math.random() > 0.7 ? (Math.random() * 1.5 + 1.0) : 1.0;
    const pricing = calculateFare(distanceKm, durationMinutes, surgeMultiplier);

    // Create ride
    const ride = {
      id: rideIdCounter++,
      userId: 1, // In real implementation, get from JWT token
      driverId: assignedDriver.id,
      status: 'confirmed',
      pickup,
      dropoff,
      rideOptionId,
      paymentMethodId: paymentMethodId || 1,
      notes,
      passengerCount,
      pricing,
      estimatedDuration: durationMinutes,
      estimatedDistance: Math.round(distanceKm * 10) / 10,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      driver: {
        id: assignedDriver.id,
        name: assignedDriver.name,
        rating: assignedDriver.rating,
        vehicle: assignedDriver.vehicle,
        plate: assignedDriver.plate,
        location: assignedDriver.location,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
      }
    };

    rides.set(ride.id, ride);

    // Update driver status
    assignedDriver.status = 'busy';
    drivers.set(assignedDriver.id, assignedDriver);

    logger.info('Ride booked successfully', {
      rideId: ride.id,
      driverId: assignedDriver.id,
      pickup: pickup.address,
      dropoff: dropoff.address,
      fare: pricing.total
    });

    res.status(201).json({
      success: true,
      ride: {
        id: ride.id,
        status: ride.status,
        pickup: ride.pickup,
        dropoff: ride.dropoff,
        driver: ride.driver,
        pricing: ride.pricing,
        estimatedDuration: ride.estimatedDuration,
        estimatedDistance: ride.estimatedDistance,
        createdAt: ride.createdAt,
        confirmedAt: ride.confirmedAt
      }
    });

  } catch (error) {
    logger.error('Ride booking error', { error: error.message });
    res.status(500).json({
      error: 'Failed to book ride',
      code: 'BOOKING_ERROR'
    });
  }
});

// Get ride status
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ride = rides.get(parseInt(id));

    if (!ride) {
      return res.status(404).json({
        error: 'Ride not found',
        code: 'RIDE_NOT_FOUND'
      });
    }

    // Simulate ride progress
    let currentStatus = ride.status;
    let driverLocation = ride.driver.location;

    if (ride.status === 'confirmed') {
      // Simulate driver arriving
      if (Math.random() > 0.7) {
        currentStatus = 'driver_arrived';
        driverLocation = ride.pickup;
      }
    } else if (ride.status === 'driver_arrived') {
      // Simulate ride in progress
      if (Math.random() > 0.5) {
        currentStatus = 'in_progress';
        // Move driver halfway to destination
        driverLocation = {
          lat: (ride.pickup.latitude + ride.dropoff.latitude) / 2,
          lng: (ride.pickup.longitude + ride.dropoff.longitude) / 2
        };
      }
    } else if (ride.status === 'in_progress') {
      // Simulate ride completion
      if (Math.random() > 0.6) {
        currentStatus = 'completed';
        driverLocation = ride.dropoff;
        
        // Update driver status back to available
        const driver = drivers.get(ride.driverId);
        if (driver) {
          driver.status = 'available';
          drivers.set(driver.id, driver);
        }
      }
    }

    // Update ride status if changed
    if (currentStatus !== ride.status) {
      ride.status = currentStatus;
      ride.driver.location = driverLocation;
      rides.set(ride.id, ride);
    }

    res.json({
      success: true,
      ride: {
        id: ride.id,
        status: ride.status,
        pickup: ride.pickup,
        dropoff: ride.dropoff,
        driver: {
          ...ride.driver,
          location: driverLocation
        },
        pricing: ride.pricing,
        estimatedDuration: ride.estimatedDuration,
        estimatedDistance: ride.estimatedDistance,
        createdAt: ride.createdAt,
        confirmedAt: ride.confirmedAt,
        ...(ride.status === 'completed' && { completedAt: new Date().toISOString() })
      }
    });

  } catch (error) {
    logger.error('Get ride status error', { error: error.message });
    res.status(500).json({
      error: 'Failed to get ride status',
      code: 'RIDE_STATUS_ERROR'
    });
  }
});

// Cancel ride
router.post('/:id/cancel', [
  body('reason').optional().isString(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const ride = rides.get(parseInt(id));

    if (!ride) {
      return res.status(404).json({
        error: 'Ride not found',
        code: 'RIDE_NOT_FOUND'
      });
    }

    if (['completed', 'cancelled'].includes(ride.status)) {
      return res.status(400).json({
        error: 'Cannot cancel completed or cancelled ride',
        code: 'INVALID_RIDE_STATUS'
      });
    }

    // Update ride status
    ride.status = 'cancelled';
    ride.cancelledAt = new Date().toISOString();
    ride.cancellationReason = reason;
    rides.set(ride.id, ride);

    // Update driver status back to available
    const driver = drivers.get(ride.driverId);
    if (driver) {
      driver.status = 'available';
      drivers.set(driver.id, driver);
    }

    logger.info('Ride cancelled', {
      rideId: ride.id,
      reason: reason || 'No reason provided'
    });

    res.json({
      success: true,
      ride: {
        id: ride.id,
        status: ride.status,
        cancelledAt: ride.cancelledAt,
        cancellationReason: ride.cancellationReason
      }
    });

  } catch (error) {
    logger.error('Cancel ride error', { error: error.message });
    res.status(500).json({
      error: 'Failed to cancel ride',
      code: 'CANCEL_RIDE_ERROR'
    });
  }
});

// Get ride history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userRides = Array.from(rides.values())
      .filter(ride => ride.userId === parseInt(userId))
      .map(ride => ({
        id: ride.id,
        status: ride.status,
        pickup: ride.pickup,
        dropoff: ride.dropoff,
        driver: {
          id: ride.driver.id,
          name: ride.driver.name,
          vehicle: ride.driver.vehicle,
          rating: ride.driver.rating
        },
        pricing: ride.pricing,
        createdAt: ride.createdAt,
        completedAt: ride.completedAt
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      rides: userRides
    });

  } catch (error) {
    logger.error('Get ride history error', { error: error.message });
    res.status(500).json({
      error: 'Failed to get ride history',
      code: 'RIDE_HISTORY_ERROR'
    });
  }
});

module.exports = router;
