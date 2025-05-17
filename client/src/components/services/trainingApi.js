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

// Save training data to server with improved error handling
export const saveTrainingData = async (trainingData) => {
  try {
    // Clear cache to ensure fresh data on next fetch
    trainingCache.data = null;
    
    console.log('Saving training data to:', `${api_url}/api/training`);
    
    // Validate input is properly structured
    if (!trainingData) {
      throw new Error('No training data provided');
    }
    
    // Ensure we have properly structured data
    const payload = {
      companyId: 'default',
      // If trainingData.records exists, use it; otherwise use trainingData as records
      records: trainingData.records && Array.isArray(trainingData.records) 
        ? trainingData.records 
        : (Array.isArray(trainingData) ? trainingData : []),
      uploadDate: new Date().toISOString()
    };
    
    // Check if we have records
    if (!payload.records || payload.records.length === 0) {
      throw new Error('No training records to save');
    }
    
    // Calculate stats if not provided
    if (!trainingData.stats) {
      const completed = payload.records.filter(r => r.status === 'Completed').length;
      const expired = payload.records.filter(r => r.status === 'Expired').length;
      
      payload.stats = {
        total: payload.records.length,
        completed: completed,
        expired: expired,
        upcoming: 0 // We'll calculate this server-side
      };
      
      payload.compliance = payload.records.length > 0 
        ? Math.round((completed / payload.records.length) * 100) 
        : 0;
    } else {
      // Use provided stats
      payload.stats = trainingData.stats;
      payload.compliance = trainingData.compliance || 0;
    }
    
    console.log('Structured payload:', payload);
    
    // Send to backend API
    const response = await fetch(`${api_url}/api/training`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      throw new Error(`Failed to save training data: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Training data saved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error saving training data:', error);
    
    // Fallback to localStorage if API fails
    try {
      // Format the data consistently
      const records = trainingData.records || trainingData;
      
      // Ensure records is an array
      const safeRecords = Array.isArray(records) ? records : [];
      
      // Calculate stats
      const total = safeRecords.length;
      const completed = safeRecords.filter(r => r.status === 'Completed').length || 0;
      const expired = safeRecords.filter(r => r.status === 'Expired').length || 0;
      
      // Save structured data to localStorage
      const storagePayload = {
        companyId: 'default',
        records: safeRecords,
        uploadDate: new Date().toISOString(),
        stats: {
          total: total,
          completed: completed,
          expired: expired,
          upcoming: 0
        },
        compliance: total > 0 ? Math.round((completed / total) * 100) : 0
      };
      
      localStorage.setItem('trainingData', JSON.stringify(storagePayload));
      
      console.log('Training data saved to localStorage due to API error');
      return { 
        success: true, 
        message: 'Training data saved locally (API unavailable)',
        local: true,
        stats: storagePayload.stats
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
    
    // Try to fetch from API
    const response = await fetch(`${api_url}/api/training`, {
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
        const data = JSON.parse(storedData);
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

// Add this function to client/src/components/services/trainingApi.js

/**
 * Add a single training record to the database
 * @param {Object} record - The training record to add
 * @returns {Promise<Object>} - The saved record with its ID
 */
export const addTrainingRecord = async (record) => {
  try {
    // Set up headers
    const headers = getHeaders();

    // Send POST request to create the record
    const response = await fetch(`${api_url}/api/training/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      throw new Error(`Failed to add training record: ${response.status} ${response.statusText}`);
    }

    // Clear the cache after adding a record
    if (apiCache && apiCache.training) {
      apiCache.training.data = null;
    }
    
    // Mark data as changed if the function exists
    if (typeof markDataChanged === 'function') {
      markDataChanged();
    }

    // Return the newly added record with its ID
    return await response.json();
  } catch (error) {
    console.error('Error adding training record:', error);

    // If server is unavailable, attempt to save locally
    try {
      // Get existing training data from local storage
      const existingData = localStorage.getItem('trainingData');
      let trainingData = existingData ? JSON.parse(existingData) : { records: [] };
      
      // Add fake ID for local storage version
      const newRecord = {
        ...record,
        _id: `local_${Date.now()}`,
        _local: true // Flag to identify locally stored records
      };
      
      // Add the new record to the array
      if (Array.isArray(trainingData.records)) {
        trainingData.records.push(newRecord);
      } else if (Array.isArray(trainingData)) {
        trainingData.push(newRecord);
      } else {
        trainingData = { records: [newRecord] };
      }
      
      // Save back to local storage
      localStorage.setItem('trainingData', JSON.stringify(trainingData));
      
      // Return the new record with a message that it was saved locally
      return { 
        ...newRecord, 
        local: true, 
        message: 'Record saved to local storage (server unavailable)' 
      };
    } catch (localError) {
      console.error('Error saving to local storage:', localError);
      throw error; // Throw the original error
    }
  }
};

// Fetch training metrics summary (used for quick access to compliance metrics)
export const fetchTrainingMetrics = async () => {
  try {
    console.log('Fetching training metrics from:', `${api_url}/api/training/metrics`);
    
    const response = await fetch(`${api_url}/api/training/metrics`, {
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
    
    // Try to calculate metrics from localStorage if API fails
    try {
      const storedData = localStorage.getItem('trainingData');
      if (storedData) {
        const data = JSON.parse(storedData);
        return {
          trainingCompliance: data.compliance || 0,
          upcomingRenewals: data.stats?.upcoming || 0,
          expiredCertificates: data.stats?.expired || 0,
          totalCertificates: data.stats?.total || 0,
          completedCertificates: data.stats?.completed || 0
        };
      }
    } catch (localError) {
      console.error('Error reading metrics from localStorage:', localError);
    }
    
    // Return default metrics
    return {
      trainingCompliance: 0,
      upcomingRenewals: 0,
      expiredCertificates: 0,
      totalCertificates: 0,
      completedCertificates: 0
    };
  }
};

// Delete a training record
export const deleteTrainingRecord = async (id) => {
  // For now, this is just a placeholder since we're focusing on the upload functionality
  // We'd implement a proper delete API call here in the future
  console.log('Delete training record not yet implemented:', id);
  return { success: true, message: 'Delete functionality not yet implemented' };
};