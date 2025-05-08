import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import TrendCharts from '../components/dashboard/ImprovedTrendCharts';
import DeepSeekAIPanel from '../components/dashboard/DeepSeekAIPanel';
import PeriodSelector from '../components/dashboard/PeriodSelector';
import CompanyFilter from '../components/dashboard/CompanyFilter';
import { fetchMetricsSummary, fetchReports, fetchMetricsForPeriod } from '../components/services/api';
import { formatPeriodDisplay, getPeriodTimestamp, getPeriodColor, parseReportPeriod } from '../utils/periodUtils.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [periodFilter, setPeriodFilter] = useState(null);
  const [companyFilter, setCompanyFilter] = useState(null);

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

  // Handler for period selection changes
  const handlePeriodChange = useCallback((periodId, periodValue) => {
    console.log('Period changed:', periodId, periodValue);
    setSelectedPeriod(periodId);
    setPeriodFilter(periodValue);
    
    // Force a refresh of the data
    setLastFetchTime(0);
  }, []);
  
  const handleCompanyChange = useCallback((company) => {
    console.log('Company changed:', company);
    setCompanyFilter(company);
    setLastFetchTime(0);
  }, []);

  // Function to filter reports based on the selected period
  const filterReportsByPeriod = useCallback((allReports, periodValue) => {
    if (!periodValue || !allReports || allReports.length === 0) {
      return allReports;
    }

    const currentDate = new Date();
    
    switch (periodValue.type) {
      case 'month':
        // Filter for specific month and year
        return allReports.filter(report => {
          // Parse report period - assuming format like "May 2025" or "Q2 2025"
          const reportDate = parseReportPeriod(report.reportPeriod);
          
          if (!reportDate) return false;
          
          return reportDate.getMonth() === periodValue.month && 
                 reportDate.getFullYear() === periodValue.year;
        });
        
      case 'range':
        // Filter for last X months
        const monthsAgo = new Date();
        monthsAgo.setMonth(currentDate.getMonth() - periodValue.months);
        
        return allReports.filter(report => {
          const reportDate = parseReportPeriod(report.reportPeriod);
          if (!reportDate) return false;
          
          return reportDate >= monthsAgo;
        });
        
      case 'quarter':
        // Filter for specific quarter
        const quarterStartMonth = (periodValue.quarter - 1) * 3;
        const quarterEndMonth = quarterStartMonth + 2;
        
        return allReports.filter(report => {
          // For quarterly reports, check if it's directly a quarterly report
          if (report.reportType === 'Quarterly' && report.reportPeriod.includes(`Q${periodValue.quarter}`)) {
            return true;
          }
          
          // For monthly reports, check if the month falls in the quarter
          const reportDate = parseReportPeriod(report.reportPeriod);
          if (!reportDate) return false;
          
          const month = reportDate.getMonth();
          return month >= quarterStartMonth && 
                 month <= quarterEndMonth && 
                 reportDate.getFullYear() === periodValue.year;
        });
        
      case 'ytd':
        // Filter for current year
        const yearStart = new Date(currentDate.getFullYear(), 0, 1);
        
        return allReports.filter(report => {
          const reportDate = parseReportPeriod(report.reportPeriod);
          if (!reportDate) return false;
          
          return reportDate >= yearStart;
        });
        
      case 'all':
      default:
        // No filtering
        return allReports;
    }
  }, []);

  // Function to aggregate metrics from multiple reports
  const aggregateMetrics = useCallback((filteredReports) => {
    if (!filteredReports || filteredReports.length === 0) {
      return null;
    }
    
    // Start with default structure
    const aggregated = {
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
        kpis: JSON.parse(JSON.stringify(defaultKpis)) // Deep clone defaultKpis
      }
    };
    
    // Sum metrics from all reports
    filteredReports.forEach(report => {
      // Handle lagging indicators
      aggregated.totalIncidents += report.metrics?.totalIncidents || 0;
      aggregated.totalNearMisses += report.metrics?.totalNearMisses || 0;
      aggregated.firstAidCount += report.metrics?.firstAidCount || 0;
      aggregated.medicalTreatmentCount += report.metrics?.medicalTreatmentCount || 0;
      
      // Handle nested lagging structure
      if (report.metrics?.lagging) {
        aggregated.lagging.incidentCount += report.metrics.lagging.incidentCount || 0;
        aggregated.lagging.nearMissCount += report.metrics.lagging.nearMissCount || 0;
        aggregated.lagging.firstAidCount += report.metrics.lagging.firstAidCount || 0;
        aggregated.lagging.medicalTreatmentCount += report.metrics.lagging.medicalTreatmentCount || 0;
        aggregated.lagging.lostTimeInjuryCount += report.metrics.lagging.lostTimeInjuryCount || 0;
      }
      
      // Handle leading indicators
      // For percentages like training compliance, we'll keep the latest value
      if (report.metrics?.trainingCompliance !== undefined) {
        aggregated.trainingCompliance = report.metrics.trainingCompliance;
      }
      
      if (report.metrics?.riskScore !== undefined) {
        aggregated.riskScore = report.metrics.riskScore;
      }
      
      // Handle nested leading structure
      if (report.metrics?.leading) {
        aggregated.leading.trainingCompleted += report.metrics.leading.trainingCompleted || 0;
        aggregated.leading.inspectionsCompleted += report.metrics.leading.inspectionsCompleted || 0;
        
        // For KPIs, we need to average values rather than sum them
        if (report.metrics.leading.kpis && report.metrics.leading.kpis.length > 0) {
          report.metrics.leading.kpis.forEach(kpi => {
            const existingKpi = aggregated.leading.kpis.find(k => k.id === kpi.id);
            if (existingKpi) {
              // Sum for now, we'll calculate averages later
              existingKpi.actual = (existingKpi.actual || 0) + (kpi.actual || 0);
              existingKpi._count = (existingKpi._count || 0) + 1; // Track count for averaging
            } else {
              // Add any new KPIs not in default set
              aggregated.leading.kpis.push({
                ...kpi,
                _count: 1
              });
            }
          });
        }
      }
    });
    
    // Calculate averages for KPIs
    aggregated.leading.kpis.forEach(kpi => {
      if (kpi._count && kpi._count > 0) {
        kpi.actual = Math.round((kpi.actual / kpi._count) * 10) / 10; // Round to 1 decimal
        delete kpi._count; // Remove the count property
      }
    });
    
    console.log('Aggregated metrics:', aggregated);
    return aggregated;
  }, [defaultKpis]);

  // Fetch metrics for the selected period
  const fetchData = useCallback(async () => {
    // Throttle API calls
    const now = Date.now();
    if (now - lastFetchTime < 10000) {
      console.log('Skipping fetch - too soon');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch reports for the trend charts
      const allReports = await fetchReports();
      console.log(`Fetched ${allReports.length} reports`);
      setReports(allReports);
      
      // Use the specialized metrics fetch function that handles periods
      const periodMetrics = await fetchMetricsForPeriod(periodFilter, true);
      console.log('Fetched metrics for period:', selectedPeriod);
      
      setMetrics(periodMetrics);
      setLastFetchTime(now);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
      
      // Set fallback metrics if we don't already have metrics
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
  }, [lastFetchTime, defaultKpis, selectedPeriod, periodFilter]);

  useEffect(() => {
    // Initial fetch
    fetchData();
    
    // Set up an interval for refreshing data
    const intervalId = setInterval(fetchData, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchData]);

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
      pdf.text(`Generated on ${new Date().toLocaleDateString()} - ${selectedPeriod}`, 105, 22, { align: 'center' });
      
      // Add canvas image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 30, 190, 0);
      
      // Download the PDF
      pdf.save(`EHS_Dashboard_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
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

      {/* Period Controls and Info */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
            <div className="w-full md:w-1/2">
              <PeriodSelector 
                onPeriodChange={handlePeriodChange}
                selectedPeriod={selectedPeriod}
              />
            </div>
            <div className="w-full md:w-1/2">
              <CompanyFilter 
                onChange={handleCompanyChange}
                selectedCompany={companyFilter}
              />
            </div>
          </div>
          
          <div className="space-y-2 mt-4 md:mt-0">
            <div className={`inline-block px-3 py-1 rounded-full border ${getPeriodColor(selectedPeriod)}`}>
              {formatPeriodDisplay(selectedPeriod, periodFilter)}
            </div>
            <div className="text-xs text-gray-500">
              {getPeriodTimestamp(selectedPeriod, periodFilter)}
            </div>
          </div>
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
        {/* Pass the metrics explicitly to each component */}
        <MetricsOverview metrics={metrics} />
        <KPIOverview metrics={metrics} />
        <TrendCharts periodFilter={periodFilter} companyFilter={companyFilter} />
        <DeepSeekAIPanel 
          metrics={metrics} 
          selectedPeriod={selectedPeriod} 
          companyName={companyFilter} 
        />
      </div>
    </div>
  );
}