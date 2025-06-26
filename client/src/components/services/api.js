// client/src/components/services/api.js
// Improved api.js with caching, request throttling, and period filtering

const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Cache for API responses
const apiCache = {
  reports: {
    data: null,
    timestamp: 0
  },
  metricsSummary: {
    data: null,
    timestamp: 0
  },
  inspections: {
    data: null,
    timestamp: 0
  },
  // Add training caches
  training: {
    data: null,
    timestamp: 0
  },
  trainingSummary: {
    data: null,
    timestamp: 0
  },
  // Track period-specific metrics
  periodMetrics: {}
};

// Cache expiration time in milliseconds (30 seconds)
const CACHE_EXPIRATION = 30000;

// Helper function to check if cache is valid
const isCacheValid = (cacheKey) => {
  const cache = apiCache[cacheKey];
  if (!cache.data) return false;
  
  const now = Date.now();
  return (now - cache.timestamp) < CACHE_EXPIRATION;
};

// Helper to set up headers with optional auth
const getHeaders = () => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Track if data has changed
let dataHasChanged = false;

// Add this function to mark data as changed
export const markDataChanged = () => {
  dataHasChanged = true;
  console.log('Data marked as changed');
};

// Submit report function (no caching for POST requests)
export const submitReport = async (reportData) => {
  try {
    const response = await fetch(`${api_url}/api/reports`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reportData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit report: ${response.status} ${response.statusText}`);
    }
    
    // Clear all caches after successful submission
    apiCache.reports.data = null;
    apiCache.metricsSummary.data = null;
    apiCache.periodMetrics = {};
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
};

// Fetch reports with caching
export const fetchReports = async (forceRefresh = false) => {
  try {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && !dataHasChanged && isCacheValid('reports')) {
      console.log('Using cached reports data');
      return apiCache.reports.data;
    }
    
    dataHasChanged = false;

    const res = await fetch(`${api_url}/api/reports`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch reports: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log(`Fetched ${data.length} reports from API`);
    
    // Check for empty data and provide default if needed
    if (!data || data.length === 0) {
      console.warn('No reports returned from API, using placeholder data');
      const placeholderData = getPlaceholderReports();
      // Cache the placeholder data
      apiCache.reports.data = placeholderData;
      apiCache.reports.timestamp = Date.now();
      return placeholderData;
    }

    // Cache the fetched data
    apiCache.reports.data = data;
    apiCache.reports.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('Error in fetchReports:', error);
    
    // If we have cached data, return it in case of error
    if (apiCache.reports.data) {
      console.log('Returning cached data after fetch error');
      return apiCache.reports.data;
    }
    
    // Return fallback data if no cache available
    const fallbackData = getFallbackReports();
    apiCache.reports.data = fallbackData;
    apiCache.reports.timestamp = Date.now();
    return fallbackData;
  }
};

// Fetch metrics summary for a specific period
export const fetchMetricsForPeriod = async (periodFilter, forceRefresh = false) => {
  try {
    // Generate a cache key based on the period filter
    const periodKey = periodFilter ? `${periodFilter.type}_${JSON.stringify(periodFilter)}` : 'default';
    
    // Check if we have a valid cache for this period
    if (!forceRefresh && !dataHasChanged && 
        apiCache.periodMetrics[periodKey] && 
        (Date.now() - apiCache.periodMetrics[periodKey].timestamp < CACHE_EXPIRATION)) {
      console.log(`Using cached metrics for period: ${periodKey}`);
      return apiCache.periodMetrics[periodKey].data;
    }
    
    // If no period filter, use standard metrics endpoint
    if (!periodFilter) {
      return fetchMetricsSummary(forceRefresh);
    }
    
    // Otherwise, we'll need to fetch all reports and filter/aggregate them
    console.log(`Fetching and calculating metrics for period: ${periodKey}`);
    
    // Get all reports
    const reports = await fetchReports(forceRefresh);
    if (!reports || reports.length === 0) {
      return getDefaultMetrics();
    }
    
    // Filter reports based on the period filter
    const filteredReports = filterReportsByPeriod(reports, periodFilter);
    console.log(`Filtered from ${reports.length} to ${filteredReports.length} reports for period ${periodKey}`);
    
    // If no reports match the filter, return default metrics
    if (filteredReports.length === 0) {
      const defaultMetrics = getDefaultMetrics();
      // Cache this result
      apiCache.periodMetrics[periodKey] = {
        data: defaultMetrics,
        timestamp: Date.now()
      };
      return defaultMetrics;
    }
    
    // Aggregate metrics from the filtered reports
    const aggregatedMetrics = aggregateMetrics(filteredReports);
    
    // Cache the result
    apiCache.periodMetrics[periodKey] = {
      data: aggregatedMetrics,
      timestamp: Date.now()
    };
    
    return aggregatedMetrics;
  } catch (error) {
    console.error('Error fetching metrics for period:', error);
    return getDefaultMetrics();
  }
};

// Standard metrics summary fetch (for current period)
export const fetchMetricsSummary = async (forceRefresh = false) => {
  try {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && !dataHasChanged && isCacheValid('metricsSummary')) {
      console.log('Using cached metrics summary data - no changes detected');
      return apiCache.metricsSummary.data;
    }
    
    // Reset the data changed flag since we're about to fetch fresh data
    dataHasChanged = false;
    
    const response = await fetch(`${api_url}/api/reports/metrics/summary`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics summary: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Metrics data received from server:', data);
    
    // Cache the fetched data
    apiCache.metricsSummary.data = data;
    apiCache.metricsSummary.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    
    // If we have cached data, return it in case of error
    if (apiCache.metricsSummary.data) {
      console.log('Returning cached metrics after fetch error');
      return apiCache.metricsSummary.data;
    }
    
    // Return default metrics object as fallback
    const fallbackData = getDefaultMetrics();
    apiCache.metricsSummary.data = fallbackData;
    apiCache.metricsSummary.timestamp = Date.now();
    return fallbackData;
  }
};

// Fetch inspections with caching
export const fetchInspections = async (forceRefresh = false) => {
  try {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && !dataHasChanged && isCacheValid('inspections')) {
      console.log('Using cached inspections data');
      return apiCache.inspections.data;
    }
    
    dataHasChanged = false;

    const response = await fetch(`${api_url}/api/inspections`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inspections: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the fetched data
    apiCache.inspections.data = data;
    apiCache.inspections.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching inspections:', error);
    
    // If we have cached data, return it in case of error
    if (apiCache.inspections.data) {
      return apiCache.inspections.data;
    }
    
    // Return empty array as fallback
    return [];
  }
};

// Fetch report by ID 
export const fetchReportById = async (id) => {
  try {
    // Check if it's in the cache first
    if (apiCache.reports.data) {
      const cachedReport = apiCache.reports.data.find(
        report => report._id === id
      );
      
      if (cachedReport) {
        console.log('Using cached report data for ID:', id);
        return cachedReport;
      }
    }
    
    const response = await fetch(`${api_url}/api/reports/${id}`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching report ID ${id}:`, error);
    throw error;
  }
};

