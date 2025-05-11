// client/src/components/services/trainingApi.js
const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Log API URL for debugging
console.log('Training API URL:', api_url);

// Cache for API responses
const trainingCache = {
  data: null,
  timestamp: 0
};

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 300000;

// Helper function to check if cache is valid
const isCacheValid = () => {
  if (!trainingCache.data) return false;
  
  const now = Date.now();
  return (now - trainingCache.timestamp) < CACHE_EXPIRATION;
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

// Fetch with better error handling and retry logic
const fetchWithRetry = async (url, options, retries = 2) => {
  try {
    // First try with credentials and CORS
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'include'
    });
    
    if (response.ok) {
      return response;
    }
    
    // If the first attempt fails with 401/403, try without credentials
    if ((response.status === 401 || response.status === 403) && retries > 0) {
      console.log('Retrying without credentials...');
      const retryOptions = { ...options };
      delete retryOptions.credentials;
      
      return fetchWithRetry(url, retryOptions, retries - 1);
    }
    
    // If we get a CORS error or other failure, try with no-cors mode as last resort
    if (response.status === 0 && retries > 0) {
      console.log('Possible CORS error, retrying with different mode...');
      return fetchWithRetry(url, { ...options, mode: 'no-cors' }, retries - 1);
    }
    
    return response;
  } catch (error) {
    // Network error occurred
    console.error('Network error during fetch:', error);
    
    // Last retry attempt with simplified options if we still have retries left
    if (retries > 0) {
      console.log('Network error, retrying with simplified options...');
      const simpleOptions = {
        method: options.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (options.body) {
        simpleOptions.body = options.body;
      }
      
      return fetchWithRetry(url, simpleOptions, retries - 1);
    }
    
    throw error;
  }
};

// Save training data to server
export const saveTrainingData = async (trainingData) => {
  try {
    // Clear cache to ensure fresh data on next fetch
    trainingCache.data = null;
    
    console.log('Saving training data to:', `${api_url}/api/training`);
    
    // Add company ID if not present (default to "default")
    const trainingPayload = {
      companyId: 'default',
      records: Array.isArray(trainingData) ? trainingData : [trainingData],
      uploadDate: new Date().toISOString()
    };
    
    // Calculate simple stats
    let completed = 0, expired = 0, upcoming = 0;
    trainingPayload.records.forEach(record => {
      if (record.status === 'Completed') completed++;
      else if (record.status === 'Expired') expired++;
      else if (record.expiryDate && new Date(record.expiryDate) > new Date()) upcoming++;
    });
    
    trainingPayload.stats = {
      total: trainingPayload.records.length,
      completed,
      expired,
      upcoming
    };
    
    trainingPayload.compliance = trainingPayload.records.length > 0 
      ? Math.round((completed / trainingPayload.records.length) * 100) 
      : 0;
    
    // Send to backend API with retry logic
    const response = await fetchWithRetry(`${api_url}/api/training`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(trainingPayload)
    });
    
    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      throw new Error(`Failed to save training data: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Training data saved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error saving training data:', error);
    
    // Fallback to localStorage if API fails
    try {
      // Format the data in the expected structure
      const trainingPayload = {
        companyId: 'default',
        records: Array.isArray(trainingData) ? trainingData : [trainingData],
        uploadDate: new Date().toISOString(),
        stats: {
          total: trainingData.length,
          completed: trainingData.filter(t => t.status === 'Completed').length,
          expired: trainingData.filter(t => t.status === 'Expired').length,
          upcoming: 0
        }
      };
      
      localStorage.setItem('trainingData', JSON.stringify({
        data: trainingPayload,
        timestamp: Date.now()
      }));
      
      console.log('Training data saved to localStorage due to API error');
      return { 
        success: true, 
        message: 'Training data saved locally (API unavailable)',
        local: true
      };
    } catch (localError) {
      console.error('Failed to save to localStorage:', localError);
      throw error; // Re-throw the original error
    }
  }
};

// Update metrics with training compliance data
export const updateMetricsWithTrainingData = (metrics, trainingData) => {
  if (!metrics || !trainingData) return metrics;
  
  // Create a copy of the metrics object to avoid mutating the original
  const updatedMetrics = { ...metrics };
  
  // Ensure metrics has the necessary structure
  if (!updatedMetrics.leading) {
    updatedMetrics.leading = {};
  }
  
  // Add/update training compliance from training data
  updatedMetrics.trainingCompliance = trainingData.compliance || 0;
  
  // Update training metrics in the leading indicators
  updatedMetrics.leading.trainingCompleted = trainingData.stats?.completed || 0;
  updatedMetrics.leading.trainingRequired = trainingData.stats?.total || 0;
  updatedMetrics.leading.trainingExpired = trainingData.stats?.expired || 0;
  updatedMetrics.leading.trainingUpcoming = trainingData.stats?.upcoming || 0;
  
  return updatedMetrics;
};

// Fetch training data from server
export const fetchTrainingData = async (forceRefresh = false) => {
  try {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      console.log('Using cached training data');
      return trainingCache.data;
    }
    
    console.log('Fetching training data from:', `${api_url}/api/training`);
    
    // Try to fetch from API with retry logic
    const response = await fetchWithRetry(`${api_url}/api/training`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (response.status === 404) {
      console.log('No training data found on server');
      return null;
    }
    
    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      throw new Error(`Failed to fetch training data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Training data fetched successfully:', data);
    
    // Cache the fetched data
    trainingCache.data = data;
    trainingCache.timestamp = Date.now();
    
    return data;
  } catch (error) {
    console.warn('API fetch failed, falling back to localStorage:', error);
    
    // Fallback to localStorage
    try {
      const storedData = localStorage.getItem('trainingData');
      if (storedData) {
        const { data } = JSON.parse(storedData);
        console.log('Using training data from localStorage');
        
        // Cache the data
        trainingCache.data = data;
        trainingCache.timestamp = Date.now();
        
        return data;
      }
    } catch (localError) {
      console.error('Error reading from localStorage:', localError);
    }
    
    // No data found
    return null;
  }
};

// Fetch training metrics summary (used for quick access to compliance metrics)
export const fetchTrainingMetrics = async () => {
  try {
    console.log('Fetching training metrics from:', `${api_url}/api/training/metrics`);
    
    const response = await fetchWithRetry(`${api_url}/api/training/metrics`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      throw new Error(`Failed to fetch training metrics: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Training metrics fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching training metrics:', error);
    
    // Return default metrics
    return {
      trainingCompliance: 0,
      upcomingRenewals: 0,
      expiredCertificates: 0
    };
  }
};

// // client/src/components/services/trainingApi.js
// const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// // Log API URL for debugging
// console.log('Training API URL:', api_url);

// // Cache for API responses
// const trainingCache = {
//   data: null,
//   timestamp: 0
// };

// // Cache expiration time in milliseconds (5 minutes)
// const CACHE_EXPIRATION = 300000;

// // Helper function to check if cache is valid
// const isCacheValid = () => {
//   if (!trainingCache.data) return false;
  
//   const now = Date.now();
//   return (now - trainingCache.timestamp) < CACHE_EXPIRATION;
// };

// // Helper to set up headers with optional auth
// const getHeaders = () => {
//   const token = localStorage.getItem('token');
  
//   const headers = {
//     'Content-Type': 'application/json',
//   };
  
//   if (token) {
//     headers.Authorization = `Bearer ${token}`;
//   }
  
//   return headers;
// };

// // Save training data to server
// export const saveTrainingData = async (trainingData) => {
//   try {
//     // Clear cache to ensure fresh data on next fetch
//     trainingCache.data = null;
    
//     console.log('Saving training data to:', `${api_url}/api/training`);
    
//     // Send to backend API with CORS mode explicitly set
//     const response = await fetch(`${api_url}/api/training`, {
//       method: 'POST',
//       headers: getHeaders(),
//       body: JSON.stringify(trainingData),
//       mode: 'cors',
//       credentials: 'include'
//     });
    
//     if (!response.ok) {
//       console.error('Server response not OK:', response.status, response.statusText);
//       throw new Error(`Failed to save training data: ${response.status} ${response.statusText}`);
//     }
    
//     const result = await response.json();
//     console.log('Training data saved successfully:', result);
//     return result;
//   } catch (error) {
//     console.error('Error saving training data:', error);
    
//     // Fallback to localStorage if API fails
//     try {
//       localStorage.setItem('trainingData', JSON.stringify({
//         data: trainingData,
//         timestamp: Date.now()
//       }));
      
//       console.log('Training data saved to localStorage due to API error');
//       return { success: true, message: 'Training data saved locally (API unavailable)' };
//     } catch (localError) {
//       console.error('Failed to save to localStorage:', localError);
//       throw error; // Re-throw the original error
//     }
//   }
// };

// // Update metrics with training compliance data
// export const updateMetricsWithTrainingData = (metrics, trainingData) => {
//   if (!metrics || !trainingData) return metrics;
  
//   // Create a copy of the metrics object to avoid mutating the original
//   const updatedMetrics = { ...metrics };
  
//   // Ensure metrics has the necessary structure
//   if (!updatedMetrics.leading) {
//     updatedMetrics.leading = {};
//   }
  
//   // Add/update training compliance from training data
//   updatedMetrics.trainingCompliance = trainingData.compliance || 0;
  
//   // Update training metrics in the leading indicators
//   updatedMetrics.leading.trainingCompleted = trainingData.stats?.completed || 0;
//   updatedMetrics.leading.trainingRequired = trainingData.stats?.total || 0;
//   updatedMetrics.leading.trainingExpired = trainingData.stats?.expired || 0;
//   updatedMetrics.leading.trainingUpcoming = trainingData.stats?.upcoming || 0;
  
//   return updatedMetrics;
// };

// // Fetch training data from server
// export const fetchTrainingData = async (forceRefresh = false) => {
//   try {
//     // Return cached data if valid and not forcing refresh
//     if (!forceRefresh && isCacheValid()) {
//       console.log('Using cached training data');
//       return trainingCache.data;
//     }
    
//     console.log('Fetching training data from:', `${api_url}/api/training`);
    
//     // Try to fetch from API with explicit CORS settings
//     const response = await fetch(`${api_url}/api/training`, {
//       method: 'GET',
//       headers: getHeaders(),
//       mode: 'cors',
//       credentials: 'include'
//     });
    
//     if (response.status === 404) {
//       console.log('No training data found on server');
//       return null;
//     }
    
//     if (!response.ok) {
//       console.error('Server response not OK:', response.status, response.statusText);
//       throw new Error(`Failed to fetch training data: ${response.status} ${response.statusText}`);
//     }
    
//     const data = await response.json();
//     console.log('Training data fetched successfully:', data);
    
//     // Cache the fetched data
//     trainingCache.data = data;
//     trainingCache.timestamp = Date.now();
    
//     return data;
//   } catch (error) {
//     console.warn('API fetch failed, falling back to localStorage:', error);
    
//     // Fallback to localStorage
//     try {
//       const storedData = localStorage.getItem('trainingData');
//       if (storedData) {
//         const { data } = JSON.parse(storedData);
//         console.log('Using training data from localStorage');
        
//         // Cache the data
//         trainingCache.data = data;
//         trainingCache.timestamp = Date.now();
        
//         return data;
//       }
//     } catch (localError) {
//       console.error('Error reading from localStorage:', localError);
//     }
    
//     // No data found
//     return null;
//   }
// };

// // Fetch training metrics summary (used for quick access to compliance metrics)
// export const fetchTrainingMetrics = async () => {
//   try {
//     console.log('Fetching training metrics from:', `${api_url}/api/training/metrics`);
    
//     const response = await fetch(`${api_url}/api/training/metrics`, {
//       method: 'GET',
//       headers: getHeaders(),
//       mode: 'cors',
//       credentials: 'include'
//     });
    
//     if (!response.ok) {
//       console.error('Server response not OK:', response.status, response.statusText);
//       throw new Error(`Failed to fetch training metrics: ${response.status} ${response.statusText}`);
//     }
    
//     const data = await response.json();
//     console.log('Training metrics fetched successfully:', data);
//     return data;
//   } catch (error) {
//     console.error('Error fetching training metrics:', error);
//     return {
//       trainingCompliance: 0,
//       upcomingRenewals: 0,
//       expiredCertificates: 0
//     };
//   }
// };