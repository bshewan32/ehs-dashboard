import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { fetchReports } from '../services/api';
import { parseReportPeriod } from '../components/dashboard/periodUtils';

const ImprovedTrendCharts = ({ periodFilter, companyFilter }) => {
  const [incidentData, setIncidentData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Create memoized load function to prevent unnecessary rerenders
  const loadTrendData = useCallback(async () => {
    // Throttle API calls - only fetch if it's been at least 30 seconds or period changed
    const now = Date.now();
    if (now - lastFetchTime < 30000 && incidentData.length > 0 && !periodFilter) {
      return; // Skip this fetch
    }
    
    try {
      setDataLoading(true);
      const reports = await fetchReports();
      setLastFetchTime(now);
      
      // First filter reports by period if a period filter is provided
      let filteredReports = reports;
      if (periodFilter) {
        filteredReports = filterReportsByPeriod(reports, periodFilter);
      }
      
      // Then filter by company if a company filter is provided
      if (companyFilter) {
        filteredReports = filteredReports.filter(report => 
          report.companyName === companyFilter);
      }
      
      console.log(`Using ${filteredReports.length} of ${reports.length} reports for trend charts`);
      
      if (!filteredReports || filteredReports.length === 0) {
        console.warn('No reports data available after filtering');
        setPlaceholderData();
        return;
      }

      // 1. Extract unique periods from reports
      const periods = extractUniquePeriods(filteredReports);
      
      // 2. Process data by period (this is where we'll aggregate by time period)
      processIncidentDataByPeriod(filteredReports, periods);
      processKpiDataByPeriod(filteredReports, periods);
      
      setError(null);
      setDataLoading(false);
    } catch (err) {
      console.error('Error loading trend data:', err);
      setError(err.message);
      setDataLoading(false);
      
      // Set fallback data if we don't have any
      if (incidentData.length === 0) {
        setPlaceholderData();
      }
    }
  }, [lastFetchTime, incidentData.length, periodFilter, companyFilter]);

  // Set placeholder data for empty states
  const setPlaceholderData = () => {
    const placeholderData = [
      { name: 'Jan', incidents: 0, nearMisses: 0 },
      { name: 'Feb', incidents: 0, nearMisses: 0 },
      { name: 'Mar', incidents: 0, nearMisses: 0 },
    ];
    setIncidentData(placeholderData);
    
    const placeholderKpiData = [
      { name: 'Jan', nearMissRate: 0, criticalRiskVerification: 0, electricalCompliance: 0 },
      { name: 'Feb', nearMissRate: 0, criticalRiskVerification: 0, electricalCompliance: 0 },
      { name: 'Mar', nearMissRate: 0, criticalRiskVerification: 0, electricalCompliance: 0 },
    ];
    setKpiData(placeholderKpiData);
  };

  // Extract unique periods from reports and sort them chronologically
  const extractUniquePeriods = (reports) => {
    // Create a map of period string to date object for sorting
    const periodMap = new Map();
    
    reports.forEach(report => {
      const periodString = report.reportPeriod;
      const date = parseReportPeriod(periodString);
      
      if (date) {
        periodMap.set(periodString, date);
      } else {
        // If we can't parse the date, still include the period
        periodMap.set(periodString, new Date(0)); // Use epoch as fallback
      }
    });
    
    // Sort periods by date
    const sortedPeriods = [...periodMap.entries()].sort((a, b) => a[1] - b[1]);
    
    // Return the sorted period strings
    return sortedPeriods.map(entry => entry[0]);
  };

  // Process incident data by period
  const processIncidentDataByPeriod = (reports, sortedPeriods) => {
    // Create data structure with all periods
    const periodData = sortedPeriods.map(period => ({
      name: formatPeriodForDisplay(period),
      rawPeriod: period,
      incidents: 0,
      nearMisses: 0,
      companies: new Set() // Track companies for averaging
    }));
    
    // Aggregate data by period
    reports.forEach(report => {
      const periodIndex = sortedPeriods.findIndex(p => p === report.reportPeriod);
      
      if (periodIndex !== -1) {
        const periodEntry = periodData[periodIndex];
        periodEntry.companies.add(report.companyName);
        
        // Add incident counts
        const incidentCount = report.metrics?.lagging?.incidentCount ?? 
                             report.metrics?.totalIncidents ?? 0;
        periodEntry.incidents += incidentCount;
        
        // Add near miss counts
        const nearMissCount = report.metrics?.lagging?.nearMissCount ?? 
                             report.metrics?.totalNearMisses ?? 0;
        periodEntry.nearMisses += nearMissCount;
      }
    });
    
    // If not filtering by company, average the data by number of companies in each period
    if (!companyFilter) {
      periodData.forEach(period => {
        const companyCount = period.companies.size || 1;
        period.incidents = Math.round(period.incidents / companyCount);
        period.nearMisses = Math.round(period.nearMisses / companyCount);
        delete period.companies; // Remove the set before setting state
      });
    } else {
      // If filtering by company, just remove the companies set
      periodData.forEach(period => {
        delete period.companies;
      });
    }
    
    setIncidentData(periodData);
  };

  // Process KPI data by period
  const processKpiDataByPeriod = (reports, sortedPeriods) => {
    // Create data structure with all periods
    const periodData = sortedPeriods.map(period => ({
      name: formatPeriodForDisplay(period),
      rawPeriod: period,
      nearMissRate: 0,
      criticalRiskVerification: 0,
      electricalCompliance: 0,
      kpiCounts: {
        nearMissRate: 0,
        criticalRiskVerification: 0,
        electricalCompliance: 0
      },
      companies: new Set() // Track companies for averaging
    }));
    
    // Aggregate data by period
    reports.forEach(report => {
      const periodIndex = sortedPeriods.findIndex(p => p === report.reportPeriod);
      
      if (periodIndex !== -1) {
        const periodEntry = periodData[periodIndex];
        periodEntry.companies.add(report.companyName);
        
        // Get KPIs from the report
        const kpis = report.metrics?.leading?.kpis || [];
        
        // Process each KPI
        kpis.forEach(kpi => {
          switch (kpi.id) {
            case 'nearMissRate':
              periodEntry.nearMissRate += kpi.actual || 0;
              periodEntry.kpiCounts.nearMissRate++;
              break;
            case 'criticalRiskVerification':
              periodEntry.criticalRiskVerification += kpi.actual || 0;
              periodEntry.kpiCounts.criticalRiskVerification++;
              break;
            case 'electricalSafetyCompliance':
              periodEntry.electricalCompliance += kpi.actual || 0;
              periodEntry.kpiCounts.electricalCompliance++;
              break;
            default:
              // Skip other KPIs
              break;
          }
        });
      }
    });
    
    // Calculate averages
    periodData.forEach(period => {
      // Average each KPI by the number of reports that had it
      period.nearMissRate = period.kpiCounts.nearMissRate > 0 
        ? period.nearMissRate / period.kpiCounts.nearMissRate 
        : 0;
        
      period.criticalRiskVerification = period.kpiCounts.criticalRiskVerification > 0 
        ? period.criticalRiskVerification / period.kpiCounts.criticalRiskVerification 
        : 0;
        
      period.electricalCompliance = period.kpiCounts.electricalCompliance > 0 
        ? period.electricalCompliance / period.kpiCounts.electricalCompliance 
        : 0;
      
      // Round values to 1 decimal place
      period.nearMissRate = Math.round(period.nearMissRate * 10) / 10;
      period.criticalRiskVerification = Math.round(period.criticalRiskVerification * 10) / 10;
      period.electricalCompliance = Math.round(period.electricalCompliance * 10) / 10;
      
      // Clean up helper properties
      delete period.kpiCounts;
      delete period.companies;
    });
    
    setKpiData(periodData);
  };

  // Helper function to filter reports by period
  const filterReportsByPeriod = (reports, periodFilter) => {
    if (!periodFilter || !reports || reports.length === 0) {
      return reports;
    }

    const currentDate = new Date();
    
    switch (periodFilter.type) {
      case 'month':
        // Filter for specific month and year
        return reports.filter(report => {
          const reportDate = parseReportPeriod(report.reportPeriod);
          if (!reportDate) return false;
          
          return reportDate.getMonth() === periodFilter.month && 
                 reportDate.getFullYear() === periodFilter.year;
        });
        
      case 'range':
        // Filter for last X months
        const monthsAgo = new Date();
        monthsAgo.setMonth(currentDate.getMonth() - periodFilter.months);
        
        return reports.filter(report => {
          const reportDate = parseReportPeriod(report.reportPeriod);
          if (!reportDate) return false;
          
          return reportDate >= monthsAgo;
        });
        
      case 'quarter':
        // Filter for specific quarter
        const quarterStartMonth = (periodFilter.quarter - 1) * 3;
        const quarterEndMonth = quarterStartMonth + 2;
        
        return reports.filter(report => {
          // For quarterly reports, check if it's directly a quarterly report
          if (report.reportType === 'Quarterly' && report.reportPeriod.includes(`Q${periodFilter.quarter}`)) {
            return true;
          }
          
          // For monthly reports, check if the month falls in the quarter
          const reportDate = parseReportPeriod(report.reportPeriod);
          if (!reportDate) return false;
          
          const month = reportDate.getMonth();
          return month >= quarterStartMonth && 
                 month <= quarterEndMonth && 
                 reportDate.getFullYear() === periodFilter.year;
        });
        
      case 'ytd':
        // Filter for current year
        const yearStart = new Date(currentDate.getFullYear(), 0, 1);
        
        return reports.filter(report => {
          const reportDate = parseReportPeriod(report.reportPeriod);
          if (!reportDate) return false;
          
          return reportDate >= yearStart;
        });
        
      case 'all':
      default:
        // No filtering
        return reports;
    }
  };

  // Format period string for better display
  const formatPeriodForDisplay = (periodString) => {
    if (!periodString) return 'Unknown';
    
    // Handle quarterly reports (Q1 2025)
    if (periodString.match(/^Q[1-4]\s+\d{4}$/)) {
      return periodString;
    }
    
    // Try to format into shorter month format
    try {
      const date = parseReportPeriod(periodString);
      if (date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
      }
    } catch (err) {
      // Just return the original string if we can't format it
    }
    
    return periodString;
  };

  useEffect(() => {
    // Initial data load
    loadTrendData();
    
    // Set up refresh interval - every 60 seconds
    const intervalId = setInterval(loadTrendData, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [loadTrendData]);

  // Reset last fetch time when period filter changes to force reload
  useEffect(() => {
    setLastFetchTime(0);
  }, [periodFilter, companyFilter]);

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
      
      {error && (
        <div className="text-sm text-red-600 p-2 rounded bg-red-50 border border-red-200">
          Error loading trend data: {error}. Showing cached or placeholder data.
        </div>
      )}
    </div>
  );
};

export default ImprovedTrendCharts;