import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { fetchReports } from '../services/api';

const TrendCharts = () => {
  const [incidentData, setIncidentData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTrendData = async () => {
      try {
        setDataLoading(true);
        const reports = await fetchReports();
        
        if (!reports || reports.length === 0) {
          console.warn('No reports data available');
          // Create placeholder data if no reports
          const placeholderData = [
            { name: 'Q1', incidents: 0, nearMisses: 0 },
            { name: 'Q2', incidents: 0, nearMisses: 0 },
          ];
          setIncidentData(placeholderData);
          
          const placeholderKpiData = [
            { 
              name: 'Q1', 
              nearMissRate: 0, 
              criticalRiskVerification: 0, 
              electricalCompliance: 0 
            },
            { 
              name: 'Q2', 
              nearMissRate: 0, 
              criticalRiskVerification: 0, 
              electricalCompliance: 0 
            },
          ];
          setKpiData(placeholderKpiData);
          setDataLoading(false);
          return;
        }

        console.log('Reports loaded:', reports.length);
        
        // Process incident data with fallbacks for different data structures
        const trendData = reports.map((report) => {
          // First try regular structure
          let incidents = report.metrics?.lagging?.incidentCount;
          if (incidents === undefined) {
            // Try flattened structure
            incidents = report.metrics?.totalIncidents;
          }
          if (incidents === undefined) {
            // Last resort direct property
            incidents = report.totalIncidents;
          }
          incidents = incidents ?? 0;

          // Same fallback pattern for near misses
          let nearMisses = report.metrics?.lagging?.nearMissCount;
          if (nearMisses === undefined) {
            nearMisses = report.metrics?.totalNearMisses;
          }
          if (nearMisses === undefined) {
            nearMisses = report.totalNearMisses;
          }
          nearMisses = nearMisses ?? 0;

          return {
            name: report.reportPeriod || 'Unknown',
            incidents: incidents,
            nearMisses: nearMisses,
          };
        });

        console.log('Processed incident data points:', trendData.length);
        if (trendData.length > 0) {
          console.log('First data point:', JSON.stringify(trendData[0]));
        }

        setIncidentData(trendData);

        // Process KPI data with proper fallbacks
        const kpiTrend = reports.map((report) => {
          // Try different possible KPI data paths
          const kpis = report.metrics?.leading?.kpis || report.kpis || [];
          
          // Find metrics with fallbacks
          const findMetric = (id, defaultValue = 0) => {
            const kpi = kpis.find(k => k.id === id);
            return kpi?.actual ?? defaultValue;
          };

          return {
            name: report.reportPeriod || 'Unknown',
            nearMissRate: findMetric('nearMissRate'),
            criticalRiskVerification: findMetric('criticalRiskVerification'),
            electricalCompliance: findMetric('electricalSafetyCompliance'),
          };
        });

        console.log('Processed KPI data points:', kpiTrend.length);
        setKpiData(kpiTrend);
        setDataLoading(false);
      } catch (err) {
        console.error('Error loading trend data:', err);
        setError(err.message);
        setDataLoading(false);
      }
    };

    loadTrendData();
  }, []);

  if (dataLoading) {
    return <div className="text-center py-10">Loading trend data...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        Error loading trend data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Incident & Near Miss Trends</h2>
        {incidentData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No incident data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={incidentData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="incidents" 
                stroke="#8884d8" 
                name="Incidents" 
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="nearMisses" 
                stroke="#82ca9d" 
                name="Near Misses" 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">KPI Trends</h2>
        {kpiData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No KPI data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpiData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="nearMissRate" 
                stroke="#8884d8" 
                name="Near Miss Rate" 
              />
              <Line 
                type="monotone" 
                dataKey="criticalRiskVerification" 
                stroke="#82ca9d" 
                name="Critical Risk Verification" 
              />
              <Line 
                type="monotone" 
                dataKey="electricalCompliance" 
                stroke="#ffc658" 
                name="Electrical Compliance" 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TrendCharts;