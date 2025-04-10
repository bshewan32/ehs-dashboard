// client/src/pages/Dashboard.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import AIPanel from '../components/dashboard/AIPanel';
import TrendCharts from '../components/dashboard/TrendCharts';
import { fetchReports, fetchMetricsSummary } from '../components/services/api';
import { usePDFExport } from '../hooks/usePDFExport';

const api_url = process.env.REACT_APP_API_URL;

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [reports, setReports] = useState([]);
  const [refreshTimestamp, setRefreshTimestamp] = useState(new Date());
  const [aiRefreshTrigger, setAiRefreshTrigger] = useState(new Date());
  const [reportCount, setReportCount] = useState(0);
  const [previousMetrics, setPreviousMetrics] = useState(null);
  const lastFetchTimeRef = useRef(null);
  const { exportToPDF, exporting, exportError } = usePDFExport();

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

  // Function to fetch data
  const fetchData = useCallback(async (force = false) => {
    try {
      // Add a unique ID to this fetch call for tracking
      const fetchId = Math.random().toString(36).substring(7);
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
      
      // Check if we have new reports - this would trigger an AI refresh
      if (reportData.length !== reportCount) {
        setReportCount(reportData.length);
        setAiRefreshTrigger(new Date()); // Trigger AI refresh when report count changes
      }
      
      setReports(reportData);
      
      // Get metrics summary
      console.log(`[${fetchId}] Fetching metrics summary...`);
      const data = await fetchMetricsSummary();
      
      // Create a properly structured metrics object
      const newMetrics = {
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
      
      // Only update if metrics have actually changed
      if (!previousMetrics || !deepEqual(newMetrics, previousMetrics)) {
        setMetrics(newMetrics);
        setPreviousMetrics(newMetrics);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      
      if (!metrics) {
        setMetrics(createDefaultMetrics());
      }
    } finally {
      setLoading(false);
    }
  }, [reportCount, createDefaultMetrics, previousMetrics, defaultKpis, metrics]);

  // Replace your current useEffect setup with this:

  // Effect for initial load only - runs once when component mounts
  useEffect(() => {
    // Initial load
    fetchData(true);

    // Set up automatic refresh timer
    const intervalId = setInterval(() => {
      // This will trigger a periodic refresh
      setRefreshTimestamp(new Date());
    }, 300000); // 5 minutes

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array - runs only once on mount

  // Effect to handle refreshTimestamp changes only
  useEffect(() => {
    // Skip the initial mount - only respond to actual changes after mounting
    if (refreshTimestamp && lastFetchTimeRef.current) {
      fetchData(false); // Never force refresh on timer
    }
  }, [refreshTimestamp]); // Only depend on refreshTimestamp, not fetchData


  // Handle PDF export using web worker
  const handleExportToPDF = useCallback(() => {
    exportToPDF(metrics, selectedCompany)
      .catch(err => {
        console.error('Failed to export PDF:', err);
        alert('PDF export failed: ' + err.message);
      });
  }, [exportToPDF, metrics, selectedCompany]);

  // Show error notification if export fails
  useEffect(() => {
    if (exportError) {
      alert('Error exporting PDF: ' + exportError);
    }
  }, [exportError]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleExportToPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 disabled:bg-blue-300"
            disabled={exporting || !metrics}
          >
            {exporting ? 'Generating PDF...' : 'Export to PDF'}
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
      ) : error ? (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded shadow mb-4">
          <div className="font-bold">Error loading dashboard data</div>
          <div>{error}</div>
          <div className="mt-2">Using fallback data for display purposes.</div>
        </div>
      ) : null}

      <div className="space-y-6">
        {/* Company filter would go here */}
        {selectedCompany && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800">
              Showing data for: <strong>{selectedCompany}</strong>
              <button 
                onClick={() => handleCompanyChange(null)}
                className="ml-2 text-sm text-blue-600 hover:text-blue-800"
              >
                (Clear filter)
              </button>
            </p>
          </div>
        )}
        
        {/* Pass the metrics explicitly to each component */}
        <MetricsOverview metrics={metrics} />
        <KPIOverview metrics={metrics} />
        <TrendCharts />
        <AIPanel metrics={metrics} refreshTrigger={aiRefreshTrigger} />
      </div>
    </div>
  );
}