// Fetch reports for a specific company
export const fetchReportsByCompany = async (companyName) => {
  try {
    // Get all reports first
    const allReports = await fetchReports();
    
    // Filter for the specific company
    return allReports.filter(report => report.companyName === companyName);
  } catch (error) {
    console.error(`Error fetching reports for company ${companyName}:`, error);
    throw error;
  }
};

// Update an existing report
export const updateReport = async (id, reportData) => {
  try {
    const response = await fetch(`${api_url}/api/reports/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(reportData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update report: ${response.status} ${response.statusText}`);
    }
    
    // Clear the cache after update
    apiCache.reports.data = null;
    apiCache.metricsSummary.data = null;
    apiCache.periodMetrics = {};
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating report ID ${id}:`, error);
    throw error;
  }
};

// Update an existing inspection
export const updateInspection = async (id, inspectionData) => {
  try {
    const response = await fetch(`${api_url}/api/inspections/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(inspectionData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update inspection: ${response.status} ${response.statusText}`);
    }
    
    // Clear the cache after update
    apiCache.inspections.data = null;
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating inspection ID ${id}:`, error);
    throw error;
  }
};

// Delete a report
export const deleteReport = async (id) => {
  try {
    const response = await fetch(`${api_url}/api/reports/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete report: ${response.status} ${response.statusText}`);
    }
    
    // Clear the cache after deletion
    apiCache.reports.data = null;
    apiCache.metricsSummary.data = null; 
    apiCache.periodMetrics = {};
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting report ID ${id}:`, error);
    throw error;
  }
};

// Delete an inspection
export const deleteInspection = async (id) => {
  try {
    const response = await fetch(`${api_url}/api/inspections/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete inspection: ${response.status} ${response.statusText}`);
    }
    
    // Clear the cache after deletion
    apiCache.inspections.data = null;
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting inspection ID ${id}:`, error);
    throw error;
  }
};

// Generate safety insights/recommendations using AI
export const generateSafetyInsights = async (metricsData, companyName = null) => {
  try {
    const response = await fetch(`${api_url}/api/ai/safety-insights`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        metrics: metricsData,
        companyName: companyName || 'All Companies'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate safety insights: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.insights || [];
  } catch (error) {
    console.error('Error generating safety insights:', error);
    
    // Return fallback recommendations if the API call fails
    return generateFallbackInsights(metricsData, companyName);
  }
};

// Generate fallback insights if AI API fails
const generateFallbackInsights = (metrics, companyName) => {
  const insights = [];
  const companyContext = companyName ? ` for ${companyName}` : '';
  
  // Extract metrics data
  const incidentCount = metrics?.lagging?.incidentCount || 
                       metrics?.totalIncidents || 0;
  const nearMissCount = metrics?.lagging?.nearMissCount || 
                       metrics?.totalNearMisses || 0;
  const trainingCompliance = metrics?.trainingCompliance || 0;
  
  // Generate basic insights based on metrics
  if (incidentCount > 5) {
    insights.push(`The high number of incidents${companyContext} (${incidentCount}) suggests potential systemic issues in risk controls. Consider conducting a comprehensive risk assessment focusing on areas with recurring incidents.`);
  }
  
  if (nearMissCount < 5) {
    insights.push(`The low near miss reporting${companyContext} (${nearMissCount}) may indicate underreporting of safety concerns. Develop a positive safety culture by implementing a non-punitive reporting system.`);
  }
  
  if (trainingCompliance < 80) {
    insights.push(`Training compliance${companyContext} is below target at ${trainingCompliance}%. Inadequate training is often a contributing factor in workplace incidents. Identify barriers to training completion.`);
  }
  
  if (incidentCount === 0 && nearMissCount === 0) {
    insights.push(`The absence of reported incidents and near misses${companyContext} may indicate excellent safety performance, but could also suggest reporting gaps. Conduct an audit to validate reporting processes.`);
  }
  
  // Add default insight if no specific ones were generated
  if (insights.length === 0) {
    insights.push(`Based on the current metrics${companyContext}, no significant safety concerns are identified. Consider conducting regular safety perception surveys to identify potential safety culture gaps.`);
  }
  
  return insights;
};

// Update a finding's status within an inspection

export const updateFindingStatus = async (inspectionId, findingIndex, resolved) => {
  try {
    // First, fetch the current inspection to get the latest data
    const response = await fetch(`${api_url}/api/inspections/${inspectionId}`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inspection: ${response.status} ${response.statusText}`);
    }
    
    const inspection = await response.json();
    
    // Validate that the finding exists at the specified index
    if (!inspection.findings || findingIndex < 0 || findingIndex >= inspection.findings.length) {
      throw new Error(`Finding with ID ${findingIndex} not found in inspection ${inspectionId}`);
    }
    
    // Create a copy of the findings array with the updated finding
    const updatedFindings = inspection.findings.map((finding, i) => 
      i === findingIndex ? { ...finding, resolved } : finding
    );
    
    // Update the inspection with the modified findings array
    const updateResponse = await fetch(`${api_url}/api/inspections/${inspectionId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        ...inspection,
        findings: updatedFindings
      }),
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update inspection: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    
    // Clear the cache after update
    apiCache.inspections.data = null;
    markDataChanged();
    
    return await updateResponse.json();
  } catch (error) {
    console.error(`Error updating finding status in inspection ${inspectionId}:`, error);
    throw error;
  }
};

// Fetch inspection by ID
export const fetchInspectionById = async (id) => {
  try {
    // Check if it's in the cache first
    if (apiCache.inspections.data) {
      const cachedInspection = apiCache.inspections.data.find(
        inspection => inspection._id === id
      );
      
      if (cachedInspection) {
        console.log('Using cached inspection data for ID:', id);
        return cachedInspection;
      }
    }
    
    const response = await fetch(`${api_url}/api/inspections/${id}`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inspection: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching inspection ID ${id}:`, error);
    throw error;
  }
};

// Fetch safety event by ID (currently aliases to inspection since routes haven't changed)
export const fetchSafetyEventById = async (id) => {
  try {
    // For now, this is the same as fetchInspectionById since the routes haven't changed
    return await fetchInspectionById(id);
  } catch (error) {
    console.error(`Error fetching safety event ID ${id}:`, error);
    throw error;
  }
};

// Submit inspection (no caching for POST)
export const submitInspection = async (inspectionData) => {
  try {
    const response = await fetch(`${api_url}/api/inspections`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(inspectionData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit inspection: ${response.status} ${response.statusText}`);
    }
    
    // Clear the inspections cache after successful submission
    apiCache.inspections.data = null;
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting inspection:', error);
    throw error;
  }
};

