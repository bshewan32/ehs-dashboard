// server/models/Training.js
const mongoose = require('mongoose');

const trainingRecordSchema = new mongoose.Schema({
  employeeName: { 
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
  expiryDate: { 
    type: Date
  },
  status: { 
    type: String, 
    enum: ['Completed', 'Expired', 'Due Soon'],
    required: true
  },
  department: { 
    type: String 
  },
  companyName: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Training', trainingRecordSchema);