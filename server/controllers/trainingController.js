// server/controllers/trainingController.js
const TrainingData = require('../models/Training');

// Get latest training data
exports.getTrainingData = async (req, res) => {
  try {
    // Get company ID from query params or default to 'default'
    const companyId = req.query.companyId || 'default';
    
    console.log(`Fetching training data for company: ${companyId}`);
    
    // Find the most recent training data entry
    const trainingData = await TrainingData.findOne({ companyId }).sort({ createdAt: -1 });
    
    if (!trainingData) {
      console.log('No training data found for company:', companyId);
      return res.status(404).json({ message: 'No training data found' });
    }
    
    console.log(`Found training data with ${trainingData.records?.length || 0} records`);
    res.status(200).json(trainingData);
  } catch (error) {
    console.error('Error fetching training data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save new training data
exports.saveTrainingData = async (req, res) => {
  try {
    // Get company ID from body or default to 'default'
    const companyId = req.body.companyId || 'default';
    
    console.log(`Saving training data for company: ${companyId}`);
    console.log('Request body structure:', Object.keys(req.body));
    
    // Validate required fields
    if (!req.body.records || !Array.isArray(req.body.records)) {
      return res.status(400).json({ 
        message: 'Invalid training data format: "records" must be an array' 
      });
    }
    
    // Make sure all required schemas are present
    const trainingData = {
      ...req.body,
      companyId,
      uploadDate: new Date(),
      // Ensure stats object exists
      stats: req.body.stats || {
        total: req.body.records.length || 0,
        completed: 0,
        expired: 0,
        upcoming: 0
      }
    };
    
    // Create a new training data document
    const newTrainingData = new TrainingData(trainingData);
    
    // Save the new data
    await newTrainingData.save();
    console.log(`Training data saved with ID: ${newTrainingData._id}`);
    
    res.status(201).json({ 
      message: 'Training data saved successfully', 
      id: newTrainingData._id 
    });
  } catch (error) {
    console.error('Error saving training data:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get summary metrics for training data
exports.getTrainingMetrics = async (req, res) => {
  try {
    // Get company ID from query params or default to 'default'
    const companyId = req.query.companyId || 'default';
    
    console.log(`Fetching training metrics for company: ${companyId}`);
    
    // Find the most recent training data entry
    const trainingData = await TrainingData.findOne({ companyId }).sort({ createdAt: -1 });
    
    if (!trainingData) {
      console.log('No training metrics found for company:', companyId);
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
      upcomingRenewals: trainingData.stats?.upcoming || 0,
      expiredCertificates: trainingData.stats?.expired || 0,
      totalCertificates: trainingData.stats?.total || 0,
      completedCertificates: trainingData.stats?.completed || 0
    };
    
    console.log('Training metrics calculated:', metrics);
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