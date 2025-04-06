// client/src/components/debug/KPIDebug.js
import React, { useState } from 'react';

const KPIDebug = ({ reports, metrics }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Extract KPI data from reports and metrics
  const kpisFromReports = reports && reports.length > 0 
    ? reports[reports.length - 1]?.metrics?.leading?.kpis
    : null;
    
  const kpisFromMetrics = metrics?.leading?.kpis;
  
  if (!reports && !metrics) return null;
  
  return (
    <div className="p-4 bg-white rounded shadow mt-4 border-t-4 border-yellow-400">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg flex items-center">
          <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          KPI Data Debug
        </h3>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isOpen ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      {isOpen && (
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-1">KPIs from Metrics:</h4>
            {!kpisFromMetrics || kpisFromMetrics.length === 0 ? (
              <div className="text-red-500 text-sm">No KPIs found in metrics</div>
            ) : (
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(kpisFromMetrics, null, 2)}
              </pre>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-1">KPIs from Latest Report:</h4>
            {!kpisFromReports || kpisFromReports.length === 0 ? (
              <div className="text-red-500 text-sm">No KPIs found in latest report</div>
            ) : (
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(kpisFromReports, null, 2)}
              </pre>
            )}
          </div>
          
          <div className="text-sm text-gray-600 pt-2 border-t">
            <p className="font-medium">Troubleshooting tips:</p>
            <ul className="list-disc list-inside mt-1 text-xs">
              <li>Check that the <code>kpis</code> array exists in <code>metrics.leading</code></li>
              <li>Each KPI should have <code>id</code>, <code>name</code>, <code>actual</code>, and <code>target</code> properties</li>
              <li>Verify your backend is correctly saving and returning the KPI data</li>
              <li>If missing, check if the form is correctly sending the data structure</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIDebug;