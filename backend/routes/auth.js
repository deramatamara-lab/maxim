/**
 * Authentication Routes
 * Handles user registration, login, token refresh, and logout
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Mock user database (replace with real database in production)
const users = new Map();
let userIdCounter = 1;

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

// Generate JWT tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      type: user.type 
    },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('phone').matches(/^\+?[\d\s\-\(\)]+$/),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, type = 'rider' } = req.body;

    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = {
      id: userIdCounter++,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      type,
      createdAt: new Date().toISOString(),
      isActive: true,
      isVerified: false
    };

    users.set(email, user);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      type: user.type
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        type: user.type,
        isVerified: user.isVerified
      },
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    });

  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// User login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;
    logger.info('Login attempt', { email, hasPassword: !!password });

    // Find user
    const user = users.get(email);
    if (!user) {
      logger.info('Login failed: User not found', { email });
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      logger.info('Login failed: Account inactive', { email });
      return res.status(401).json({
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logger.info('Login failed: Invalid password', { email });
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Update last login
    user.lastLoginAt = new Date().toISOString();

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        type: user.type,
        isVerified: user.isVerified
      },
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    });

  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Refresh access token
router.post('/refresh', [
  body('refreshToken').notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
    
    // Find user
    const user = Array.from(users.values()).find(u => u.id === decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    logger.info('Token refreshed successfully', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      tokens
    });

  } catch (error) {
    logger.error('Token refresh error', { error: error.message });
    res.status(401).json({
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

// Logout (invalidate token on client side)
router.post('/logout', async (req, res) => {
  try {
    // In a real implementation, you might want to blacklist tokens
    // For now, we'll just log the logout event
    logger.info('User logged out', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    // In a real implementation, you'd verify the JWT token
    // For now, we'll return a mock profile
    res.json({
      success: true,
      user: {
        id: 1,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        type: 'rider',
        isVerified: true,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Profile fetch error', { error: error.message });
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'PROFILE_ERROR'
    });
  }
});

module.exports = router;
