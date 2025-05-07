// client/src/pages/Dashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import AIPanel from '../components/dashboard/AIPanel';
import TrendCharts from '../components/dashboard/TrendCharts';
import { fetchMetricsSummary } from '../components/services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [exporting, setExporting] = useState(false);

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

  // Modified fetchMetrics function for better structure and error handling
  const fetchMetrics = useCallback(async () => {
    // Throttle API calls - only fetch if it's been at least 10 seconds
    const now = Date.now();
    if (now - lastFetchTime < 10000) {
      console.log('Skipping fetch - too soon');
      return; // Skip this fetch if we've fetched recently
    }

    try {
      setLoading(true);
      
      // Use our API service to fetch data
      const data = await fetchMetricsSummary();
      console.log('Fetched metrics:', data);
      setLastFetchTime(now);
      
      // Create a properly structured metrics object with proper nesting
      const processedMetrics = {
        // Ensure all properties exist
        totalIncidents: data.totalIncidents ?? data.lagging?.incidentCount ?? 0,
        totalNearMisses: data.totalNearMisses ?? data.lagging?.nearMissCount ?? 0,
        firstAidCount: data.firstAidCount ?? data.lagging?.firstAidCount ?? 0,
        medicalTreatmentCount: data.medicalTreatmentCount ?? data.lagging?.medicalTreatmentCount ?? 0,
        trainingCompliance: data.trainingCompliance ?? 0,
        riskScore: data.riskScore ?? 0,
        
        // Properly structure the leading metrics
        leading: {
          trainingCompleted: data.leading?.trainingCompleted ?? 0,
          inspectionsCompleted: data.leading?.inspectionsCompleted ?? 0,
          // Handle nested KPIs properly
          kpis: Array.isArray(data.leading?.kpis) && data.leading.kpis.length > 0
            ? data.leading.kpis
            : Array.isArray(data.kpis) && data.kpis.length > 0
              ? data.kpis  // Support legacy format with kpis at top level
              : defaultKpis
        },
        
        // Properly structure lagging metrics
        lagging: {
          incidentCount: data.lagging?.incidentCount ?? data.totalIncidents ?? 0,
          nearMissCount: data.lagging?.nearMissCount ?? data.totalNearMisses ?? 0,
          firstAidCount: data.lagging?.firstAidCount ?? data.firstAidCount ?? 0,
          medicalTreatmentCount: data.lagging?.medicalTreatmentCount ?? data.medicalTreatmentCount ?? 0,
          lostTimeInjuryCount: data.lagging?.lostTimeInjuryCount ?? 0
        }
      };
      
      console.log('Processed metrics:', processedMetrics);
      
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
  }, [lastFetchTime, defaultKpis]);

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
        {/* Explicitly pass the metrics object to each component */}
        <MetricsOverview metrics={metrics} />
        <KPIOverview metrics={metrics} />
        <TrendCharts />
        <AIPanel metrics={metrics} />
      </div>
    </div>
  );
}