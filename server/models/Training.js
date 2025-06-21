// server/models/Training.js
const mongoose = require('mongoose');

// Schema for individual training record
const TrainingRecordSchema = new mongoose.Schema({
  employee: {
    type: String,
    required: true,
    trim: true
  },
  courseTitle: {
    type: String,
    required: true,
    trim: true
  },
  completionDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Not Started', 'Completed', 'Current', 'Expired', 'Due Soon', 'Valid', 'Renew'],
    default: 'Not Started'
  },
  archived: {
    type: Boolean,
    default: false
  }
});

// Schema for overall training data
const TrainingDataSchema = new mongoose.Schema({
  records: [TrainingRecordSchema],
  compliance: {
    type: Number,
    default: 0
  },
  upcomingRenewals: [{
    employee: String,
    courseTitle: String,
    expirationDate: Date,
    daysRemaining: Number
  }],
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
  companyId: {
    type: String,
    default: 'default',
    index: true  // Add index for faster queries
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const model = mongoose.model('TrainingData', TrainingDataSchema, 'trainings');

module.exports = {
  model,
  TrainingRecordSchema,
  TrainingDataSchema
};