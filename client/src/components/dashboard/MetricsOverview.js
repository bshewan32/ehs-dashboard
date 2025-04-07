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

  if (!localMetrics) return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

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

  // Helper function to get color based on value
  const getIndicatorColor = (value, type) => {
    if (type === 'incidents' || type === 'medicalTreatments') {
      if (value === 0) return 'text-green-600';
      if (value <= 3) return 'text-yellow-600';
      return 'text-red-600';
    } else if (type === 'nearMisses') {
      if (value >= 10) return 'text-green-600';
      if (value >= 5) return 'text-yellow-600';
      return 'text-red-600'; // Low near miss reporting is concerning
    } else {
      // Training and inspections
      if (value >= 90) return 'text-green-600';
      if (value >= 70) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-500 text-white">
        <h2 className="text-xl font-semibold">
          Safety Indicators
          {companyName && <span className="ml-2 text-blue-100">({companyName})</span>}
        </h2>
        <p className="text-sm text-blue-100">Lagging & leading metrics</p>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Lagging Indicators</h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Incidents
                </span>
                <span className={`font-semibold text-lg ${getIndicatorColor(incidentCount, 'incidents')}`}>
                  {incidentCount}
                </span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Near Misses
                </span>
                <span className={`font-semibold text-lg ${getIndicatorColor(nearMissCount, 'nearMisses')}`}>
                  {nearMissCount}
                </span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  First Aid Cases
                </span>
                <span className="font-semibold text-lg text-gray-800">
                  {firstAidCount}
                </span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Medical Treatments
                </span>
                <span className={`font-semibold text-lg ${getIndicatorColor(medicalTreatmentCount, 'medicalTreatments')}`}>
                  {medicalTreatmentCount}
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Leading Indicators</h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Training Completed
                </span>
                <span className={`font-semibold text-lg ${getIndicatorColor(trainingCompleted, 'training')}`}>
                  {trainingCompleted}%
                </span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Inspections Completed
                </span>
                <span className={`font-semibold text-lg ${getIndicatorColor(inspectionsCompleted, 'inspections')}`}>
                  {inspectionsCompleted}
                </span>
              </li>
            </ul>
            
            {/* Quick trend indicator */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center text-sm">
                <span className="text-gray-600">Incident trend: </span>
                <span className="ml-2 font-medium text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Improving
                </span>
                <span className="ml-auto text-xs text-gray-500">Last 30 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsOverview;