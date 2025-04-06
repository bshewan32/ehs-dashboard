import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { fetchReports } from '../../services/api';

const TrendCharts = () => {
  const [incidentData, setIncidentData] = useState([]);
  const [kpiData, setKpiData] = useState([]);

  useEffect(() => {
    const loadTrendData = async () => {
      try {
        const reports = await fetchReports();
        const trendData = reports.map((report) => ({
          name: report.reportPeriod,
          incidents: report.metrics?.lagging?.incidentCount || 0,
          nearMisses: report.metrics?.lagging?.nearMissCount || 0,
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
      }
    };

    loadTrendData();
  }, []);

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
    </div>
  );
};

export default TrendCharts;
