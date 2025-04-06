// client/src/components/services/api.js
const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    // Try to get error message from response
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    } catch (e) {
      throw new Error(`API error: ${response.status}`);
    }
  }
  return response.json();
};

// Get auth headers if token exists
const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Fetch all reports
export const fetchReports = async () => {
  try {
    console.log('Fetching reports from:', `${api_url}/api/reports`);
    const response = await fetch(`${api_url}/api/reports`, {
      headers: getHeaders(),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
};

// Fetch metrics summary
export const fetchMetricsSummary = async () => {
  try {
    console.log('Fetching metrics summary from:', `${api_url}/api/reports/metrics/summary`);
    const response = await fetch(`${api_url}/api/reports/metrics/summary`, {
      headers: getHeaders(),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    return null;
  }
};

// Fetch inspections
export const fetchInspections = async () => {
  try {
    const response = await fetch(`${api_url}/api/inspections`, {
      headers: getHeaders(),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return [];
  }
};

// Submit a new report
export const submitReport = async (reportData) => {
  try {
    console.log('Submitting report to:', `${api_url}/api/reports`);
    console.log('Report data:', JSON.stringify(reportData, null, 2));
    
    const response = await fetch(`${api_url}/api/reports`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reportData),
    });
    
    if (!response.ok) {
      // Try to get error details from the response
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server returned ${response.status} ${response.statusText}`);
    }
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
};

// Submit a new inspection
export const submitInspection = async (inspectionData) => {
  try {
    const response = await fetch(`${api_url}/api/inspections`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(inspectionData),
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error submitting inspection:', error);
    throw error;
  }
};

// const api_url = process.env.REACT_APP_API_URL;

// export const fetchReports = async () => {
//   const token = localStorage.getItem('token');
//   const res = await fetch(`${api_url}/api/reports`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   if (!res.ok) {
//     throw new Error('Failed to fetch reports');
//   }

//   return res.json();
// };