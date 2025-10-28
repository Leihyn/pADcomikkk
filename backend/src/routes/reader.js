const express = require('express');
const { body, validationResult } = require('express-validator');
const hederaService = require('../services/hederaService');
const ipfsService = require('../services/ipfsService');

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
 * @route POST /api/reader/access
 * @desc Check if user has access to read a comic
 * @access Public
 */
router.post('/access', [
  body('comicId').notEmpty().withMessage('Comic ID is required'),
  body('userAddress').notEmpty().withMessage('User address is required'),
  body('tokenId').notEmpty().withMessage('Token ID is required'),
  body('serialNumber').isInt({ min: 1 }).withMessage('Serial number must be a positive integer')
], validateRequest, async (req, res) => {
  try {
    const { comicId, userAddress, tokenId, serialNumber } = req.body;

    // Check NFT ownership
    const ownership = await hederaService.checkNFTOwnership(userAddress, tokenId, serialNumber);
    
    if (!ownership) {
      return res.json({
        success: true,
        data: {
          hasAccess: false,
          reason: 'NFT not owned by user'
        }
      });
    }

    // Get NFT info to verify it's the correct comic
    const nftInfo = await hederaService.getNFTInfo(tokenId, serialNumber);
    
    res.json({
      success: true,
      data: {
        hasAccess: true,
        nftInfo,
        accessGrantedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking access:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/reader/comic/:comicId
 * @desc Get comic content for reading
 * @access Public
 */
router.get('/comic/:comicId', async (req, res) => {
  try {
    const { comicId } = req.params;
    const { userAddress, tokenId, serialNumber } = req.query;

    // Verify ownership if provided
    if (userAddress && tokenId && serialNumber) {
      const ownership = await hederaService.checkNFTOwnership(userAddress, tokenId, serialNumber);
      if (!ownership) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: NFT not owned by user'
        });
      }
    }

    // In a real implementation, you would fetch comic data from database
    // For now, return mock data structure
    const comicData = {
      id: comicId,
      title: 'Sample Comic',
      series: 'Sample Series',
      issueNumber: 1,
      pages: [
        {
          pageNumber: 1,
          thumbnail: 'https://ipfs.io/ipfs/QmSample1',
          web: 'https://ipfs.io/ipfs/QmSample1',
          print: 'https://ipfs.io/ipfs/QmSample1'
        },
        {
          pageNumber: 2,
          thumbnail: 'https://ipfs.io/ipfs/QmSample2',
          web: 'https://ipfs.io/ipfs/QmSample2',
          print: 'https://ipfs.io/ipfs/QmSample2'
        }
      ],
      metadata: {
        totalPages: 2,
        format: 'CBZ',
        resolution: '2048x3072',
        downloadUrl: 'https://ipfs.io/ipfs/QmSampleCBZ'
      }
    };

    res.json({
      success: true,
      data: comicData
    });
  } catch (error) {
    console.error('Error getting comic content:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/reader/page/:comicId/:pageNumber
 * @desc Get specific page content
 * @access Public
 */
router.get('/page/:comicId/:pageNumber', async (req, res) => {
  try {
    const { comicId, pageNumber } = req.params;
    const { userAddress, tokenId, serialNumber, quality = 'web' } = req.query;

    // Verify ownership if provided
    if (userAddress && tokenId && serialNumber) {
      const ownership = await hederaService.checkNFTOwnership(userAddress, tokenId, serialNumber);
      if (!ownership) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: NFT not owned by user'
        });
      }
    }

    // Validate quality parameter
    const validQualities = ['thumbnail', 'web', 'print'];
    if (!validQualities.includes(quality)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quality parameter. Must be thumbnail, web, or print'
      });
    }

    // In a real implementation, you would fetch page data from database/IPFS
    const pageData = {
      comicId,
      pageNumber: parseInt(pageNumber),
      quality,
      url: `https://ipfs.io/ipfs/QmSample${pageNumber}`,
      metadata: {
        width: quality === 'thumbnail' ? 400 : quality === 'web' ? 1200 : 2048,
        height: quality === 'thumbnail' ? 600 : quality === 'web' ? 1800 : 3072,
        format: 'JPEG',
        size: '2.5MB'
      }
    };

    res.json({
      success: true,
      data: pageData
    });
  } catch (error) {
    console.error('Error getting page content:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/reader/download/:comicId
 * @desc Download comic in CBZ format
 * @access Public
 */
router.get('/download/:comicId', async (req, res) => {
  try {
    const { comicId } = req.params;
    const { userAddress, tokenId, serialNumber, format = 'cbz' } = req.query;

    // Verify ownership
    if (userAddress && tokenId && serialNumber) {
      const ownership = await hederaService.checkNFTOwnership(userAddress, tokenId, serialNumber);
      if (!ownership) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: NFT not owned by user'
        });
      }
    }

    // Validate format
    const validFormats = ['cbz', 'pdf', 'zip'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format. Must be cbz, pdf, or zip'
      });
    }

    // In a real implementation, you would:
    // 1. Fetch comic data from database
    // 2. Generate the requested format
    // 3. Stream the file to the user

    const downloadData = {
      comicId,
      format,
      url: `https://ipfs.io/ipfs/QmSample${format.toUpperCase()}`,
      filename: `comic-${comicId}.${format}`,
      size: '15.2MB',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    res.json({
      success: true,
      data: downloadData
    });
  } catch (error) {
    console.error('Error downloading comic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/reader/progress
 * @desc Save reading progress
 * @access Public
 */
router.post('/progress', [
  body('comicId').notEmpty().withMessage('Comic ID is required'),
  body('userAddress').notEmpty().withMessage('User address is required'),
  body('currentPage').isInt({ min: 1 }).withMessage('Current page must be a positive integer'),
  body('totalPages').isInt({ min: 1 }).withMessage('Total pages must be a positive integer'),
  body('readTime').optional().isInt({ min: 0 }).withMessage('Read time must be a non-negative integer')
], validateRequest, async (req, res) => {
  try {
    const { comicId, userAddress, currentPage, totalPages, readTime = 0 } = req.body;

    // In a real implementation, you would save progress to database
    const progress = {
      comicId,
      userAddress,
      currentPage,
      totalPages,
      readTime,
      progressPercentage: Math.round((currentPage / totalPages) * 100),
      lastReadAt: new Date().toISOString(),
      isCompleted: currentPage >= totalPages
    };

    res.json({
      success: true,
      data: progress,
      message: 'Reading progress saved'
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/reader/progress/:userAddress
 * @desc Get user's reading progress
 * @access Public
 */
router.get('/progress/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // In a real implementation, you would fetch from database
    const progressData = [];

    res.json({
      success: true,
      data: {
        progress: progressData,
        total: progressData.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/reader/bookmark
 * @desc Add bookmark to comic
 * @access Public
 */
router.post('/bookmark', [
  body('comicId').notEmpty().withMessage('Comic ID is required'),
  body('userAddress').notEmpty().withMessage('User address is required'),
  body('pageNumber').isInt({ min: 1 }).withMessage('Page number must be a positive integer'),
  body('note').optional().isString().withMessage('Note must be a string')
], validateRequest, async (req, res) => {
  try {
    const { comicId, userAddress, pageNumber, note = '' } = req.body;

    const bookmark = {
      id: `${comicId}-${userAddress}-${pageNumber}`,
      comicId,
      userAddress,
      pageNumber,
      note,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: bookmark,
      message: 'Bookmark added successfully'
    });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/reader/bookmarks/:userAddress
 * @desc Get user's bookmarks
 * @access Public
 */
router.get('/bookmarks/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // In a real implementation, you would fetch from database
    const bookmarks = [];

    res.json({
      success: true,
      data: {
        bookmarks,
        total: bookmarks.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/reader/bookmark/:bookmarkId
 * @desc Remove bookmark
 * @access Public
 */
router.delete('/bookmark/:bookmarkId', async (req, res) => {
  try {
    const { bookmarkId } = req.params;

    // In a real implementation, you would delete from database
    res.json({
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
