import React, { useState, useEffect, useCallback } from 'react';

const MetricsOverview = ({ metrics }) => {
  const [localMetrics, setLocalMetrics] = useState(null);

  // Memoized function to process metrics data
  const processMetrics = useCallback(() => {
    if (metrics) {
      setLocalMetrics(metrics);
    } else {
      // Fallback metrics if none provided
      setLocalMetrics({
        lagging: {
          incidentCount: 0,
          nearMissCount: 0,
          firstAidCount: 0,
          medicalTreatmentCount: 0
        },
        leading: {
          trainingCompleted: 0,
          inspectionsCompleted: 0
        }
      });
    }
  }, [metrics]);

  // Only update local state when metrics prop changes
  useEffect(() => {
    processMetrics();
  }, [processMetrics]);

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
      <h2 className="text-xl font-semibold mb-4">Lagging & Leading Indicators</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <h3 className="text-sm font-medium text-gray-500">Incidents</h3>
          <p className="text-2xl font-bold text-red-700">{incidentCount}</p>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
          <h3 className="text-sm font-medium text-gray-500">Near Misses</h3>
          <p className="text-2xl font-bold text-yellow-700">{nearMissCount}</p>
        </div>
        
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <h3 className="text-sm font-medium text-gray-500">Medical Treatments</h3>
          <p className="text-2xl font-bold text-blue-700">{medicalTreatmentCount}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">First Aid Cases</h3>
          <p className="text-2xl font-bold text-gray-700">{firstAidCount}</p>
        </div>
        
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <h3 className="text-sm font-medium text-gray-500">Training Completed</h3>
          <p className="text-2xl font-bold text-green-700">{trainingCompleted}</p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded border border-purple-200">
          <h3 className="text-sm font-medium text-gray-500">Inspections Completed</h3>
          <p className="text-2xl font-bold text-purple-700">{inspectionsCompleted}</p>
        </div>
      </div>
    </div>
  );
};

export default MetricsOverview;