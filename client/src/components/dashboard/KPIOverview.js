// client/src/components/dashboard/KPIOverview.js
import React, { useEffect, useState } from 'react';

const KPIOverview = ({ metrics, reports }) => {
  const [kpis, setKpis] = useState([]);
  const [debugInfo, setDebugInfo] = useState({
    metricsKpis: null,
    reportKpis: null,
    selectedSource: null
  });
  
  useEffect(() => {
    // Log what we're receiving for debugging
    console.log("KPIOverview - metrics prop:", metrics);
    console.log("KPIOverview - reports prop:", reports);
    
    const debug = {
      metricsKpis: null,
      reportKpis: null,
      selectedSource: null
    };
    
    // Check metrics for KPI data
    if (metrics && metrics.leading && Array.isArray(metrics.leading.kpis)) {
      debug.metricsKpis = metrics.leading.kpis;
      console.log("Found KPIs in metrics:", debug.metricsKpis);
    }
    
    // Check reports for KPI data
    if (reports && reports.length > 0) {
      const mostRecent = reports[reports.length - 1];
      if (mostRecent && mostRecent.metrics && mostRecent.metrics.leading && 
          Array.isArray(mostRecent.metrics.leading.kpis)) {
        debug.reportKpis = mostRecent.metrics.leading.kpis;
        console.log("Found KPIs in most recent report:", debug.reportKpis);
      }
    }
    
    // Decide which KPIs to use
    let selectedKpis = [];
    
    // Priority 1: Use KPIs from metrics if available and not empty
    if (debug.metricsKpis && debug.metricsKpis.length > 0) {
      selectedKpis = debug.metricsKpis;
      debug.selectedSource = "metrics.leading.kpis";
    } 
    // Priority 2: Use KPIs from reports if available and not empty
    else if (debug.reportKpis && debug.reportKpis.length > 0) {
      selectedKpis = debug.reportKpis;
      debug.selectedSource = "reports[latest].metrics.leading.kpis";
    }
    // Priority 3: Use default KPIs if nothing else is available
    else {
      selectedKpis = [
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
      debug.selectedSource = "default values";
    }
    
    console.log("Selected KPI source:", debug.selectedSource);
    console.log("Selected KPIs:", selectedKpis);
    
    setKpis(selectedKpis);
    setDebugInfo(debug);
  }, [metrics, reports]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">KPI Metrics</h2>
        <div className="text-xs text-gray-500">Source: {debugInfo.selectedSource || 'None'}</div>
      </div>
      
      {kpis.length === 0 ? (
        <p className="text-gray-600 italic">No KPI data available.</p>
      ) : (
        <div className="divide-y">
          {kpis.map((kpi, index) => (
            <div key={index} className="py-3 flex justify-between items-center">
              <div>
                <strong className="text-gray-800">{kpi.name}:</strong>
                <span className="ml-2">{kpi.actual} {kpi.unit}</span>
                <div className="text-xs text-gray-500">
                  Type: {typeof kpi.actual} | Value: {kpi.actual}
                </div>
              </div>
              <div className="flex items-center">
                <div className="text-gray-500 text-sm mr-3">Target: {kpi.target} {kpi.unit}</div>
                
                {/* Progress bar showing actual vs target */}
                <div className="w-32 bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${getProgressColor(kpi.actual, kpi.target)}`}
                    style={{ width: `${Math.min(100, (kpi.actual / kpi.target) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Debug information */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700">Debug Information</div>
          <button
            onClick={() => console.log("KPI data state:", { kpis, debugInfo })}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            Log Data
          </button>
        </div>
        <div className="mt-1 text-xs text-gray-600">
          <div>Metrics KPIs: {debugInfo.metricsKpis ? `Found (${debugInfo.metricsKpis.length})` : 'Not found'}</div>
          <div>Report KPIs: {debugInfo.reportKpis ? `Found (${debugInfo.reportKpis.length})` : 'Not found'}</div>
          <div>Selected source: {debugInfo.selectedSource || 'None'}</div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get color based on progress
const getProgressColor = (actual, target) => {
  const percentage = (actual / target) * 100;
  
  if (percentage >= 90) return 'bg-green-600';
  if (percentage >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
};

export default KPIOverview;