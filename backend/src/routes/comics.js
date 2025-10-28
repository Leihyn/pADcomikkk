const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const comicService = require('../services/comicService');
const hederaService = require('../services/hederaService');
const ipfsService = require('../services/ipfsService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE?.replace('MB', '')) * 1024 * 1024 || 50 * 1024 * 1024,
    files: parseInt(process.env.MAX_PAGES_PER_COMIC) || 100
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

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
 * @route POST /api/comics/collections
 * @desc Create a new comic collection
 * @access Public
 */
router.post('/collections', [
  body('name').notEmpty().withMessage('Collection name is required'),
  body('symbol').notEmpty().withMessage('Collection symbol is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('creator').notEmpty().withMessage('Creator address is required'),
  body('genres').isArray().withMessage('Genres must be an array'),
  body('royaltyPercentage').optional().isInt({ min: 0, max: 25 }).withMessage('Royalty must be between 0-25%'),
  body('maxSupply').optional().isInt({ min: 0 }).withMessage('Max supply must be a positive integer')
], validateRequest, async (req, res) => {
  try {
    const collection = await comicService.createCollection(req.body);
    
    res.status(201).json({
      success: true,
      data: collection,
      message: 'Collection created successfully'
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/comics/collections/:id
 * @desc Get collection by ID
 * @access Public
 */
router.get('/collections/:id', async (req, res) => {
  try {
    const collection = await comicService.getCollection(req.params.id);
    
    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error getting collection:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/comics
 * @desc Create a new comic issue
 * @access Public
 */
router.post('/', upload.array('pages'), [
  body('collectionId').notEmpty().withMessage('Collection ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('creator').notEmpty().withMessage('Creator address is required'),
  body('issueNumber').isInt({ min: 1 }).withMessage('Issue number must be a positive integer'),
  body('series').notEmpty().withMessage('Series name is required'),
  body('genres').isArray().withMessage('Genres must be an array'),
  body('mintPrice').isInt({ min: 0 }).withMessage('Mint price must be a non-negative integer'),
  body('maxSupply').isInt({ min: 1 }).withMessage('Max supply must be a positive integer'),
  body('royaltyPercentage').optional().isInt({ min: 0, max: 25 }).withMessage('Royalty must be between 0-25%')
], validateRequest, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one page image is required'
      });
    }

    const comicData = {
      ...req.body,
      pages: req.files,
      publicationDate: req.body.publicationDate || new Date().toISOString().split('T')[0],
      rarity: req.body.rarity || 'Standard',
      edition: req.body.edition || 'First Print',
      artists: req.body.artists ? req.body.artists.split(',') : [req.body.creator]
    };

    const comic = await comicService.createComic(comicData);
    
    res.status(201).json({
      success: true,
      data: comic,
      message: 'Comic created successfully'
    });
  } catch (error) {
    console.error('Error creating comic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/comics/search
 * @desc Search comics
 * @access Public
 */
router.get('/search', async (req, res) => {
  try {
    const searchParams = {
      query: req.query.q,
      genre: req.query.genre,
      series: req.query.series,
      creator: req.query.creator,
      rarity: req.query.rarity,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const result = await comicService.searchComics(searchParams);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error searching comics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/comics/:id
 * @desc Get comic by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const comic = await comicService.getComic(req.params.id);
    
    res.json({
      success: true,
      data: comic
    });
  } catch (error) {
    console.error('Error getting comic:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/comics/:id/mint
 * @desc Batch mint multiple copies of a comic
 * @access Public
 */
router.post('/:id/mint', [
  body('quantity').isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1-100')
], validateRequest, async (req, res) => {
  try {
    const result = await comicService.batchMintComic(req.params.id, req.body.quantity);
    
    res.json({
      success: true,
      data: result,
      message: `${req.body.quantity} copies minted successfully`
    });
  } catch (error) {
    console.error('Error batch minting comic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/comics/collection/:collectionId
 * @desc Get all comics in a collection
 * @access Public
 */
router.get('/collection/:collectionId', async (req, res) => {
  try {
    const comics = await comicService.getComicsByCollection(req.params.collectionId);
    
    res.json({
      success: true,
      data: comics
    });
  } catch (error) {
    console.error('Error getting comics by collection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/comics/creator/:creator
 * @desc Get comics by creator
 * @access Public
 */
router.get('/creator/:creator', async (req, res) => {
  try {
    const comics = await comicService.getComicsByCreator(req.params.creator);
    
    res.json({
      success: true,
      data: comics
    });
  } catch (error) {
    console.error('Error getting comics by creator:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route PUT /api/comics/:id
 * @desc Update comic
 * @access Public
 */
router.put('/:id', async (req, res) => {
  try {
    const comic = await comicService.updateComic(req.params.id, req.body);
    
    res.json({
      success: true,
      data: comic,
      message: 'Comic updated successfully'
    });
  } catch (error) {
    console.error('Error updating comic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/comics/stats/overview
 * @desc Get platform statistics
 * @access Public
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = comicService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
