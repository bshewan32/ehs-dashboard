// client/src/components/dashboard/TrendCharts.js
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { fetchReports } from '../services/api';

const TrendCharts = ({ reports: propReports }) => {
  const [incidentData, setIncidentData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState({
    dataSource: null,
    reportCount: 0,
    hasKpiData: false
  });

  useEffect(() => {
    const loadTrendData = async () => {
      try {
        // Use prop reports if available, otherwise fetch reports
        let reports;
        let dataSource;
        
        if (propReports && propReports.length > 0) {
          reports = propReports;
          dataSource = "props";
          console.log("TrendCharts - Using reports from props:", reports.length);
        } else {
          reports = await fetchReports();
          dataSource = "fetch";
          console.log("TrendCharts - Fetched reports directly:", reports.length);
        }
        
        if (!reports || reports.length === 0) {
          console.log("TrendCharts - No reports available");
          setLoading(false);
          return;
        }

        // Debug log all reports to check structure
        reports.forEach((report, index) => {
          console.log(`Report ${index} (${report.reportPeriod}):`, {
            incidentCount: report.metrics?.lagging?.incidentCount,
            nearMissCount: report.metrics?.lagging?.nearMissCount,
            totalIncidents: report.metrics?.totalIncidents,
            totalNearMisses: report.metrics?.totalNearMisses,
            kpis: report.metrics?.leading?.kpis
          });
        });

        // Format incident data, checking various possible locations
        const trendData = reports.map((report) => {
          // Check both new structure and legacy structure
          const incidentCount = report.metrics?.lagging?.incidentCount ?? 
                               report.metrics?.totalIncidents ?? 0;
                               
          const nearMissCount = report.metrics?.lagging?.nearMissCount ?? 
                               report.metrics?.totalNearMisses ?? 0;
                               
          console.log(`TrendCharts - ${report.reportPeriod} data:`, { 
            incidentCount, 
            nearMissCount 
          });
          
          return {
            name: report.reportPeriod,
            incidents: incidentCount,
            nearMisses: nearMissCount,
          };
        });
        
        setIncidentData(trendData);

        // Process KPI data from reports
        const kpiTrend = reports.map((report) => {
          // Initialize result object with name
          const result = { name: report.reportPeriod };
          
          // Get KPIs from the structured location
          const kpis = report.metrics?.leading?.kpis || [];
          
          // Map each KPI to the result object
          kpis.forEach(kpi => {
            if (kpi && kpi.id && kpi.actual !== undefined) {
              result[kpi.id] = kpi.actual;
            }
          });
          
          return result;
        });
        
        // Check if we actually have KPI data
        const hasKpiData = kpiTrend.some(item => 
          item.nearMissRate !== undefined || 
          item.criticalRiskVerification !== undefined || 
          item.electricalSafetyCompliance !== undefined
        );
        
        console.log("TrendCharts - KPI trend data:", kpiTrend);
        console.log("TrendCharts - Has KPI data:", hasKpiData);
        
        setKpiData(kpiTrend);
        setDebug({
          dataSource,
          reportCount: reports.length,
          hasKpiData
        });
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Incident & Near Miss Trends</h2>
          <div className="text-xs text-gray-500">
            Data source: {debug.dataSource} | Reports: {debug.reportCount}
          </div>
        </div>
        
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

      {debug.hasKpiData && (
        <div className="p-4 bg-white rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">KPI Trends</h2>
            <button
              onClick={() => console.log("KPI trend data:", kpiData)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Log KPI Data
            </button>
          </div>
          
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
      
      {/* Debug info */}
      <div className="p-3 bg-white rounded shadow border-l-4 border-blue-400">
        <div className="text-sm font-medium text-gray-700 mb-1">TrendCharts Debug Info:</div>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Data source: {debug.dataSource}</div>
          <div>Reports processed: {debug.reportCount}</div>
          <div>Has KPI trend data: {debug.hasKpiData ? 'Yes' : 'No'}</div>
          <div>Incident data points: {incidentData.length}</div>
          <div>Incident data first item: {incidentData.length > 0 ? JSON.stringify(incidentData[0]) : 'None'}</div>
        </div>
      </div>
    </div>
  );
};

export default TrendCharts;