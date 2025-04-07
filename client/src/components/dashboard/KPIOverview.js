import React, { useEffect, useState } from 'react';
import { fetchReports } from '../services/api';

const KPIOverview = ({ metrics }) => {
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
        
        if (reports && reports.length > 0) {
          const mostRecent = reports[reports.length - 1];
          
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
  }, [metrics]);

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
      <h2 className="text-xl font-semibold mb-2">KPI Metrics</h2>
      {(!kpis || kpis.length === 0) ? (
        <p className="text-gray-600 italic">No KPI data available. Using default values.</p>
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