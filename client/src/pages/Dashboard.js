import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from './MetricsOverview';
import KPIOverview from './KPIOverview';
import AIPanel from './AIPanel';
import TrendCharts from './TrendCharts';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reports/metrics/summary`);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    }

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Link to="/report/new">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700">
            + Create New Report
          </button>
        </Link>
      </div>

      {!metrics ? (
        <div className="text-center text-gray-500">Loading metrics...</div>
      ) : (
        <>
          <MetricsOverview metrics={metrics} />
          <KPIOverview metrics={metrics} />
          <TrendCharts />
          <AIPanel metrics={metrics} />
        </>
      )}
    </div>
  );
}
