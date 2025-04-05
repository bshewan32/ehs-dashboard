const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// GET /metrics/summary
router.get('/metrics/summary', (req, res) => {
  res.json({
    totalIncidents: 5,
    totalNearMisses: 3,
    firstAidCount: 1,
    medicalTreatmentCount: 2,
    trainingCompliance: 92,
    riskScore: 4.3,
    kpis: [
      {
        name: 'Near Miss Reporting Rate',
        description: 'Number of near misses reported per 100,000 hrs worked',
        target: 10,
        actual: 6,
        unit: 'per 100K hrs'
      },
      {
        name: 'Critical Risk Verification',
        description: 'Percentage of critical risk tasks verified',
        target: 100,
        actual: 85,
        unit: '%'
      },
      {
        name: 'Electrical Safety Compliance',
        description: 'Compliance with electrical work requirements',
        target: 100,
        actual: 95,
        unit: '%'
      }
    ],
    aiRecommendations: [
      'Increase near miss reporting in high-risk areas.',
      'Review electrical safety training for gaps.',
      'Audit critical risk tasks more frequently.'
    ]
  });
});

// POST /
router.post('/', async (req, res) => {
  try {
    const newReport = new Report(req.body);
    await newReport.save();
    console.log('✅ Report saved to MongoDB');
    res.status(201).json({ message: 'Report saved to database.' });
  } catch (error) {
    console.error('❌ Error saving report:', error);
    res.status(500).json({ message: 'Failed to save report.' });
  }
});

// GET /api/reports - Fetch all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ message: 'Failed to fetch reports.' });
  }
});

module.exports = router;
