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
    firstAidCount: { type: Number, default: 0 },
    medicalTreatmentCount: { type: Number, default: 0 },
    trainingCompliance: { type: Number, default: 0 },
    riskScore: { type: Number, default: 0 },
    kpis: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Report', ReportSchema);
