const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const hederaService = require('../services/hederaService');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Mock user database (replace with real database in production)
const users = new Map();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('hederaAccountId').optional().isString().withMessage('Hedera account ID must be a string')
], validateRequest, async (req, res) => {
  try {
    const { username, email, password, hederaAccountId } = req.body;

    // Check if user already exists
    if (users.has(email)) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      hederaAccountId: hederaAccountId || null,
      createdAt: new Date().toISOString(),
      isVerified: false,
      profile: {
        bio: '',
        avatar: '',
        socialLinks: {}
      }
    };

    users.set(email, user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          hederaAccountId: user.hederaAccountId,
          createdAt: user.createdAt,
          profile: user.profile
        },
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          hederaAccountId: user.hederaAccountId,
          createdAt: user.createdAt,
          profile: user.profile
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/auth/connect-wallet
 * @desc Connect Hedera wallet to user account
 * @access Private
 */
router.post('/connect-wallet', [
  body('hederaAccountId').notEmpty().withMessage('Hedera account ID is required'),
  body('publicKey').optional().isString().withMessage('Public key must be a string')
], validateRequest, async (req, res) => {
  try {
    const { hederaAccountId, publicKey } = req.body;
    const userId = req.user.userId;

    // Find user
    const user = Array.from(users.values()).find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify Hedera account exists and get balance
    try {
      const balance = await hederaService.getAccountBalance(hederaAccountId);
      
      // Update user's Hedera account
      user.hederaAccountId = hederaAccountId;
      user.publicKey = publicKey;
      user.walletConnectedAt = new Date().toISOString();

      res.json({
        success: true,
        data: {
          hederaAccountId,
          balance: balance.hbarBalance,
          connectedAt: user.walletConnectedAt
        },
        message: 'Wallet connected successfully'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Hedera account ID'
      });
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/auth/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find user
    const user = Array.from(users.values()).find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get Hedera account balance if connected
    let balance = null;
    if (user.hederaAccountId) {
      try {
        const balanceData = await hederaService.getAccountBalance(user.hederaAccountId);
        balance = balanceData.hbarBalance;
      } catch (error) {
        console.warn('Could not fetch balance:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          hederaAccountId: user.hederaAccountId,
          createdAt: user.createdAt,
          profile: user.profile,
          balance
        }
      }
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', [
  body('username').optional().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
  body('bio').optional().isString().withMessage('Bio must be a string'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  body('socialLinks').optional().isObject().withMessage('Social links must be an object')
], validateRequest, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, bio, avatar, socialLinks } = req.body;

    // Find user
    const user = Array.from(users.values()).find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update profile fields
    if (username) user.username = username;
    if (bio !== undefined) user.profile.bio = bio;
    if (avatar !== undefined) user.profile.avatar = avatar;
    if (socialLinks !== undefined) user.profile.socialLinks = socialLinks;

    user.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          hederaAccountId: user.hederaAccountId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          profile: user.profile
        }
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/auth/verify-token
 * @desc Verify JWT token
 * @access Public
 */
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = Array.from(users.values()).find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          hederaAccountId: user.hederaAccountId,
          createdAt: user.createdAt,
          profile: user.profile
        }
      },
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Private
 */
router.post('/logout', async (req, res) => {
  try {
    // In a stateless JWT implementation, logout is handled client-side
    // by removing the token from storage
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Apply authentication middleware to protected routes
router.use('/profile', authenticateToken);
router.use('/connect-wallet', authenticateToken);

module.exports = router;
