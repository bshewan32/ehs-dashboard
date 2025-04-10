import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import AIPanel from '../components/dashboard/AIPanel';
import TrendCharts from '../components/dashboard/TrendCharts';
import CompanyFilter from '../components/dashboard/CompanyFilter';
import CompanyComparison from '../components/dashboard/CompanyComparison';
import { fetchReports, fetchMetricsSummary, fetchCompanyMetrics } from '../components/services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const api_url = process.env.REACT_APP_API_URL;

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [reports, setReports] = useState([]);
  const [refreshTimestamp, setRefreshTimestamp] = useState(new Date()); // For regular metrics refresh
  const [aiRefreshTrigger, setAiRefreshTrigger] = useState(new Date()); // Separate refresh trigger for AI
  const [reportCount, setReportCount] = useState(0); // Track report count to detect new reports
  const [previousMetrics, setPreviousMetrics] = useState(null);
  const lastFetchTimeRef = useRef(null); // Track when we last successfully fetched data
  const [exporting, setExporting] = useState(false);
  const [recommendations, setRecommendations] = useState([]); // Added state for recommendations

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

  // Deep equality check function
  const deepEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true;
    
    if (typeof obj1 !== 'object' || obj1 === null || 
        typeof obj2 !== 'object' || obj2 === null) {
      return false;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      
      if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  };

  // Function to normalize KPI data
  const normalizeKpiData = (kpis) => {
    if (!kpis || !Array.isArray(kpis)) return [];
    
    // Map to ensure consistent structure and naming
    return kpis.map(kpi => ({
      id: kpi.id || kpi.name.toLowerCase().replace(/\s+/g, ''),
      name: kpi.name,
      actual: kpi.actual || 0,
      target: kpi.target || 100,
      unit: kpi.unit || '%'
    }));
  };

  // Handle company filter change
  const handleCompanyChange = useCallback((company) => {
    setSelectedCompany(company);
    setAiRefreshTrigger(new Date()); // Trigger AI refresh when company changes
  }, []);

  // Create default metrics object for fallback
  const createDefaultMetrics = useCallback(() => {
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
        kpis: defaultKpis.map(kpi => ({ ...kpi })) // Create a new array with copied objects
      }
    };
  }, [defaultKpis]);

  // Process metrics based on selected company
  const processMetricsForCompany = useCallback(async (company) => {
    const processId = Math.random().toString(36).substring(7);
    console.log(`[${processId}] Starting metrics processing for ${company || 'all'}`);
    
    if (!reports || reports.length === 0) {
      console.log(`[${processId}] No reports available, aborting metrics processing`);
      return;
    }

    try {
      let newMetrics;
      
      if (company) {
        // Use the specialized company metrics API
        console.log(`[${processId}] Calling fetchCompanyMetrics for ${company}`);
        newMetrics = await fetchCompanyMetrics(company);
        
        // Ensure KPIs are normalized
        if (newMetrics?.leading?.kpis) {
          newMetrics.leading.kpis = normalizeKpiData(newMetrics.leading.kpis);
        }
      } else {
        // Use the general metrics summary API
        console.log(`[${processId}] Calling fetchMetricsSummary for all companies`);
        const data = await fetchMetricsSummary();
        console.log(`[${processId}] Received metrics summary data`);
        
        // Create a properly structured metrics object
        newMetrics = {
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
              ? normalizeKpiData(data.leading.kpis)
              : defaultKpis.map(kpi => ({ ...kpi }))
          },
          
          // Create lagging metrics if they don't exist
          lagging: data.lagging || {
            incidentCount: data.totalIncidents ?? 0,
            nearMissCount: data.totalNearMisses ?? 0,
            firstAidCount: data.firstAidCount ?? 0,
            medicalTreatmentCount: data.medicalTreatmentCount ?? 0
          }
        };
      }
      
      // Only update if metrics have actually changed
      if (!previousMetrics || !deepEqual(newMetrics, previousMetrics)) {
        console.log(`[${processId}] Metrics have changed, updating state`);
        setMetrics(newMetrics);
        setPreviousMetrics(newMetrics);
      } else {
        console.log(`[${processId}] Metrics unchanged, skipping state update`);
      }
    } catch (error) {
      console.error(`[${processId}] Error processing metrics for company:`, error);
      if (!metrics) {
        setMetrics(createDefaultMetrics());
      }
    }
    
    console.log(`[${processId}] Completed metrics processing for ${company || 'all'}`);
  }, [reports, defaultKpis, previousMetrics, createDefaultMetrics, normalizeKpiData, metrics]);

  // Function to fetch data (separate from useEffect for cleaner code)
  const fetchData = useCallback(async (force = false) => {
    try {
      // Add a unique ID to this fetch call for tracking
      const fetchId = Math.random().toString(36).substring(7);
      const fetchStartTime = new Date();
      console.log(`[${fetchId}] Dashboard fetchData called, force=${force}`);
      
      // Throttle API calls - only fetch if it's been at least 2 minutes or forced
      const now = new Date();
      if (!force && lastFetchTimeRef.current) {
        const timeSinceLastFetch = now - lastFetchTimeRef.current;
        const minimumInterval = 120000; // 2 minutes in milliseconds
        
        if (timeSinceLastFetch < minimumInterval) {
          console.log(`[${fetchId}] Skipping API call, last fetch was ${Math.round(timeSinceLastFetch/1000)}s ago`);
          return; // Skip this fetch cycle
        }
      }
      
      setLoading(true);
      
      // Fetch all reports first
      console.log(`[${fetchId}] Fetching reports...`);
      const reportData = await fetchReports();
      lastFetchTimeRef.current = now; // Update last successful fetch time
      console.log(`[${fetchId}] Reports fetched, got ${reportData.length} reports`);
      
      // Check if we have new reports - this would trigger an AI refresh
      if (reportData.length !== reportCount) {
        console.log(`[${fetchId}] Report count changed from ${reportCount} to ${reportData.length}`);
        setReportCount(reportData.length);
        setAiRefreshTrigger(new Date()); // Trigger AI refresh when report count changes
      }
      
      setReports(reportData);
      
      // Process metrics for selected company
      console.log(`[${fetchId}] Processing metrics for company: ${selectedCompany || 'all'}`);
      await processMetricsForCompany(selectedCompany);
      
      setError(null);
      
      // Log total time taken
      const fetchEndTime = new Date();
      const fetchDuration = fetchEndTime - fetchStartTime;
      console.log(`[${fetchId}] Dashboard fetchData completed in ${fetchDuration}ms`);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      setMetrics(createDefaultMetrics());
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, reportCount, processMetricsForCompany, createDefaultMetrics]);

  // Effect for initial load and regular refresh of metrics
  useEffect(() => {
    // Initial load - force fetch regardless of time
    fetchData(true);
    
    // Set up regular refresh - triggered by refreshTimestamp changes
  }, [fetchData]);

  // Effect to handle refreshTimestamp changes
  useEffect(() => {
    // Only respond to refreshTimestamp after initial setup
    if (refreshTimestamp) {
      fetchData();
    }
  }, [fetchData, refreshTimestamp]);

  // Set up automatic refresh timer
  useEffect(() => {
    // Refresh metrics every 5 minutes instead of 30 seconds
    const intervalId = setInterval(() => {
      setRefreshTimestamp(new Date());
    }, 300000); // 5 minutes in milliseconds
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Effect to get recommendations from AIPanel
  useEffect(() => {
    // This is a placeholder - in a real implementation, you would either:
    // 1. Get recommendations from the AIPanel component via props or context
    // 2. Fetch recommendations from your API based on metrics
    
    // For now, we'll generate some basic recommendations based on metrics
    if (metrics) {
      const generateBasicRecommendations = () => {
        const recs = [];
        
        const incidentCount = metrics.lagging?.incidentCount ?? metrics.totalIncidents ?? 0;
        const nearMissCount = metrics.lagging?.nearMissCount ?? metrics.totalNearMisses ?? 0;
        
        if (incidentCount > 5) {
          recs.push("High number of incidents detected. Consider reviewing recent risk assessments.");
        }
        if (nearMissCount < 5) {
          recs.push("Low near miss reporting. Reinforce importance of reporting minor events.");
        }
        if (incidentCount === 0 && nearMissCount === 0) {
          recs.push("No reported incidents or near misses. Consider conducting an audit to validate reporting accuracy.");
        }
        
        if (recs.length === 0) {
          recs.push("No significant trends detected. Maintain current safety protocols.");
        }
        
        return recs;
      };
      
      setRecommendations(generateBasicRecommendations());
    }
  }, [metrics, aiRefreshTrigger]);

  const exportToPDF = async () => {
    try {
      // Show loading indicator
      setExporting(true);
      console.log("Starting PDF export process...");
      
      // Use text-only approach for reliability
      const pdf = new jsPDF('p', 'mm', 'a4'); // portrait orientation is more reliable
      
      // Add title
      pdf.setFontSize(18);
      pdf.text('EHS Dashboard Report', 105, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 25, { align: 'center' });
      if (selectedCompany) {
        pdf.text(`Company: ${selectedCompany}`, 105, 35, { align: 'center' });
      }
      
      // Add metrics summary
      let yPos = 45;
      
      if (metrics) {
        // Lagging indicators
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 150); // blue
        pdf.text("SAFETY METRICS SUMMARY", 105, yPos, { align: 'center' }); 
        yPos += 10;
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0); // black
        pdf.text("Lagging Indicators:", 20, yPos); 
        yPos += 8;
        
        if (metrics.lagging) {
          pdf.setFontSize(10);
          pdf.text(`• Incidents: ${metrics.lagging.incidentCount || 0}`, 25, yPos); yPos += 6;
          pdf.text(`• Near Misses: ${metrics.lagging.nearMissCount || 0}`, 25, yPos); yPos += 6;
          pdf.text(`• First Aid Cases: ${metrics.lagging.firstAidCount || 0}`, 25, yPos); yPos += 6;
          pdf.text(`• Medical Treatments: ${metrics.lagging.medicalTreatmentCount || 0}`, 25, yPos); yPos += 6;
        } else {
          pdf.text("No lagging indicators available", 25, yPos);
          yPos += 8;
        }
        
        // Leading indicators
        yPos += 5;
        pdf.setFontSize(12);
        pdf.text("Leading Indicators:", 20, yPos);
        yPos += 8;
        
        if (metrics.leading) {
          pdf.setFontSize(10);
          pdf.text(`• Training Completed: ${metrics.leading.trainingCompleted || 0}`, 25, yPos); yPos += 6;
          pdf.text(`• Inspections Completed: ${metrics.leading.inspectionsCompleted || 0}`, 25, yPos); yPos += 6;
          
          if (metrics.trainingCompliance !== undefined) {
            pdf.text(`• Training Compliance: ${metrics.trainingCompliance}%`, 25, yPos); yPos += 6;
          }
          
          // Add KPIs
          if (metrics.leading.kpis && metrics.leading.kpis.length > 0) {
            yPos += 5;
            pdf.setFontSize(12);
            pdf.text("Key Performance Indicators:", 20, yPos);
            yPos += 8;
            
            pdf.setFontSize(10);
            metrics.leading.kpis.forEach(kpi => {
              const percentOfTarget = ((kpi.actual / kpi.target) * 100).toFixed(1);
              const status = percentOfTarget >= 90 ? "On Target" : 
                           percentOfTarget >= 70 ? "Needs Attention" : "Critical";
              
              pdf.text(`• ${kpi.name}: ${kpi.actual}${kpi.unit} (${percentOfTarget}% of target)`, 25, yPos);
              yPos += 6;
              
              // Add status with different colors
              if (status === "On Target") {
                pdf.setTextColor(0, 150, 0); // green
              } else if (status === "Needs Attention") {
                pdf.setTextColor(255, 150, 0); // orange
              } else {
                pdf.setTextColor(200, 0, 0); // red
              }
              
              pdf.text(`  Status: ${status}`, 30, yPos);
              pdf.setTextColor(0, 0, 0); // reset to black
              yPos += 8;
            });
          }
        } else {
          pdf.text("No leading indicators available", 25, yPos);
          yPos += 8;
        }
        
        // Add AI recommendations if available
        if (recommendations && recommendations.length > 0) {
          // Add a page break if we're too far down
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          } else {
            yPos += 10;
          }
          
          pdf.setFontSize(14);
          pdf.setTextColor(100, 0, 150); // purple
          pdf.text("AI SAFETY RECOMMENDATIONS", 105, yPos, { align: 'center' });
          yPos += 10;
          
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0); // black
          
          recommendations.forEach((rec, index) => {
            // Add page break if needed
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            
            // Split long recommendations into multiple lines
            const textLines = pdf.splitTextToSize(
              `${index + 1}. ${rec}`, 
              170 // max width
            );
            
            pdf.text(textLines, 20, yPos);
            yPos += (textLines.length * 6) + 4; // adjust y position based on number of lines
          });
        }
      } else {
        pdf.text("No metrics data available", 20, yPos);
      }
      
      // Add footer with timestamp
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `EHS Dashboard Report - Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
          105, 
          pdf.internal.pageSize.getHeight() - 10, 
          { align: 'center' }
        );
      }
      
      console.log("Saving PDF...");
      // Download the PDF
      pdf.save(`EHS_Dashboard_${selectedCompany || 'All'}_${new Date().toISOString().split('T')[0]}.pdf`);
      console.log("PDF saved successfully");
    } catch (error) {
      console.error('Error exporting dashboard to PDF:', error);
      alert('Failed to export dashboard to PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section with gradient background */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-md">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold">EHS Dashboard</h1>
              <p className="mt-1 text-blue-100">Environmental Health & Safety Metrics</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={exportToPDF}
                className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg shadow-sm font-medium transition duration-150 ease-in-out"
                disabled={exporting}
              >
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <Link to="/report/new">
                <button className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg shadow-sm font-medium transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50">
                  + Create Report
                </button>
              </Link>
              <Link to="/inspections">
                <button className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm font-medium border border-blue-400 transition duration-150 ease-in-out">
                  View Inspections
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
  
      {/* Main content */}
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Loading and error states */}
        {loading && !metrics ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-400 mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-24 mb-6"></div>
              <div className="h-2 bg-gray-300 rounded w-32"></div>
              <div className="mt-4 text-gray-500">Loading dashboard data...</div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow mb-6 animate-bounce">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="font-medium">Error loading dashboard data</h3>
                <p className="text-sm">{error}</p>
                <p className="text-sm mt-2">Using fallback data for display purposes.</p>
              </div>
            </div>
          </div>
        ) : null}
  
        {/* Company filter card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition duration-300 ease-in-out transform hover:shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Filter</h2>
          <CompanyFilter 
            onChange={handleCompanyChange}
            selectedCompany={selectedCompany}
          />
          
          {selectedCompany && (
            <div className="mt-3 flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                </svg>
                Showing data for: {selectedCompany}
              </span>
              <button 
                onClick={() => handleCompanyChange(null)} 
                className="ml-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
  
        {/* Main dashboard grid */}
        <div id="dashboard-content" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pass the metrics explicitly to each component */}
          <MetricsOverview metrics={metrics} companyName={selectedCompany} />
          <KPIOverview metrics={metrics} companyName={selectedCompany} />
          
          <div className="col-span-1 lg:col-span-2 mt-6">
            <TrendCharts selectedCompany={selectedCompany} />
          </div>
  
          <div className="col-span-1 lg:col-span-2 mt-6">
            {/* Pass aiRefreshTrigger to only refresh AI when necessary */}
            <AIPanel 
              metrics={metrics} 
              companyName={selectedCompany} 
              refreshTrigger={aiRefreshTrigger}
              onRecommendationsChange={setRecommendations} // Add a callback to get recommendations
            />
          </div>
          
          {/* Only show company comparison when not filtering to a specific company */}
          {!selectedCompany && (
            <div className="col-span-1 lg:col-span-2 mt-6">
              <CompanyComparison />
            </div>
          )}
        </div>
      </div>
  
      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold">EHS Dashboard</h3>
              <p className="text-sm text-gray-400">Version 1.0</p>
            </div>
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}