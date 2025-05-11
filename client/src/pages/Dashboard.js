import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import AIPanel from '../components/dashboard/AIPanel';
import TrendCharts from '../components/dashboard/TrendCharts';
import TrainingMetrics from '../components/dashboard/TrainingMetrics';
import { fetchMetricsSummary } from '../components/services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [exporting, setExporting] = useState(false); // Add this state variable

  // Setup default KPIs to ensure they're always available
  const defaultKpis = [
    { 
      id: 'nearMissRate',
      name: 'Near Miss Reporting Rate',
      actual: 0,
      target: 100,
      unit: '%' 
    },
    { 
      id: 'criticalRiskVerification',
      name: 'Critical Risk Control Verification',
      actual: 0,
      target: 95,
      unit: '%' 
    },
    { 
      id: 'electricalSafetyCompliance',
      name: 'Electrical Safety Compliance',
      actual: 0,
      target: 100,
      unit: '%' 
    },
  ];

  // Modify your fetchMetrics function to not depend on metrics
  const fetchMetrics = useCallback(async () => {
    // Throttle API calls - only fetch if it's been at least 10 seconds
    const now = Date.now();
    if (now - lastFetchTime < 10000) {
      console.log('Skipping fetch - too soon');
      return; // Skip this fetch if we've fetched recently
    }

    try {
      setLoading(true);
      
      // Use our API service instead of direct fetch
      const data = await fetchMetricsSummary();
      console.log('Fetched metrics:', data);
      setLastFetchTime(now);
      
      // Create a properly structured metrics object
      const processedMetrics = {
        // Ensure these properties exist with fallbacks
        totalIncidents: data.totalIncidents ?? 0,
        totalNearMisses: data.totalNearMisses ?? 0,
        firstAidCount: data.firstAidCount ?? 0,
        medicalTreatmentCount: data.medicalTreatmentCount ?? 0,
        trainingCompliance: data.trainingCompliance ?? 0,
        riskScore: data.riskScore ?? 0,
        
        // Ensure the leading object exists
        leading: {
          ...data.leading,
          // Either use existing KPIs or defaults
          kpis: (data.leading?.kpis && data.leading.kpis.length > 0) 
            ? data.leading.kpis 
            : defaultKpis
        },
        
        // Create lagging metrics if they don't exist
        lagging: data.lagging || {
          incidentCount: data.totalIncidents ?? 0,
          nearMissCount: data.totalNearMisses ?? 0,
          firstAidCount: data.firstAidCount ?? 0,
          medicalTreatmentCount: data.medicalTreatmentCount ?? 0
        }
      };
      
      // Store processed metrics
      setMetrics(processedMetrics);
      setError(null);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError(error.message);
      
      // Only set fallback metrics if we don't already have metrics
      setMetrics(currentMetrics => {
        if (currentMetrics) return currentMetrics;
        return {
          totalIncidents: 0,
          totalNearMisses: 0,
          firstAidCount: 0,
          medicalTreatmentCount: 0,
          trainingCompliance: 0,
          riskScore: 0,
          lagging: {
            incidentCount: 0,
            nearMissCount: 0,
            firstAidCount: 0,
            medicalTreatmentCount: 0
          },
          leading: {
            trainingCompleted: 0,
            inspectionsCompleted: 0,
            kpis: defaultKpis
          }
        };
      });
    } finally {
      setLoading(false);
    }
  }, [lastFetchTime, defaultKpis]); // Remove metrics from dependencies

  useEffect(() => {
    // Initial fetch
    fetchMetrics();
    
    // Set up a controlled interval for refreshing data
    const intervalId = setInterval(fetchMetrics, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchMetrics]);

  const exportToPDF = async () => {
    const dashboardElement = document.getElementById('dashboard-content');
    if (!dashboardElement) return;
    
    try {
      // Show loading indicator
      setExporting(true);
      
      // Create a PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Create a canvas from the dashboard
      const canvas = await html2canvas(dashboardElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false
      });
      
      // Add title
      pdf.setFontSize(16);
      pdf.text('EHS Dashboard Report', 105, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
      
      // Add canvas image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 30, 190, 0);
      
      // Download the PDF
      pdf.save(`EHS_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting dashboard to PDF:', error);
      alert('Failed to export dashboard to PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div id="dashboard-content" className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="space-x-4">
          <button
            onClick={exportToPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700"
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export to PDF'}
          </button>
          <Link to="/report/new">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700">
              + Create New Report
            </button>
          </Link>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="text-center p-10 text-gray-500">
          <div className="text-xl">Loading dashboard data...</div>
        </div>
      ) : error && !metrics ? (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded shadow mb-4">
          <div className="font-bold">Error loading dashboard data</div>
          <div>{error}</div>
          <div className="mt-2">Using fallback data for display purposes.</div>
        </div>
      ) : null}

      <div className="space-y-6">
        {/* First row - Metrics Overview and Training Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <MetricsOverview metrics={metrics} />
          </div>
          <div>
            <TrainingMetrics />
          </div>
        </div>
        
        {/* Second row - KPI Overview */}
        <KPIOverview metrics={metrics} />
        
        {/* Third row - Trend Charts */}
        <TrendCharts />
        
        {/* Fourth row - AI Panel */}
        <AIPanel metrics={metrics} />
      </div>
      
      {/* Quick Links Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Link to="/reports" className="bg-white p-4 rounded shadow hover:shadow-md transition duration-200">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <span className="font-medium">Reports</span>
          </div>
        </Link>
        
        <Link to="/inspections" className="bg-white p-4 rounded shadow hover:shadow-md transition duration-200">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
            </svg>
            <span className="font-medium">Inspections</span>
          </div>
        </Link>
        
        <Link to="/training" className="bg-white p-4 rounded shadow hover:shadow-md transition duration-200">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            <span className="font-medium">Training</span>
          </div>
        </Link>
        
        <Link to="/debug" className="bg-white p-4 rounded shadow hover:shadow-md transition duration-200">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span className="font-medium">Debug Tools</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

// import React, { useEffect, useState, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import TrainingComplianceWidget from '../components/dashboard/TrainingComplianceWidget';
// import InspectionsWidget from '../components/dashboard/InspectionsWidget';
// import MetricsOverview from '../components/dashboard/MetricsOverview';
// import KPIOverview from '../components/dashboard/KPIOverview';
// import TrendCharts from '../components/dashboard/ImprovedTrendCharts';
// import DeepSeekAIPanel from '../components/dashboard/DeepSeekAIPanel';
// import PeriodSelector from '../components/dashboard/PeriodSelector';
// import CompanyFilter from '../components/dashboard/CompanyFilter';
// import { fetchMetricsSummary, fetchReports, fetchMetricsForPeriod } from '../components/services/api';
// import { formatPeriodDisplay, getPeriodTimestamp, getPeriodColor } from '../utils/periodUtils.js';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import NavigationButtons from '../components/dashboard/NavigationButtons';


// export default function Dashboard() {
//   const [metrics, setMetrics] = useState(null);
//   const [reports, setReports] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [lastFetchTime, setLastFetchTime] = useState(0);
//   const [exporting, setExporting] = useState(false);
//   const [selectedPeriod, setSelectedPeriod] = useState('current');
//   const [periodFilter, setPeriodFilter] = useState(null);
//   const [companyFilter, setCompanyFilter] = useState(null);

//   // Setup default KPIs to ensure they're always available
//   const defaultKpis = [
//     { 
//       id: 'nearMissRate',
//       name: 'Near Miss Reporting Rate',
//       actual: 0,
//       target: 100,
//       unit: '%' 
//     },
//     { 
//       id: 'criticalRiskVerification',
//       name: 'Critical Risk Control Verification',
//       actual: 0,
//       target: 95,
//       unit: '%' 
//     },
//     { 
//       id: 'electricalSafetyCompliance',
//       name: 'Electrical Safety Compliance',
//       actual: 0,
//       target: 100,
//       unit: '%' 
//     },
//   ];

//   // Handler for period selection changes
//   const handlePeriodChange = useCallback((periodId, periodValue) => {
//     console.log('Period changed:', periodId, periodValue);
//     setSelectedPeriod(periodId);
//     setPeriodFilter(periodValue);
    
//     // Force a refresh of the data
//     setLastFetchTime(0);
//   }, []);
  
//   const handleCompanyChange = useCallback((company) => {
//     console.log('Company changed:', company);
//     setCompanyFilter(company);
//     setLastFetchTime(0);
//   }, []);

//   // Function to filter reports based on the selected period
//   const filterReportsByPeriod = useCallback((allReports, periodValue) => {
//     if (!periodValue || !allReports || allReports.length === 0) {
//       return allReports;
//     }

//     const currentDate = new Date();
    
//     switch (periodValue.type) {
//       case 'month':
//         // Filter for specific month and year
//         return allReports.filter(report => {
//           // Parse report period - assuming format like "May 2025" or "Q2 2025"
//           const reportDate = parseReportPeriod(report.reportPeriod);
          
//           if (!reportDate) return false;
          
//           return reportDate.getMonth() === periodValue.month && 
//                  reportDate.getFullYear() === periodValue.year;
//         });
        
//       case 'range':
//         // Filter for last X months
//         const monthsAgo = new Date();
//         monthsAgo.setMonth(currentDate.getMonth() - periodValue.months);
        
//         return allReports.filter(report => {
//           const reportDate = parseReportPeriod(report.reportPeriod);
//           if (!reportDate) return false;
          
//           return reportDate >= monthsAgo;
//         });
        
//       case 'quarter':
//         // Filter for specific quarter
//         const quarterStartMonth = (periodValue.quarter - 1) * 3;
//         const quarterEndMonth = quarterStartMonth + 2;
        
//         return allReports.filter(report => {
//           // For quarterly reports, check if it's directly a quarterly report
//           if (report.reportType === 'Quarterly' && report.reportPeriod.includes(`Q${periodValue.quarter}`)) {
//             return true;
//           }
          
//           // For monthly reports, check if the month falls in the quarter
//           const reportDate = parseReportPeriod(report.reportPeriod);
//           if (!reportDate) return false;
          
//           const month = reportDate.getMonth();
//           return month >= quarterStartMonth && 
//                  month <= quarterEndMonth && 
//                  reportDate.getFullYear() === periodValue.year;
//         });
        
//       case 'ytd':
//         // Filter for current year
//         const yearStart = new Date(currentDate.getFullYear(), 0, 1);
        
//         return allReports.filter(report => {
//           const reportDate = parseReportPeriod(report.reportPeriod);
//           if (!reportDate) return false;
          
//           return reportDate >= yearStart;
//         });
        
//       case 'all':
//       default:
//         // No filtering
//         return allReports;
//     }
//   }, []);

//   // Function to aggregate metrics from multiple reports
//   const aggregateMetrics = useCallback((filteredReports) => {
//     if (!filteredReports || filteredReports.length === 0) {
//       return null;
//     }
    
//     // Start with default structure
//     const aggregated = {
//       totalIncidents: 0,
//       totalNearMisses: 0,
//       firstAidCount: 0,
//       medicalTreatmentCount: 0,
//       trainingCompliance: 0,
//       riskScore: 0,
//       lagging: {
//         incidentCount: 0,
//         nearMissCount: 0,
//         firstAidCount: 0,
//         medicalTreatmentCount: 0,
//         lostTimeInjuryCount: 0
//       },
//       leading: {
//         trainingCompleted: 0,
//         inspectionsCompleted: 0,
//         kpis: JSON.parse(JSON.stringify(defaultKpis)) // Deep clone defaultKpis
//       }
//     };
    
//     // Sum metrics from all reports
//     filteredReports.forEach(report => {
//       // Handle lagging indicators
//       aggregated.totalIncidents += report.metrics?.totalIncidents || 0;
//       aggregated.totalNearMisses += report.metrics?.totalNearMisses || 0;
//       aggregated.firstAidCount += report.metrics?.firstAidCount || 0;
//       aggregated.medicalTreatmentCount += report.metrics?.medicalTreatmentCount || 0;
      
//       // Handle nested lagging structure
//       if (report.metrics?.lagging) {
//         aggregated.lagging.incidentCount += report.metrics.lagging.incidentCount || 0;
//         aggregated.lagging.nearMissCount += report.metrics.lagging.nearMissCount || 0;
//         aggregated.lagging.firstAidCount += report.metrics.lagging.firstAidCount || 0;
//         aggregated.lagging.medicalTreatmentCount += report.metrics.lagging.medicalTreatmentCount || 0;
//         aggregated.lagging.lostTimeInjuryCount += report.metrics.lagging.lostTimeInjuryCount || 0;
//       }
      
//       // Handle leading indicators
//       // For percentages like training compliance, we'll keep the latest value
//       if (report.metrics?.trainingCompliance !== undefined) {
//         aggregated.trainingCompliance = report.metrics.trainingCompliance;
//       }
      
//       if (report.metrics?.riskScore !== undefined) {
//         aggregated.riskScore = report.metrics.riskScore;
//       }
      
//       // Handle nested leading structure
//       if (report.metrics?.leading) {
//         aggregated.leading.trainingCompleted += report.metrics.leading.trainingCompleted || 0;
//         aggregated.leading.inspectionsCompleted += report.metrics.leading.inspectionsCompleted || 0;
        
//         // For KPIs, we need to average values rather than sum them
//         if (report.metrics.leading.kpis && report.metrics.leading.kpis.length > 0) {
//           report.metrics.leading.kpis.forEach(kpi => {
//             const existingKpi = aggregated.leading.kpis.find(k => k.id === kpi.id);
//             if (existingKpi) {
//               // Sum for now, we'll calculate averages later
//               existingKpi.actual = (existingKpi.actual || 0) + (kpi.actual || 0);
//               existingKpi._count = (existingKpi._count || 0) + 1; // Track count for averaging
//             } else {
//               // Add any new KPIs not in default set
//               aggregated.leading.kpis.push({
//                 ...kpi,
//                 _count: 1
//               });
//             }
//           });
//         }
//       }
//     });
    
//     // Calculate averages for KPIs
//     aggregated.leading.kpis.forEach(kpi => {
//       if (kpi._count && kpi._count > 0) {
//         kpi.actual = Math.round((kpi.actual / kpi._count) * 10) / 10; // Round to 1 decimal
//         delete kpi._count; // Remove the count property
//       }
//     });
    
//     console.log('Aggregated metrics:', aggregated);
//     return aggregated;
//   }, [defaultKpis]);

//   // Fetch metrics for the selected period
//   const fetchData = useCallback(async () => {
//     // Throttle API calls
//     const now = Date.now();
//     if (now - lastFetchTime < 10000) {
//       console.log('Skipping fetch - too soon');
//       return;
//     }

//     try {
//       setLoading(true);
      
//       // Fetch reports for the trend charts
//       const allReports = await fetchReports();
//       console.log(`Fetched ${allReports.length} reports`);
//       setReports(allReports);
      
//       // Use the specialized metrics fetch function that handles periods
//       const periodMetrics = await fetchMetricsForPeriod(periodFilter, true);
//       console.log('Fetched metrics for period:', selectedPeriod);
      
//       setMetrics(periodMetrics);
//       setLastFetchTime(now);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       setError(error.message);
      
//       // Set fallback metrics if we don't already have metrics
//       setMetrics(currentMetrics => {
//         if (currentMetrics) return currentMetrics;
//         return {
//           totalIncidents: 0,
//           totalNearMisses: 0,
//           firstAidCount: 0,
//           medicalTreatmentCount: 0,
//           trainingCompliance: 0,
//           riskScore: 0,
//           lagging: {
//             incidentCount: 0,
//             nearMissCount: 0,
//             firstAidCount: 0,
//             medicalTreatmentCount: 0
//           },
//           leading: {
//             trainingCompleted: 0,
//             inspectionsCompleted: 0,
//             kpis: defaultKpis
//           }
//         };
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [lastFetchTime, defaultKpis, selectedPeriod, periodFilter]);

//   useEffect(() => {
//     // Initial fetch
//     fetchData();
    
//     // Set up an interval for refreshing data
//     const intervalId = setInterval(fetchData, 30000);
    
//     // Clean up interval on unmount
//     return () => clearInterval(intervalId);
//   }, [fetchData]);

//   const exportToPDF = async () => {
//     const dashboardElement = document.getElementById('dashboard-content');
//     if (!dashboardElement) return;
    
//     try {
//       // Show loading indicator
//       setExporting(true);
      
//       // Create a PDF document
//       const pdf = new jsPDF('p', 'mm', 'a4');
      
//       // Create a canvas from the dashboard
//       const canvas = await html2canvas(dashboardElement, {
//         scale: 2, // Higher scale for better quality
//         useCORS: true,
//         logging: false
//       });
      
//       // Add title
//       pdf.setFontSize(16);
//       pdf.text('EHS Dashboard Report', 105, 15, { align: 'center' });
//       pdf.setFontSize(12);
//       pdf.text(`Generated on ${new Date().toLocaleDateString()} - ${selectedPeriod}`, 105, 22, { align: 'center' });
      
//       // Add canvas image to PDF
//       const imgData = canvas.toDataURL('image/png');
//       pdf.addImage(imgData, 'PNG', 10, 30, 190, 0);
      
//       // Download the PDF
//       pdf.save(`EHS_Dashboard_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
//     } catch (error) {
//       console.error('Error exporting dashboard to PDF:', error);
//       alert('Failed to export dashboard to PDF');
//     } finally {
//       setExporting(false);
//     }
//   };
    
//   // Add this function to your Dashboard.js file, right next to your other functions:

// // Helper function to parse report period strings
// const parseReportPeriod = (periodString) => {
//   if (!periodString) return null;
  
//   // Handle quarterly reports like "Q1 2025"
//   if (periodString.startsWith('Q')) {
//     const quarterMatch = periodString.match(/Q(\d)\s+(\d{4})/);
//     if (quarterMatch) {
//       const quarter = parseInt(quarterMatch[1]);
//       const year = parseInt(quarterMatch[2]);
//       const month = (quarter - 1) * 3; // Q1=0, Q2=3, Q3=6, Q4=9
//       return new Date(year, month, 1);
//     }
//   }
  
//   // Handle monthly reports like "May 2025" or "05/2025"
//   try {
//     // Try parsing as month name and year
//     const date = new Date(periodString);
//     if (!isNaN(date.getTime())) {
//       return date;
//     }
    
//     // Try parsing as MM/YYYY
//     const parts = periodString.split('/');
//     if (parts.length === 2) {
//       const month = parseInt(parts[0]) - 1; // JS months are 0-based
//       const year = parseInt(parts[1]);
//       return new Date(year, month, 1);
//     }
//   } catch (err) {
//     console.error('Error parsing report period:', periodString, err);
//   }
  
//   return null;
// };

//   return (
//     <div id="dashboard-content" className="space-y-6 p-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
//         <div className="space-x-4">
//           <button
//             onClick={exportToPDF}
//             className="bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700"
//             disabled={exporting}
//           >
//             {exporting ? 'Exporting...' : 'Export to PDF'}
//           </button>
//           <Link to="/report/new">
//             <button className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700">
//               + Create New Report
//             </button>
//           </Link>
//         </div>
//       </div>

//       {/* Period Controls and Info */}
//       <div className="bg-white p-4 rounded-lg shadow">
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//           <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
//             <div className="w-full md:w-1/2">
//               <PeriodSelector 
//                 onPeriodChange={handlePeriodChange}
//                 selectedPeriod={selectedPeriod}
//               />
//             </div>
//             <div className="w-full md:w-1/2">
//               <CompanyFilter 
//                 onChange={handleCompanyChange}
//                 selectedCompany={companyFilter}
//               />
//             </div>
//           </div>
          
//           <div className="space-y-2 mt-4 md:mt-0">
//             <div className={`inline-block px-3 py-1 rounded-full border ${getPeriodColor(selectedPeriod)}`}>
//               {formatPeriodDisplay(selectedPeriod, periodFilter)}
//             </div>
//             <div className="text-xs text-gray-500">
//               {getPeriodTimestamp(selectedPeriod, periodFilter)}
//             </div>
//           </div>
//         </div>
//       </div>

//       {loading && !metrics ? (
//         <div className="text-center p-10 text-gray-500">
//           <div className="text-xl">Loading dashboard data...</div>
//         </div>
//       ) : error && !metrics ? (
//         <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded shadow mb-4">
//           <div className="font-bold">Error loading dashboard data</div>
//           <div>{error}</div>
//           <div className="mt-2">Using fallback data for display purposes.</div>
//         </div>
//       ) : null}
        
//         <div className="space-y-6">
//           {/* Navigation Buttons */}
//           <NavigationButtons />
          
//           {/* Pass the metrics explicitly to each component */}
//           <MetricsOverview metrics={metrics} />
          
//           {/* New widgets in a 2-column grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <TrainingComplianceWidget metrics={metrics} />
//             <InspectionsWidget periodFilter={periodFilter} companyFilter={companyFilter} />
//           </div>
          
//           <KPIOverview metrics={metrics} />
//           <TrendCharts periodFilter={periodFilter} companyFilter={companyFilter} />
//           <DeepSeekAIPanel 
//             metrics={metrics} 
//             selectedPeriod={selectedPeriod} 
//             companyName={companyFilter} 
//           />
//         </div>
//     </div>
//   );
// }