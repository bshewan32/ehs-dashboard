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
const TrainingData = mongoose.models.TrainingData || mongoose.model('TrainingData', TrainingSchema, 'trainings');

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
    
    // Extract and validate records
    const records = extractAndValidateRecords(req.body);
    if (!records.isValid) {
      return res.status(400).json({
        message: records.message,
        ...(records.invalidCount && { invalidCount: records.invalidCount })
      });
    }

    // Process records with standardized formatting
    const { processedRecords, upcomingRenewals } = processRecords(records.data);

    // Calculate statistics
    const stats = calculateStats(processedRecords, upcomingRenewals);

    // Build and save training data document
    const trainingData = {
      companyId,
      uploadDate: new Date(),
      records: processedRecords,
      compliance: stats.compliance,
      stats: stats,
      upcomingRenewals
    };

    const newTrainingData = await TrainingData.create(trainingData);
    
    console.log(`Training data saved with ID: ${newTrainingData._id}`, {
      totalRecords: stats.total,
      completed: stats.completed,
      expired: stats.expired,
      upcoming: stats.upcoming
    });

    return res.status(201).json({
      success: true,
      message: 'Training data saved successfully',
      id: newTrainingData._id,
      stats,
      recordCount: processedRecords.length
    });

  } catch (error) {
    console.error('Error saving training data:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper functions

const extractAndValidateRecords = (body) => {
  // Handle both array input and object with records property
  const records = Array.isArray(body.records) 
    ? body.records 
    : Array.isArray(body) ? body : [];

  if (records.length === 0) {
    return { isValid: false, message: 'No valid records provided' };
  }

  // Validate required fields
  const invalidRecords = records.filter(
    record => !record.employee || !record.courseTitle
  );

  if (invalidRecords.length > 0) {
    console.error(`Found ${invalidRecords.length} invalid records`);
    return { 
      isValid: false, 
      message: 'Invalid records: each record must have employee and courseTitle',
      invalidCount: invalidRecords.length
    };
  }

  return { isValid: true, data: records };
};

const processRecords = (records) => {
  const now = new Date();
  const ninetyDaysFromNow = new Date(now);
  ninetyDaysFromNow.setDate(now.getDate() + 90);

  const processedRecords = records.map(record => {
    // Standardize record format
    const processedRecord = {
      employee: String(record.employee || '').trim(),
      courseTitle: String(record.courseTitle || '').trim(),
      status: ['Completed', 'Expired', 'In Progress'].includes(record.status) 
        ? record.status 
        : 'Completed',
      department: String(record.department || '').trim(),
      assignedBy: String(record.assignedBy || '').trim(),
      notes: String(record.notes || '').trim()
    };

    // Process dates
    processedRecord.completionDate = record.completionDate 
      ? new Date(record.completionDate)
      : null;
      
    processedRecord.expiryDate = record.expiryDate 
      ? new Date(record.expiryDate)
      : null;

    return processedRecord;
  });

  // Calculate upcoming renewals
  const upcomingRenewals = processedRecords
    .filter(r => 
      r.expiryDate && 
      r.expiryDate > now && 
      r.expiryDate <= ninetyDaysFromNow
    )
    .map(r => ({
      employee: r.employee,
      courseTitle: r.courseTitle,
      expiryDate: r.expiryDate
    }));

  return { processedRecords, upcomingRenewals };
};

const calculateStats = (records, upcomingRenewals) => {
  const total = records.length;
  const completed = records.filter(r => r.status === 'Completed').length;
  const expired = records.filter(r => r.status === 'Expired').length;
  const compliance = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    expired,
    upcoming: upcomingRenewals.length,
    compliance
  };
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


