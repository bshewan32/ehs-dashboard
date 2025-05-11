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

// Save training data to server
export const saveTrainingData = async (trainingData) => {
  try {
    // Clear cache to ensure fresh data on next fetch
    trainingCache.data = null;
    
    console.log('Saving training data to:', `${api_url}/api/training`);
    
    // Send to backend API with CORS mode explicitly set
    const response = await fetch(`${api_url}/api/training`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(trainingData),
      mode: 'cors',
      credentials: 'include'
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
      localStorage.setItem('trainingData', JSON.stringify({
        data: trainingData,
        timestamp: Date.now()
      }));
      
      console.log('Training data saved to localStorage due to API error');
      return { success: true, message: 'Training data saved locally (API unavailable)' };
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
    
    // Try to fetch from API with explicit CORS settings
    const response = await fetch(`${api_url}/api/training`, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'include'
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
    
    const response = await fetch(`${api_url}/api/training/metrics`, {
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
      credentials: 'include'
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
    return {
      trainingCompliance: 0,
      upcomingRenewals: 0,
      expiredCertificates: 0
    };
  }
};