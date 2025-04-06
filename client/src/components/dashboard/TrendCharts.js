// client/src/components/dashboard/TrendCharts.js
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
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
        
        console.log('Reports for trend charts:', reports);
        
        if (!reports || reports.length === 0) {
          setLoading(false);
          return;
        }

        // Format incident data
        const trendData = reports.map((report) => ({
          name: report.reportPeriod,
          incidents: report.metrics?.lagging?.incidentCount || 
                    report.metrics?.totalIncidents || 0,
          nearMisses: report.metrics?.lagging?.nearMissCount || 
                      report.metrics?.totalNearMisses || 0,
        }));
        setIncidentData(trendData);

        // Process KPI data from reports
        const kpiTrend = reports.map((report) => {
          // Initialize result object with name
          const result = { name: report.reportPeriod };
          
          // Check if kpis array exists
          const kpis = report.metrics?.leading?.kpis || [];
          
          // Log found KPIs for debugging
          console.log(`KPIs for ${report.reportPeriod}:`, kpis);
          
          // Map each KPI to the result object
          kpis.forEach(kpi => {
            if (kpi && kpi.id && kpi.actual !== undefined) {
              result[kpi.id] = kpi.actual;
            }
          });
          
          return result;
        });
        
        console.log('Processed KPI data:', kpiTrend);
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

  // Check if we have any KPI data to display
  const hasKpiData = kpiData.some(item => 
    item.nearMissRate !== undefined || 
    item.criticalRiskVerification !== undefined || 
    item.electricalSafetyCompliance !== undefined
  );

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
            <Legend />
            <Line type="monotone" dataKey="incidents" stroke="#8884d8" name="Incidents" />
            <Line type="monotone" dataKey="nearMisses" stroke="#82ca9d" name="Near Misses" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {hasKpiData && (
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-4">KPI Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpiData}>
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="nearMissRate" 
                stroke="#8884d8" 
                name="Near Miss Rate" 
                connectNulls={true}
              />
              <Line 
                type="monotone" 
                dataKey="criticalRiskVerification" 
                stroke="#82ca9d" 
                name="Critical Risk Verification" 
                connectNulls={true}
              />
              <Line 
                type="monotone" 
                dataKey="electricalSafetyCompliance" 
                stroke="#ffc658" 
                name="Electrical Compliance" 
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TrendCharts;