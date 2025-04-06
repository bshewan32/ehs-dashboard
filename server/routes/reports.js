// server/routes/reports.js
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/reports
 * @desc    Get all reports
 * @access  Private (if using auth middleware)
 */
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reports/metrics/summary
 * @desc    Get summary metrics from most recent report
 * @access  Private (if using auth middleware)
 */
router.get('/metrics/summary', async (req, res) => {
  try {
    // Get the most recent report
    const latestReport = await Report.findOne().sort({ createdAt: -1 });
    
    if (!latestReport) {
      return res.status(404).json({ message: 'No reports found' });
    }
    
    // Ensure metrics has the right structure before returning
    const metrics = latestReport.metrics || {};
    
    // Make sure leading.kpis exists and is accessible
    if (!metrics.leading) {
      metrics.leading = {};
    }
    
    if (!metrics.leading.kpis) {
      metrics.leading.kpis = [];
    }
    
    // Log the KPIs for debugging
    console.log('KPIs in metrics summary:', metrics.leading.kpis);
    
    // Return the structured metrics
    res.json(metrics);
  } catch (err) {
    console.error('Error fetching metrics summary:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/reports
 * @desc    Create a new report
 * @access  Private (if using auth middleware)
 */
router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      reportPeriod,
      reportType,
      metrics
    } = req.body;

    // Validate required fields
    if (!companyName || !reportPeriod || !reportType) {
      return res.status(400).json({ message: 'Please include all required fields' });
    }

    // Create new report with proper structure
    const newReport = new Report({
      companyName,
      reportPeriod,
      reportType,
      metrics: {
        // Ensure metrics has proper structure even if some fields are missing
        lagging: {
          incidentCount: metrics?.lagging?.incidentCount || 0,
          nearMissCount: metrics?.lagging?.nearMissCount || 0,
          firstAidCount: metrics?.lagging?.firstAidCount || 0,
          medicalTreatmentCount: metrics?.lagging?.medicalTreatmentCount || 0,
          lostTimeInjuryCount: metrics?.lagging?.lostTimeInjuryCount || 0
        },
        leading: {
          trainingCompleted: metrics?.leading?.trainingCompleted || 0,
          inspectionsCompleted: metrics?.leading?.inspectionsCompleted || 0,
          kpis: metrics?.leading?.kpis || []
        },
        // Handle flat metrics fields
        trainingCompliance: metrics?.trainingCompliance || 0,
        riskScore: metrics?.riskScore || 0
      }
    });

    // Save to database
    const savedReport = await newReport.save();
    res.status(201).json({ 
      message: 'Report created successfully', 
      report: savedReport 
    });
  } catch (err) {
    console.error('Error creating report:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * @route   GET /api/reports/:id
 * @desc    Get report by ID
 * @access  Private (if using auth middleware)
 */
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json(report);
  } catch (err) {
    console.error('Error fetching report:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const Report = require('../models/Report');

// // GET /metrics/summary
// router.get('/metrics/summary', async (req, res) => {
//   try {
//     const reports = await Report.find();

//     let summary = {
//       totalIncidents: 0,
//       totalNearMisses: 0,
//       firstAidCount: 0,
//       medicalTreatmentCount: 0,
//       trainingCompliance: 0,
//       riskScore: 0,
//       kpis: [],
//       aiRecommendations: [] // This can be filled by AI logic later
//     };

//     reports.forEach((report) => {
//       const metrics = report.metrics || {};
//       summary.totalIncidents += metrics.totalIncidents || 0;
//       summary.totalNearMisses += metrics.totalNearMisses || 0;
//       summary.firstAidCount += metrics.firstAidCount || 0;
//       summary.medicalTreatmentCount += metrics.medicalTreatmentCount || 0;
//       summary.trainingCompliance += metrics.trainingCompliance || 0;
//       summary.riskScore += metrics.riskScore || 0;

//       if (Array.isArray(metrics.kpis)) {
//         summary.kpis.push(...metrics.kpis);
//       }
//     });

//     // Average values where appropriate
//     const reportCount = reports.length;
//     if (reportCount > 0) {
//       summary.trainingCompliance = +(summary.trainingCompliance / reportCount).toFixed(1);
//       summary.riskScore = +(summary.riskScore / reportCount).toFixed(1);
//     }

//     res.json(summary);
//   } catch (err) {
//     console.error('Error generating metrics summary:', err);
//     res.status(500).json({ message: 'Failed to generate summary.' });
//   }
// });

// // POST /
// router.post('/', async (req, res) => {
//   try {
//     const newReport = new Report(req.body);
//     await newReport.save();
//     console.log('✅ Report saved to MongoDB');
//     res.status(201).json({ message: 'Report saved to database.' });
//   } catch (error) {
//     console.error('❌ Error saving report:', error);
//     res.status(500).json({ message: 'Failed to save report.' });
//   }
// });

// // GET /api/reports - Fetch all reports
// router.get('/', async (req, res) => {
//   try {
//     const reports = await Report.find().sort({ createdAt: -1 });
//     res.json(reports);
//   } catch (err) {
//     console.error('Error fetching reports:', err);
//     res.status(500).json({ message: 'Failed to fetch reports.' });
//   }
// });

// module.exports = router;
