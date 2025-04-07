import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { fetchReports } from '../services/api';
import CompanyFilter from './CompanyFilter';

const TrendCharts = () => {
  const [incidentData, setIncidentData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [allReports, setAllReports] = useState([]); // Store all reports

  // Helper function to ensure valid period names
  const formatPeriod = (period) => {
    if (!period || period === '123') return 'Missing';
    return period;
  };

  const handleCompanyChange = (company) => {
    setSelectedCompany(company);
    processReportsData(allReports, company);
  };

  const processReportsData = (reports, companyFilter = null) => {
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
      return;
    }

    // Filter by company if needed
    const filteredReports = companyFilter 
      ? reports.filter(report => report.companyName === companyFilter)
      : reports;
    
    console.log(`Processing ${filteredReports.length} reports ${companyFilter ? `for ${companyFilter}` : 'for all companies'}`);
    
    // Process incident data with fallbacks for different data structures
    const trendData = filteredReports.map((report) => {
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
        name: formatPeriod(report.reportPeriod),
        incidents: incidents,
        nearMisses: nearMisses,
        company: report.companyName, // Add company name for tooltip
      };
    });

    // Sort data chronologically if possible
    const sortedData = [...trendData].sort((a, b) => {
      // Simple quarter comparison (Q1, Q2, etc)
      if (a.name.startsWith('Q') && b.name.startsWith('Q')) {
        return a.name.localeCompare(b.name);
      }
      // Default to original order
      return 0;
    });

    setIncidentData(sortedData);

    // Process KPI data with proper fallbacks
    const kpiTrend = filteredReports.map((report) => {
      // Try different possible KPI data paths
      const kpis = report.metrics?.leading?.kpis || report.kpis || [];
      
      // Find metrics with fallbacks
      const findMetric = (id, defaultValue = 0) => {
        const kpi = kpis.find(k => k.id === id);
        return kpi?.actual ?? defaultValue;
      };

      return {
        name: formatPeriod(report.reportPeriod),
        nearMissRate: findMetric('nearMissRate'),
        criticalRiskVerification: findMetric('criticalRiskVerification'),
        electricalCompliance: findMetric('electricalSafetyCompliance'),
        company: report.companyName, // Add company name for tooltip
      };
    });

    // Sort KPI data the same way
    const sortedKpiData = [...kpiTrend].sort((a, b) => {
      if (a.name.startsWith('Q') && b.name.startsWith('Q')) {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    console.log('Processed KPI data points:', kpiTrend.length);
    setKpiData(sortedKpiData);
  };

  useEffect(() => {
    const loadTrendData = async () => {
      try {
        setDataLoading(true);
        const reports = await fetchReports();
        
        // Store all reports for filtering later
        setAllReports(reports);
        
        // Process reports data with selected company filter
        processReportsData(reports, selectedCompany);
        
        setDataLoading(false);
      } catch (err) {
        console.error('Error loading trend data:', err);
        setError(err.message);
        setDataLoading(false);
        
        // Set fallback data on error
        const fallbackData = [
          { name: 'Q1', incidents: 0, nearMisses: 0 },
          { name: 'Q2', incidents: 0, nearMisses: 0 },
        ];
        setIncidentData(fallbackData);
        
        const fallbackKpiData = [
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
        setKpiData(fallbackKpiData);
      }
    };

    loadTrendData();
    
    // Refresh trends every minute
    const intervalId = setInterval(loadTrendData, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Custom tooltip to show company name
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-semibold">{label}</p>
          {payload[0].payload.company && !selectedCompany && (
            <p className="text-sm text-gray-700">{payload[0].payload.company}</p>
          )}
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}
              {entry.name.includes('Rate') || entry.name.includes('Verification') || entry.name.includes('Compliance') ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (dataLoading && incidentData.length === 0 && kpiData.length === 0) {
    return <div className="text-center py-10">Loading trend data...</div>;
  }

  if (error && incidentData.length === 0 && kpiData.length === 0) {
    return (
      <div className="text-center py-10 text-red-600">
        Error loading trend data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CompanyFilter 
        onChange={handleCompanyChange} 
        selectedCompany={selectedCompany} 
      />
      
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          Incident & Near Miss Trends
          {selectedCompany && <span className="text-blue-600 ml-2">({selectedCompany})</span>}
        </h2>
        {incidentData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No incident data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={incidentData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="incidents" 
                stroke="#8884d8" 
                name="Incidents" 
                activeDot={{ r: 8 }}
                isAnimationActive={false} // Disable animation to avoid flicker
              />
              <Line 
                type="monotone" 
                dataKey="nearMisses" 
                stroke="#82ca9d" 
                name="Near Misses" 
                isAnimationActive={false} // Disable animation to avoid flicker
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          KPI Trends
          {selectedCompany && <span className="text-blue-600 ml-2">({selectedCompany})</span>}
        </h2>
        {kpiData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No KPI data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpiData}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="nearMissRate" 
                stroke="#8884d8" 
                name="Near Miss Rate" 
                isAnimationActive={false} // Disable animation to avoid flicker
              />
              <Line 
                type="monotone" 
                dataKey="criticalRiskVerification" 
                stroke="#82ca9d" 
                name="Critical Risk Verification" 
                isAnimationActive={false} // Disable animation to avoid flicker
              />
              <Line 
                type="monotone" 
                dataKey="electricalCompliance" 
                stroke="#ffc658" 
                name="Electrical Compliance" 
                isAnimationActive={false} // Disable animation to avoid flicker
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default TrendCharts;