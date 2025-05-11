// server/routes/training.js
const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');

// Debug middleware to log request details
router.use((req, res, next) => {
  // Log basic request info
  console.log(`[${new Date().toISOString()}] Training API: ${req.method} ${req.originalUrl}`);
  
  // Log headers for CORS debugging
  console.log('Request headers:', {
    origin: req.headers.origin,
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length']
  });
  
  // For POST requests, log the structure of the body
  if (req.method === 'POST' && req.body) {
    try {
      const bodyStructure = {
        hasRecords: !!req.body.records,
        recordsIsArray: Array.isArray(req.body.records),
        recordCount: Array.isArray(req.body.records) ? req.body.records.length : 0,
        hasStats: !!req.body.stats,
        topLevelFields: Object.keys(req.body)
      };
      console.log('Request body structure:', bodyStructure);
    } catch (err) {
      console.error('Error logging request body:', err.message);
    }
  }
  
  // Add CORS headers directly just to be safe
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS requests specially
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

/**
 * @route   GET /api/training
 * @desc    Get all training data
 * @access  Public
 */
router.get('/', trainingController.getTrainingData);

/**
 * @route   POST /api/training
 * @desc    Create or update training data
 * @access  Public
 */
router.post('/', trainingController.saveTrainingData);

/**
 * @route   GET /api/training/metrics
 * @desc    Get training metrics summary
 * @access  Public
 */
router.get('/metrics', trainingController.getTrainingMetrics);

/**
 * @route   GET /api/training/test
 * @desc    Simple test endpoint for training API
 * @access  Public  
 */
router.get('/test', (req, res) => {
  res.json({
    message: 'Training API test endpoint working',
    timestamp: new Date().toISOString(),
    requestOrigin: req.headers.origin || 'unknown'
  });
});

module.exports = router;