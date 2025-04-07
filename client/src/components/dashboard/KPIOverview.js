// client/src/components/dashboard/KPIOverview.js
import React, { useEffect, useState } from 'react';

const KPIOverview = ({ metrics, reports }) => {
  const [kpis, setKpis] = useState([]);
  const [debugInfo, setDebugInfo] = useState({
    metricsSource: null,
    foundKpis: false,
    kpiPath: null
  });
  
  useEffect(() => {
    const extractKPIs = () => {
      console.log('KPIOverview - Metrics prop:', metrics);
      console.log('KPIOverview - Reports prop:', reports);
      
      const debugData = {
        metricsSource: null,
        foundKpis: false,
        kpiPath: null
      };
      
      // OPTION 1: Try to get KPIs from the metrics prop (correctly nested)
      if (metrics && metrics.leading && Array.isArray(metrics.leading.kpis) && metrics.leading.kpis.length > 0) {
        console.log('Found KPIs in metrics.leading.kpis:', metrics.leading.kpis);
        setKpis(metrics.leading.kpis);
        debugData.metricsSource = 'metrics.leading.kpis';
        debugData.foundKpis = true;
        debugData.kpiPath = JSON.stringify(metrics.leading.kpis);
        setDebugInfo(debugData);
        return;
      }
      
      // OPTION 2: Try to get KPIs from the metrics prop (incorrectly nested at top level)
      if (metrics && Array.isArray(metrics.kpis) && metrics.kpis.length > 0) {
        console.log('Found KPIs in metrics.kpis (incorrect location):', metrics.kpis);
        setKpis(metrics.kpis);
        debugData.metricsSource = 'metrics.kpis';
        debugData.foundKpis = true;
        debugData.kpiPath = JSON.stringify(metrics.kpis);
        setDebugInfo(debugData);
        return;
      }
      
      // OPTION 3: Try to get from reports (correctly nested)
      if (reports && reports.length > 0) {
        const mostRecent = reports[reports.length - 1];
        console.log('Most recent report:', mostRecent);
        
        // Check for correctly nested KPIs
        if (mostRecent && 
            mostRecent.metrics && 
            mostRecent.metrics.leading && 
            Array.isArray(mostRecent.metrics.leading.kpis) &&
            mostRecent.metrics.leading.kpis.length > 0) {
          
          console.log('Found KPIs in most recent report (correct location):', 
                      mostRecent.metrics.leading.kpis);
          setKpis(mostRecent.metrics.leading.kpis);
          debugData.metricsSource = 'reports[latest].metrics.leading.kpis';
          debugData.foundKpis = true;
          debugData.kpiPath = JSON.stringify(mostRecent.metrics.leading.kpis);
          setDebugInfo(debugData);
          return;
        }
        
        // Check for incorrectly nested KPIs
        if (mostRecent && 
            mostRecent.metrics && 
            Array.isArray(mostRecent.metrics.kpis) &&
            mostRecent.metrics.kpis.length > 0) {
          
          console.log('Found KPIs in most recent report (incorrect location):', 
                      mostRecent.metrics.kpis);
          setKpis(mostRecent.metrics.kpis);
          debugData.metricsSource = 'reports[latest].metrics.kpis';
          debugData.foundKpis = true;
          debugData.kpiPath = JSON.stringify(mostRecent.metrics.kpis);
          setDebugInfo(debugData);
          return;
        }
      }
      
      // If we reach here, no KPIs were found
      console.log('No KPIs found in either metrics or reports');
      
      // Create default KPIs if none found
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
        }
      ];
      
      console.log('Using default KPIs:', defaultKpis);
      setKpis(defaultKpis);
      debugData.metricsSource = 'default values';
      debugData.foundKpis = false;
      setDebugInfo(debugData);
    };
    
    extractKPIs();
  }, [metrics, reports]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold mb-2">KPI Metrics</h2>
        {debugInfo.metricsSource && (
          <div className="text-xs text-gray-500">
            Source: {debugInfo.metricsSource}
          </div>
        )}
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
      
      {/* Debug section - remove in production */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
        <div className="mb-1">Debug Info:</div>
        <div>Found KPIs: {debugInfo.foundKpis ? '✅ Yes' : '❌ No'}</div>
        <div>Source: {debugInfo.metricsSource || 'None'}</div>
        {debugInfo.kpiPath && (
          <div className="mt-1 overflow-hidden text-ellipsis">
            <div>KPI Data:</div>
            <pre className="text-xs bg-gray-100 p-1 rounded mt-1 overflow-x-auto">
              {debugInfo.kpiPath}
            </pre>
          </div>
        )}
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