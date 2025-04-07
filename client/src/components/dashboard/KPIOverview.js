import React, { useEffect, useState } from 'react';
import { fetchReports } from '../services/api';

const KPIOverview = ({ metrics }) => {
  const [kpis, setKpis] = useState([]);

  useEffect(() => {
    const loadKpis = async () => {
      try {
        // If metrics are passed directly as props
        if (metrics && metrics.leading && metrics.leading.kpis) {
          setKpis(metrics.leading.kpis);
          return;
        }

        // Fall back to API if no props or props don't have kpis
        const reports = await fetchReports();
        const mostRecent = reports[reports.length - 1];
        
        // Try different possible locations of KPI data
        if (mostRecent?.metrics?.leading?.kpis) {
          setKpis(mostRecent.metrics.leading.kpis);
        } else if (mostRecent?.kpis) {
          setKpis(mostRecent.kpis);
        } else {
          // Create default KPIs if none exist
          setKpis([
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
          ]);
        }
      } catch (error) {
        console.error('Error loading KPIs:', error);
        // Set default KPIs on error
        setKpis([
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
        ]);
      }
    };

    loadKpis();
  }, [metrics]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">KPI Metrics</h2>
      {kpis.length === 0 ? (
        <p className="text-gray-600 italic">No KPI data available.</p>
      ) : (
        <ul className="list-disc list-inside space-y-2">
          {kpis.map((kpi, index) => (
            <li key={index}>
              <strong>{kpi.name}:</strong> {kpi.actual} {kpi.unit}
              <span className="text-gray-500 text-sm ml-2">(Target: {kpi.target} {kpi.unit})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default KPIOverview;