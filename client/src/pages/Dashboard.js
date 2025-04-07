// client/src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import AIPanel from '../components/dashboard/AIPanel';
import TrendCharts from '../components/dashboard/TrendCharts';
import { fetchReports, fetchMetricsSummary } from '../components/services/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all reports first for the full dataset
        const reportsData = await fetchReports();
        console.log('Dashboard - Fetched reports:', reportsData);
        setReports(reportsData);
        
        // Also fetch the metrics summary to ensure we have the latest data
        const metricsData = await fetchMetricsSummary();
        console.log('Dashboard - Fetched metrics summary:', metricsData);
        setMetrics(metricsData);
        
        setError(null);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Function to verify that we have KPI data
  const verifyKpiData = () => {
    let kpiFound = false;
    let kpiSource = null;
    
    // Check metrics object first
    if (metrics && metrics.leading && Array.isArray(metrics.leading.kpis) && metrics.leading.kpis.length > 0) {
      kpiFound = true;
      kpiSource = 'metrics.leading.kpis';
      console.log('Dashboard - KPIs found in metrics:', metrics.leading.kpis);
    } 
    // Then check reports
    else if (reports && reports.length > 0) {
      const mostRecent = reports[reports.length - 1];
      if (mostRecent && mostRecent.metrics && mostRecent.metrics.leading && 
          Array.isArray(mostRecent.metrics.leading.kpis) && mostRecent.metrics.leading.kpis.length > 0) {
        kpiFound = true;
        kpiSource = 'reports[latest].metrics.leading.kpis';
        console.log('Dashboard - KPIs found in most recent report:', mostRecent.metrics.leading.kpis);
      }
    }
    
    return { kpiFound, kpiSource };
  };

  const { kpiFound, kpiSource } = verifyKpiData();

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
        <div className="text-center p-8">
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-slate-200 h-10 w-10"></div>
            <div className="flex-1 space-y-6 py-1 max-w-md">
              <div className="h-2 bg-slate-200 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                  <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                </div>
                <div className="h-2 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-gray-500">Loading metrics...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded text-red-600">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Pass both metrics and reports to child components */}
          <MetricsOverview metrics={metrics} reports={reports} />
          <KPIOverview metrics={metrics} reports={reports} />
          <TrendCharts reports={reports} />
          <AIPanel metrics={metrics} reports={reports} />
          
          {/* Debug information */}
          <div className="p-4 bg-white rounded shadow border-l-4 border-yellow-400">
            <h2 className="text-lg font-medium mb-2">Debug Information</h2>
            <div className="text-sm text-gray-600">
              <div><strong>Reports loaded:</strong> {reports.length}</div>
              <div><strong>Metrics loaded:</strong> {metrics ? 'Yes' : 'No'}</div>
              <div><strong>KPI data found:</strong> {kpiFound ? '✅ Yes' : '❌ No'}</div>
              {kpiSource && <div><strong>KPI source:</strong> {kpiSource}</div>}
              
              <div className="mt-3">
                <strong>Data verification:</strong>
                <ul className="list-disc list-inside mt-1 ml-2">
                  <li className={metrics ? 'text-green-600' : 'text-red-600'}>
                    Metrics object: {metrics ? 'Present' : 'Missing'}
                  </li>
                  <li className={metrics?.leading ? 'text-green-600' : 'text-red-600'}>
                    Leading metrics: {metrics?.leading ? 'Present' : 'Missing'}
                  </li>
                  <li className={Array.isArray(metrics?.leading?.kpis) ? 'text-green-600' : 'text-red-600'}>
                    KPIs array: {Array.isArray(metrics?.leading?.kpis) ? 'Present' : 'Missing'}
                  </li>
                  <li className={metrics?.leading?.kpis?.length > 0 ? 'text-green-600' : 'text-red-600'}>
                    KPIs data: {metrics?.leading?.kpis?.length > 0 ? 'Present' : 'Empty or missing'}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}