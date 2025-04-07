import React, { useEffect, useState } from 'react';
import { fetchReports } from '../services/api';

const MetricsOverview = ({ metrics, companyName }) => {
  const [localMetrics, setLocalMetrics] = useState(null);

  useEffect(() => {
    // If metrics are passed as props, use them
    if (metrics) {
      setLocalMetrics(metrics);
      return;
    }

    // Otherwise fetch from API
    const getMetrics = async () => {
      try {
        const reports = await fetchReports();
        
        // Filter by company name if provided
        let filteredReports = reports;
        if (companyName) {
          filteredReports = reports.filter(report => report.companyName === companyName);
        }
        
        // Use the most recent report
        const mostRecent = filteredReports.length > 0 
          ? filteredReports[filteredReports.length - 1] 
          : null;
          
        setLocalMetrics(mostRecent?.metrics || {});
      } catch (err) {
        console.error('Error loading metrics:', err);
      }
    };

    getMetrics();
  }, [metrics, companyName]);

  if (!localMetrics) return <div>Loading metrics...</div>;

  // Safely access nested properties
  const incidentCount = localMetrics.lagging?.incidentCount ?? 
                        localMetrics.totalIncidents ?? 0;
  const nearMissCount = localMetrics.lagging?.nearMissCount ?? 
                        localMetrics.totalNearMisses ?? 0;
  const firstAidCount = localMetrics.lagging?.firstAidCount ?? 
                        localMetrics.firstAidCount ?? 0;
  const medicalTreatmentCount = localMetrics.lagging?.medicalTreatmentCount ?? 
                               localMetrics.medicalTreatmentCount ?? 0;
  
  // Safely access leading indicators
  const trainingCompleted = localMetrics.leading?.trainingCompleted ?? 
                            localMetrics.trainingCompliance ?? 0;
  const inspectionsCompleted = localMetrics.leading?.inspectionsCompleted ?? 0;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">
        Lagging & Leading Indicators
        {companyName && <span className="text-blue-600 ml-2">({companyName})</span>}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div><strong>Incidents:</strong> {incidentCount}</div>
        <div><strong>Near Misses:</strong> {nearMissCount}</div>
        <div><strong>First Aid Cases:</strong> {firstAidCount}</div>
        <div><strong>Medical Treatments:</strong> {medicalTreatmentCount}</div>
        <div><strong>Training Completed:</strong> {trainingCompleted}</div>
        <div><strong>Inspections Completed:</strong> {inspectionsCompleted}</div>
      </div>
    </div>
  );
};

export default MetricsOverview;