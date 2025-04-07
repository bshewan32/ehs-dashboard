import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import AIPanel from '../components/dashboard/AIPanel';
import TrendCharts from '../components/dashboard/TrendCharts';

const api_url = process.env.REACT_APP_API_URL;

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        // Try to fetch from summary endpoint
        const response = await fetch(`${api_url}/api/reports/metrics/summary`);
        
        // Check if response is valid
        if (!response.ok) {
          throw new Error(`API error with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched metrics:', data);
        
        // Ensure KPIs are defined with fallbacks
        if (!data.leading) {
          data.leading = {};
        }
        
        if (!data.leading.kpis || !Array.isArray(data.leading.kpis) || data.leading.kpis.length === 0) {
          data.leading.kpis = [
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
        }
        
        setMetrics(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setError(error.message);
        
        // Create a fallback metrics object with default values
        const fallbackMetrics = {
          lagging: {
            incidentCount: 0,
            nearMissCount: 0,
            firstAidCount: 0,
            medicalTreatmentCount: 0
          },
          leading: {
            trainingCompleted: 0,
            inspectionsCompleted: 0,
            kpis: [
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
            ]
          }
        };
        
        setMetrics(fallbackMetrics);
        setLoading(false);
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

      {loading ? (
        <div className="text-center p-10 text-gray-500">
          <div className="text-xl">Loading dashboard data...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded shadow mb-4">
          <div className="font-bold">Error loading dashboard data</div>
          <div>{error}</div>
          <div className="mt-2">Using fallback data for display purposes.</div>
        </div>
      ) : null}

      <div className="space-y-6">
        <MetricsOverview metrics={metrics} />
        <KPIOverview metrics={metrics} />
        <TrendCharts />
        <AIPanel metrics={metrics} />
      </div>
    </div>
  );
}