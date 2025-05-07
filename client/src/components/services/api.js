// client/src/components/services/api.js
// Improved api.js with better caching, error handling, and data consistency

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
  inspectionDetails: {
    // Will store individual inspection details by ID
    // Format: { [inspectionId]: { data, timestamp } }
  }
};

// Initialize inspectionDetails to avoid undefined errors
apiCache.inspectionDetails = {};

// Cache expiration time in milliseconds (30 seconds)
const CACHE_EXPIRATION = 30000;

// Track if data has changed (e.g. after a form submission)
let dataHasChanged = false;

// Helper function to check if cache is valid
const isCacheValid = (cacheKey, id = null) => {
  if (id) {
    // For caches that are indexed by ID
    const cache = apiCache[cacheKey][id];
    if (!cache || !cache.data) return false;
    
    const now = Date.now();
    return (now - cache.timestamp) < CACHE_EXPIRATION;
  } else {
    // For regular caches
    const cache = apiCache[cacheKey];
    if (!cache.data) return false;
    
    const now = Date.now();
    return (now - cache.timestamp) < CACHE_EXPIRATION;
  }
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

// Mark data as changed - to be called after successful POST/PUT operations
export const markDataChanged = () => {
  console.log('Marking data as changed');
  dataHasChanged = true;
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to submit report: ${response.status} ${response.statusText}`);
    }
    
    // Clear the cache and mark data as changed after successful submission
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
};

// Fetch reports with caching and consistent error handling
export const fetchReports = async (forceRefresh = false) => {
  try {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && !dataHasChanged && isCacheValid('reports')) {
      console.log('Using cached reports data');
      return apiCache.reports.data;
    }
    
    // Reset the data changed flag
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
      console.warn('No reports returned from API');
      apiCache.reports.data = [];
      apiCache.reports.timestamp = Date.now();
      return [];
    }

    // Normalize the data structure
    const normalizedData = data.map(report => {
      // Ensure the metrics structure is consistent
      const metrics = report.metrics || {};
      
      // Ensure lagging and leading structures exist
      if (!metrics.lagging) {
        metrics.lagging = {
          incidentCount: metrics.totalIncidents || 0,
          nearMissCount: metrics.totalNearMisses || 0,
          firstAidCount: metrics.firstAidCount || 0, 
          medicalTreatmentCount: metrics.medicalTreatmentCount || 0,
          lostTimeInjuryCount: 0
        };
      }
      
      if (!metrics.leading) {
        metrics.leading = {
          trainingCompleted: 0,
          inspectionsCompleted: 0,
          kpis: metrics.kpis || []
        };
      } else if (!metrics.leading.kpis) {
        metrics.leading.kpis = metrics.kpis || [];
      }
      
      return {
        ...report,
        metrics
      };
    });
    
    // Cache the normalized data
    apiCache.reports.data = normalizedData;
    apiCache.reports.timestamp = Date.now();
    return normalizedData;
  } catch (error) {
    console.error('Error in fetchReports:', error);
    
    // If we have cached data, return it in case of error
    if (apiCache.reports.data) {
      console.log('Returning cached data after fetch error');
      return apiCache.reports.data;
    }
    
    // Return empty array as fallback
    return [];
  }
};

// Fetch specific report by ID
export const fetchReportById = async (reportId, forceRefresh = false) => {
  try {
    if (!reportId) {
      throw new Error('Report ID is required');
    }
    
    // First try to find it in the reports cache if available
    if (!forceRefresh && !dataHasChanged && isCacheValid('reports')) {
      const cachedReports = apiCache.reports.data;
      const cachedReport = cachedReports.find(report => report._id === reportId);
      
      if (cachedReport) {
        console.log(`Using cached report data for ID: ${reportId}`);
        return cachedReport;
      }
    }
    
    // If not found in cache or cache invalid, fetch directly
    const response = await fetch(`${api_url}/api/reports/${reportId}`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`);
    }
    
    const report = await response.json();
    
    // Normalize the data structure
    const metrics = report.metrics || {};
    
    // Ensure lagging and leading structures exist
    if (!metrics.lagging) {
      metrics.lagging = {
        incidentCount: metrics.totalIncidents || 0,
        nearMissCount: metrics.totalNearMisses || 0,
        firstAidCount: metrics.firstAidCount || 0,
        medicalTreatmentCount: metrics.medicalTreatmentCount || 0,
        lostTimeInjuryCount: 0
      };
    }
    
    if (!metrics.leading) {
      metrics.leading = {
        trainingCompleted: 0,
        inspectionsCompleted: 0,
        kpis: metrics.kpis || []
      };
    } else if (!metrics.leading.kpis) {
      metrics.leading.kpis = metrics.kpis || [];
    }
    
    const normalizedReport = {
      ...report,
      metrics
    };
    
    return normalizedReport;
  } catch (error) {
    console.error(`Error fetching report ID: ${reportId}`, error);
    throw error;
  }
};

// Fetch metrics summary with caching
export const fetchMetricsSummary = async (forceRefresh = false) => {
  try {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && !dataHasChanged && isCacheValid('metricsSummary')) {
      console.log('Using cached metrics summary data');
      return apiCache.metricsSummary.data;
    }
    
    // Reset the data changed flag
    dataHasChanged = false;
    
    const response = await fetch(`${api_url}/api/reports/metrics/summary`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics summary: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Metrics data received from server:', data);
    
    // Normalize the metrics structure to ensure consistency
    const normalizedMetrics = normalizeMetricsStructure(data);
    
    // Cache the normalized data
    apiCache.metricsSummary.data = normalizedMetrics;
    apiCache.metricsSummary.timestamp = Date.now();
    return normalizedMetrics;
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    
    // If we have cached data, return it in case of error
    if (apiCache.metricsSummary.data) {
      console.log('Returning cached metrics after fetch error');
      return apiCache.metricsSummary.data;
    }
    
    // Return default metrics object as fallback
    const defaultMetrics = getDefaultMetrics();
    return defaultMetrics;
  }
};

// Normalize metrics structure for consistency
function normalizeMetricsStructure(metrics) {
  if (!metrics) return getDefaultMetrics();
  
  // Create a deep copy to avoid modifying the original object
  const normalizedMetrics = JSON.parse(JSON.stringify(metrics));
  
  // Ensure lagging indicators structure exists
  if (!normalizedMetrics.lagging) {
    normalizedMetrics.lagging = {
      incidentCount: normalizedMetrics.totalIncidents || 0,
      nearMissCount: normalizedMetrics.totalNearMisses || 0,
      firstAidCount: normalizedMetrics.firstAidCount || 0,
      medicalTreatmentCount: normalizedMetrics.medicalTreatmentCount || 0,
      lostTimeInjuryCount: 0
    };
  }
  
  // Ensure leading indicators structure exists
  if (!normalizedMetrics.leading) {
    normalizedMetrics.leading = {
      trainingCompleted: 0,
      inspectionsCompleted: 0,
      kpis: normalizedMetrics.kpis || []
    };
  } else if (!normalizedMetrics.leading.kpis) {
    // If leading exists but kpis doesn't, check if kpis exists at top level
    normalizedMetrics.leading.kpis = normalizedMetrics.kpis || [];
  }
  
  // If kpis exists at top level, make sure it's also in leading.kpis
  if (Array.isArray(normalizedMetrics.kpis) && normalizedMetrics.kpis.length > 0) {
    // Ensure leading.kpis exists and copy kpis into it if empty
    if (!Array.isArray(normalizedMetrics.leading.kpis) || normalizedMetrics.leading.kpis.length === 0) {
      normalizedMetrics.leading.kpis = [...normalizedMetrics.kpis];
    }
  }
  
  // Add any missing KPIs if there are none or add defaults if they're missing
  if (!normalizedMetrics.leading.kpis || normalizedMetrics.leading.kpis.length === 0) {
    normalizedMetrics.leading.kpis = getDefaultKPIs();
  }
  
  // Ensure top-level properties for backward compatibility
  normalizedMetrics.totalIncidents = normalizedMetrics.lagging?.incidentCount ?? normalizedMetrics.totalIncidents ?? 0;
  normalizedMetrics.totalNearMisses = normalizedMetrics.lagging?.nearMissCount ?? normalizedMetrics.totalNearMisses ?? 0;
  normalizedMetrics.firstAidCount = normalizedMetrics.lagging?.firstAidCount ?? normalizedMetrics.firstAidCount ?? 0;
  normalizedMetrics.medicalTreatmentCount = normalizedMetrics.lagging?.medicalTreatmentCount ?? normalizedMetrics.medicalTreatmentCount ?? 0;
  
  return normalizedMetrics;
}

// Fetch inspections with caching
export const fetchInspections = async (forceRefresh = false) => {
  try {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && !dataHasChanged && isCacheValid('inspections')) {
      console.log('Using cached inspections data');
      return apiCache.inspections.data;
    }
    
    // Reset the data changed flag
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

// Fetch a specific inspection by ID
export const fetchInspectionById = async (inspectionId, forceRefresh = false) => {
  try {
    if (!inspectionId) {
      throw new Error('Inspection ID is required');
    }
    
    // Initialize inspectionDetails cache object if it doesn't exist
    if (!apiCache.inspectionDetails[inspectionId]) {
      apiCache.inspectionDetails[inspectionId] = {
        data: null,
        timestamp: 0
      };
    }
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && 
        !dataHasChanged && 
        isCacheValid('inspectionDetails', inspectionId)) {
      console.log(`Using cached inspection data for ID: ${inspectionId}`);
      return apiCache.inspectionDetails[inspectionId].data;
    }
    
    // First try to find it in the inspections cache if available
    if (!forceRefresh && !dataHasChanged && isCacheValid('inspections')) {
      const cachedInspections = apiCache.inspections.data;
      const cachedInspection = cachedInspections.find(insp => insp._id === inspectionId);
      
      if (cachedInspection) {
        // Store in the specific inspection cache as well
        apiCache.inspectionDetails[inspectionId] = {
          data: cachedInspection,
          timestamp: Date.now()
        };
        return cachedInspection;
      }
    }
    
    // If not found in cache or cache invalid, fetch directly
    const response = await fetch(`${api_url}/api/inspections/${inspectionId}`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inspection: ${response.status} ${response.statusText}`);
    }
    
    const inspection = await response.json();
    
    // Cache the specific inspection data
    apiCache.inspectionDetails[inspectionId] = {
      data: inspection,
      timestamp: Date.now()
    };
    
    return inspection;
  } catch (error) {
    console.error(`Error fetching inspection ID: ${inspectionId}`, error);
    throw error;
  }
};

// Update an inspection
export const updateInspection = async (inspectionId, inspectionData) => {
  try {
    if (!inspectionId) {
      throw new Error('Inspection ID is required for update');
    }
    
    const response = await fetch(`${api_url}/api/inspections/${inspectionId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(inspectionData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update inspection: ${response.status} ${response.statusText}`);
    }
    
    // Mark data as changed after successful update
    markDataChanged();
    
    // Clear specific inspection cache
    if (apiCache.inspectionDetails && apiCache.inspectionDetails[inspectionId]) {
      apiCache.inspectionDetails[inspectionId] = {
        data: null,
        timestamp: 0
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating inspection ID: ${inspectionId}`, error);
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
    
    // Mark data as changed after successful submission
    markDataChanged();
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting inspection:', error);
    throw error;
  }
};

// Delete an inspection
export const deleteInspection = async (inspectionId) => {
  try {
    if (!inspectionId) {
      throw new Error('Inspection ID is required for deletion');
    }
    
    const response = await fetch(`${api_url}/api/inspections/${inspectionId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete inspection: ${response.status} ${response.statusText}`);
    }
    
    // Mark data as changed after successful deletion
    markDataChanged();
    
    // Clear specific inspection cache
    if (apiCache.inspectionDetails && apiCache.inspectionDetails[inspectionId]) {
      apiCache.inspectionDetails[inspectionId] = {
        data: null,
        timestamp: 0
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting inspection ID: ${inspectionId}`, error);
    throw error;
  }
};

// Update the status of a finding within an inspection
export const updateFindingStatus = async (inspectionId, findingId, resolved) => {
  try {
    if (!inspectionId) {
      throw new Error('Inspection ID is required');
    }
    
    if (!findingId) {
      throw new Error('Finding ID is required');
    }
    
    // Define the payload with just the resolved status to update
    const payload = {
      findingId,
      resolved: !!resolved // Convert to boolean
    };
    
    // Make API call to update just the finding status
    const response = await fetch(`${api_url}/api/inspections/${inspectionId}/findings/${findingId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update finding status: ${response.status} ${response.statusText}`);
    }
    
    // Mark data as changed after successful update
    markDataChanged();
    
    // Clear specific inspection cache to force a refresh
    if (apiCache.inspectionDetails && apiCache.inspectionDetails[inspectionId]) {
      apiCache.inspectionDetails[inspectionId] = {
        data: null,
        timestamp: 0
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating finding status for inspection ID: ${inspectionId}, finding ID: ${findingId}`, error);
    throw error;
  }
};

// Helper function to get default KPIs
function getDefaultKPIs() {
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
}

// Helper function for default metrics
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
      kpis: getDefaultKPIs()
    },
    trainingCompliance: 0,
    riskScore: 0
  };
}