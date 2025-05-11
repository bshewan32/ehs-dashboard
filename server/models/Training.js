// server/models/Training.js
const mongoose = require('mongoose');

// Schema for individual training records
const trainingRecordSchema = new mongoose.Schema({
  employee: { 
    type: String, 
    required: true 
  },
  trainingType: { 
    type: String, 
    required: true 
  },
  completionDate: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  expirationDate: { 
    type: Date
  },
  status: { 
    type: String, 
    required: true
  },
  department: { 
    type: String 
  },
  daysRemaining: {
    type: Number
  }
}, { _id: false });

// Schema for training statistics
const trainingStatsSchema = new mongoose.Schema({
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
}, { _id: false });

// Main training data schema
const trainingDataSchema = new mongoose.Schema({
  companyId: {
    type: String,
    default: 'default',
    index: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  records: [trainingRecordSchema],
  compliance: {
    type: Number,
    required: true,
    default: 0
  },
  upcomingRenewals: [{
    employee: String,
    trainingType: String,
    expirationDate: Date,
    daysRemaining: Number
  }],
  stats: trainingStatsSchema
}, { timestamps: true });

module.exports = mongoose.model('Training', trainingDataSchema);