// server/controllers/trainingController.js
const mongoose = require('mongoose');

// Ensure the model is properly defined
const TrainingSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    default: 'default'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  records: [{
    employee: {
      type: String,
      required: true
    },
    courseTitle: {
      type: String,
      required: true
    },
    completionDate: {
      type: Date
    },
    expiryDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Completed', 'In Progress', 'Expired', 'Not Started'],
      default: 'Completed'
    },
    department: String,
    assignedBy: String,
    courseType: String,
    notes: String
  }],
  compliance: {
    type: Number,
    default: 0
  },
  stats: {
    total: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    },
    expired: {
      type: Number,
      default: 0
    },
    upcoming: {
      type: Number,
      default: 0
    }
  },
  upcomingRenewals: [{
    employee: String,
    courseTitle: String,
    expiryDate: Date
  }]
}, {
  timestamps: true
});

// Only create the model if it doesn't already exist
const TrainingData = mongoose.models.Training || mongoose.model('Training', TrainingSchema);

// Debug function to log safely
const safeLog = (obj) => {
  try {
    if (typeof obj === 'object') {
      // Safely stringify with circular reference handling
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      }, 2);
    }
    return String(obj);
  } catch (e) {
    return '[Error during logging]';
  }
};

// Get latest training data
exports.getTrainingData = async (req, res) => {
  try {
    // Get company ID from query params or default to 'default'
    const companyId = req.query.companyId || 'default';
    // Check if we should include archived records
    const includeArchived = req.query.includeArchived === 'true';
    
    console.log(`Fetching training data for company: ${companyId}, includeArchived: ${includeArchived}`);
    
    // Find the most recent training data entry
    const trainingData = await TrainingData.findOne({ companyId }).sort({ createdAt: -1 });
    
    if (!trainingData) {
      console.log('No training data found for company:', companyId);
      return res.status(404).json({ message: 'No training data found' });
    }
    
    // Filter out archived records unless explicitly requested
    if (!includeArchived && trainingData.records) {
      trainingData.records = trainingData.records.filter(record => !record.archived);
    }
    
    console.log(`Found training data with ${trainingData.records?.length || 0} records`);
    res.status(200).json(trainingData);
  } catch (error) {
    console.error('Error fetching training data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save new training data with robust error handling
exports.saveTrainingData = async (req, res) => {
  try {
    // Get company ID from body or default to 'default'
    const companyId = req.body.companyId || 'default';
    
    console.log(`Saving training data for company: ${companyId}`);
    console.log('Request body top-level keys:', Object.keys(req.body));
    
    // Validate the request has some form of records
    if (!req.body.records) {
      console.error('Missing records in request body');
      return res.status(400).json({
        message: 'Invalid training data format: "records" field is required'
      });
    }
    
    // Ensure records is an array
    if (!Array.isArray(req.body.records)) {
      console.error('Records is not an array:', typeof req.body.records);
      return res.status(400).json({
        message: 'Invalid training data format: "records" must be an array'
      });
    }
    
    // Validate records have required fields
    const invalidRecords = req.body.records.filter(
      record => !record.employee || !record.courseTitle
    );
    
    if (invalidRecords.length > 0) {
      console.error(`Found ${invalidRecords.length} invalid records`);
      return res.status(400).json({
        message: 'Invalid records: each record must have employee and courseTitle',
        invalidCount: invalidRecords.length
      });
    }
    
    // Process records to ensure proper date formatting
    const processedRecords = req.body.records.map(record => {
      const processed = { ...record };
      
      // Convert date strings to Date objects
      if (record.completionDate) {
        processed.completionDate = new Date(record.completionDate);
      }
      
      if (record.expiryDate) {
        processed.expiryDate = new Date(record.expiryDate);
      }
      
      return processed;
    });
    
    // Calculate stats
    const total = processedRecords.length;
    const completed = processedRecords.filter(r => r.status === 'Completed').length;
    const expired = processedRecords.filter(r => r.status === 'Expired').length;
    
    // Calculate upcoming renewals (within 90 days)
    const now = new Date();
    const ninetyDaysFromNow = new Date(now);
    ninetyDaysFromNow.setDate(now.getDate() + 90);
    
    const upcomingRenewals = processedRecords
      .filter(r => 
        r.expiryDate && 
        new Date(r.expiryDate) > now && 
        new Date(r.expiryDate) <= ninetyDaysFromNow
      )
      .map(r => ({
        employee: r.employee,
        courseTitle: r.courseTitle,
        expiryDate: r.expiryDate
      }));
    
    // Build training data document
    const trainingData = {
      companyId,
      uploadDate: new Date(),
      records: processedRecords,
      compliance: total > 0 ? Math.round((completed / total) * 100) : 0,
      stats: {
        total,
        completed,
        expired,
        upcoming: upcomingRenewals.length
      },
      upcomingRenewals
    };
    
    console.log(`Processed ${total} records with ${completed} completed and ${expired} expired`);
    
    // Create a new training data document
    const newTrainingData = new TrainingData(trainingData);
    
    // Save the new data
    await newTrainingData.save();
    console.log(`Training data saved with ID: ${newTrainingData._id}`);
    
    res.status(201).json({
      message: 'Training data saved successfully',
      id: newTrainingData._id,
      stats: {
        total,
        completed,
        expired,
        upcoming: upcomingRenewals.length
      }
    });
  } catch (error) {
    console.error('Error saving training data:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
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
    // Check if we should include archived records
    const includeArchived = req.query.includeArchived === 'true';
    
    console.log(`Fetching training metrics for company: ${companyId}, includeArchived: ${includeArchived}`);
    
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
    
    // Filter records based on archived status if needed
    let records = trainingData.records || [];
    if (!includeArchived) {
      records = records.filter(record => !record.archived);
    }
    
    // Calculate metrics from non-archived records
    const total = records.length;
    const completed = records.filter(r => r.status === 'Completed').length;
    const expired = records.filter(r => r.status === 'Expired').length;
    
    // Calculate upcoming renewals (similar logic to the saveTrainingData function)
    const now = new Date();
    const ninetyDaysFromNow = new Date(now);
    ninetyDaysFromNow.setDate(now.getDate() + 90);
    
    const upcomingRenewals = records
      .filter(r => 
        r.expiryDate && 
        new Date(r.expiryDate) > now && 
        new Date(r.expiryDate) <= ninetyDaysFromNow
      ).length;
    
    // Extract key metrics
    const metrics = {
      trainingCompliance: total > 0 ? Math.round((completed / total) * 100) : 0,
      upcomingRenewals: upcomingRenewals,
      expiredCertificates: expired,
      totalCertificates: total,
      completedCertificates: completed
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

// Archive a training record
exports.archiveTrainingRecord = async (req, res) => {
  try {
    // Get company ID and record ID from request
    const companyId = req.body.companyId || req.query.companyId || 'default';
    const recordId = req.params.id;
    
    if (!recordId) {
      return res.status(400).json({
        success: false,
        message: 'Record ID is required'
      });
    }
    
    console.log(`Archiving training record ${recordId} for company ${companyId}`);
    
    // Find the most recent training data entry
    const trainingData = await TrainingData.findOne({ companyId }).sort({ createdAt: -1 });
    
    if (!trainingData) {
      return res.status(404).json({
        success: false,
        message: 'No training data found'
      });
    }
    
    // Find the record by its ID
    const recordIndex = trainingData.records.findIndex(record => record._id.toString() === recordId);
    
    if (recordIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Training record not found'
      });
    }
    
    // Set the archived flag to true
    trainingData.records[recordIndex].archived = true;
    
    // Save the updated training data
    await trainingData.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Training record archived successfully'
    });
  } catch (error) {
    console.error('Error archiving training record:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Unarchive a training record
exports.unarchiveTrainingRecord = async (req, res) => {
  try {
    // Get company ID and record ID from request
    const companyId = req.body.companyId || req.query.companyId || 'default';
    const recordId = req.params.id;
    
    if (!recordId) {
      return res.status(400).json({
        success: false,
        message: 'Record ID is required'
      });
    }
    
    console.log(`Unarchiving training record ${recordId} for company ${companyId}`);
    
    // Find the most recent training data entry
    const trainingData = await TrainingData.findOne({ companyId }).sort({ createdAt: -1 });
    
    if (!trainingData) {
      return res.status(404).json({
        success: false,
        message: 'No training data found'
      });
    }
    
    // Find the record by its ID
    const recordIndex = trainingData.records.findIndex(record => record._id.toString() === recordId);
    
    if (recordIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Training record not found'
      });
    }
    
    // Set the archived flag to false
    trainingData.records[recordIndex].archived = false;
    
    // Save the updated training data
    await trainingData.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Training record unarchived successfully'
    });
  } catch (error) {
    console.error('Error unarchiving training record:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// // Extract key metrics
// const metrics = {
//   trainingCompliance: trainingData.compliance || 0,
//   upcomingRenewals: trainingData.stats?.upcoming || 0,
//   expiredCertificates: trainingData.stats?.expired || 0,
//   totalCertificates: trainingData.stats?.total || 0,
//   completedCertificates: trainingData.stats?.completed || 0
// };