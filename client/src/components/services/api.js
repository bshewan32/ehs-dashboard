// client/src/components/services/api.js
const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Submit a new safety report to the server
 */
export const submitReport = async (reportData) => {
  try {
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
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
};

/**
 * Fetch all reports from the server
 */
export const fetchReports = async () => {
  try {
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
    
    // Add debugging
    console.log(`Fetched ${data.length} reports from API`);
    
    // For empty arrays, return default placeholder data
    if (!data || data.length === 0) {
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
            }
          }
        }
      ];
    }

    return data;
  } catch (error) {
    console.error('Error in fetchReports:', error);
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
          }
        }
      }
    ];
  }
};

/**
 * Fetch all inspections from the server
 */
export const fetchInspections = async () => {
  try {
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
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching inspections:', error);
    // Return empty array as fallback
    return [];
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
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting inspection:', error);
    throw error;
  }
};

/**
 * Fetch metrics summary from the server
 */
export const fetchMetricsSummary = async () => {
  try {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${api_url}/api/reports/metrics/summary`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics summary: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    // Return default metrics object as fallback
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
      }
    };
  }
};

/**
 * Fetch metrics data for a specific company
 */
/**
 * Fetch metrics data for a specific company
 * With improved stability for KPI processing
 */
export const fetchCompanyMetrics = async (companyName) => {
  try {
    if (!companyName) {
      return await fetchMetricsSummary();
    }
    
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
      lagging: mostRecent.metrics?.lagging ?? {
        incidentCount: mostRecent.metrics?.totalIncidents ?? 0,
        nearMissCount: mostRecent.metrics?.totalNearMisses ?? 0,
        firstAidCount: mostRecent.metrics?.firstAidCount ?? 0,
        medicalTreatmentCount: mostRecent.metrics?.medicalTreatmentCount ?? 0
      },
      leading: {
        trainingCompleted: mostRecent.metrics?.leading?.trainingCompleted ?? 0,
        inspectionsCompleted: mostRecent.metrics?.leading?.inspectionsCompleted ?? 0,
        // Normalize KPIs to ensure consistency
        kpis: normalizeKpis(mostRecent.metrics?.leading?.kpis)
      }
    };
    
    return metrics;
  } catch (error) {
    console.error('Error fetching company metrics:', error);
    return createDefaultMetrics();
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
function createDefaultMetrics() {
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
      kpis: createDefaultKpis()
    }
  };
}