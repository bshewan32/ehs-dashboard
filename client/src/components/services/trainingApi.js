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
export const fetchTrainingData = async (forceRefresh = false, includeArchived = false) => {
  try {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      console.log('Using cached training data');
      
      // Filter archived records from cache if needed
      if (!includeArchived && trainingCache.data && trainingCache.data.records) {
        // Create a copy of cached data to avoid modifying the cache directly
        const filteredData = {
          ...trainingCache.data,
          records: trainingCache.data.records.filter(record => !record.archived)
        };
        return filteredData;
      }
      
      return trainingCache.data;
    }
    
    const url = new URL(`${api_url}/api/training`);
    if (includeArchived) {
      url.searchParams.append('includeArchived', 'true');
    }
    
    console.log('Fetching training data from:', url.toString());
    
    // Try to fetch from API
    const response = await fetch(url, {
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
    
    // Always cache the full data including archived records
    trainingCache.data = data;
    trainingCache.timestamp = Date.now();
    
    // Filter out archived records if needed
    if (!includeArchived && data && data.records) {
      // Return filtered data but keep the cache complete
      const filteredData = {
        ...data,
        records: data.records.filter(record => !record.archived)
      };
      return filteredData;
    }
    
    return data;
  } catch (error) {
    console.warn('API fetch failed, falling back to localStorage:', error);
    
    // Fallback to localStorage
    try {
      const storedData = localStorage.getItem('trainingData');
      if (storedData) {
        const data = JSON.parse(storedData);
        console.log('Using training data from localStorage');
        
        // Cache the full data
        trainingCache.data = data;
        trainingCache.timestamp = Date.now();
        
        // Filter archived records if needed
        if (!includeArchived && data && data.records) {
          const filteredData = {
            ...data,
            records: data.records.filter(record => !record.archived)
          };
          return filteredData;
        }
        
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

// Add this function to client/src/components/services/trainingApi.js

/**
 * Add a single training record to the database
 * @param {Object} record - The training record to add
 * @returns {Promise<Object>} - The saved record with its ID
 */
export const addTrainingRecord = async (record) => {
  try {
    // Get the API URL from environment variable or use default
    const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Set up headers
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization if available
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Send POST request to create the record
    const response = await fetch(`${api_url}/api/training/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      throw new Error(`Failed to add training record: ${response.status} ${response.statusText}`);
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
export const fetchTrainingMetrics = async (includeArchived = false) => {
  try {
    const url = new URL(`${api_url}/api/training/metrics`);
    if (includeArchived) {
      url.searchParams.append('includeArchived', 'true');
    }
    
    console.log('Fetching training metrics from:', url.toString());
    
    const response = await fetch(url, {
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
        
        // If we need to filter out archived records
        if (!includeArchived && data.records) {
          const nonArchivedRecords = data.records.filter(record => !record.archived);
          const total = nonArchivedRecords.length;
          const completed = nonArchivedRecords.filter(r => r.status === 'Completed').length;
          const expired = nonArchivedRecords.filter(r => r.status === 'Expired').length;
          
          // Find upcoming renewals (records with expiry dates in next 90 days)
          const now = new Date();
          const ninetyDaysFromNow = new Date(now);
          ninetyDaysFromNow.setDate(now.getDate() + 90);
          
          const upcomingRenewals = nonArchivedRecords
            .filter(r => 
              r.expiryDate && 
              new Date(r.expiryDate) > now && 
              new Date(r.expiryDate) <= ninetyDaysFromNow
            ).length;
          
          return {
            trainingCompliance: total > 0 ? Math.round((completed / total) * 100) : 0,
            upcomingRenewals: upcomingRenewals,
            expiredCertificates: expired,
            totalCertificates: total,
            completedCertificates: completed
          };
        }
        
        // If including archived records or no records to filter
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

// Archive a training record
export const archiveTrainingRecord = async (id) => {
  try {
    console.log('Archiving training record:', id);
    
    // Make API call to archive the record
    const response = await fetch(`${api_url}/api/training/records/${id}/archive`, {
      method: 'PUT',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      throw new Error(`Failed to archive training record: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Training record archived successfully:', result);
    
    // Clear cache to ensure fresh data on next fetch
    trainingCache.data = null;
    
    return result;
  } catch (error) {
    console.error('Error archiving training record:', error);
    
    // Handle the case where the server is unavailable
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      // Try to archive the record locally
      try {
        // Get existing training data from local storage
        const storedData = localStorage.getItem('trainingData');
        if (storedData) {
          const data = JSON.parse(storedData);
          
          // Find the record in the local data
          let recordFound = false;
          if (data.records && Array.isArray(data.records)) {
            // Find the record by ID and mark it as archived
            data.records = data.records.map(record => {
              if (record._id === id) {
                recordFound = true;
                return { ...record, archived: true };
              }
              return record;
            });
          }
          
          if (recordFound) {
            // Save the updated data back to local storage
            localStorage.setItem('trainingData', JSON.stringify(data));
            return { 
              success: true, 
              message: 'Training record archived locally (API unavailable)',
              local: true 
            };
          }
        }
      } catch (localError) {
        console.error('Error archiving record locally:', localError);
      }
    }
    
    throw error;
  }
};

// Unarchive a training record
export const unarchiveTrainingRecord = async (id) => {
  try {
    console.log('Unarchiving training record:', id);
    
    // Make API call to unarchive the record
    const response = await fetch(`${api_url}/api/training/records/${id}/unarchive`, {
      method: 'PUT',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      throw new Error(`Failed to unarchive training record: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Training record unarchived successfully:', result);
    
    // Clear cache to ensure fresh data on next fetch
    trainingCache.data = null;
    
    return result;
  } catch (error) {
    console.error('Error unarchiving training record:', error);
    
    // Handle the case where the server is unavailable
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      // Try to unarchive the record locally
      try {
        // Get existing training data from local storage
        const storedData = localStorage.getItem('trainingData');
        if (storedData) {
          const data = JSON.parse(storedData);
          
          // Find the record in the local data
          let recordFound = false;
          if (data.records && Array.isArray(data.records)) {
            // Find the record by ID and mark it as unarchived
            data.records = data.records.map(record => {
              if (record._id === id) {
                recordFound = true;
                return { ...record, archived: false };
              }
              return record;
            });
          }
          
          if (recordFound) {
            // Save the updated data back to local storage
            localStorage.setItem('trainingData', JSON.stringify(data));
            return { 
              success: true, 
              message: 'Training record unarchived locally (API unavailable)',
              local: true 
            };
          }
        }
      } catch (localError) {
        console.error('Error unarchiving record locally:', localError);
      }
    }
    
    throw error;
  }
};

// Delete a training record (deprecated - use archiveTrainingRecord instead)
export const deleteTrainingRecord = async (id) => {
  console.log('Delete training record is deprecated, use archiveTrainingRecord instead:', id);
  return archiveTrainingRecord(id);
};