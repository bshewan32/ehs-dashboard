// client/src/components/dashboard/MetricsOverview.js
import React, { useEffect } from 'react';

const MetricsOverview = ({ metrics, reports }) => {
  useEffect(() => {
    // Log what we're receiving for debugging
    console.log("MetricsOverview - metrics prop:", metrics);
    console.log("MetricsOverview - reports prop:", reports);
    
    // Let's see what specific values we're trying to access
    if (metrics) {
      console.log("Checking metrics values:");
      console.log("- metrics.lagging:", metrics.lagging);
      console.log("- Incident count:", metrics.lagging?.incidentCount);
      console.log("- Near miss count:", metrics.lagging?.nearMissCount);
      console.log("- First aid count:", metrics.lagging?.firstAidCount);
      console.log("- Medical treatment count:", metrics.lagging?.medicalTreatmentCount);
      console.log("- metrics.leading:", metrics.leading);
      console.log("- Training completed:", metrics.leading?.trainingCompleted);
      console.log("- Inspections completed:", metrics.leading?.inspectionsCompleted);
    }
    
    // Also check the most recent report if available
    if (reports && reports.length > 0) {
      const mostRecent = reports[reports.length - 1];
      console.log("Most recent report metrics:", mostRecent.metrics);
    }
  }, [metrics, reports]);
  
  // If we have no metrics or reports, show loading
  if ((!metrics || Object.keys(metrics).length === 0) && 
      (!reports || reports.length === 0)) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Lagging & Leading Indicators</h2>
        <div className="text-gray-500">Loading metrics data...</div>
      </div>
    );
  }
  
  // Get data from metrics object first, then fall back to most recent report if needed
  let laggingMetrics = {};
  let leadingMetrics = {};
  
  // First, check if metrics has the data
  if (metrics && metrics.lagging) {
    laggingMetrics = metrics.lagging;
  }
  
  if (metrics && metrics.leading) {
    leadingMetrics = metrics.leading;
  }
  
  // If metrics doesn't have complete data but reports does, use that
  if (reports && reports.length > 0) {
    const mostRecent = reports[reports.length - 1];
    
    if (mostRecent && mostRecent.metrics) {
      // Only use report data if metrics data is missing
      if (!laggingMetrics || Object.keys(laggingMetrics).length === 0) {
        laggingMetrics = mostRecent.metrics.lagging || {};
      }
      
      if (!leadingMetrics || Object.keys(leadingMetrics).length === 0) {
        leadingMetrics = mostRecent.metrics.leading || {};
      }
      
      // Also check for legacy flat structure in the report
      if (!laggingMetrics.incidentCount && mostRecent.metrics.totalIncidents !== undefined) {
        laggingMetrics.incidentCount = mostRecent.metrics.totalIncidents;
      }
      
      if (!laggingMetrics.nearMissCount && mostRecent.metrics.totalNearMisses !== undefined) {
        laggingMetrics.nearMissCount = mostRecent.metrics.totalNearMisses;
      }
      
      if (!laggingMetrics.firstAidCount && mostRecent.metrics.firstAidCount !== undefined) {
        laggingMetrics.firstAidCount = mostRecent.metrics.firstAidCount;
      }
      
      if (!laggingMetrics.medicalTreatmentCount && mostRecent.metrics.medicalTreatmentCount !== undefined) {
        laggingMetrics.medicalTreatmentCount = mostRecent.metrics.medicalTreatmentCount;
      }
    }
  }
  
  // Also check for legacy structure in metrics
  if (!laggingMetrics.incidentCount && metrics?.totalIncidents !== undefined) {
    laggingMetrics.incidentCount = metrics.totalIncidents;
  }
  
  if (!laggingMetrics.nearMissCount && metrics?.totalNearMisses !== undefined) {
    laggingMetrics.nearMissCount = metrics.totalNearMisses;
  }
  
  if (!laggingMetrics.firstAidCount && metrics?.firstAidCount !== undefined) {
    laggingMetrics.firstAidCount = metrics.firstAidCount;
  }
  
  if (!laggingMetrics.medicalTreatmentCount && metrics?.medicalTreatmentCount !== undefined) {
    laggingMetrics.medicalTreatmentCount = metrics.medicalTreatmentCount;
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Lagging & Leading Indicators</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <strong>Incidents:</strong> {laggingMetrics.incidentCount ?? '-'}
          <div className="text-xs text-gray-500">
            Type: {typeof laggingMetrics.incidentCount}
          </div>
        </div>
        <div>
          <strong>Near Misses:</strong> {laggingMetrics.nearMissCount ?? '-'}
          <div className="text-xs text-gray-500">
            Type: {typeof laggingMetrics.nearMissCount}
          </div>
        </div>
        <div>
          <strong>First Aid Cases:</strong> {laggingMetrics.firstAidCount ?? '-'}
          <div className="text-xs text-gray-500">
            Type: {typeof laggingMetrics.firstAidCount}
          </div>
        </div>
        <div>
          <strong>Medical Treatments:</strong> {laggingMetrics.medicalTreatmentCount ?? '-'}
          <div className="text-xs text-gray-500">
            Type: {typeof laggingMetrics.medicalTreatmentCount}
          </div>
        </div>
        <div>
          <strong>Training Completed:</strong> {leadingMetrics.trainingCompleted ?? '-'}
          <div className="text-xs text-gray-500">
            Type: {typeof leadingMetrics.trainingCompleted}
          </div>
        </div>
        <div>
          <strong>Inspections Completed:</strong> {leadingMetrics.inspectionsCompleted ?? '-'}
          <div className="text-xs text-gray-500">
            Type: {typeof leadingMetrics.inspectionsCompleted}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsOverview;