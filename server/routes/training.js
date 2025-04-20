// server/routes/training.js
const express = require('express');
const router = express.Router();
const TrainingData = require('../models/Training');

/**
 * @route   GET /api/training
 * @desc    Get all training data
 * @access  Private (if using auth middleware)
 */
router.get('/', async (req, res) => {
  try {
    // Get the company ID from query params or default to 'default'
    const companyId = req.query.companyId || 'default';
    
    // Get the most recent training data entry for the company
    const trainingData = await TrainingData.findOne({ companyId })
      .sort({ createdAt: -1 });
    
    if (!trainingData) {
      return res.status(404).json({ message: 'No training data found' });
    }
    
    res.json(trainingData);
  } catch (err) {
    console.error('Error fetching training data:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/training
 * @desc    Create or update training data
 * @access  Private (if using auth middleware)
 */
router.post('/', async (req, res) => {
  try {
    // Extract company ID from request or use default
    const companyId = req.body.companyId || 'default';
    
    // Create a new training data entry
    const newTrainingData = new TrainingData({
      ...req.body,
      companyId,
      uploadDate: new Date()
    });
    
    // Save the training data
    await newTrainingData.save();
    
    res.status(201).json({ 
      message: 'Training data saved successfully', 
      id: newTrainingData._id 
    });
  } catch (err) {
    console.error('Error saving training data:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(err.errors).map(e => e.message) 
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/training/metrics
 * @desc    Get training metrics summary
 * @access  Private (if using auth middleware)
 */
router.get('/metrics', async (req, res) => {
  try {
    // Get the company ID from query params or default to 'default'
    const companyId = req.query.companyId || 'default';
    
    // Get the most recent training data entry for the company
    const trainingData = await TrainingData.findOne({ companyId })
      .sort({ createdAt: -1 });
    
    if (!trainingData) {
      return res.status(404).json({ 
        message: 'No training data found',
        trainingCompliance: 0,
        upcomingRenewals: 0,
        expiredCertificates: 0
      });
    }
    
    // Extract key metrics
    const metrics = {
      trainingCompliance: trainingData.compliance || 0,
      upcomingRenewals: trainingData.stats.upcoming || 0,
      expiredCertificates: trainingData.stats.expired || 0,
      totalCertificates: trainingData.stats.total || 0,
      completedCertificates: trainingData.stats.completed || 0
    };
    
    res.json(metrics);
  } catch (err) {
    console.error('Error fetching training metrics:', err.message);
    res.status(500).json({ 
      message: 'Server error',
      trainingCompliance: 0,
      upcomingRenewals: 0,
      expiredCertificates: 0
    });
  }
});

module.exports = router;