import React, { useEffect, useState } from 'react';
import { fetchReports } from '../services/api';

const KPIOverview = ({ metrics, companyName }) => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default KPIs to use when none are available
  const defaultKpis = [
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
    },
  ];

  useEffect(() => {
    const loadKpis = async () => {
      try {
        setLoading(true);
        
        // First check if metrics are passed and have KPIs
        if (metrics && metrics.leading && metrics.leading.kpis && metrics.leading.kpis.length > 0) {
          console.log('Using KPIs from props:', metrics.leading.kpis);
          setKpis(metrics.leading.kpis);
          setLoading(false);
          return;
        }
        
        // If metrics exist but no KPIs, add default KPIs to metrics
        if (metrics) {
          console.log('No KPIs in props, using defaults');
          // Ensure we don't cause side effects on the original metrics object
          if (!metrics.leading) {
            metrics.leading = {};
          }
          metrics.leading.kpis = defaultKpis;
          setKpis(defaultKpis);
          setLoading(false);
          return;
        }

        // Fall back to API if no props
        const reports = await fetchReports();
        console.log('Fetched reports for KPIs:', reports.length);
        
        // Filter by company if specified
        let filteredReports = reports;
        if (companyName) {
          filteredReports = reports.filter(report => report.companyName === companyName);
          console.log(`Filtered to ${filteredReports.length} reports for company: ${companyName}`);
        }
        
        if (filteredReports && filteredReports.length > 0) {
          // Sort reports by date to get the most recent
          filteredReports.sort((a, b) => {
            return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
          });
          
          const mostRecent = filteredReports[0];
          
          // Try different possible locations of KPI data
          if (mostRecent?.metrics?.leading?.kpis && mostRecent.metrics.leading.kpis.length > 0) {
            console.log('Using KPIs from API reports - nested path');
            setKpis(mostRecent.metrics.leading.kpis);
          } else if (mostRecent?.kpis && mostRecent.kpis.length > 0) {
            console.log('Using KPIs from API reports - direct path');
            setKpis(mostRecent.kpis);
          } else {
            console.log('No KPIs in API data, using defaults');
            setKpis(defaultKpis);
          }
        } else {
          console.log('No reports found, using default KPIs');
          setKpis(defaultKpis);
        }
      } catch (error) {
        console.error('Error loading KPIs:', error);
        console.log('Using default KPIs due to error');
        setKpis(defaultKpis);
      } finally {
        setLoading(false);
      }
    };

    loadKpis();
  }, [metrics, companyName]); // Add companyName as dependency to reload when it changes

  // Helper function to determine the color based on how close the actual value is to the target
  const getProgressColor = (actual, target) => {
    const percentage = (actual / target) * 100;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Helper function to determine status text based on values
  const getStatusText = (actual, target) => {
    const percentage = (actual / target) * 100;
    if (percentage >= 90) return 'On Target';
    if (percentage >= 70) return 'Needs Attention';
    return 'Critical';
  };

  // Helper function to get status icon based on values
  const getStatusIcon = (actual, target) => {
    const percentage = (actual / target) * 100;
    if (percentage >= 90) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    } else if (percentage >= 70) {
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
        <div className="h-10 bg-gray-200 mb-4"></div>
        <div className="p-6">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-green-700 to-green-500 text-white">
        <h2 className="text-xl font-semibold">
          Key Performance Indicators
          {companyName && <span className="ml-2 text-green-100">({companyName})</span>}
        </h2>
        <p className="text-sm text-green-100">Tracking safety performance metrics</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {(!kpis || kpis.length === 0) ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No KPI data available</p>
            <p className="text-sm mt-1">Using default values for display purposes.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {kpis.map((kpi, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition duration-200 ease-in-out">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-800">{kpi.name}</h3>
                  <div className="flex items-center">
                    {getStatusIcon(kpi.actual, kpi.target)}
                    <span className="ml-1 text-sm font-medium">{getStatusText(kpi.actual, kpi.target)}</span>
                  </div>
                </div>
                
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-100">
                        Current: {kpi.actual}{kpi.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-gray-600">
                        Target: {kpi.target}{kpi.unit}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                    <div 
                      style={{ width: `${Math.min(100, Math.round((kpi.actual / kpi.target) * 100))}%` }} 
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getProgressColor(kpi.actual, kpi.target)}`}>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {Math.round((kpi.actual / kpi.target) * 100)}% of target
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-sm">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">KPIs are updated on a monthly basis.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPIOverview;