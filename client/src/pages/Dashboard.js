import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import AIPanel from '../components/dashboard/AIPanel';
import TrendCharts from '../components/dashboard/TrendCharts';
import TrainingSummary from '../components/dashboard/TrainingSummary';
import { fetchMetricsSummary } from '../components/services/api';
import { fetchTrainingData, updateMetricsWithTrainingData } from '../components/services/trainingApi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [exporting, setExporting] = useState(false);
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
  const fetchMetrics = useCallback(async () => {
    // Throttle API calls - only fetch if it's been at least 10 seconds
    const now = Date.now();
    if (now - lastFetchTime < 10000) {
      console.log('Skipping fetch - too soon');
      return; // Skip this fetch if we've fetched recently
    }

    try {
      setLoading(true);
      
      // Fetch training data first
      const trainingInfo = await fetchTrainingInfo();
      
      // Use our API service instead of direct fetch
      const data = await fetchMetricsSummary();
      console.log('Fetched metrics:', data);
      setLastFetchTime(now);
      
      // Create a properly structured metrics object
      let processedMetrics = {
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
      
      // Update metrics with training data if available
      if (trainingInfo) {
        processedMetrics = updateMetricsWithTrainingData(processedMetrics, trainingInfo);
      }
      
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
  }, [lastFetchTime, defaultKpis, fetchTrainingInfo]); // Remove metrics from dependencies

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
  
  // Handler for company filter changes from TrendCharts
  const handleCompanyChange = (company) => {
    setSelectedCompany(company);
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
          <Link to="/training">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-xl shadow hover:bg-purple-700">
              Training Dashboard
            </button>
          </Link>
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
          <MetricsOverview metrics={metrics} />
        </div>
        
        {/* Two-column layout for KPIs and Training */}
        <KPIOverview metrics={metrics} />
        <TrainingSummary trainingData={trainingData} showPieChart={true} />
        
        {/* Full width for trend charts with embedded year filter */}
        <div className="md:col-span-2">
          <TrendCharts 
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
          />
        </div>
      </div>
    </div>
  );
}