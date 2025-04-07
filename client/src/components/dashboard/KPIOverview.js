// client/src/components/dashboard/KPIOverview.js
import React, { useEffect, useState } from 'react';

const KPIOverview = ({ metrics, reports }) => {
  const [kpis, setKpis] = useState([]);
  const [kpiSource, setKpiSource] = useState('none');
  
  useEffect(() => {
    console.log('KPIOverview - Reports prop:', reports);
    console.log('KPIOverview - Metrics prop:', metrics);
    
    // Priority 1: Check for KPIs in the most recent report
    if (reports && reports.length > 0) {
      const mostRecent = reports[reports.length - 1];
      console.log('Most recent report:', mostRecent);
      
      if (mostRecent?.metrics?.leading?.kpis && 
          Array.isArray(mostRecent.metrics.leading.kpis) && 
          mostRecent.metrics.leading.kpis.length > 0) {
        
        console.log('Using KPIs from most recent report:', mostRecent.metrics.leading.kpis);
        setKpis(mostRecent.metrics.leading.kpis);
        setKpiSource('reports[latest].metrics.leading.kpis');
        return;
      }
    }
    
    // Priority 2: Check for KPIs in the metrics prop
    if (metrics?.leading?.kpis && 
        Array.isArray(metrics.leading.kpis) && 
        metrics.leading.kpis.length > 0) {
      
      console.log('Using KPIs from metrics.leading.kpis:', metrics.leading.kpis);
      setKpis(metrics.leading.kpis);
      setKpiSource('metrics.leading.kpis');
      return;
    }
    
    // Priority 3: Check legacy structure - kpis at top level of metrics
    if (metrics?.kpis && 
        Array.isArray(metrics.kpis) && 
        metrics.kpis.length > 0) {
      
      console.log('Using KPIs from metrics.kpis (legacy location):', metrics.kpis);
      setKpis(metrics.kpis);
      setKpiSource('metrics.kpis (legacy)');
      return;
    }
    
    // Fallback: Use default KPIs if no data found
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
    setKpiSource('default values');
    
  }, [metrics, reports]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">KPI Metrics</h2>
        <div className="text-xs text-gray-500">Source: {kpiSource}</div>
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