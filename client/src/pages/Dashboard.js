import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import TrainingComplianceWidget from '../components/dashboard/TrainingComplianceWidget';
import InspectionsWidget from '../components/dashboard/InspectionsWidget';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import TrendCharts from '../components/dashboard/ImprovedTrendCharts';
import DeepSeekAIPanel from '../components/dashboard/DeepSeekAIPanel';
import PeriodSelector from '../components/dashboard/PeriodSelector';
import CompanyFilter from '../components/dashboard/CompanyFilter';
import { fetchMetricsSummary, fetchReports, fetchMetricsForPeriod } from '../components/services/api';
import { formatPeriodDisplay, getPeriodTimestamp, getPeriodColor } from '../utils/periodUtils.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import NavigationButtons from '../components/dashboard/NavigationButtons';

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
  const [activeSectionId, setActiveSectionId] = useState(null);

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

  // Function to handle navigation button clicks with smooth scrolling
  const handleNavClick = (sectionId) => {
    setActiveSectionId(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      
      // Set a highlight effect that fades after 1 second
      element.classList.add('highlight-section');
      setTimeout(() => {
        element.classList.remove('highlight-section');
      }, 1000);
    }
  };

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
    
    // Setup scroll observer to highlight active section
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSectionId(entry.target.id);
        }
      });
    }, { threshold: 0.5 });

    // Observe all sections
    document.querySelectorAll('[id^="section-"]').forEach((section) => {
      observer.observe(section);
    });
    
    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
      observer.disconnect();
    };
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
      
      const periodText = formatPeriodDisplay(selectedPeriod, periodFilter);
      const companyText = companyFilter ? ` - ${companyFilter}` : '';
      pdf.text(`Generated on ${new Date().toLocaleDateString()} - ${periodText}${companyText}`, 105, 22, { align: 'center' });
      
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
    
  // Helper function to parse report period strings
  const parseReportPeriod = (periodString) => {
    if (!periodString) return null;
    
    // Handle quarterly reports like "Q1 2025"
    if (periodString.startsWith('Q')) {
      const quarterMatch = periodString.match(/Q(\d)\s+(\d{4})/);
      if (quarterMatch) {
        const quarter = parseInt(quarterMatch[1]);
        const year = parseInt(quarterMatch[2]);
        const month = (quarter - 1) * 3; // Q1=0, Q2=3, Q3=6, Q4=9
        return new Date(year, month, 1);
      }
    }
    
    // Handle monthly reports like "May 2025" or "05/2025"
    try {
      // Try parsing as month name and year
      const date = new Date(periodString);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Try parsing as MM/YYYY
      const parts = periodString.split('/');
      if (parts.length === 2) {
        const month = parseInt(parts[0]) - 1; // JS months are 0-based
        const year = parseInt(parts[1]);
        return new Date(year, month, 1);
      }
    } catch (err) {
      console.error('Error parsing report period:', periodString, err);
    }
    
    return null;
  };

  // Custom navigation items
  const navItems = [
    { id: 'section-overview', label: 'Metrics', icon: 'chart-bar' },
    { id: 'section-widgets', label: 'Training & Inspections', icon: 'clipboard-check' },
    { id: 'section-kpi', label: 'KPIs', icon: 'chart-pie' },
    { id: 'section-trends', label: 'Trends', icon: 'chart-line' },
    { id: 'section-ai', label: 'AI Insights', icon: 'light-bulb' }
  ];

  return (
    <div id="dashboard-content" className="space-y-6 p-6">
      {/* Sticky Header with Title, Filters and Controls */}
      <div className="sticky top-0 z-10 bg-gray-100 p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Title and Action Buttons */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">EHS Dashboard</h1>
            <div className="flex space-x-3">
              <button
                onClick={exportToPDF}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-green-700 text-sm flex items-center"
                disabled={exporting}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <Link to="/report/new">
                <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-blue-700 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  New Report
                </button>
              </Link>
            </div>
          </div>
          
          {/* Filters and Period Display */}
          <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
              <div>
                <PeriodSelector 
                  onPeriodChange={handlePeriodChange}
                  selectedPeriod={selectedPeriod}
                />
              </div>
              <div>
                <CompanyFilter 
                  onChange={handleCompanyChange}
                  selectedCompany={companyFilter}
                />
              </div>
            </div>
            
            <div className="flex-shrink-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`inline-block px-3 py-1 rounded-full border ${getPeriodColor(selectedPeriod)}`}>
                  {formatPeriodDisplay(selectedPeriod, periodFilter)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getPeriodTimestamp(selectedPeriod, periodFilter)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Bar */}
        <div className="mt-4 border-t pt-4 overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 
                  ${activeSectionId === item.id 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {item.label}
              </button>
            ))}
            
            <div className="flex-grow"></div>
            
            {/* Quick Access Buttons */}
            <div className="flex space-x-1">
              <Link to="/training">
                <button className="bg-purple-100 text-purple-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-200">
                  Training
                </button>
              </Link>
              <Link to="/inspections">
                <button className="bg-green-100 text-green-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-200">
                  Inspections
                </button>
              </Link>
              <Link to="/reports">
                <button className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-200">
                  Reports
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && !metrics ? (
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-lg text-gray-600">Loading dashboard data...</div>
        </div>
      ) : error && !metrics ? (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded shadow mb-4">
          <div className="font-bold">Error loading dashboard data</div>
          <div>{error}</div>
          <div className="mt-2">Using fallback data for display purposes.</div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Metrics Overview Section */}
          <section id="section-overview" className="dashboard-section transition-all duration-300">
            <div className="section-header flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-gray-800">Safety Metrics</h2>
              <span className="text-sm text-gray-500">
                {companyFilter ? `${companyFilter}` : 'All Companies'}
              </span>
            </div>
            <MetricsOverview metrics={metrics} />
          </section>
          
          {/* Widgets Section - Training and Inspections */}
          <section id="section-widgets" className="dashboard-section transition-all duration-300">
            <div className="section-header flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-gray-800">Training & Inspections</h2>
              <div className="flex space-x-3">
                <Link to="/training">
                  <button className="text-sm text-purple-600 hover:text-purple-800 flex items-center">
                    <span>Training Details</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </Link>
                <Link to="/inspections">
                  <button className="text-sm text-green-600 hover:text-green-800 flex items-center">
                    <span>Inspection Details</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TrainingComplianceWidget metrics={metrics} />
              <InspectionsWidget periodFilter={periodFilter} companyFilter={companyFilter} />
            </div>
          </section>
          
          {/* KPI Overview Section */}
          <section id="section-kpi" className="dashboard-section transition-all duration-300">
            <div className="section-header flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-gray-800">Key Performance Indicators</h2>
              <Link to="/kpi-management">
                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  <span>Manage KPIs</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>
            <KPIOverview metrics={metrics} />
          </section>
          
          {/* Trend Charts Section */}
          <section id="section-trends" className="dashboard-section transition-all duration-300">
            <div className="section-header flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-gray-800">Safety Trends</h2>
              <Link to="/reports">
                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  <span>View All Reports</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>
            <TrendCharts periodFilter={periodFilter} companyFilter={companyFilter} />
          </section>
          
          {/* AI Insights Section */}
          <section id="section-ai" className="dashboard-section transition-all duration-300">
            <div className="section-header flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-gray-800">AI Safety Insights</h2>
              <div className="text-sm text-gray-500">
                Powered by DeepSeek AI
              </div>
            </div>
            <DeepSeekAIPanel 
              metrics={metrics} 
              selectedPeriod={selectedPeriod} 
              companyName={companyFilter} 
            />
          </section>
        </div>
      )}
      
      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-opacity duration-300"
        style={{ opacity: window.scrollY > 300 ? 1 : 0 }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
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