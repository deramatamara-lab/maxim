/**
 * Driver Routes
 * Handles driver status, location updates, and ride assignments
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

// Mock drivers database
const drivers = new Map([
  [1, { 
    id: 1, 
    name: 'Sarah Johnson', 
    rating: 4.9, 
    vehicle: 'Tesla Model 3', 
    plate: 'ABC-123', 
    location: { lat: 40.7128, lng: -74.0060 }, 
    status: 'available',
    isOnline: true,
    totalRides: 1247,
    earnings: 45678.90
  }],
  [2, { 
    id: 2, 
    name: 'Mike Chen', 
    rating: 4.8, 
    vehicle: 'Toyota Camry', 
    plate: 'XYZ-789', 
    location: { lat: 40.7589, lng: -73.9851 }, 
    status: 'available',
    isOnline: true,
    totalRides: 892,
    earnings: 32145.67
  }],
  [3, { 
    id: 3, 
    name: 'Emily Davis', 
    rating: 4.95, 
    vehicle: 'Honda Accord', 
    plate: 'DEF-456', 
    location: { lat: 40.7489, lng: -73.9680 }, 
    status: 'busy',
    isOnline: true,
    totalRides: 1567,
    earnings: 52341.23
  }]
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

// Get driver profile
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const driver = drivers.get(parseInt(id));

    if (!driver) {
      return res.status(404).json({
        error: 'Driver not found',
        code: 'DRIVER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
        rating: driver.rating,
        vehicle: driver.vehicle,
        plate: driver.plate,
        status: driver.status,
        isOnline: driver.isOnline,
        totalRides: driver.totalRides,
        earnings: driver.earnings,
        location: driver.location
      }
    });

  } catch (error) {
    logger.error('Get driver profile error', { error: error.message });
    res.status(500).json({
      error: 'Failed to get driver profile',
      code: 'DRIVER_PROFILE_ERROR'
    });
  }
});

// Update driver status (online/offline)
router.put('/status/:id', [
  body('isOnline').isBoolean(),
  body('status').optional().isIn(['available', 'busy', 'offline']),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { isOnline, status } = req.body;

    const driver = drivers.get(parseInt(id));
    if (!driver) {
      return res.status(404).json({
        error: 'Driver not found',
        code: 'DRIVER_NOT_FOUND'
      });
    }

    // Update driver status
    driver.isOnline = isOnline;
    if (status) {
      driver.status = status;
    } else if (!isOnline) {
      driver.status = 'offline';
    }

    drivers.set(driver.id, driver);

    logger.info('Driver status updated', {
      driverId: driver.id,
      isOnline: driver.isOnline,
      status: driver.status
    });

    res.json({
      success: true,
      driver: {
        id: driver.id,
        isOnline: driver.isOnline,
        status: driver.status
      }
    });

  } catch (error) {
    logger.error('Update driver status error', { error: error.message });
    res.status(500).json({
      error: 'Failed to update driver status',
      code: 'DRIVER_STATUS_ERROR'
    });
  }
});

// Update driver location
router.put('/location/:id', [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('accuracy').optional().isFloat(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy } = req.body;

    const driver = drivers.get(parseInt(id));
    if (!driver) {
      return res.status(404).json({
        error: 'Driver not found',
        code: 'DRIVER_NOT_FOUND'
      });
    }

    // Update driver location
    driver.location = { lat: latitude, lng: longitude };
    driver.locationUpdatedAt = new Date().toISOString();
    if (accuracy) {
      driver.locationAccuracy = accuracy;
    }

    drivers.set(driver.id, driver);

    logger.info('Driver location updated', {
      driverId: driver.id,
      location: driver.location,
      accuracy
    });

    res.json({
      success: true,
      location: {
        latitude: driver.location.lat,
        longitude: driver.location.lng,
        updatedAt: driver.locationUpdatedAt
      }
    });

  } catch (error) {
    logger.error('Update driver location error', { error: error.message });
    res.status(500).json({
      error: 'Failed to update driver location',
      code: 'DRIVER_LOCATION_ERROR'
    });
  }
});

// Get available drivers near location
router.get('/available', [
  query('latitude').isFloat({ min: -90, max: 90 }),
  query('longitude').isFloat({ min: -180, max: 180 }),
  query('radius').optional().isFloat({ min: 0.1, max: 50 }), // Default 5km radius
  handleValidationErrors
], async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    // Calculate distance from each driver
    const availableDrivers = Array.from(drivers.values())
      .filter(driver => driver.isOnline && driver.status === 'available')
      .map(driver => {
        // Simple distance calculation (for production, use proper geospatial queries)
        const distance = Math.sqrt(
          Math.pow(driver.location.lat - parseFloat(latitude), 2) +
          Math.pow(driver.location.lng - parseFloat(longitude), 2)
        ) * 111; // Rough conversion to kilometers
        
        return {
          ...driver,
          distanceKm: Math.round(distance * 10) / 10
        };
      })
      .filter(driver => driver.distanceKm <= parseFloat(radius))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({
      success: true,
      drivers: availableDrivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        rating: driver.rating,
        vehicle: driver.vehicle,
        plate: driver.plate,
        location: driver.location,
        distanceKm: driver.distanceKm,
        etaMinutes: Math.ceil(driver.distanceKm * 2) // Rough ETA calculation
      }))
    });

  } catch (error) {
    logger.error('Get available drivers error', { error: error.message });
    res.status(500).json({
      error: 'Failed to get available drivers',
      code: 'AVAILABLE_DRIVERS_ERROR'
    });
  }
});

// Accept ride assignment
router.post('/accept-ride/:driverId', [
  body('rideId').isInt(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { driverId } = req.params;
    const { rideId } = req.body;

    const driver = drivers.get(parseInt(driverId));
    if (!driver) {
      return res.status(404).json({
        error: 'Driver not found',
        code: 'DRIVER_NOT_FOUND'
      });
    }

    if (driver.status !== 'available') {
      return res.status(400).json({
        error: 'Driver is not available',
        code: 'DRIVER_NOT_AVAILABLE'
      });
    }

    // Update driver status to busy
    driver.status = 'busy';
    driver.currentRideId = rideId;
    drivers.set(driver.id, driver);

    logger.info('Driver accepted ride', {
      driverId: driver.id,
      rideId: rideId
    });

    res.json({
      success: true,
      driver: {
        id: driver.id,
        status: driver.status,
        currentRideId: driver.currentRideId
      }
    });

  } catch (error) {
    logger.error('Accept ride error', { error: error.message });
    res.status(500).json({
      error: 'Failed to accept ride',
      code: 'ACCEPT_RIDE_ERROR'
    });
  }
});

// Complete ride
router.post('/complete-ride/:driverId', [
  body('rideId').isInt(),
  body('finalLocation.latitude').isFloat({ min: -90, max: 90 }),
  body('finalLocation.longitude').isFloat({ min: -180, max: 180 }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { driverId } = req.params;
    const { rideId, finalLocation } = req.body;

    const driver = drivers.get(parseInt(driverId));
    if (!driver) {
      return res.status(404).json({
        error: 'Driver not found',
        code: 'DRIVER_NOT_FOUND'
      });
    }

    if (driver.status !== 'busy' || driver.currentRideId !== rideId) {
      return res.status(400).json({
        error: 'Invalid ride assignment',
        code: 'INVALID_RIDE_ASSIGNMENT'
      });
    }

    // Update driver status back to available
    driver.status = 'available';
    driver.location = { lat: finalLocation.latitude, lng: finalLocation.longitude };
    driver.locationUpdatedAt = new Date().toISOString();
    delete driver.currentRideId;
    
    // Update stats
    driver.totalRides += 1;
    driver.earnings += Math.random() * 50 + 10; // Mock earnings

    drivers.set(driver.id, driver);

    logger.info('Driver completed ride', {
      driverId: driver.id,
      rideId: rideId,
      totalRides: driver.totalRides,
      earnings: driver.earnings
    });

    res.json({
      success: true,
      driver: {
        id: driver.id,
        status: driver.status,
        location: driver.location,
        totalRides: driver.totalRides,
        earnings: Math.round(driver.earnings * 100) / 100
      }
    });

  } catch (error) {
    logger.error('Complete ride error', { error: error.message });
    res.status(500).json({
      error: 'Failed to complete ride',
      code: 'COMPLETE_RIDE_ERROR'
    });
  }
});

// Get driver earnings summary
router.get('/earnings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const driver = drivers.get(parseInt(id));

    if (!driver) {
      return res.status(404).json({
        error: 'Driver not found',
        code: 'DRIVER_NOT_FOUND'
      });
    }

    // Mock earnings data
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const earnings = {
      total: Math.round(driver.earnings * 100) / 100,
      today: Math.round((Math.random() * 200 + 50) * 100) / 100,
      thisWeek: Math.round((Math.random() * 800 + 300) * 100) / 100,
      thisMonth: Math.round((Math.random() * 3000 + 1000) * 100) / 100,
      ridesCompleted: driver.totalRides,
      averagePerRide: Math.round((driver.earnings / driver.totalRides) * 100) / 100,
      currency: 'USD'
    };

    res.json({
      success: true,
      earnings
    });

  } catch (error) {
    logger.error('Get driver earnings error', { error: error.message });
    res.status(500).json({
      error: 'Failed to get driver earnings',
      code: 'DRIVER_EARNINGS_ERROR'
    });
  }
});

module.exports = router;
