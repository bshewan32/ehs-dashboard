const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// GET /metrics/summary
router.get('/metrics/summary', async (req, res) => {
  try {
    const reports = await Report.find();

    let summary = {
      totalIncidents: 0,
      totalNearMisses: 0,
      firstAidCount: 0,
      medicalTreatmentCount: 0,
      trainingCompliance: 0,
      riskScore: 0,
      kpis: [],
      aiRecommendations: [] // This can be filled by AI logic later
    };

    reports.forEach((report) => {
      const metrics = report.metrics || {};
      summary.totalIncidents += metrics.totalIncidents || 0;
      summary.totalNearMisses += metrics.totalNearMisses || 0;
      summary.firstAidCount += metrics.firstAidCount || 0;
      summary.medicalTreatmentCount += metrics.medicalTreatmentCount || 0;
      summary.trainingCompliance += metrics.trainingCompliance || 0;
      summary.riskScore += metrics.riskScore || 0;

      if (Array.isArray(metrics.kpis)) {
        summary.kpis.push(...metrics.kpis);
      }
    });

    // Average values where appropriate
    const reportCount = reports.length;
    if (reportCount > 0) {
      summary.trainingCompliance = +(summary.trainingCompliance / reportCount).toFixed(1);
      summary.riskScore = +(summary.riskScore / reportCount).toFixed(1);
    }

    res.json(summary);
  } catch (err) {
    console.error('Error generating metrics summary:', err);
    res.status(500).json({ message: 'Failed to generate summary.' });
  }
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
