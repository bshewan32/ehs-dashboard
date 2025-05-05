// client/src/components/dashboard/MetricsOverview.js
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
        },
        periodLabel: 'Current Month'
      });
    }
  }, [metrics]);

  // Only update local state when metrics prop changes
  useEffect(() => {
    processMetrics();
  }, [processMetrics]);

  if (!localMetrics) return <div>Loading metrics...</div>;

  // Safely access nested properties
  const incidentCount = localMetrics.lagging?.incidentCount ?? 0;
  const nearMissCount = localMetrics.lagging?.nearMissCount ?? 0;
  const firstAidCount = localMetrics.lagging?.firstAidCount ?? 0;
  const medicalTreatmentCount = localMetrics.lagging?.medicalTreatmentCount ?? 0;
  const lostTimeInjuryCount = localMetrics.lagging?.lostTimeInjuryCount ?? 0;
  
  // Safely access leading indicators
  const trainingCompleted = localMetrics.leading?.trainingCompleted ?? 0;
  const inspectionsCompleted = localMetrics.leading?.inspectionsCompleted ?? 0;
  const trainingCompliance = localMetrics.trainingCompliance ?? 0;
  const riskScore = localMetrics.riskScore ?? 0;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">
        Safety Metrics for {localMetrics.periodLabel || 'Current Period'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700 border-b pb-2">
            Lagging Indicators
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <h4 className="text-sm font-medium text-gray-500">Incidents</h4>
              <p className="text-2xl font-bold text-red-700">{incidentCount}</p>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <h4 className="text-sm font-medium text-gray-500">Near Misses</h4>
              <p className="text-2xl font-bold text-yellow-700">{nearMissCount}</p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <h4 className="text-sm font-medium text-gray-500">First Aid Cases</h4>
              <p className="text-2xl font-bold text-blue-700">{firstAidCount}</p>
            </div>
            
            <div className="bg-purple-50 p-3 rounded border border-purple-200">
              <h4 className="text-sm font-medium text-gray-500">Medical Treatments</h4>
              <p className="text-2xl font-bold text-purple-700">{medicalTreatmentCount}</p>
            </div>
            
            <div className="bg-red-50 p-3 rounded border border-red-300">
              <h4 className="text-sm font-medium text-gray-500">Lost Time Injuries</h4>
              <p className="text-2xl font-bold text-red-800">{lostTimeInjuryCount}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700 border-b pb-2">
            Leading Indicators
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <h4 className="text-sm font-medium text-gray-500">Training Completed</h4>
              <p className="text-2xl font-bold text-green-700">{trainingCompleted}</p>
            </div>
            
            <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
              <h4 className="text-sm font-medium text-gray-500">Inspections Completed</h4>
              <p className="text-2xl font-bold text-indigo-700">{inspectionsCompleted}</p>
            </div>
            
            <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
              <h4 className="text-sm font-medium text-gray-500">Training Compliance</h4>
              <p className="text-2xl font-bold text-emerald-700">{trainingCompliance}%</p>
            </div>
            
            <div className="bg-amber-50 p-3 rounded border border-amber-200">
              <h4 className="text-sm font-medium text-gray-500">Risk Score</h4>
              <p className="text-2xl font-bold text-amber-700">{riskScore}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-2 border-t text-xs text-gray-500">
        {localMetrics.periodType === 'ytd' ? 
          'Year to date metrics reflect cumulative values from all reports submitted in the current calendar year.' : 
          localMetrics.periodType === 'lastYear' ? 
            'Previous year metrics reflect cumulative values from all reports submitted last calendar year.' : 
            'Current month metrics reflect the most recent report data.'}
      </div>
    </div>
  );
};

export default MetricsOverview;