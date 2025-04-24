// server/controllers/trainingController.js
const TrainingData = require('../models/Training');

// Get latest training data
exports.getTrainingData = async (req, res) => {
  try {
    // Get company ID from query params or default to 'default'
    const companyId = req.query.companyId || 'default';
    
    // Find the most recent training data entry
    const trainingData = await TrainingData.findOne({ companyId }).sort({ createdAt: -1 });
    
    if (!trainingData) {
      return res.status(404).json({ message: 'No training data found' });
    }
    
    res.status(200).json(trainingData);
  } catch (error) {
    console.error('Error fetching training data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save new training data (overwrites existing)
exports.saveTrainingData = async (req, res) => {
  try {
    // Get company ID from body or default to 'default'
    const companyId = req.body.companyId || 'default';
    
    // Create a new training data document
    const newTrainingData = new TrainingData({
      ...req.body,
      companyId,
      uploadDate: new Date()
    });
    
    // Save the new data
    await newTrainingData.save();
    
    res.status(201).json({ 
      message: 'Training data saved successfully', 
      id: newTrainingData._id 
    });
  } catch (error) {
    console.error('Error saving training data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get summary metrics for training data
exports.getTrainingMetrics = async (req, res) => {
  try {
    // Get company ID from query params or default to 'default'
    const companyId = req.query.companyId || 'default';
    
    // Find the most recent training data entry
    const trainingData = await TrainingData.findOne({ companyId }).sort({ createdAt: -1 });
    
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
    
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching training metrics:', error);
    res.status(500).json({ 
      message: 'Server error',
      trainingCompliance: 0,
      upcomingRenewals: 0,
      expiredCertificates: 0,
      error: error.message
    });
  }
};