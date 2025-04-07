const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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