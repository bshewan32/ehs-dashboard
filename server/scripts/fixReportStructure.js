// server/scripts/fixReportStructure.js
require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('../models/Report');

// Get MongoDB URI explicitly from process.env
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('ERROR: MONGODB_URI environment variable is not set.');
  console.error('Make sure your .env file contains the MongoDB connection string.');
  process.exit(1);
}

// Function to fix report structure
async function fixReportStructure() {
  try {
    // Connect to MongoDB directly using the URI from .env
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas successfully');
    
    // Find all reports
    const reports = await Report.find({});
    console.log(`Found ${reports.length} reports to check`);
    
    let fixedCount = 0;
    
    // Process each report
    for (const report of reports) {
      let needsUpdate = false;
      
      console.log(`Checking report ID: ${report._id}`);
      console.log('Current metrics structure:', JSON.stringify(report.metrics, null, 2));
      
      // Make sure metrics exists
      if (!report.metrics) {
        report.metrics = {};
        needsUpdate = true;
      }
      
      // Fix lagging metrics structure
      if (!report.metrics.lagging) {
        report.metrics.lagging = {
          incidentCount: report.metrics.totalIncidents || 0,
          nearMissCount: report.metrics.totalNearMisses || 0,
          firstAidCount: report.metrics.firstAidCount || 0,
          medicalTreatmentCount: report.metrics.medicalTreatmentCount || 0,
          lostTimeInjuryCount: 0
        };
        needsUpdate = true;
      }
      
      // Fix leading metrics structure
      if (!report.metrics.leading) {
        report.metrics.leading = {
          trainingCompleted: 0,
          inspectionsCompleted: 0,
          kpis: []
        };
        needsUpdate = true;
      }
      
      // Move misplaced KPIs array if it exists
      if (Array.isArray(report.metrics.kpis)) {
        console.log(`Found misplaced KPIs in report ${report._id}:`, report.metrics.kpis);
        
        if (!report.metrics.leading) {
          report.metrics.leading = {};
        }
        
        report.metrics.leading.kpis = report.metrics.kpis;
        // Remove the incorrectly placed array
        delete report.metrics.kpis;
        needsUpdate = true;
      }
      
      // Make sure the leading.kpis array exists
      if (!report.metrics.leading.kpis) {
        report.metrics.leading.kpis = [];
        needsUpdate = true;
      }
      
      // Save changes if needed
      if (needsUpdate) {
        console.log(`Fixing report: ${report._id} (${report.reportPeriod || 'unknown period'})`);
        console.log('Updated metrics structure:', JSON.stringify(report.metrics, null, 2));
        await report.save();
        fixedCount++;
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} reports successfully`);
  } catch (err) {
    console.error('❌ Error fixing reports:', err);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the fix function
fixReportStructure()
  .catch(err => {
    console.error('Script execution failed:', err);
  })
  .finally(() => {
    console.log('Script completed');
  });