import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import AIPanel from '../components/dashboard/AIPanel';
import TrendCharts from '../components/dashboard/TrendCharts';
import TrainingSummary from '../components/dashboard/TrainingSummary';
import { fetchMetricsSummary, markDataChanged } from '../components/services/api';
import { fetchTrainingData, updateMetricsWithTrainingData } from '../components/services/trainingApi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [trainingData, setTrainingData] = useState(null);

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

  // Fetch training data
  const fetchTrainingInfo = useCallback(async () => {
    try {
      const data = await fetchTrainingData();
      setTrainingData(data);
      return data;
    } catch (error) {
      console.error('Error fetching training data:', error);
      return null;
    }
  }, []);

  // Modify your fetchMetrics function to not depend on metrics
  const fetchMetrics = useCallback(async (force = false) => {
    // Throttle API calls - only fetch if it's been at least 10 seconds
    const now = Date.now();
    if (!force && now - lastFetchTime < 10000) {
      console.log('Skipping fetch - too soon');
      return; // Skip this fetch if we've fetched recently
    }

    try {
      setLoading(true);
      
      // Fetch training data first
      const trainingInfo = await fetchTrainingInfo();
      
      // Use our API service to fetch current year metrics
      const data = await fetchMetricsSummary(force);
      console.log('Raw metrics summary response:', data);
      setLastFetchTime(now);
      
      // Create a properly structured metrics object
      let processedMetrics = {
        // Ensure these properties exist with fallbacks
        totalIncidents: data.totalIncidents ?? 0,
        totalNearMisses: data.totalNearMisses ?? 0,
        firstAidCount: data.firstAidCount ?? 0,
        medicalTreatmentCount: data.medicalTreatmentCount ?? 0,
        lostTimeInjuryCount: data.lagging?.lostTimeInjuryCount ?? data.lostTimeInjuryCount ?? 0,
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
          medicalTreatmentCount: data.medicalTreatmentCount ?? 0,
          lostTimeInjuryCount: data.lostTimeInjuryCount ?? 0
        }
      };

      // Update metrics with training data if available
      if (trainingInfo) {
        processedMetrics = updateMetricsWithTrainingData(processedMetrics, trainingInfo);
      }

      // Debug log processed metrics summary
      console.log('Processed metrics summary:', processedMetrics);
      // Debug log the metrics (detailed)
      console.log('Dashboard - processed metrics (detailed):', processedMetrics);

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
          lostTimeInjuryCount: 0,
          trainingCompliance: 0,
          riskScore: 0,
          lagging: {
            incidentCount: 0,
            nearMissCount: 0,
            firstAidCount: 0,
            medicalTreatmentCount: 0,
            lostTimeInjuryCount: 0
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
  }, [lastFetchTime, defaultKpis, fetchTrainingInfo]);

  useEffect(() => {
    // Initial fetch
    fetchMetrics(true); // Force the initial fetch
    
    // Set up a controlled interval for refreshing data
    const intervalId = setInterval(() => fetchMetrics(), 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchMetrics, refreshKey]);

  // Function to manually refresh the dashboard
  const handleRefresh = () => {
    // Mark data as changed in the API service
    markDataChanged();
    
    // Force fetch metrics
    fetchMetrics(true);
    
    // Increment the refresh key to force component updates
    setRefreshKey(prev => prev + 1);
  };

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
  
  // Handler for company filter changes from TrendCharts
  const handleCompanyChange = (company) => {
    setSelectedCompany(company);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation buttons at the top */}
      <div className="bg-white border-b py-3 px-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Link to="/">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
            </Link>
            <Link to="/reports">
              <button className="text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Reports
              </button>
            </Link>
            <Link to="/inspections">
              <button className="text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Inspections
              </button>
            </Link>
            <Link to="/training">
              <button className="text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Training
              </button>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
            <button
              onClick={handleRefresh}
              className="bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 flex items-center"
              title="Refresh data"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div id="dashboard-content" className="space-y-6 p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="space-x-3 flex items-center">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main metrics overview (full width) */}
          <div className="md:col-span-2">
            <MetricsOverview metrics={metrics} key={`metrics-${refreshKey}`} />
          </div>
          
          {/* Two-column layout for KPIs and Training */}
          <KPIOverview metrics={metrics} key={`kpi-${refreshKey}`} />
          <TrainingSummary trainingData={trainingData} showPieChart={true} key={`training-${refreshKey}`} />
          
          {/* Full width for trend charts with embedded year filter */}
          <div className="md:col-span-2">
            <TrendCharts 
              key={`trends-${refreshKey}`}
              onCompanyChange={handleCompanyChange}
              selectedCompany={selectedCompany}
              enableYearFilter={true}  // Enable built-in year filter
            />
          </div>
          
          {/* AI panel at the bottom (full width) */}
          <div className="md:col-span-2">
            <AIPanel 
              metrics={metrics} 
              selectedCompany={selectedCompany}
              key={`ai-${refreshKey}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// import React, { useEffect, useState, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import MetricsOverview from '../components/dashboard/MetricsOverview';
// import KPIOverview from '../components/dashboard/KPIOverview';
// import AIPanel from '../components/dashboard/AIPanel';
// import TrendCharts from '../components/dashboard/TrendCharts';
// import TrainingSummary from '../components/dashboard/TrainingSummary';
// import { fetchMetricsSummary } from '../components/services/api';
// import { fetchTrainingData, updateMetricsWithTrainingData } from '../components/services/trainingApi';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

// export default function Dashboard() {
//   const [metrics, setMetrics] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [lastFetchTime, setLastFetchTime] = useState(0);
//   const [exporting, setExporting] = useState(false);
//   const [selectedCompany, setSelectedCompany] = useState(null);
//   const [trainingData, setTrainingData] = useState(null);

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

//   // Fetch training data
//   const fetchTrainingInfo = useCallback(async () => {
//     try {
//       const data = await fetchTrainingData();
//       setTrainingData(data);
//       return data;
//     } catch (error) {
//       console.error('Error fetching training data:', error);
//       return null;
//     }
//   }, []);

//   // Modify your fetchMetrics function to not depend on metrics
//   const fetchMetrics = useCallback(async () => {
//     // Throttle API calls - only fetch if it's been at least 10 seconds
//     const now = Date.now();
//     if (now - lastFetchTime < 10000) {
//       console.log('Skipping fetch - too soon');
//       return; // Skip this fetch if we've fetched recently
//     }

//     try {
//       setLoading(true);
      
//       // Fetch training data first
//       const trainingInfo = await fetchTrainingInfo();
      
//       // Use our API service to fetch current year metrics
//       const data = await fetchMetricsSummary(true); // true = current year only
//       console.log('Fetched current year metrics:', data);
//       setLastFetchTime(now);
      
//       // Create a properly structured metrics object
//       let processedMetrics = {
//         // Ensure these properties exist with fallbacks
//         totalIncidents: data.totalIncidents ?? 0,
//         totalNearMisses: data.totalNearMisses ?? 0,
//         firstAidCount: data.firstAidCount ?? 0,
//         medicalTreatmentCount: data.medicalTreatmentCount ?? 0,
//         lostTimeInjuryCount: data.lagging?.lostTimeInjuryCount ?? data.lostTimeInjuryCount ?? 0,
//         trainingCompliance: data.trainingCompliance ?? 0,
//         riskScore: data.riskScore ?? 0,
        
//         // Ensure the leading object exists
//         leading: {
//           ...data.leading,
//           // Either use existing KPIs or defaults
//           kpis: (data.leading?.kpis && data.leading.kpis.length > 0) 
//             ? data.leading.kpis 
//             : defaultKpis
//         },
        
//         // Create lagging metrics if they don't exist
//         lagging: data.lagging || {
//           incidentCount: data.totalIncidents ?? 0,
//           nearMissCount: data.totalNearMisses ?? 0,
//           firstAidCount: data.firstAidCount ?? 0,
//           medicalTreatmentCount: data.medicalTreatmentCount ?? 0,
//           lostTimeInjuryCount: data.lostTimeInjuryCount ?? 0
//         }
//       };
      
//       // Update metrics with training data if available
//       if (trainingInfo) {
//         processedMetrics = updateMetricsWithTrainingData(processedMetrics, trainingInfo);
//       }
      
//       // Debug log the metrics 
//       console.log('Dashboard - processed metrics:', {
//         lostTimeInjuryCount: processedMetrics.lostTimeInjuryCount,
//         laggingLTI: processedMetrics.lagging?.lostTimeInjuryCount 
//       });
      
//       // Store processed metrics
//       setMetrics(processedMetrics);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching metrics:', error);
//       setError(error.message);
      
//       // Only set fallback metrics if we don't already have metrics
//       setMetrics(currentMetrics => {
//         if (currentMetrics) return currentMetrics;
//         return {
//           totalIncidents: 0,
//           totalNearMisses: 0,
//           firstAidCount: 0,
//           medicalTreatmentCount: 0,
//           lostTimeInjuryCount: 0,
//           trainingCompliance: 0,
//           riskScore: 0,
//           lagging: {
//             incidentCount: 0,
//             nearMissCount: 0,
//             firstAidCount: 0,
//             medicalTreatmentCount: 0,
//             lostTimeInjuryCount: 0
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
//   }, [lastFetchTime, defaultKpis, fetchTrainingInfo]); // Remove metrics from dependencies

//   useEffect(() => {
//     // Initial fetch
//     fetchMetrics();
    
//     // Set up a controlled interval for refreshing data
//     const intervalId = setInterval(fetchMetrics, 30000);
    
//     // Clean up interval on unmount
//     return () => clearInterval(intervalId);
//   }, [fetchMetrics]);

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
//       pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
      
//       // Add canvas image to PDF
//       const imgData = canvas.toDataURL('image/png');
//       pdf.addImage(imgData, 'PNG', 10, 30, 190, 0);
      
//       // Download the PDF
//       pdf.save(`EHS_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
//     } catch (error) {
//       console.error('Error exporting dashboard to PDF:', error);
//       alert('Failed to export dashboard to PDF');
//     } finally {
//       setExporting(false);
//     }
//   };
  
//   // Handler for company filter changes from TrendCharts
//   const handleCompanyChange = (company) => {
//     setSelectedCompany(company);
//   };

//   return (
//     <div id="dashboard-content" className="space-y-6 p-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
//         <div className="space-x-3">
//           <button
//             onClick={exportToPDF}
//             className="bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700"
//             disabled={exporting}
//           >
//             {exporting ? 'Exporting...' : 'Export to PDF'}
//           </button>
//           <Link to="/reports">
//             <button className="bg-teal-600 text-white px-4 py-2 rounded-xl shadow hover:bg-teal-700">
//               Reports Dashboard
//             </button>
//           </Link>
//           <Link to="/training">
//             <button className="bg-purple-600 text-white px-4 py-2 rounded-xl shadow hover:bg-purple-700">
//               Training Dashboard
//             </button>
//           </Link>
//           <Link to="/inspections">
//             <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow hover:bg-indigo-700">
//               Inspection Dashboard
//             </button>
//           </Link>
//           <Link to="/report/new">
//             <button className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700">
//               + Create New Report
//             </button>
//           </Link>
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

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* Main metrics overview (full width) */}
//         <div className="md:col-span-2">
//           <MetricsOverview metrics={metrics} />
//         </div>
        
//         {/* Two-column layout for KPIs and Training */}
//         <KPIOverview metrics={metrics} />
//         <TrainingSummary trainingData={trainingData} showPieChart={true} />
        
//         {/* Full width for trend charts with embedded year filter */}
//         <div className="md:col-span-2">
//           <TrendCharts 
//             onCompanyChange={handleCompanyChange}
//             selectedCompany={selectedCompany}
//             enableYearFilter={true}  // Enable built-in year filter
//           />
//         </div>
        
//         {/* AI panel at the bottom (full width) */}
//         <div className="md:col-span-2">
//           <AIPanel 
//             metrics={metrics} 
//             selectedCompany={selectedCompany}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }