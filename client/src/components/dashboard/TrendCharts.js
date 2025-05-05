import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { fetchReports } from '../services/api';
import CompanyFilter from './CompanyFilter';

const TrendCharts = ({ selectedPeriod = 'current' }) => {
  const [incidentData, setIncidentData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState(null); // Add company filter state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString()); // Default to current year
  const [availableYears, setAvailableYears] = useState([]);

  // Helper function to ensure valid period names and extract month/year
  const processPeriod = (period) => {
    if (!period || period === '123') return { name: 'Missing', month: 0, year: selectedYear };
    
    // Try to extract month and year from common formats
    let month = 0;
    let year = selectedYear;

    // Handle "Q1 2025" format
    const quarterMatch = period.match(/Q(\d)\s*(\d{4})?/i);
    if (quarterMatch) {
      const quarter = parseInt(quarterMatch[1]);
      month = quarter * 3 - 2; // Q1 -> 1, Q2 -> 4, Q3 -> 7, Q4 -> 10
      if (quarterMatch[2]) year = quarterMatch[2];
      return { name: `Q${quarter} ${year}`, month, year };
    }
    
    // Handle month name formats like "Jan 2025" or "January"
    const monthNames = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];
    
    const monthMatch = new RegExp(`(${monthNames.join('|')})[a-z]*\\s*(\\d{4})?`, 'i');
    const matches = period.match(monthMatch);
    
    if (matches) {
      const monthName = matches[1].toLowerCase();
      month = monthNames.findIndex(m => m === monthName) + 1;
      if (matches[2]) year = matches[2];
      return { name: period, month, year };
    }
    
    // Default case - just return the original period
    return { name: period, month, year };
  };

  // Create memoized load function to prevent unnecessary rerenders
  const loadTrendData = useCallback(async () => {
    // Throttle API calls - only fetch if it's been at least 30 seconds
    const now = Date.now();
    if (now - lastFetchTime < 30000 && incidentData.length > 0) {
      return; // Skip this fetch if we've fetched recently
    }
    
    try {
      setDataLoading(true);
      const reports = await fetchReports();
      setLastFetchTime(now);
      
      if (!reports || reports.length === 0) {
        console.warn('No reports data available');
        // Create placeholder data
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
      
      // Extract all years from report data
      const years = [...new Set(reports.map(report => {
        const processedPeriod = processPeriod(report.reportPeriod);
        return processedPeriod.year;
      }))]
      .filter(year => !isNaN(parseInt(year)))
      .sort((a, b) => b - a); // Sort descending
      
      setAvailableYears(years);
      
      // Filter reports by company if one is selected
      let filteredReports = reports;
      if (selectedCompany) {
        filteredReports = reports.filter(report => report.companyName === selectedCompany);
      }
      
      // Further filter by selected year
      if (selectedYear) {
        filteredReports = filteredReports.filter(report => {
          const processedPeriod = processPeriod(report.reportPeriod);
          return processedPeriod.year === selectedYear;
        });
      }
      
      // Group reports by month/period for aggregate data
      const monthlyData = {};
      const monthlyKPIs = {};
      
      filteredReports.forEach(report => {
        // Process the period to get standardized name and month
        const processedPeriod = processPeriod(report.reportPeriod);
        
        // IMPORTANT: For "All Companies" view, we need to aggregate by month/year only
        // For company-specific views, we can keep the original period labels
        let periodKey;
        let displayName;
        
        if (selectedCompany) {
          // When a specific company is selected, use the period as-is
          periodKey = `${processedPeriod.month}-${processedPeriod.year}`;
          displayName = processedPeriod.name;
        } else {
          // For "All Companies" view, standardize the month names to ensure proper aggregation
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          periodKey = `${processedPeriod.month}-${processedPeriod.year}`;
          
          // Create standardized display names for the x-axis
          if (processedPeriod.month > 0 && processedPeriod.month <= 12) {
            displayName = `${monthNames[processedPeriod.month-1]} ${processedPeriod.year}`;
          } else if (processedPeriod.name.startsWith('Q')) {
            // Keep quarter format (Q1, Q2, etc.)
            displayName = processedPeriod.name;
          } else {
            // Default fallback
            displayName = `${processedPeriod.month}-${processedPeriod.year}`;
          }
        }
        
        // Initialize or update monthly data
        if (!monthlyData[periodKey]) {
          monthlyData[periodKey] = {
            name: displayName,
            month: processedPeriod.month,
            year: processedPeriod.year,
            incidents: 0,
            nearMisses: 0,
            firstAid: 0,
            medicalTreatments: 0,
            count: 0 // Count of reports aggregated
          };
        }
        
        // Extract and add metrics data
        const incidents = report.metrics?.lagging?.incidentCount ?? 
                          report.metrics?.totalIncidents ?? 0;
                          
        const nearMisses = report.metrics?.lagging?.nearMissCount ?? 
                           report.metrics?.totalNearMisses ?? 0;
                           
        const firstAid = report.metrics?.lagging?.firstAidCount ?? 
                         report.metrics?.firstAidCount ?? 0;
                         
        const medicalTreatments = report.metrics?.lagging?.medicalTreatmentCount ?? 
                                  report.metrics?.medicalTreatmentCount ?? 0;
        
        // Add metrics to monthly total
        monthlyData[periodKey].incidents += incidents;
        monthlyData[periodKey].nearMisses += nearMisses;
        monthlyData[periodKey].firstAid += firstAid;
        monthlyData[periodKey].medicalTreatments += medicalTreatments;
        monthlyData[periodKey].count += 1;
        
        // KPI data processing (similar approach)
        if (!monthlyKPIs[periodKey]) {
          monthlyKPIs[periodKey] = {
            name: displayName,
            month: processedPeriod.month,
            year: processedPeriod.year,
            nearMissRate: 0,
            criticalRiskVerification: 0,
            electricalCompliance: 0,
            count: 0
          };
        }
        
        // Extract KPIs
        const kpis = report.metrics?.leading?.kpis || [];
        
        // Process KPIs
        kpis.forEach(kpi => {
          if (kpi.id === 'nearMissRate') {
            monthlyKPIs[periodKey].nearMissRate += (kpi.actual || 0);
          } else if (kpi.id === 'criticalRiskVerification') {
            monthlyKPIs[periodKey].criticalRiskVerification += (kpi.actual || 0);
          } else if (kpi.id === 'electricalSafetyCompliance') {
            monthlyKPIs[periodKey].electricalCompliance += (kpi.actual || 0);
          }
        });
        
        monthlyKPIs[periodKey].count += 1;
      });
      
      // Convert to arrays and calculate averages for KPIs
      const monthlyDataArray = Object.values(monthlyData)
        .sort((a, b) => (a.year === b.year) 
          ? a.month - b.month 
          : a.year - b.year);
      
      const monthlyKPIsArray = Object.values(monthlyKPIs)
        .map(item => {
          // Calculate averages
          if (item.count > 0) {
            item.nearMissRate /= item.count;
            item.criticalRiskVerification /= item.count;
            item.electricalCompliance /= item.count;
          }
          return item;
        })
        .sort((a, b) => (a.year === b.year) 
          ? a.month - b.month 
          : a.year - b.year);
      
      setIncidentData(monthlyDataArray);
      setKpiData(monthlyKPIsArray);
      setError(null);
    } catch (err) {
      console.error('Error loading trend data:', err);
      setError(err.message);
      
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
    } finally {
      setDataLoading(false);
    }
  }, [lastFetchTime, incidentData.length, selectedCompany, selectedYear]);

  useEffect(() => {
    // Initial data load
    loadTrendData();
    
    // Set up refresh interval - every 60 seconds
    const intervalId = setInterval(loadTrendData, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [loadTrendData]);

  // Handle company filter change
  const handleCompanyChange = (company) => {
    setSelectedCompany(company);
  };

  // Handle year filter change
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  if (dataLoading && incidentData.length === 0) {
    return <div className="text-center py-10">Loading trend data...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="p-4 bg-white rounded shadow">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">Incident & Near Miss Trends</h2>
          
          <div className="flex gap-4 items-center">
            {/* Company filter */}
            <div className="w-48">
              <CompanyFilter 
                onChange={handleCompanyChange} 
                selectedCompany={selectedCompany} 
              />
            </div>
            
            {/* Year filter */}
            <div>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedYear}
                onChange={handleYearChange}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
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

export default TrendCharts;

// // client/src/components/dashboard/TrendCharts.js
// import React, { useEffect, useState, useCallback } from 'react';
// import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
// import { fetchReports } from '../services/api';

// const TrendCharts = ({ onCompanyChange, selectedCompany, enableYearFilter = false }) => {
//   const [incidentData, setIncidentData] = useState([]);
//   const [kpiData, setKpiData] = useState([]);
//   const [dataLoading, setDataLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [lastFetchTime, setLastFetchTime] = useState(0);
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [availableYears, setAvailableYears] = useState([]);
//   const [companies, setCompanies] = useState([]);

//   // Helper function to ensure valid period names
//   const formatPeriod = (period) => {
//     if (!period || period === '123') return 'Missing';
//     return period;
//   };

//   // Get the year from a period string like "Q1 2024" or "Jan 2024"
//   const extractYearFromPeriod = (period) => {
//     if (!period) return null;
    
//     // Try to extract a 4-digit year
//     const yearMatch = period.match(/\b(20\d{2})\b/);
//     if (yearMatch && yearMatch[1]) {
//       return parseInt(yearMatch[1]);
//     }
    
//     return null; // No year found
//   };

//   // Create memoized load function to prevent unnecessary rerenders
//   const loadTrendData = useCallback(async () => {
//     // Throttle API calls - only fetch if it's been at least 30 seconds
//     const now = Date.now();
//     if (now - lastFetchTime < 30000 && incidentData.length > 0) {
//       return; // Skip this fetch
//     }
    
//     try {
//       setDataLoading(true);
//       const reports = await fetchReports();
//       setLastFetchTime(now);
      
//       if (!reports || reports.length === 0) {
//         console.warn('No reports data available');
//         // Create placeholder data if no reports
//         const placeholderData = [
//           { name: 'Q1', incidents: 0, nearMisses: 0 },
//           { name: 'Q2', incidents: 0, nearMisses: 0 },
//         ];
//         setIncidentData(placeholderData);
        
//         const placeholderKpiData = [
//           { 
//             name: 'Q1', 
//             nearMissRate: 0, 
//             criticalRiskVerification: 0, 
//             electricalCompliance: 0 
//           },
//           { 
//             name: 'Q2', 
//             nearMissRate: 0, 
//             criticalRiskVerification: 0, 
//             electricalCompliance: 0 
//           },
//         ];
//         setKpiData(placeholderKpiData);
//         setDataLoading(false);
//         return;
//       }
      
//       // Extract unique companies
//       const uniqueCompanies = [...new Set(reports.map(report => report.companyName))];
//       setCompanies(['All Companies', ...uniqueCompanies]);
      
//       // Extract all years from report periods
//       const years = reports
//         .map(report => extractYearFromPeriod(report.reportPeriod))
//         .filter(year => year !== null);
      
//       // Get unique years and sort
//       const uniqueYears = [...new Set(years)].sort();
//       setAvailableYears(uniqueYears.length > 0 ? uniqueYears : [new Date().getFullYear()]);
      
//       // Filter reports by company if selected
//       let filteredReports = reports;
//       if (selectedCompany && selectedCompany !== 'All Companies') {
//         filteredReports = reports.filter(report => report.companyName === selectedCompany);
//       }
      
//       // Filter reports by year if enabled
//       if (enableYearFilter && selectedYear) {
//         filteredReports = filteredReports.filter(report => {
//           const reportYear = extractYearFromPeriod(report.reportPeriod);
//           return reportYear === selectedYear;
//         });
//       }
      
//       // Process incident data with fallbacks for different data structures
//       const trendData = filteredReports.map((report) => {
//         // First try regular structure
//         let incidents = report.metrics?.lagging?.incidentCount;
//         if (incidents === undefined) {
//           // Try flattened structure
//           incidents = report.metrics?.totalIncidents;
//         }
//         if (incidents === undefined) {
//           // Last resort direct property
//           incidents = report.totalIncidents;
//         }
//         incidents = incidents ?? 0;

//         // Same fallback pattern for near misses
//         let nearMisses = report.metrics?.lagging?.nearMissCount;
//         if (nearMisses === undefined) {
//           nearMisses = report.metrics?.totalNearMisses;
//         }
//         if (nearMisses === undefined) {
//           nearMisses = report.totalNearMisses;
//         }
//         nearMisses = nearMisses ?? 0;

//         return {
//           name: formatPeriod(report.reportPeriod),
//           incidents: incidents,
//           nearMisses: nearMisses,
//         };
//       });

//       // Sort data chronologically if possible
//       const sortedData = [...trendData].sort((a, b) => {
//         // First compare years if they exist
//         const yearA = extractYearFromPeriod(a.name) || 0;
//         const yearB = extractYearFromPeriod(b.name) || 0;
        
//         if (yearA !== yearB) {
//           return yearA - yearB;
//         }
        
//         // For quarters (Q1, Q2, etc)
//         if (a.name.startsWith('Q') && b.name.startsWith('Q')) {
//           const quarterA = parseInt(a.name.charAt(1)) || 0;
//           const quarterB = parseInt(b.name.charAt(1)) || 0;
//           return quarterA - quarterB;
//         }
        
//         // For months (Jan, Feb, etc)
//         const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//         const monthA = months.findIndex(m => a.name.startsWith(m));
//         const monthB = months.findIndex(m => b.name.startsWith(m));
        
//         if (monthA !== -1 && monthB !== -1) {
//           return monthA - monthB;
//         }
        
//         // Default to string comparison
//         return a.name.localeCompare(b.name);
//       });

//       setIncidentData(sortedData);

//       // Process KPI data with proper fallbacks
//       const kpiTrend = filteredReports.map((report) => {
//         // Try different possible KPI data paths
//         const kpis = report.metrics?.leading?.kpis || report.kpis || [];
        
//         // Find metrics with fallbacks
//         const findMetric = (id, defaultValue = 0) => {
//           const kpi = kpis.find(k => k.id === id);
//           return kpi?.actual ?? defaultValue;
//         };

//         return {
//           name: formatPeriod(report.reportPeriod),
//           nearMissRate: findMetric('nearMissRate'),
//           criticalRiskVerification: findMetric('criticalRiskVerification'),
//           electricalCompliance: findMetric('electricalSafetyCompliance'),
//         };
//       });

//       // Sort KPI data the same way
//       const sortedKpiData = [...kpiTrend].sort((a, b) => {
//         // First compare years if they exist
//         const yearA = extractYearFromPeriod(a.name) || 0;
//         const yearB = extractYearFromPeriod(b.name) || 0;
        
//         if (yearA !== yearB) {
//           return yearA - yearB;
//         }
        
//         // For quarters (Q1, Q2, etc)
//         if (a.name.startsWith('Q') && b.name.startsWith('Q')) {
//           const quarterA = parseInt(a.name.charAt(1)) || 0;
//           const quarterB = parseInt(b.name.charAt(1)) || 0;
//           return quarterA - quarterB;
//         }
        
//         // For months (Jan, Feb, etc)
//         const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//         const monthA = months.findIndex(m => a.name.startsWith(m));
//         const monthB = months.findIndex(m => b.name.startsWith(m));
        
//         if (monthA !== -1 && monthB !== -1) {
//           return monthA - monthB;
//         }
        
//         // Default to string comparison
//         return a.name.localeCompare(b.name);
//       });

//       setKpiData(sortedKpiData);
//       setError(null);
//       setDataLoading(false);
//     } catch (err) {
//       console.error('Error loading trend data:', err);
//       setError(err.message);
//       setDataLoading(false);
      
//       // Only set fallback data if we don't already have data
//       if (incidentData.length === 0) {
//         // Set fallback data on error
//         const fallbackData = [
//           { name: 'Q1', incidents: 0, nearMisses: 0 },
//           { name: 'Q2', incidents: 0, nearMisses: 0 },
//         ];
//         setIncidentData(fallbackData);
        
//         const fallbackKpiData = [
//           { 
//             name: 'Q1', 
//             nearMissRate: 0, 
//             criticalRiskVerification: 0, 
//             electricalCompliance: 0 
//           },
//           { 
//             name: 'Q2', 
//             nearMissRate: 0, 
//             criticalRiskVerification: 0, 
//             electricalCompliance: 0 
//           },
//         ];
//         setKpiData(fallbackKpiData);
//       }
//     }
//   }, [lastFetchTime, incidentData.length, selectedCompany, selectedYear, enableYearFilter]);

//   // Handle company selection
//   const handleCompanyChange = (e) => {
//     const company = e.target.value;
//     const companyValue = company === 'All Companies' ? null : company;
    
//     // Update internal state
//     // setSelectedCompany(companyValue);
    
//     // Notify parent component if callback provided
//     if (onCompanyChange) {
//       onCompanyChange(companyValue);
//     }
//   };
  
//   // Handle year selection
//   const handleYearChange = (e) => {
//     const year = parseInt(e.target.value);
//     setSelectedYear(year);
//   };

//   useEffect(() => {
//     // Initial data load
//     loadTrendData();
    
//     // Set up refresh interval - every 60 seconds
//     const intervalId = setInterval(loadTrendData, 60000);
    
//     // Clean up interval on unmount
//     return () => clearInterval(intervalId);
//   }, [loadTrendData]);

//   // Reload when selected company or year changes
//   useEffect(() => {
//     loadTrendData();
//   }, [selectedCompany, selectedYear, loadTrendData]);

//   if (dataLoading && incidentData.length === 0) {
//     return <div className="text-center py-10">Loading trend data...</div>;
//   }

//   return (
//     <div className="space-y-6">
//       <div className="p-4 bg-white rounded shadow">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold">Incident & Near Miss Trends</h2>
          
//           <div className="flex items-center space-x-4">
//             {/* Company Filter */}
//             <div className="flex items-center">
//               <label htmlFor="company-filter" className="mr-2 text-sm font-medium text-gray-700">
//                 Company:
//               </label>
//               <select
//                 id="company-filter"
//                 value={selectedCompany || 'All Companies'}
//                 onChange={handleCompanyChange}
//                 className="bg-white border border-gray-300 text-gray-700 py-1 px-3 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//               >
//                 {companies.map((company, index) => (
//                   <option key={index} value={company}>{company}</option>
//                 ))}
//               </select>
//             </div>
            
//             {/* Year Filter (only shown if enabled) */}
//             {enableYearFilter && availableYears.length > 0 && (
//               <div className="flex items-center">
//                 <label htmlFor="year-filter" className="mr-2 text-sm font-medium text-gray-700">
//                   Year:
//                 </label>
//                 <select
//                   id="year-filter"
//                   value={selectedYear}
//                   onChange={handleYearChange}
//                   className="bg-white border border-gray-300 text-gray-700 py-1 px-3 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                 >
//                   {availableYears.map(year => (
//                     <option key={year} value={year}>{year}</option>
//                   ))}
//                 </select>
//               </div>
//             )}
//           </div>
//         </div>
        
//         {incidentData.length === 0 ? (
//           <p className="text-gray-500 text-center py-8">No incident data available</p>
//         ) : (
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={incidentData}>
//               <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
//               <XAxis dataKey="name" />
//               <YAxis allowDecimals={false} />
//               <Tooltip />
//               <Legend />
//               <Line 
//                 type="monotone" 
//                 dataKey="incidents" 
//                 stroke="#8884d8" 
//                 name="Incidents" 
//                 activeDot={{ r: 8 }}
//                 isAnimationActive={false} // Disable animation to avoid flicker
//               />
//               <Line 
//                 type="monotone" 
//                 dataKey="nearMisses" 
//                 stroke="#82ca9d" 
//                 name="Near Misses" 
//                 isAnimationActive={false} // Disable animation to avoid flicker
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         )}
//       </div>

//       <div className="p-4 bg-white rounded shadow">
//         <h2 className="text-xl font-semibold mb-4">KPI Trends</h2>
//         {kpiData.length === 0 ? (
//           <p className="text-gray-500 text-center py-8">No KPI data available</p>
//         ) : (
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={kpiData}>
//               <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
//               <XAxis dataKey="name" />
//               <YAxis domain={[0, 100]} allowDecimals={false} />
//               <Tooltip />
//               <Legend />
//               <Line 
//                 type="monotone" 
//                 dataKey="nearMissRate" 
//                 stroke="#8884d8" 
//                 name="Near Miss Rate" 
//                 isAnimationActive={false} // Disable animation to avoid flicker
//               />
//               <Line 
//                 type="monotone" 
//                 dataKey="criticalRiskVerification" 
//                 stroke="#82ca9d" 
//                 name="Critical Risk Verification" 
//                 isAnimationActive={false} // Disable animation to avoid flicker
//               />
//               <Line 
//                 type="monotone" 
//                 dataKey="electricalCompliance" 
//                 stroke="#ffc658" 
//                 name="Electrical Compliance" 
//                 isAnimationActive={false} // Disable animation to avoid flicker
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         )}
//       </div>
      
//       {error && (
//         <div className="text-sm text-red-600 p-2 rounded bg-red-50 border border-red-200">
//           Error loading trend data: {error}. Showing cached or placeholder data.
//         </div>
//       )}
//     </div>
//   );
// };

// export default TrendCharts;