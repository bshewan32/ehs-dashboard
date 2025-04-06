// client/src/components/dashboard/TrendCharts.js
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { fetchReports } from '../services/api';

const TrendCharts = ({ reports: propReports }) => {
  const [incidentData, setIncidentData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrendData = async () => {
      try {
        // Use prop reports if available, otherwise fetch reports
        const reports = propReports && propReports.length > 0 
          ? propReports 
          : await fetchReports();
        
        if (!reports || reports.length === 0) {
          setLoading(false);
          return;
        }

        const trendData = reports.map((report) => ({
          name: report.reportPeriod,
          incidents: report.metrics?.lagging?.incidentCount || 
                    report.metrics?.totalIncidents || 0,
          nearMisses: report.metrics?.lagging?.nearMissCount || 
                      report.metrics?.totalNearMisses || 0,
        }));
        setIncidentData(trendData);

        const kpiTrend = reports.map((report) => {
          const kpis = report.metrics?.leading?.kpis || [];
          const nearMissRate = kpis.find(k => k.id === 'nearMissRate')?.actual || 0;
          const criticalRiskVerification = kpis.find(k => k.id === 'criticalRiskVerification')?.actual || 0;
          const electricalCompliance = kpis.find(k => k.id === 'electricalSafetyCompliance')?.actual || 0;

          return {
            name: report.reportPeriod,
            nearMissRate,
            criticalRiskVerification,
            electricalCompliance,
          };
        });
        setKpiData(kpiTrend);
      } catch (err) {
        console.error('Error loading trend data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrendData();
  }, [propReports]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="p-4 bg-white rounded shadow animate-pulse">
          <h2 className="text-xl font-semibold mb-4">Loading Charts...</h2>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (incidentData.length === 0) {
    return (
      <div className="space-y-8">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Trend Data</h2>
          <p className="text-gray-500 italic">No trend data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Incident & Near Miss Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={incidentData}>
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="incidents" stroke="#8884d8" name="Incidents" />
            <Line type="monotone" dataKey="nearMisses" stroke="#82ca9d" name="Near Misses" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {kpiData.some(item => item.nearMissRate || item.criticalRiskVerification || item.electricalCompliance) && (
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-4">KPI Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpiData}>
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="nearMissRate" stroke="#8884d8" name="Near Miss Rate" />
              <Line type="monotone" dataKey="criticalRiskVerification" stroke="#82ca9d" name="Critical Risk Verification" />
              <Line type="monotone" dataKey="electricalCompliance" stroke="#ffc658" name="Electrical Compliance" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TrendCharts;

// import React, { useEffect, useState } from 'react';
// import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
// import { fetchReports } from '../services/api';

// const TrendCharts = () => {
//   const [incidentData, setIncidentData] = useState([]);
//   const [kpiData, setKpiData] = useState([]);

//   useEffect(() => {
//     const loadTrendData = async () => {
//       try {
//         const reports = await fetchReports();
//         const trendData = reports.map((report) => ({
//           name: report.reportPeriod,
//           incidents: report.metrics?.lagging?.incidentCount || 0,
//           nearMisses: report.metrics?.lagging?.nearMissCount || 0,
//         }));
//         setIncidentData(trendData);

//         const kpiTrend = reports.map((report) => {
//           const kpis = report.metrics?.leading?.kpis || [];
//           const nearMissRate = kpis.find(k => k.id === 'nearMissRate')?.actual || 0;
//           const criticalRiskVerification = kpis.find(k => k.id === 'criticalRiskVerification')?.actual || 0;
//           const electricalCompliance = kpis.find(k => k.id === 'electricalSafetyCompliance')?.actual || 0;

//           return {
//             name: report.reportPeriod,
//             nearMissRate,
//             criticalRiskVerification,
//             electricalCompliance,
//           };
//         });
//         setKpiData(kpiTrend);
//       } catch (err) {
//         console.error('Error loading trend data:', err);
//       }
//     };

//     loadTrendData();
//   }, []);

//   return (
//     <div className="space-y-8">
//       <div className="p-4 bg-white rounded shadow">
//         <h2 className="text-xl font-semibold mb-4">Incident & Near Miss Trends</h2>
//         <ResponsiveContainer width="100%" height={300}>
//           <LineChart data={incidentData}>
//             <CartesianGrid stroke="#ccc" />
//             <XAxis dataKey="name" />
//             <YAxis allowDecimals={false} />
//             <Tooltip />
//             <Line type="monotone" dataKey="incidents" stroke="#8884d8" name="Incidents" />
//             <Line type="monotone" dataKey="nearMisses" stroke="#82ca9d" name="Near Misses" />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>

//       <div className="p-4 bg-white rounded shadow">
//         <h2 className="text-xl font-semibold mb-4">KPI Trends</h2>
//         <ResponsiveContainer width="100%" height={300}>
//           <LineChart data={kpiData}>
//             <CartesianGrid stroke="#ccc" />
//             <XAxis dataKey="name" />
//             <YAxis allowDecimals={false} />
//             <Tooltip />
//             <Line type="monotone" dataKey="nearMissRate" stroke="#8884d8" name="Near Miss Rate" />
//             <Line type="monotone" dataKey="criticalRiskVerification" stroke="#82ca9d" name="Critical Risk Verification" />
//             <Line type="monotone" dataKey="electricalCompliance" stroke="#ffc658" name="Electrical Compliance" />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// };

// export default TrendCharts;
