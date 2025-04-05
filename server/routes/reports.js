const express = require('express');
const router = express.Router();

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
router.post('/', (req, res) => {
  console.log('Received new report:', req.body);
  res.status(201).json({ message: 'Report received and logged.' });
});

module.exports = router;
