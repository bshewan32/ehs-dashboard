// server/scripts/migrateReportData.js
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

// Function to migrate report data from old structure to new structure
async function migrateReportData() {
  try {
    // Connect to MongoDB directly using the URI from .env
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas successfully');
    
    // Find all reports
    const reports = await Report.find({});
    console.log(`Found ${reports.length} reports to check`);
    
    let migratedCount = 0;
    
    // Process each report
    for (const report of reports) {
      let needsUpdate = false;
      
      console.log(`Checking report ID: ${report._id}`);
      
      // 1. Move totalIncidents to lagging.incidentCount if not already set
      if (report.metrics.totalIncidents !== undefined && 
          (!report.metrics.lagging.incidentCount || report.metrics.lagging.incidentCount === 0)) {
        report.metrics.lagging.incidentCount = report.metrics.totalIncidents;
        needsUpdate = true;
      }
      
      // 2. Move totalNearMisses to lagging.nearMissCount if not already set
      if (report.metrics.totalNearMisses !== undefined && 
          (!report.metrics.lagging.nearMissCount || report.metrics.lagging.nearMissCount === 0)) {
        report.metrics.lagging.nearMissCount = report.metrics.totalNearMisses;
        needsUpdate = true;
      }
      
      // 3. Move firstAidCount to lagging.firstAidCount if not already set
      if (report.metrics.firstAidCount !== undefined && 
          (!report.metrics.lagging.firstAidCount || report.metrics.lagging.firstAidCount === 0)) {
        report.metrics.lagging.firstAidCount = report.metrics.firstAidCount;
        needsUpdate = true;
      }
      
      // 4. Move medicalTreatmentCount to lagging.medicalTreatmentCount if not already set
      if (report.metrics.medicalTreatmentCount !== undefined && 
          (!report.metrics.lagging.medicalTreatmentCount || report.metrics.lagging.medicalTreatmentCount === 0)) {
        report.metrics.lagging.medicalTreatmentCount = report.metrics.medicalTreatmentCount;
        needsUpdate = true;
      }
      
      // 5. Check for KPIs array at top level and move to leading.kpis if not empty
      if (Array.isArray(report.metrics.kpis) && report.metrics.kpis.length > 0 &&
          (!Array.isArray(report.metrics.leading.kpis) || report.metrics.leading.kpis.length === 0)) {
        report.metrics.leading.kpis = report.metrics.kpis;
        needsUpdate = true;
      }
      
      // 6. Create default KPIs if none exist
      if (!Array.isArray(report.metrics.leading.kpis) || report.metrics.leading.kpis.length === 0) {
        // Create default KPIs
        report.metrics.leading.kpis = [
          {
            id: 'nearMissRate',
            name: 'Near Miss Reporting Rate',
            actual: 0,
            target: 100,
            unit: '%'
          },
          {
            id: 'criticalRiskVerification',
            name: 'Critical Risk Control Verification',
            actual: 0,
            target: 95,
            unit: '%'
          },
          {
            id: 'electricalSafetyCompliance',
            name: 'Electrical Safety Compliance',
            actual: 0,
            target: 100,
            unit: '%'
          }
        ];
        needsUpdate = true;
      }
      
      // Update the report if needed
      if (needsUpdate) {
        console.log('Migrating data from old structure to new structure:');
        console.log('Before:', JSON.stringify(report.metrics, null, 2));
        
        // Remove old fields now that they've been migrated to the new structure
        delete report.metrics.totalIncidents;
        delete report.metrics.totalNearMisses;
        delete report.metrics.firstAidCount;
        delete report.metrics.medicalTreatmentCount;
        delete report.metrics.kpis;
        
        console.log('After:', JSON.stringify(report.metrics, null, 2));
        
        await report.save();
        migratedCount++;
      } else {
        console.log('No migration needed for this report');
      }
    }
    
    console.log(`✅ Migrated ${migratedCount} reports successfully`);
  } catch (err) {
    console.error('❌ Error migrating reports:', err);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the migration function
migrateReportData()
  .catch(err => {
    console.error('Script execution failed:', err);
  })
  .finally(() => {
    console.log('Script completed');
  });