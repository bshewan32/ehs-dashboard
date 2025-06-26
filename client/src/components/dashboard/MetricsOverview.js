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
          medicalTreatmentCount: 0,
          lostTimeInjuryCount: 0
        }
      });
    }
  }, [metrics]);

  // Only update local state when metrics prop changes
  useEffect(() => {
    processMetrics();
  }, [processMetrics]);

  if (!localMetrics) return <div>Loading metrics...</div>;

  // Safely access nested properties for lagging indicators
  const incidentCount = localMetrics.lagging?.incidentCount ?? 
                        localMetrics.totalIncidents ?? 0;
  const nearMissCount = localMetrics.lagging?.nearMissCount ?? 
                        localMetrics.totalNearMisses ?? 0;
  const firstAidCount = localMetrics.lagging?.firstAidCount ?? 
                        localMetrics.firstAidCount ?? 0;
  const medicalTreatmentCount = localMetrics.lagging?.medicalTreatmentCount ?? 
                               localMetrics.medicalTreatmentCount ?? 0;
  const lostTimeInjuryCount = localMetrics.lagging?.lostTimeInjuryCount ?? 
                             localMetrics.lostTimeInjuryCount ?? 0;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Lagging Indicators</h2>
      <p className="text-sm text-gray-600 mb-4">Safety incidents and events that have already occurred</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Incidents</h3>
              <p className="text-2xl font-bold text-red-700">{incidentCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Near Misses</h3>
              <p className="text-2xl font-bold text-yellow-700">{nearMissCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-gray-500">First Aid Cases</h3>
              <p className="text-2xl font-bold text-orange-700">{firstAidCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Medical Treatments</h3>
              <p className="text-2xl font-bold text-blue-700">{medicalTreatmentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Lost Time Injuries</h3>
              <p className="text-2xl font-bold text-purple-700">{lostTimeInjuryCount}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Training compliance and inspection data are displayed in the dedicated widgets below.</p>
      </div>
    </div>
  );
};

export default MetricsOverview;