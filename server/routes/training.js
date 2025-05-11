// server/routes/training.js
const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');

// Middleware to log requests to the training API
router.use((req, res, next) => {
  console.log(`Training API Request: ${req.method} ${req.originalUrl}`);
  console.log('Request headers:', req.headers);
  if (req.method === 'POST') {
    console.log('Request body keys:', Object.keys(req.body));
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

module.exports = router;