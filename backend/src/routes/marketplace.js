const express = require('express');
const { body, validationResult } = require('express-validator');
const hederaService = require('../services/hederaService');
const comicService = require('../services/comicService');

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

/**
 * @route POST /api/marketplace/list
 * @desc List a comic for sale
 * @access Public
 */
router.post('/list', [
  body('comicId').notEmpty().withMessage('Comic ID is required'),
  body('seller').notEmpty().withMessage('Seller address is required'),
  body('price').isInt({ min: 0 }).withMessage('Price must be a non-negative integer'),
  body('currency').optional().isIn(['HBAR', 'USDC']).withMessage('Currency must be HBAR or USDC'),
  body('type').isIn(['fixed', 'auction']).withMessage('Type must be fixed or auction'),
  body('duration').optional().isInt({ min: 3600, max: 604800 }).withMessage('Duration must be between 1 hour and 7 days')
], validateRequest, async (req, res) => {
  try {
    const {
      comicId,
      seller,
      price,
      currency = 'HBAR',
      type = 'fixed',
      duration = 86400, // 24 hours default
      description = ''
    } = req.body;

    // Get comic information
    const comic = await comicService.getComic(comicId);
    if (!comic) {
      return res.status(404).json({
        success: false,
        error: 'Comic not found'
      });
    }

    // Create listing
    const listing = {
      id: `${comicId}-${Date.now()}`,
      comicId,
      seller,
      price,
      currency,
      type,
      duration,
      description,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
      bids: [],
      highestBid: null
    };

    // In a real implementation, you would store this in a database
    // For now, we'll simulate the listing creation
    
    res.status(201).json({
      success: true,
      data: listing,
      message: 'Comic listed for sale successfully'
    });
  } catch (error) {
    console.error('Error listing comic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/marketplace/buy
 * @desc Buy a comic at fixed price
 * @access Public
 */
router.post('/buy', [
  body('listingId').notEmpty().withMessage('Listing ID is required'),
  body('buyer').notEmpty().withMessage('Buyer address is required'),
  body('tokenId').notEmpty().withMessage('Token ID is required'),
  body('serialNumber').isInt({ min: 1 }).withMessage('Serial number must be a positive integer')
], validateRequest, async (req, res) => {
  try {
    const {
      listingId,
      buyer,
      tokenId,
      serialNumber,
      seller
    } = req.body;

    // Verify ownership (in a real implementation, you would check the actual listing)
    const ownership = await hederaService.checkNFTOwnership(seller, tokenId, serialNumber);
    if (!ownership) {
      return res.status(400).json({
        success: false,
        error: 'Seller does not own this NFT'
      });
    }

    // Transfer NFT
    const transferResult = await hederaService.transferNFT(
      tokenId,
      serialNumber,
      seller,
      buyer
    );

    res.json({
      success: true,
      data: transferResult,
      message: 'Comic purchased successfully'
    });
  } catch (error) {
    console.error('Error buying comic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/marketplace/bid
 * @desc Place a bid on an auction
 * @access Public
 */
router.post('/bid', [
  body('listingId').notEmpty().withMessage('Listing ID is required'),
  body('bidder').notEmpty().withMessage('Bidder address is required'),
  body('amount').isInt({ min: 0 }).withMessage('Bid amount must be a non-negative integer'),
  body('currency').optional().isIn(['HBAR', 'USDC']).withMessage('Currency must be HBAR or USDC')
], validateRequest, async (req, res) => {
  try {
    const {
      listingId,
      bidder,
      amount,
      currency = 'HBAR'
    } = req.body;

    // In a real implementation, you would:
    // 1. Verify the listing exists and is an auction
    // 2. Check if the bid is higher than the current highest bid
    // 3. Check if the auction is still active
    // 4. Store the bid in the database

    const bid = {
      id: `${listingId}-${Date.now()}`,
      listingId,
      bidder,
      amount,
      currency,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    res.status(201).json({
      success: true,
      data: bid,
      message: 'Bid placed successfully'
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/marketplace/accept-bid
 * @desc Accept a bid and complete the sale
 * @access Public
 */
router.post('/accept-bid', [
  body('bidId').notEmpty().withMessage('Bid ID is required'),
  body('seller').notEmpty().withMessage('Seller address is required'),
  body('tokenId').notEmpty().withMessage('Token ID is required'),
  body('serialNumber').isInt({ min: 1 }).withMessage('Serial number must be a positive integer')
], validateRequest, async (req, res) => {
  try {
    const {
      bidId,
      seller,
      tokenId,
      serialNumber,
      buyer
    } = req.body;

    // Verify ownership
    const ownership = await hederaService.checkNFTOwnership(seller, tokenId, serialNumber);
    if (!ownership) {
      return res.status(400).json({
        success: false,
        error: 'Seller does not own this NFT'
      });
    }

    // Transfer NFT
    const transferResult = await hederaService.transferNFT(
      tokenId,
      serialNumber,
      seller,
      buyer
    );

    res.json({
      success: true,
      data: transferResult,
      message: 'Bid accepted and NFT transferred successfully'
    });
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/marketplace/listings
 * @desc Get active listings
 * @access Public
 */
router.get('/listings', async (req, res) => {
  try {
    const {
      type,
      currency,
      minPrice,
      maxPrice,
      seller,
      limit = 20,
      offset = 0
    } = req.query;

    // In a real implementation, you would query the database
    // For now, return mock data
    const listings = [];

    res.json({
      success: true,
      data: {
        listings,
        total: listings.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting listings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/marketplace/listings/:id
 * @desc Get specific listing
 * @access Public
 */
router.get('/listings/:id', async (req, res) => {
  try {
    // In a real implementation, you would fetch from database
    const listing = null;

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error getting listing:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/marketplace/bids/:listingId
 * @desc Get bids for a listing
 * @access Public
 */
router.get('/bids/:listingId', async (req, res) => {
  try {
    // In a real implementation, you would fetch from database
    const bids = [];

    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('Error getting bids:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/marketplace/user/:address/listings
 * @desc Get user's listings
 * @access Public
 */
router.get('/user/:address/listings', async (req, res) => {
  try {
    const { address } = req.params;
    const { status = 'active', limit = 20, offset = 0 } = req.query;

    // In a real implementation, you would query the database
    const listings = [];

    res.json({
      success: true,
      data: {
        listings,
        total: listings.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting user listings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/marketplace/user/:address/bids
 * @desc Get user's bids
 * @access Public
 */
router.get('/user/:address/bids', async (req, res) => {
  try {
    const { address } = req.params;
    const { status = 'active', limit = 20, offset = 0 } = req.query;

    // In a real implementation, you would query the database
    const bids = [];

    res.json({
      success: true,
      data: {
        bids,
        total: bids.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting user bids:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/marketplace/stats
 * @desc Get marketplace statistics
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    // In a real implementation, you would calculate from database
    const stats = {
      totalListings: 0,
      activeListings: 0,
      totalVolume: 0,
      averagePrice: 0,
      totalSales: 0,
      topCollections: [],
      recentActivity: []
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting marketplace stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
