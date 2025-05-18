// server/routes/training.js
const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { model: TrainingData } = require('../models/Training');

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

// Add this to server/routes/training.js

/**
 * @route   POST /api/training/records
 * @desc    Add a single training record
 * @access  Private (if using auth middleware)
 */
router.post('/records', async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.employee || !req.body.courseTitle || !req.body.status) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: employee, courseTitle, and status are required'
      });
    }
    
    // Get company ID from body or default to 'default'
    const companyId = req.body.companyId || 'default';
    
    // Find the most recent training data entry
    const trainingData = await TrainingData.findOne({ companyId }).sort({ createdAt: -1 });
    
    if (!trainingData) {
      return res.status(404).json({
        success: false,
        message: 'No training data found to add record to'
      });
    }
    
    // Create new record object
    const newRecord = {
      employee: req.body.employee,
      trainingType: req.body.courseTitle, // Map to the schema field
      status: req.body.status,
      completionDate: req.body.completionDate || null,
      expirationDate: req.body.expiryDate || null, // Map to the schema field
      archived: false
    };
    
    // Add the new record to the existing records array
    trainingData.records.push(newRecord);
    
    // Save the updated training data
    await trainingData.save();
    
    // Get the newly added record (it will be the last one in the array)
    const savedRecord = trainingData.records[trainingData.records.length - 1];
    
    // Return success response with the saved record
    res.status(201).json({
      success: true,
      message: 'Training record added successfully',
      record: savedRecord
    });
  } catch (error) {
    console.error('Error adding training record:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to add training record'
    });
  }
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
 * @route   PUT /api/training/records/:id/archive
 * @desc    Archive a training record
 * @access  Private (if using auth middleware)
 */
router.put('/records/:id/archive', trainingController.archiveTrainingRecord);

/**
 * @route   PUT /api/training/records/:id/unarchive
 * @desc    Unarchive a training record
 * @access  Private (if using auth middleware)
 */
router.put('/records/:id/unarchive', trainingController.unarchiveTrainingRecord);

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