// Filter reports based on period filter
export const filterReportsByPeriod = (reports, periodFilter) => {
  if (!periodFilter || !reports || reports.length === 0) {
    return reports;
  }

  const currentDate = new Date();
  
  switch (periodFilter.type) {
    case 'month':
      // Filter for specific month and year
      return reports.filter(report => {
        // Parse report period - assuming format like "May 2025" or "Q2 2025"
        const reportDate = parseReportPeriod(report.reportPeriod);
        
        if (!reportDate) return false;
        
        return reportDate.getMonth() === periodFilter.month && 
               reportDate.getFullYear() === periodFilter.year;
      });
      
    case 'range':
      // Filter for last X months
      const monthsAgo = new Date();
      monthsAgo.setMonth(currentDate.getMonth() - periodFilter.months);
      
      return reports.filter(report => {
        const reportDate = parseReportPeriod(report.reportPeriod);
        if (!reportDate) return false;
        
        return reportDate >= monthsAgo;
      });
      
    case 'quarter':
      // Filter for specific quarter
      const quarterStartMonth = (periodFilter.quarter - 1) * 3;
      const quarterEndMonth = quarterStartMonth + 2;
      
      return reports.filter(report => {
        // For quarterly reports, check if it's directly a quarterly report
        if (report.reportType === 'Quarterly' && report.reportPeriod.includes(`Q${periodFilter.quarter}`)) {
          return true;
        }
        
        // For monthly reports, check if the month falls in the quarter
        const reportDate = parseReportPeriod(report.reportPeriod);
        if (!reportDate) return false;
        
        const month = reportDate.getMonth();
        return month >= quarterStartMonth && 
               month <= quarterEndMonth && 
               reportDate.getFullYear() === periodFilter.year;
      });
      
    case 'ytd':
      // Filter for current year
      const yearStart = new Date(currentDate.getFullYear(), 0, 1);
      
      return reports.filter(report => {
        const reportDate = parseReportPeriod(report.reportPeriod);
        if (!reportDate) return false;
        
        return reportDate >= yearStart;
      });
      
    case 'all':
    default:
      // No filtering
      return reports;
  }
};

