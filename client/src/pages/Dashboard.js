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
        // Fetch metrics summary
        const metricsData = await fetchMetricsSummary();
        setMetrics(metricsData);
        
        // Also fetch reports for child components that need the full report data
        const reportsData = await fetchReports();
        setReports(reportsData);
        
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

  if (error) {
    return (
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
    );
  }

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
      ) : (
        <>
          {/* Pass both metrics and reports to child components */}
          <MetricsOverview metrics={metrics} reports={reports} />
          <KPIOverview metrics={metrics} reports={reports} />
          <TrendCharts reports={reports} />
          <AIPanel metrics={metrics} reports={reports} />
        </>
      )}
    </div>
  );
}

// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import MetricsOverview from '../components/dashboard/MetricsOverview';
// import KPIOverview from '../components/dashboard/KPIOverview';
// import AIPanel from '../components/dashboard/AIPanel';
// import TrendCharts from '../components/dashboard/TrendCharts';

// const api_url = process.env.REACT_APP_API_URL;

// export default function Dashboard() {
//   const [metrics, setMetrics] = useState(null);

//   useEffect(() => {
//     async function fetchMetrics() {
//       console.log('API URL:', api_url); // ✅ Add this
//       try {
//         const response = await fetch(`${api_url}/api/reports/metrics/summary`);
//         const data = await response.json();
//         console.log('Metrics received:', data); // ✅ Also helpful
//         setMetrics(data);
//       } catch (error) {
//         console.error('Error fetching metrics:', error);
//       }
//     }
  
//     fetchMetrics();
//   }, []);

    

//   return (
//     <div className="space-y-6 p-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
//         <Link to="/report/new">
//           <button className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700">
//             + Create New Report
//           </button>
//         </Link>
//       </div>

//       {!metrics ? (
//         <div className="text-center text-gray-500">Loading metrics...</div>
//       ) : (
//         <>
//           <MetricsOverview metrics={metrics} />
//           <KPIOverview metrics={metrics} />
//           <TrendCharts />
//           <AIPanel metrics={metrics} />
//         </>
//       )}
//     </div>
//   );
// }
