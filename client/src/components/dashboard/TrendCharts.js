import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { fetchReports } from '../services/api';

const TrendCharts = () => {
  const [incidentData, setIncidentData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Helper function to ensure valid period names
  const formatPeriod = (period) => {
    if (!period || period === '123') return 'Missing';
    return period;
  };

  // Helper function to extract year from period if available
  const extractYearFromPeriod = (period) => {
    if (!period) return null;
    
    // Look for year pattern in the period string (e.g., "Q1 2025" or "Jan 2025")
    const yearMatch = period.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    
    return null;
  };

  // Create memoized load function to prevent unnecessary rerenders
  const loadTrendData = useCallback(async () => {
    // Throttle API calls - only fetch if it's been at least 30 seconds
    const now = Date.now();
    if (now - lastFetchTime < 30000 && incidentData.length > 0) {
      return; // Skip this fetch
    }
    
    try {
      setDataLoading(true);
      const reports = await fetchReports();
      setLastFetchTime(now);
      
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
          name: formatPeriod(report.reportPeriod),
          incidents: incidents,
          nearMisses: nearMisses,
          reportYear: extractYearFromPeriod(report.reportPeriod) || new Date(report.createdAt || Date.now()).getFullYear(),
          createdAt: report.createdAt || Date.now()
        };
      });

      // Sort data chronologically if possible
      const sortedData = [...trendData].sort((a, b) => {
        // First compare by year if available
        if (a.reportYear !== b.reportYear) {
          return a.reportYear - b.reportYear;
        }
        
        // Simple quarter comparison (Q1, Q2, etc)
        if (a.name.startsWith('Q') && b.name.startsWith('Q')) {
          return a.name.localeCompare(b.name);
        }
        
        // Sort by creation date as fallback
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      // Keep all incident data for historical trending
      setIncidentData(sortedData);

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
          name: formatPeriod(report.reportPeriod),
          nearMissRate: findMetric('nearMissRate'),
          criticalRiskVerification: findMetric('criticalRiskVerification'),
          electricalCompliance: findMetric('electricalSafetyCompliance'),
          reportYear: extractYearFromPeriod(report.reportPeriod) || new Date(report.createdAt || Date.now()).getFullYear(),
          createdAt: report.createdAt || Date.now()
        };
      });

      // Sort KPI data the same way
      const sortedKpiData = [...kpiTrend].sort((a, b) => {
        // First compare by year if available
        if (a.reportYear !== b.reportYear) {
          return a.reportYear - b.reportYear;
        }
        
        if (a.name.startsWith('Q') && b.name.startsWith('Q')) {
          return a.name.localeCompare(b.name);
        }
        
        // Sort by creation date as fallback
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      // Filter KPI data to only current year
      const currentYearKpiData = sortedKpiData.filter(item => item.reportYear === selectedYear);
      
      setKpiData(currentYearKpiData.length > 0 ? currentYearKpiData : sortedKpiData);
      setError(null);
      setDataLoading(false);
    } catch (err) {
      console.error('Error loading trend data:', err);
      setError(err.message);
      setDataLoading(false);
      
      // Only set fallback data if we don't already have data
      if (incidentData.length === 0) {
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
    }
  }, [lastFetchTime, incidentData.length, selectedYear]);

  useEffect(() => {
    // Initial data load
    loadTrendData();
    
    // Set up refresh interval - every 60 seconds
    const intervalId = setInterval(loadTrendData, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [loadTrendData]);

  // Function to handle year change
  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  // Get a list of available years from data
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = new Set([currentYear]);
    
    // Extract unique years from both datasets
    [...incidentData, ...kpiData].forEach(item => {
      if (item.reportYear) {
        years.add(item.reportYear);
      }
    });
    
    return Array.from(years).sort().reverse();
  };

  if (dataLoading && incidentData.length === 0) {
    return <div className="text-center py-10">Loading trend data...</div>;
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">KPI Trends</h2>
          <div className="flex items-center">
            <label htmlFor="yearFilter" className="mr-2 text-sm text-gray-600">Year:</label>
            <select 
              id="yearFilter" 
              className="border rounded px-2 py-1 text-sm"
              value={selectedYear}
              onChange={handleYearChange}
            >
              {getAvailableYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        {kpiData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No KPI data available for {selectedYear}</p>
        ) : (
          <>
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
            <div className="mt-2 text-xs text-blue-600 text-center">
              Showing KPI data for {selectedYear} only
            </div>
          </>
        )}
      </div>
      
      {error && (
        <div className="text-sm text-red-600 p-2 rounded bg-red-50 border border-red-200">
          Error loading trend data: {error}. Showing cached or placeholder data.
        </div>
      )}
    </div>
  );
};

export default TrendCharts;