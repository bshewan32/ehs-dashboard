import React, { useEffect, useState } from 'react';
import { fetchReports } from '../services/api';

const KPIOverview = () => {
  const [kpis, setKpis] = useState([]);

  useEffect(() => {
    const loadKpis = async () => {
      try {
        const reports = await fetchReports();
        const mostRecent = reports[reports.length - 1];
        setKpis(mostRecent?.metrics?.leading?.kpis || []);
      } catch (error) {
        console.error('Error loading KPIs:', error);
      }
    };

    loadKpis();
  }, []);

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
              <span className="text-gray-500 text-sm ml-2">(Target: {kpi.target})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default KPIOverview;