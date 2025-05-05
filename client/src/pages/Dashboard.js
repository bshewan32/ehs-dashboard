// client/src/pages/Dashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import AIPanel from '../components/dashboard/AIPanel';
import TrendCharts from '../components/dashboard/TrendCharts';
import PeriodSelector from '../components/dashboard/PeriodSelector';
import { fetchReports, fetchMetricsSummary } from '../components/services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current'); // 'current', 'ytd', 'lastYear'
  
  // Common data fetch function that loads both metrics and reports
  const fetchDashboardData = useCallback(async () => {
    // Throttle API calls - only fetch if it's been at least 15 seconds
    const now = Date.now();
    if (now - lastFetchTime < 15000) {
      console.log('Skipping fetch - too soon');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch both the latest metrics summary and all reports
      const [metricsData, reportsData] = await Promise.all([
        fetchMetricsSummary(true), // Force refresh
        fetchReports(true) // Force refresh
      ]);
      
      setReports(reportsData || []);
      setLastFetchTime(now);
      
      // Process metrics data for dashboard display
      const processedMetrics = processMetricsForDashboard(metricsData, reportsData);
      setMetrics(processedMetrics);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [lastFetchTime]);

  // Process metrics data based on the selected period
  const processMetricsForDashboard = (metricsData, reportsData) => {
    if (!metricsData) {
      return createDefaultMetrics();
    }
    
    // First ensure we have the basic structure with fallbacks
    const baseMetrics = {
      // Ensure lagging indicators exist with proper fallbacks
      lagging: {
        incidentCount: metricsData.lagging?.incidentCount ?? metricsData.totalIncidents ?? 0,
        nearMissCount: metricsData.lagging?.nearMissCount ?? metricsData.totalNearMisses ?? 0,
        firstAidCount: metricsData.lagging?.firstAidCount ?? metricsData.firstAidCount ?? 0,
        medicalTreatmentCount: metricsData.lagging?.medicalTreatmentCount ?? metricsData.medicalTreatmentCount ?? 0,
        lostTimeInjuryCount: metricsData.lagging?.lostTimeInjuryCount ?? 0
      },
      
      // Ensure leading indicators exist with proper fallbacks
      leading: {
        trainingCompleted: metricsData.leading?.trainingCompleted ?? 0,
        inspectionsCompleted: metricsData.leading?.inspectionsCompleted ?? 0,
        kpis: (metricsData.leading?.kpis && metricsData.leading.kpis.length > 0) 
          ? metricsData.leading.kpis 
          : createDefaultKPIs()
      },
      
      // General metrics at the top level
      trainingCompliance: metricsData.trainingCompliance ?? 0,
      riskScore: metricsData.riskScore ?? 0,
      
      // Time period metadata
      periodType: 'current',
      periodLabel: 'Current Month'
    };
    
    // If we have report data, generate time-specific metrics
    if (reportsData && reportsData.length > 0) {
      // Sort reports by date to ensure we're working with the most recent first
      const sortedReports = [...reportsData].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB - dateA; // Descending - newest first
      });
      
      // Current month metrics (from the most recent report - already in baseMetrics)
      const currentMonthMetrics = { ...baseMetrics };
      
      // YTD metrics (sum of all reports from this year)
      const currentYear = new Date().getFullYear();
      const ytdReports = sortedReports.filter(report => {
        const reportDate = new Date(report.createdAt || report.updatedAt || 0);
        return reportDate.getFullYear() === currentYear;
      });
      
      // Calculate YTD metrics by summing all values
      const ytdMetrics = calculatePeriodMetrics(ytdReports, 'YTD', 'Year to Date');
      
      // Last year metrics (all reports from previous year)
      const lastYear = currentYear - 1;
      const lastYearReports = sortedReports.filter(report => {
        const reportDate = new Date(report.createdAt || report.updatedAt || 0);
        return reportDate.getFullYear() === lastYear;
      });
      
      // Calculate last year metrics
      const lastYearMetrics = calculatePeriodMetrics(lastYearReports, 'lastYear', `${lastYear} Results`);
      
      // Return metrics for the selected period
      switch (selectedPeriod) {
        case 'ytd':
          return ytdMetrics;
        case 'lastYear':
          return lastYearMetrics;
        case 'current':
        default:
          return currentMonthMetrics;
      }
    }
    
    return baseMetrics;
  };
  
  // Calculate metrics for a specific time period
  const calculatePeriodMetrics = (periodReports, periodType, periodLabel) => {
    if (!periodReports || periodReports.length === 0) {
      const defaultMetrics = createDefaultMetrics();
      defaultMetrics.periodType = periodType;
      defaultMetrics.periodLabel = periodLabel;
      return defaultMetrics;
    }
    
    // Initialize sums
    let incidentCount = 0;
    let nearMissCount = 0;
    let firstAidCount = 0;
    let medicalTreatmentCount = 0;
    let lostTimeInjuryCount = 0;
    let trainingCompleted = 0;
    let inspectionsCompleted = 0;
    let trainingComplianceSum = 0;
    let riskScoreSum = 0;
    
    // Collect all KPIs for averaging
    const kpiMap = new Map();
    
    // Process each report
    periodReports.forEach(report => {
      // Sum up lagging indicators with fallbacks
      incidentCount += report.metrics?.lagging?.incidentCount ?? report.metrics?.totalIncidents ?? 0;
      nearMissCount += report.metrics?.lagging?.nearMissCount ?? report.metrics?.totalNearMisses ?? 0;
      firstAidCount += report.metrics?.lagging?.firstAidCount ?? report.metrics?.firstAidCount ?? 0;
      medicalTreatmentCount += report.metrics?.lagging?.medicalTreatmentCount ?? report.metrics?.medicalTreatmentCount ?? 0;
      lostTimeInjuryCount += report.metrics?.lagging?.lostTimeInjuryCount ?? 0;
      
      // Sum up leading indicators
      trainingCompleted += report.metrics?.leading?.trainingCompleted ?? 0;
      inspectionsCompleted += report.metrics?.leading?.inspectionsCompleted ?? 0;
      
      // Sum up general metrics for averaging
      trainingComplianceSum += report.metrics?.trainingCompliance ?? 0;
      riskScoreSum += report.metrics?.riskScore ?? 0;
      
      // Process KPIs for averaging
      const kpis = report.metrics?.leading?.kpis || [];
      kpis.forEach(kpi => {
        if (!kpiMap.has(kpi.id)) {
          kpiMap.set(kpi.id, {
            id: kpi.id,
            name: kpi.name,
            values: [],
            target: kpi.target,
            unit: kpi.unit || '%'
          });
        }
        
        kpiMap.get(kpi.id).values.push(kpi.actual || 0);
      });
    });
    
    // Calculate averages for general metrics
    const reportCount = periodReports.length;
    const avgTrainingCompliance = reportCount ? trainingComplianceSum / reportCount : 0;
    const avgRiskScore = reportCount ? riskScoreSum / reportCount : 0;
    
    // Calculate KPI averages
    const averagedKpis = [];
    kpiMap.forEach(kpiData => {
      const sum = kpiData.values.reduce((acc, val) => acc + val, 0);
      const avg = kpiData.values.length ? sum / kpiData.values.length : 0;
      
      averagedKpis.push({
        id: kpiData.id,
        name: kpiData.name,
        actual: Math.round(avg * 10) / 10, // Round to 1 decimal place
        target: kpiData.target,
        unit: kpiData.unit
      });
    });
    
    // If we have no KPIs, use defaults
    if (averagedKpis.length === 0) {
      averagedKpis.push(...createDefaultKPIs());
    }
    
    // Return the aggregated metrics
    return {
      lagging: {
        incidentCount,
        nearMissCount,
        firstAidCount,
        medicalTreatmentCount,
        lostTimeInjuryCount
      },
      leading: {
        trainingCompleted,
        inspectionsCompleted,
        kpis: averagedKpis
      },
      trainingCompliance: Math.round(avgTrainingCompliance * 10) / 10,
      riskScore: Math.round(avgRiskScore * 10) / 10,
      periodType,
      periodLabel
    };
  };
  
  // Helper to create default KPIs
  const createDefaultKPIs = () => {
    return [
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
      }
    ];
  };
  
  // Helper to create default metrics structure
  const createDefaultMetrics = () => {
    return {
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
        kpis: createDefaultKPIs()
      },
      trainingCompliance: 0,
      riskScore: 0,
      periodType: 'current',
      periodLabel: 'Current Month'
    };
  };
  
  // Handle period change
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  useEffect(() => {
    // Initial fetch
    fetchDashboardData();
    
    // Set up a controlled interval for refreshing data
    const intervalId = setInterval(fetchDashboardData, 60000); // Refresh every minute
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

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
      pdf.text(`Generated on ${new Date().toLocaleDateString()} - ${metrics?.periodLabel || ''}`, 105, 22, { align: 'center' });
      
      // Add canvas image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 30, 190, 0);
      
      // Download the PDF
      pdf.save(`EHS_Dashboard_${metrics?.periodLabel || 'Current'}_${new Date().toISOString().split('T')[0]}.pdf`);
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

      {/* Period selector */}
      <PeriodSelector 
        selectedPeriod={selectedPeriod} 
        onChange={handlePeriodChange} 
      />
      
      {/* Dashboard period label */}
      <div className="bg-gray-100 px-4 py-2 rounded-lg shadow-inner">
        <h2 className="text-lg font-semibold text-gray-700">
          {metrics?.periodLabel || 'Current Period'} Metrics
        </h2>
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
        {/* Pass the metrics explicitly to each component */}
        <MetricsOverview metrics={metrics} />
        <KPIOverview metrics={metrics} />
        <TrendCharts selectedPeriod={selectedPeriod} />
        <AIPanel metrics={metrics} />
      </div>
    </div>
  );
}