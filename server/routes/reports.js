// server/routes/reports.js
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

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
 * @route   POST /api/reports
 * @desc    Create a new report
 * @access  Private (if using auth middleware)
 */
router.post('/', async (req, res) => {
  try {
    // Log the incoming request body for debugging
    console.log('Received report submission:', JSON.stringify(req.body, null, 2));
    
    // Create a new report from the request body
    const newReport = new Report(req.body);
    
    // Save the report to the database
    const savedReport = await newReport.save();
    
    // Log the saved report
    console.log('Successfully saved report:', savedReport._id);
    
    // Return success response
    res.status(201).json({ 
      message: 'Report created successfully', 
      reportId: savedReport._id 
    });
  } catch (err) {
    console.error('Error creating report:', err);
    
    // Check for validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(err.errors).map(e => e.message) 
      });
    }
    
    // Return general server error
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
    
    // Clone the metrics from the latest report
    let metrics = JSON.parse(JSON.stringify(latestReport.metrics || {}));
    
    // Ensure the structure is complete
    if (!metrics.lagging) {
      metrics.lagging = {
        incidentCount: 0,
        nearMissCount: 0,
        firstAidCount: 0,
        medicalTreatmentCount: 0,
        lostTimeInjuryCount: 0
      };
    }
    
    if (!metrics.leading) {
      metrics.leading = {
        trainingCompleted: 0,
        inspectionsCompleted: 0,
        kpis: []
      };
    } else if (!metrics.leading.kpis) {
      metrics.leading.kpis = [];
    }
    
    // If KPIs exist at top level, move them to the leading.kpis array
    if (Array.isArray(metrics.kpis) && metrics.kpis.length > 0) {
      metrics.leading.kpis = metrics.kpis;
      delete metrics.kpis;
    }
    
    // Log what we're returning
    console.log('Returning metrics summary:');
    console.log('- KPIs:', metrics.leading.kpis);
    
    // Return the structured metrics
    res.json(metrics);
  } catch (err) {
    console.error('Error fetching metrics summary:', err.message);
    res.status(500).json({ message: 'Server error' });
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