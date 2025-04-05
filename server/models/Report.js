const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  reportPeriod: {
    type: String,
    required: true,
  },
  reportType: {
    type: String,
    required: true,
    enum: ['Monthly', 'Quarterly', 'Annual'],
  },
  metrics: {
    totalIncidents: { type: Number, default: 0 },
    totalNearMisses: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Report', ReportSchema);
