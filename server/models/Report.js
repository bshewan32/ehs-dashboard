// server/models/Report.js
const mongoose = require('mongoose');

// KPI Schema (sub-document)
const KpiSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  actual: {
    type: Number,
    default: 0
  },
  target: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: '%'
  }
});

// Report Schema
const ReportSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  reportPeriod: {
    type: String,
    required: true
  },
  reportType: {
    type: String,
    required: true,
    enum: ['Monthly', 'Quarterly', 'Annual']
  },
  metrics: {
    lagging: {
      incidentCount: {
        type: Number,
        default: 0
      },
      nearMissCount: {
        type: Number,
        default: 0
      },
      firstAidCount: {
        type: Number,
        default: 0
      },
      medicalTreatmentCount: {
        type: Number,
        default: 0
      },
      lostTimeInjuryCount: {
        type: Number,
        default: 0
      }
    },
    leading: {
      trainingCompleted: {
        type: Number,
        default: 0
      },
      inspectionsCompleted: {
        type: Number,
        default: 0
      },
      kpis: [KpiSchema]
    },
    trainingCompliance: {
      type: Number,
      default: 0
    },
    riskScore: {
      type: Number,
      default: 0
    }
    // Add any other metrics fields here
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
ReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Report', ReportSchema);

// const mongoose = require('mongoose');

// const ReportSchema = new mongoose.Schema({
//   companyName: {
//     type: String,
//     required: true,
//   },
//   reportPeriod: {
//     type: String,
//     required: true,
//   },
//   reportType: {
//     type: String,
//     required: true,
//     enum: ['Monthly', 'Quarterly', 'Annual'],
//   },
//   metrics: {
//     totalIncidents: { type: Number, default: 0 },
//     totalNearMisses: { type: Number, default: 0 },
//     firstAidCount: { type: Number, default: 0 },
//     medicalTreatmentCount: { type: Number, default: 0 },
//     trainingCompliance: { type: Number, default: 0 },
//     riskScore: { type: Number, default: 0 },
//     kpis: { type: [mongoose.Schema.Types.Mixed], default: [] }
//   },
// }, {
//   timestamps: true,
// });

// module.exports = mongoose.model('Report', ReportSchema);
