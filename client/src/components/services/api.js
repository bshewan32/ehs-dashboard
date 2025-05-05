// Improved api.js with caching and request throttling
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
  }
};

// Cache expiration time in milliseconds
const CACHE_EXPIRATION = 30000; // 30 seconds 

// Flag to track if data has changed due to user actions
let dataHasChanged = false;

// Helper function to check if cache is valid
const isCacheValid = (cacheKey) => {
  const cache = apiCache[cacheKey];
  if (!cache.data) return false;
  
  const now = Date.now();
  return !dataHasChanged && (now - cache.timestamp) < CACHE_EXPIRATION;
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

// Mark data as changed - called after form submissions
export const markDataChanged = () => {
  console.log("API: Marking data as changed - will force refresh on next fetch");
  dataHasChanged = true;
  
  // Clear all caches when data changes
  apiCache.reports.data = null;
  apiCache.metricsSummary.data = null;
  apiCache.inspections.data = null;
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
    
    // Mark data as changed after submission
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
    if (!forceRefresh && isCacheValid('reports')) {
      console.log('Using cached reports data');
      return apiCache.reports.data;
    }
    
    // Reset the data changed flag since we're about to fetch fresh data
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

// Fetch metrics summary with caching
export const fetchMetricsSummary = async (forceRefresh = false) => {
  try {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid('metricsSummary')) {
      console.log('Using cached metrics summary data');
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
    console.log('Fetched fresh metrics summary data');
    
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
    if (!forceRefresh && isCacheValid('inspections')) {
      console.log('Using cached inspections data');
      return apiCache.inspections.data;
    }
    
    // Reset the data changed flag since we're about to fetch fresh data
    dataHasChanged = false;

    console.log('Fetching fresh inspections data from API');
    const response = await fetch(`${api_url}/api/inspections`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inspections: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length} inspections from API`);
    
    // Cache the fetched data
    apiCache.inspections.data = data;
    apiCache.inspections.timestamp = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching inspections:', error);
    
    // If we have cached data, return it in case of error
    if (apiCache.inspections.data) {
      console.log('Returning cached inspections after fetch error');
      return apiCache.inspections.data;
    }
    
    // Return empty array as fallback
    return [];
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
    
    // Mark data as changed to force refresh on next fetch
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting inspection:', error);
    throw error;
  }
};

// Fetch inspection by ID
export const fetchInspectionById = async (id) => {
  try {
    // For inspection details, we don't use the cache as we want the most up-to-date data
    const response = await fetch(`${api_url}/api/inspections/${id}`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inspection: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching inspection ${id}:`, error);
    throw error;
  }
};

// Update finding status (mark as resolved/unresolved)
export const updateFindingStatus = async (inspectionId, findingIndex, resolved) => {
  try {
    const response = await fetch(`${api_url}/api/inspections/${inspectionId}/findings/${findingIndex}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ resolved }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update finding status: ${response.status} ${response.statusText}`);
    }
    
    // Mark data as changed to force refresh on next fetch
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error('Error updating finding status:', error);
    throw error;
  }
};

// Helper functions for default/fallback data
function getDefaultMetrics() {
  return {
    lagging: {
      incidentCount: 0,
      nearMissCount: 0,
      firstAidCount: 0,
      medicalTreatmentCount: 0
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
      reportPeriod: 'Q1',
      reportType: 'Monthly',
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

// NOTE: Make sure all API functions are properly exported as 'export const'