const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema({
  issue: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  resolved: { type: Boolean, default: false },
});

const inspectionSchema = new mongoose.Schema({
  inspector: { type: String, required: true },
  date: { type: Date, default: Date.now },
  location: { type: String, required: true },
  type: { type: String, required: true },
  findings: [findingSchema],
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Inspection', inspectionSchema);
