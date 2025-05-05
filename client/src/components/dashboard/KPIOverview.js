// client/src/components/dashboard/KPIOverview.js
import React, { useState, useEffect, useCallback } from 'react';

const KPIOverview = ({ metrics }) => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Current Month');

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

  // Use a memoized function to process KPIs to avoid unnecessary re-runs
  const processKPIs = useCallback(() => {
    setLoading(true);
    
    // Get period label if available
    if (metrics?.periodLabel) {
      setPeriod(metrics.periodLabel);
    }
    
    // First check if metrics are passed and have KPIs
    if (metrics?.leading?.kpis && metrics.leading.kpis.length > 0) {
      console.log('Using KPIs from props:', metrics.leading.kpis);
      setKpis(metrics.leading.kpis);
      setLoading(false);
      return;
    }
    
    // If metrics exist but no KPIs, use default KPIs
    console.log('No KPIs in props, using defaults');
    setKpis(defaultKpis);
    setLoading(false);
  }, [metrics, defaultKpis]);

  useEffect(() => {
    processKPIs();
  }, [processKPIs]);

  // Render a loading state while we're getting data
  if (loading) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">KPI Metrics</h2>
        <p className="text-gray-600 italic">Loading KPI data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Key Performance Indicators</h2>
      <h3 className="text-sm font-medium text-gray-500 mb-4">{period}</h3>
      
      {(!kpis || kpis.length === 0) ? (
        <p className="text-gray-600 italic">No KPI data available. Using default values.</p>
      ) : (
        <div className="space-y-6">
          {kpis.map((kpi, index) => (
            <div key={index} className="relative">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">{kpi.name}</span>
                <span className="text-gray-600">
                  {kpi.actual} / {kpi.target} {kpi.unit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getColorByCompletion(kpi.actual, kpi.target)}`} 
                  style={{ width: `${Math.min(100, (kpi.actual / kpi.target) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>0 {kpi.unit}</span>
                <span>Target: {kpi.target} {kpi.unit}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {getCompletionStatus(kpi.actual, kpi.target)}
              </div>
            </div>
          ))}
          
          <div className="mt-6 pt-2 border-t text-xs text-gray-600">
            <p className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {metrics?.periodType === 'ytd' ? 
                'Year to date KPIs represent averages across all reports this year.' : 
                metrics?.periodType === 'lastYear' ? 
                  'Previous year KPIs represent averages across all reports from last year.' : 
                  'Current KPIs reflect the most recent report data.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get color based on completion percentage
function getColorByCompletion(actual, target) {
  const percentage = (actual / target) * 100;
  
  if (percentage >= 90) {
    return 'bg-green-600';
  } else if (percentage >= 70) {
    return 'bg-yellow-500';
  } else {
    return 'bg-red-500';
  }
}

// Helper function to get status text based on completion
function getCompletionStatus(actual, target) {
  const percentage = (actual / target) * 100;
  
  if (percentage >= 90) {
    return 'On target';
  } else if (percentage >= 70) {
    return 'Needs improvement';
  } else {
    return 'Action required';
  }
}

export default KPIOverview;