// Helper function to parse report period strings
export const parseReportPeriod = (periodString) => {
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

// Aggregate metrics from multiple reports
export const aggregateMetrics = (reports) => {
  if (!reports || reports.length === 0) {
    return getDefaultMetrics();
  }
  
  // Start with default structure
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
  reports.forEach(report => {
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
};

// Helper functions for default/fallback data
function getDefaultMetrics() {
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
      kpis: [
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
      ]
    },
    trainingCompliance: 0,
    riskScore: 0
  };
}

function getPlaceholderReports() {
  return [
    {
      _id: 'placeholder1',
      companyName: 'Example Corp',
      reportPeriod: 'Q1 2025',
      reportType: 'Quarterly',
      metrics: getDefaultMetrics()
    }
  ];
}

function getFallbackReports() {
  return [
    {
      _id: 'error1',
      companyName: 'Data Unavailable',
      reportPeriod: 'Current',
      reportType: 'Error',
      metrics: getDefaultMetrics()
    }
  ];
}

// --------------------------------------------------------------------
// Training-related API functions
// --------------------------------------------------------------------

// Fetch training records with caching
export const fetchTrainingRecords = async (companyFilter = null, forceRefresh = false) => {
  try {
    // Cache key for training records
    const cacheKey = 'training';
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && !dataHasChanged && isCacheValid(cacheKey)) {
      console.log('Using cached training data');
      return apiCache[cacheKey].data;
    }
    
    dataHasChanged = false;
    
    // Prepare URL with optional company filter
    let url = `${api_url}/api/training`;
    if (companyFilter) {
      url += `?company=${encodeURIComponent(companyFilter)}`;
    }
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch training records: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length} training records from API`);
    
    // Cache the fetched data
    apiCache[cacheKey].data = data;
    apiCache[cacheKey].timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('Error in fetchTrainingRecords:', error);
    
    // If we have cached data, return it in case of error
    if (apiCache.training.data) {
      console.log('Returning cached training data after fetch error');
      return apiCache.training.data;
    }
    
    // Return empty array as fallback
    return [];
  }
};

// Fetch training summary with caching
export const fetchTrainingSummary = async (companyFilter = null, forceRefresh = false) => {
  try {
    // Cache key for training summary
    const cacheKey = 'trainingSummary';
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && !dataHasChanged && isCacheValid(cacheKey)) {
      console.log('Using cached training summary data');
      return apiCache[cacheKey].data;
    }
    
    dataHasChanged = false;
    
    // Prepare URL with optional company filter
    let url = `${api_url}/api/training/summary`;
    if (companyFilter) {
      url += `?company=${encodeURIComponent(companyFilter)}`;
    }
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch training summary: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the fetched data
    apiCache[cacheKey].data = data;
    apiCache[cacheKey].timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('Error in fetchTrainingSummary:', error);
    
    // If we have cached data, return it in case of error
    if (apiCache.trainingSummary.data) {
      console.log('Returning cached training summary after fetch error');
      return apiCache.trainingSummary.data;
    }
    
    // Return default data as fallback
    return {
      totalRecords: 0,
      completed: 0,
      expired: 0,
      dueSoon: 0,
      complianceRate: 0,
      trainingTypes: [],
      lastUpdated: new Date()
    };
  }
};

// Submit training record
export const submitTrainingRecord = async (trainingData) => {
  try {
    const response = await fetch(`${api_url}/api/training`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(trainingData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit training record: ${response.status} ${response.statusText}`);
    }
    
    // Clear the cache after successful submission
    apiCache.training.data = null;
    apiCache.trainingSummary.data = null;
    // Mark data as changed
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting training record:', error);
    throw error;
  }
};

// Upload training file
export const uploadTrainingFile = async (formData) => {
  try {
    const response = await fetch(`${api_url}/api/training/upload`, {
      method: 'POST',
      body: formData, // No Content-Type header for FormData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload training file: ${response.status} ${response.statusText}`);
    }
    
    // Clear the cache after successful upload
    apiCache.training.data = null;
    apiCache.trainingSummary.data = null;
    // Mark data as changed
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading training file:', error);
    throw error;
  }
};

// Fetch training record by ID
export const fetchTrainingById = async (id) => {
  try {
    // Check if it's in the cache first
    if (apiCache.training.data) {
      const cachedTraining = apiCache.training.data.find(
        training => training._id === id
      );
      
      if (cachedTraining) {
        console.log('Using cached training data for ID:', id);
        return cachedTraining;
      }
    }
    
    const response = await fetch(`${api_url}/api/training/${id}`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch training record: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching training ID ${id}:`, error);
    throw error;
  }
};

// Update an existing training record
export const updateTrainingRecord = async (id, trainingData) => {
  try {
    const response = await fetch(`${api_url}/api/training/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(trainingData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update training record: ${response.status} ${response.statusText}`);
    }
    
    // Clear the cache after update
    apiCache.training.data = null;
    apiCache.trainingSummary.data = null;
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating training ID ${id}:`, error);
    throw error;
  }
};

// Delete a training record
export const deleteTrainingRecord = async (id) => {
  try {
    const response = await fetch(`${api_url}/api/training/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete training record: ${response.status} ${response.statusText}`);
    }
    
    // Clear the cache after deletion
    apiCache.training.data = null;
    apiCache.trainingSummary.data = null;
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting training ID ${id}:`, error);
    throw error;
  }
};

// Get expired or due soon training records (for notifications/dashboards)
export const getExpiringTrainingRecords = async (daysThreshold = 30, companyFilter = null) => {
  try {
    // Get all training records first
    const allRecords = await fetchTrainingRecords(companyFilter);
    
    // Current date for comparison
    const today = new Date();
    const futureThreshold = new Date();
    futureThreshold.setDate(today.getDate() + daysThreshold);
    
    // Filter records that are expired or due soon
    return allRecords.filter(record => {
      if (!record.expiryDate) return false;
      
      const expiryDate = new Date(record.expiryDate);
      // Return true if expired or will expire within threshold
      return expiryDate <= futureThreshold;
    });
  } catch (error) {
    console.error('Error getting expiring training records:', error);
    return [];
  }
};
