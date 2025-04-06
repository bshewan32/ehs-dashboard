// client/src/components/dashboard/KPIOverview.js
import React, { useEffect, useState } from 'react';

const KPIOverview = ({ metrics, reports }) => {
  const [kpis, setKpis] = useState([]);
  
  useEffect(() => {
    const extractKPIs = () => {
      // First try to get KPIs from the metrics prop
      if (metrics && metrics.leading && metrics.leading.kpis && metrics.leading.kpis.length > 0) {
        console.log('Using KPIs from metrics prop:', metrics.leading.kpis);
        setKpis(metrics.leading.kpis);
        return;
      }
      
      // If not found in metrics, try to get from reports
      if (reports && reports.length > 0) {
        const mostRecent = reports[reports.length - 1];
        
        if (mostRecent && 
            mostRecent.metrics && 
            mostRecent.metrics.leading && 
            mostRecent.metrics.leading.kpis &&
            mostRecent.metrics.leading.kpis.length > 0) {
          
          console.log('Using KPIs from most recent report:', mostRecent.metrics.leading.kpis);
          setKpis(mostRecent.metrics.leading.kpis);
          return;
        }
      }
      
      // If we reach here, no KPIs were found
      console.log('No KPIs found in either metrics or reports');
      setKpis([]);
    };
    
    extractKPIs();
  }, [metrics, reports]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">KPI Metrics</h2>
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