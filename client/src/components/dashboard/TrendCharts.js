import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { fetchReports } from '../services/api';
import CompanyFilter from './CompanyFilter';

const TrendCharts = ({ selectedCompany: propSelectedCompany }) => {
  const [incidentData, setIncidentData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(propSelectedCompany || null);
  const [allReports, setAllReports] = useState([]); // Store all reports
  const lastFetchTimeRef = useRef(null); // Track when we last successfully fetched data
  const reportCountRef = useRef(0); // Track report count to detect changes
  const processingRef = useRef(false); // Prevent concurrent processing

  // Helper function to ensure valid period names
  const formatPeriod = (period) => {
    if (!period || period === '123') return 'Missing';
    return period;
  };

  // Update local selectedCompany when prop changes
  useEffect(() => {
    if (propSelectedCompany !== undefined) {
      setSelectedCompany(propSelectedCompany);
    }
  }, [propSelectedCompany]);

  const handleCompanyChange = useCallback((company) => {
    setSelectedCompany(company);
    if (allReports.length > 0) {
      processReportsData(allReports, company);
    }
  }, [allReports]);

  const processReportsData = useCallback((reports, companyFilter = null) => {
    // Prevent concurrent processing
    if (processingRef.current) return;
    processingRef.current = true;

    try {
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

      setKpiData(sortedKpiData);
    } finally {
      processingRef.current = false;
    }
  }, []);

  // Function to fetch data with throttling
  const fetchData = useCallback(async (forceRefresh = false) => {
    // Skip if already processing
    if (processingRef.current) return;
    
    try {
      // Throttle API calls - only fetch if it's been at least 5 minutes or forced
      const now = new Date();
      if (!forceRefresh && lastFetchTimeRef.current) {
        const timeSinceLastFetch = now - lastFetchTimeRef.current;
        const minimumInterval = 300000; // 5 minutes in milliseconds
        
        if (timeSinceLastFetch < minimumInterval) {
          console.log(`Skipping trend data fetch, last fetch was ${Math.round(timeSinceLastFetch/1000)}s ago`);
          return; // Skip this fetch cycle
        }
      }
      
      setDataLoading(true);
      
      // Use cache if available
      const cacheKey = 'trendReportsCache';
      const cacheData = localStorage.getItem(cacheKey);
      let reports;
      
      // Check if we have cached data and it's recent (less than 30 minutes old)
      if (!forceRefresh && cacheData) {
        const { data, timestamp } = JSON.parse(cacheData);
        const cacheAge = now - new Date(timestamp);
        
        if (cacheAge < 1800000) { // 30 minutes
          console.log('Using cached trend data', data.length, 'reports');
          reports = data;
          processReportsData(reports, selectedCompany);
          setAllReports(reports);
          setDataLoading(false);
          return;
        }
      }
      
      // Fetch fresh data
      reports = await fetchReports();
      lastFetchTimeRef.current = now;
      
      // Cache the fetched reports
      localStorage.setItem(cacheKey, JSON.stringify({
        data: reports,
        timestamp: now.toISOString()
      }));
      
      // Check if we have new reports
      if (reports.length !== reportCountRef.current) {
        console.log(`Report count changed from ${reportCountRef.current} to ${reports.length}`);
        reportCountRef.current = reports.length;
      }
      
      setAllReports(reports);
      processReportsData(reports, selectedCompany);
      setError(null);
    } catch (err) {
      console.error('Error loading trend data:', err);
      setError(err.message);
      
      // Use fallback data only if we don't already have data
      if (incidentData.length === 0) {
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
    } finally {
      setDataLoading(false);
    }
  }, [selectedCompany, processReportsData, incidentData.length]);

  // Initial data load
  useEffect(() => {
    // Initial load - force fetch regardless of time
    fetchData(true);
  }, [fetchData]);

  // Set up refresh timer with a longer interval
  useEffect(() => {
    // Refresh trend data every 5 minutes instead of every minute
    const intervalId = setInterval(() => {
      fetchData(false); // Not forced, will respect throttling
    }, 300000); // 5 minutes
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchData]);

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

  // When loading with no data, show loading state
  if (dataLoading && incidentData.length === 0 && kpiData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse flex flex-col items-center py-10">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-48 bg-gray-100 rounded w-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="mt-4 text-gray-500">Loading trend data...</div>
        </div>
      </div>
    );
  }

  // Show error if we have no data
  if (error && incidentData.length === 0 && kpiData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-10 text-red-600">
          <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Error loading trend data</h3>
          <p>{error}</p>
          <button 
            onClick={() => fetchData(true)} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Only show company filter if not provided from props */}
      {propSelectedCompany === undefined && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-md font-medium mb-3">Filter Trend Data</h3>
          <CompanyFilter 
            onChange={handleCompanyChange} 
            selectedCompany={selectedCompany} 
          />
        </div>
      )}
      
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Incident & Near Miss Trends
            {selectedCompany && <span className="text-blue-600 ml-2">({selectedCompany})</span>}
          </h2>
          {dataLoading && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
              Updating...
            </span>
          )}
        </div>
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

      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            KPI Trends
            {selectedCompany && <span className="text-blue-600 ml-2">({selectedCompany})</span>}
          </h2>
          {dataLoading && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full animate-pulse">
              Updating...
            </span>
          )}
        </div>
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
      
      <div className="text-xs text-gray-500 text-right">
        Last updated: {lastFetchTimeRef.current ? new Date(lastFetchTimeRef.current).toLocaleString() : 'Never'}
      </div>
    </div>
  );
};

export default TrendCharts;