import React, { useState, useEffect, useCallback } from 'react';
import { fetchInspections } from '../services/api';

const MetricsOverview = ({ metrics }) => {
  const [localMetrics, setLocalMetrics] = useState(null);
  const [inspectionsCount, setInspectionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the actual inspections count from the API
  useEffect(() => {
    const loadInspectionsCount = async () => {
      try {
        setLoading(true);
        const inspections = await fetchInspections();
        setInspectionsCount(inspections.length);
        setError(null);
      } catch (error) {
        console.error('Error fetching inspections count:', error);
        setError('Failed to load inspections count');
        // Keep the default value if there's an error
      } finally {
        setLoading(false);
      }
    };
    
    loadInspectionsCount();
    
    // Set up a refresh interval (every 2 minutes)
    const intervalId = setInterval(loadInspectionsCount, 120000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

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
        trainingCompliance: 0,
        riskScore: 0
      });
    }
  }, [metrics]);

  // Only update local state when metrics prop changes
  useEffect(() => {
    processMetrics();
  }, [processMetrics]);

  if (!localMetrics) return <div className="p-4 bg-white rounded shadow text-center">Loading metrics...</div>;

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
  
  // For risk score, check both potential locations
  const riskScore = localMetrics.riskScore ?? 0;

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
          <h3 className="text-sm font-medium text-gray-500">Training Compliance</h3>
          <p className="text-2xl font-bold text-green-700">{trainingCompleted}%</p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded border border-purple-200">
          <h3 className="text-sm font-medium text-gray-500">Inspections Completed</h3>
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-purple-700">Loading...</span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-purple-700">{inspectionsCount}</p>
          )}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>
      
      {/* Optional: Add Risk Score Metric */}
      {riskScore > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1">
            <div className="bg-orange-50 p-3 rounded border border-orange-200">
              <h3 className="text-sm font-medium text-gray-500">Average Risk Score</h3>
              <p className="text-2xl font-bold text-orange-700">{riskScore}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsOverview;