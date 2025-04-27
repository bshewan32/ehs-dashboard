const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Submit a new safety report to the server
 */
export const submitReport = async (reportData) => {
  try {
    // Ensure LTI is included in the metrics
    if (reportData.metrics && reportData.metrics.lagging && reportData.metrics.lagging.lostTimeInjuryCount === undefined) {
      reportData.metrics.lagging.lostTimeInjuryCount = 0;
    }
    
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${api_url}/api/reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify(reportData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit report: ${response.status} ${response.statusText}`);
    }
    
    // Clear metrics cache
    localStorage.removeItem('metricsSummaryCache');
    localStorage.removeItem('reportsCache');
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
};

/**
 * Process report data to ensure LTI field is included
 */
function processReportData(report) {
  // Make a copy to avoid modifying original data
  const processedReport = { ...report };
  
  // Ensure metrics exists
  if (!processedReport.metrics) {
    processedReport.metrics = {};
  }
  
  // Ensure lagging metrics exists and includes lostTimeInjuryCount
  if (!processedReport.metrics.lagging) {
    processedReport.metrics.lagging = {
      incidentCount: processedReport.metrics.totalIncidents || 0,
      nearMissCount: processedReport.metrics.totalNearMisses || 0,
      firstAidCount: processedReport.metrics.firstAidCount || 0,
      medicalTreatmentCount: processedReport.metrics.medicalTreatmentCount || 0,
      lostTimeInjuryCount: 0
    };
  } else if (processedReport.metrics.lagging.lostTimeInjuryCount === undefined) {
    processedReport.metrics.lagging.lostTimeInjuryCount = 0;
  }
  
  return processedReport;
}

/**
 * Fetch all reports from the server
 * With caching to reduce API calls
 */
export const fetchReports = async () => {
  try {
    // Check if we have cached reports
    const cacheKey = 'reportsCache';
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;
      const maxCacheAge = 10 * 60 * 1000; // 10 minutes
      
      if (cacheAge < maxCacheAge) {
        console.log(`Using cached reports (age: ${Math.round(cacheAge/1000)}s, count: ${data.length})`);
        return data.map(processReportData);
      }
    }
    
    console.log('Fetching fresh reports from API');
    
    // Get token if it exists
    const token = localStorage.getItem('token');
    
    // Setup headers with optional authentication
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const res = await fetch(`${api_url}/api/reports`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch reports: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    // Process the data to ensure LTI is included
    const processedData = data.map(processReportData);
    
    // Cache the results
    localStorage.setItem(cacheKey, JSON.stringify({
      data: processedData,
      timestamp: Date.now()
    }));
    
    console.log(`Fetched ${processedData.length} reports from API`);
    
    // For empty arrays, return default placeholder data
    if (!processedData || processedData.length === 0) {
      console.warn('No reports returned from API, using placeholder data');
      return [
        {
          _id: 'placeholder1',
          companyName: 'Example Corp',
          reportPeriod: 'Q1',
          reportType: 'Monthly',
          metrics: {
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
            }
          }
        }
      ];
    }

    return processedData;
  } catch (error) {
    console.error('Error in fetchReports:', error);
    
    // Try to use cached data even if it's expired
    try {
      const cacheKey = 'reportsCache';
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        console.log('Error occurred, using expired reports cache as fallback');
        const { data } = JSON.parse(cachedData);
        return data.map(processReportData);
      }
    } catch (cacheError) {
      console.error('Could not retrieve reports cache:', cacheError);
    }

    // Return mock data to prevent UI breaking
    return [
      {
        _id: 'error1',
        companyName: 'Data Unavailable',
        reportPeriod: 'Current',
        reportType: 'Error',
        metrics: {
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
          }
        }
      }
    ];
  }
};

/**
 * Fetch all inspections from the server
 * With caching to reduce API calls
 */
export const fetchInspections = async () => {
  try {
    // Check for cached inspections
    const cacheKey = 'inspectionsCache';
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;
      const maxCacheAge = 5 * 60 * 1000; // 5 minutes
      
      if (cacheAge < maxCacheAge) {
        console.log(`Using cached inspections (age: ${Math.round(cacheAge/1000)}s, count: ${data.length})`);
        return data;
      }
    }
    
    console.log('Fetching fresh inspections from API');
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${api_url}/api/inspections`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inspections: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the results
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    return data;
  } catch (error) {
    console.error('Error fetching inspections:', error);
    
    // Try to use cached data even if it's expired
    try {
      const cacheKey = 'inspectionsCache';
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        console.log('Error occurred, using expired inspections cache as fallback');
        const { data } = JSON.parse(cachedData);
        return data;
      }
    } catch (cacheError) {
      console.error('Could not retrieve inspections cache:', cacheError);
    }
    
    // Return empty array as fallback
    return [];
  }
};

/**
 * Fetch a specific inspection by ID
 */
export const fetchInspectionById = async (inspectionId) => {
  try {
    // Check cached inspections first
    const cacheKey = 'inspectionsCache';
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data } = JSON.parse(cachedData);
      const cachedInspection = data.find(insp => insp._id === inspectionId);
      
      if (cachedInspection) {
        console.log(`Using cached inspection for ID: ${inspectionId}`);
        return cachedInspection;
      }
    }
    
    console.log(`Fetching inspection with ID: ${inspectionId}`);
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${api_url}/api/inspections/${inspectionId}`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inspection: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching inspection ${inspectionId}:`, error);
    throw error;
  }
};

/**
 * Submit a new inspection to the server
 */
export const submitInspection = async (inspectionData) => {
  try {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${api_url}/api/inspections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(inspectionData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit inspection: ${response.status} ${response.statusText}`);
    }
    
    // Clear the inspections cache to ensure fresh data on next fetch
    localStorage.removeItem('inspectionsCache');
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting inspection:', error);
    throw error;
  }
};

/**
 * Update an existing inspection
 */
export const updateInspection = async (inspectionId, inspectionData) => {
  try {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${api_url}/api/inspections/${inspectionId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(inspectionData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update inspection: ${response.status} ${response.statusText}`);
    }
    
    // Clear the inspections cache to ensure fresh data on next fetch
    localStorage.removeItem('inspectionsCache');
    
    return await response.json();
  } catch (error) {
    console.error('Error updating inspection:', error);
    throw error;
  }
};

/**
 * Update the status of a specific finding within an inspection
 */
export const updateFindingStatus = async (inspectionId, findingIndex, resolved) => {
  try {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${api_url}/api/inspections/${inspectionId}/findings/${findingIndex}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ resolved }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update finding: ${response.status} ${response.statusText}`);
    }
    
    // Clear the inspections cache to ensure fresh data on next fetch
    localStorage.removeItem('inspectionsCache');
    
    return await response.json();
  } catch (error) {
    console.error('Error updating finding status:', error);
    throw error;
  }
};

/**
 * Fetch metrics summary from the server
 * With client-side caching
 */
export const fetchMetricsSummary = async (currentYearOnly = false) => {
  try {
    // Determine which endpoint to use
    const endpoint = currentYearOnly ? 
      `${api_url}/api/reports/metrics/current-year` : 
      `${api_url}/api/reports/metrics/summary`;
    
    // Use different cache keys for all-time vs current year
    const cacheKey = currentYearOnly ? 'currentYearMetricsCache' : 'metricsSummaryCache';
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;
      const maxCacheAge = 10 * 60 * 1000; // 10 minutes
      
      if (cacheAge < maxCacheAge) {
        console.log(`Using cached metrics ${currentYearOnly ? 'for current year' : 'summary'} (age: ${Math.round(cacheAge/1000)}s)`);
        // Ensure cached data has the LTI field
        if (data.lagging && data.lagging.lostTimeInjuryCount === undefined) {
          data.lagging.lostTimeInjuryCount = 0;
        }
        return data;
      }
    }
    
    console.log(`Fetching fresh metrics ${currentYearOnly ? 'for current year' : 'summary'} from API`);
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(endpoint, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Ensure the data structure is complete with all fields
    const processedData = {
      // Lagging indicators
      totalIncidents: data.totalIncidents ?? 0,
      totalNearMisses: data.totalNearMisses ?? 0,
      firstAidCount: data.firstAidCount ?? 0,
      medicalTreatmentCount: data.medicalTreatmentCount ?? 0,
      lostTimeInjuryCount: data.lostTimeInjuryCount ?? 0,
      
      // Leading indicators
      trainingCompliance: data.trainingCompliance ?? 0,
      riskScore: data.riskScore ?? 0,
      
      // Store whether this is current year data
      isCurrentYear: currentYearOnly,
      year: data.year,
      
      // Ensure proper structure for nested objects
      lagging: {
        incidentCount: data.lagging?.incidentCount ?? data.totalIncidents ?? 0,
        nearMissCount: data.lagging?.nearMissCount ?? data.totalNearMisses ?? 0,
        firstAidCount: data.lagging?.firstAidCount ?? data.firstAidCount ?? 0,
        medicalTreatmentCount: data.lagging?.medicalTreatmentCount ?? data.medicalTreatmentCount ?? 0,
        lostTimeInjuryCount: data.lagging?.lostTimeInjuryCount ?? data.lostTimeInjuryCount ?? 0
      },
      
      leading: {
        ...(data.leading || {}),
        trainingCompleted: data.leading?.trainingCompleted ?? 0,
        inspectionsCompleted: data.leading?.inspectionsCompleted ?? 0,
        kpis: Array.isArray(data.leading?.kpis) ? data.leading.kpis : []
      }
    };
    
    // Cache the fetched data
    localStorage.setItem(cacheKey, JSON.stringify({
      data: processedData,
      timestamp: Date.now()
    }));
    
    return processedData;
  } catch (error) {
    console.error(`Error fetching metrics ${currentYearOnly ? 'for current year' : 'summary'}:`, error);
    
    // Try to use cached data even if it's expired
    try {
      const cacheKey = currentYearOnly ? 'currentYearMetricsCache' : 'metricsSummaryCache';
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        console.log('Error occurred, using expired cache as fallback');
        const { data } = JSON.parse(cachedData);
        // Ensure cached data has the LTI field
        if (data.lagging && data.lagging.lostTimeInjuryCount === undefined) {
          data.lagging.lostTimeInjuryCount = 0;
        }
        return data;
      }
    } catch (cacheError) {
      console.error('Could not retrieve cache:', cacheError);
    }
    
    // Return default metrics object as last resort fallback
    return createDefaultMetrics(currentYearOnly);
  }
};

/**
 * Fetch metrics data for a specific company
 * With caching to reduce API calls
 */
export const fetchCompanyMetrics = async (companyName) => {
  try {
    if (!companyName) {
      return await fetchMetricsSummary();
    }
    
    // Cache key for this company
    const cacheKey = `companyMetrics_${companyName}`;
    
    // Check cache first
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const cacheAge = Date.now() - timestamp;
      const maxCacheAge = 10 * 60 * 1000; // 10 minutes
      
      if (cacheAge < maxCacheAge) {
        console.log(`Using cached metrics for ${companyName} (age: ${Math.round(cacheAge/1000)}s)`);
        // Ensure cached data has the LTI field
        if (data.lagging && data.lagging.lostTimeInjuryCount === undefined) {
          data.lagging.lostTimeInjuryCount = 0;
        }
        return data;
      }
    }
    
    console.log(`Fetching fresh metrics for company: ${companyName}`);
    
    // Get token if it exists
    const token = localStorage.getItem('token');
    
    // Setup headers with optional authentication
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // First get all reports
    const reports = await fetchReports();
    
    // Filter by company name
    const companyReports = reports.filter(report => report.companyName === companyName);
    
    if (companyReports.length === 0) {
      console.warn(`No reports found for company: ${companyName}`);
      return createDefaultMetrics();
    }
    
    // Sort to get most recent
    companyReports.sort((a, b) => {
      return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
    });
    
    const mostRecent = companyReports[0];
    console.log(`Using most recent report from ${mostRecent.reportPeriod} for ${companyName}`);
    
    // Helper function to normalize KPI data
    const normalizeKpis = (kpis) => {
      if (!kpis || !Array.isArray(kpis)) return createDefaultKpis();
      
      return kpis.map(kpi => ({
        id: kpi.id || kpi.name.toLowerCase().replace(/\s+/g, ''),
        name: kpi.name,
        actual: kpi.actual || 0,
        target: kpi.target || 100,
        unit: kpi.unit || '%'
      }));
    };
    
    // Extract and format metrics from the most recent report
    const metrics = {
      // Combine both the top-level metrics and nested structure
      totalIncidents: mostRecent.metrics?.totalIncidents ?? mostRecent.metrics?.lagging?.incidentCount ?? 0,
      totalNearMisses: mostRecent.metrics?.totalNearMisses ?? mostRecent.metrics?.lagging?.nearMissCount ?? 0,
      firstAidCount: mostRecent.metrics?.firstAidCount ?? mostRecent.metrics?.lagging?.firstAidCount ?? 0,
      medicalTreatmentCount: mostRecent.metrics?.medicalTreatmentCount ?? mostRecent.metrics?.lagging?.medicalTreatmentCount ?? 0,
      trainingCompliance: mostRecent.metrics?.trainingCompliance ?? 0,
      riskScore: mostRecent.metrics?.riskScore ?? 0,
      
      // Extract nested structures
      lagging: {
        incidentCount: mostRecent.metrics?.lagging?.incidentCount ?? mostRecent.metrics?.totalIncidents ?? 0,
        nearMissCount: mostRecent.metrics?.lagging?.nearMissCount ?? mostRecent.metrics?.totalNearMisses ?? 0,
        firstAidCount: mostRecent.metrics?.lagging?.firstAidCount ?? mostRecent.metrics?.firstAidCount ?? 0,
        medicalTreatmentCount: mostRecent.metrics?.lagging?.medicalTreatmentCount ?? mostRecent.metrics?.medicalTreatmentCount ?? 0,
        lostTimeInjuryCount: mostRecent.metrics?.lagging?.lostTimeInjuryCount ?? 0
      },
      leading: {
        trainingCompleted: mostRecent.metrics?.leading?.trainingCompleted ?? 0,
        inspectionsCompleted: mostRecent.metrics?.leading?.inspectionsCompleted ?? 0,
        // Normalize KPIs to ensure consistency
        kpis: normalizeKpis(mostRecent.metrics?.leading?.kpis)
      }
    };
    
    // Cache the metrics
    localStorage.setItem(cacheKey, JSON.stringify({
      data: metrics,
      timestamp: Date.now()
    }));
    
    return metrics;
  } catch (error) {
    console.error('Error fetching company metrics:', error);
    return createDefaultMetrics();
  }
};

/**
 * Delete an inspection by ID
 */
export const deleteInspection = async (inspectionId) => {
  try {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${api_url}/api/inspections/${inspectionId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete inspection: ${response.status} ${response.statusText}`);
    }
    
    // Clear the inspections cache to ensure fresh data on next fetch
    localStorage.removeItem('inspectionsCache');
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting inspection ${inspectionId}:`, error);
    throw error;
  }
};

// Helper function to create default KPIs
function createDefaultKpis() {
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

// Helper function to create default metrics
function createDefaultMetrics(isCurrentYear = false) {
  const currentYear = new Date().getFullYear();
  
  return {
    totalIncidents: 0,
    totalNearMisses: 0,
    firstAidCount: 0,
    medicalTreatmentCount: 0,
    lostTimeInjuryCount: 0,
    trainingCompliance: 0,
    riskScore: 0,
    isCurrentYear: isCurrentYear,
    year: isCurrentYear ? currentYear : null,
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
      kpis: createDefaultKpis()
    }
  };
}