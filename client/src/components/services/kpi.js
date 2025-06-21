// client/src/components/services/kpiApi.js
const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Cache for KPI data
const kpiCache = {
  data: null,
  timestamp: 0
};

// Cache expiration time in milliseconds (30 seconds)
const CACHE_EXPIRATION = 30000;

// Helper function to check if cache is valid
const isCacheValid = () => {
  if (!kpiCache.data) return false;
  
  const now = Date.now();
  return (now - kpiCache.timestamp) < CACHE_EXPIRATION;
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

// Track if data has changed
let dataHasChanged = false;

// Mark data as changed
export const markKPIDataChanged = () => {
  dataHasChanged = true;
  console.log('KPI data marked as changed');
};

// Fetch all KPIs
export const fetchKPIs = async (forceRefresh = false) => {
  try {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && !dataHasChanged && isCacheValid()) {
      console.log('Using cached KPI data');
      return kpiCache.data;
    }
    
    dataHasChanged = false;

    const response = await fetch(`${api_url}/api/kpis`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch KPIs: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.length} KPIs from API`);
    
    // Cache the fetched data
    kpiCache.data = data;
    kpiCache.timestamp = Date.now();
    
    return data;
  } catch (error) {
    console.error('Error in fetchKPIs:', error);
    
    // If we have cached data, return it in case of error
    if (kpiCache.data) {
      console.log('Returning cached KPI data after fetch error');
      return kpiCache.data;
    }
    
    // Fallback to localStorage
    try {
      const storedData = localStorage.getItem('kpiData');
      if (storedData) {
        const data = JSON.parse(storedData);
        console.log('Using KPI data from localStorage');
        
        // Cache the data
        kpiCache.data = data;
        kpiCache.timestamp = Date.now();
        
        return data;
      }
    } catch (localError) {
      console.error('Error reading KPIs from localStorage:', localError);
    }
    
    // Return default KPIs if no data available
    const defaultKPIs = getDefaultKPIs();
    
    // Cache default data
    kpiCache.data = defaultKPIs;
    kpiCache.timestamp = Date.now();
    
    return defaultKPIs;
  }
};

// Save a new KPI
export const saveKPI = async (kpiData) => {
  try {
    const response = await fetch(`${api_url}/api/kpis`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        ...kpiData,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save KPI: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Clear cache after successful save
    kpiCache.data = null;
    markKPIDataChanged();
    
    return result;
  } catch (error) {
    console.error('Error saving KPI:', error);
    
    // Fallback to localStorage
    try {
      const existingData = await fetchKPIs();
      const newKPI = {
        ...kpiData,
        _id: `local_${Date.now()}`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        _local: true
      };
      
      const updatedData = [...(existingData || []), newKPI];
      localStorage.setItem('kpiData', JSON.stringify(updatedData));
      
      // Clear cache to force refresh
      kpiCache.data = null;
      markKPIDataChanged();
      
      console.warn('KPI saved to localStorage due to API error');
      return { 
        ...newKPI, 
        message: 'KPI saved locally (API unavailable)',
        local: true 
      };
    } catch (localError) {
      console.error('Failed to save to localStorage:', localError);
      throw error;
    }
  }
};

// Update an existing KPI
export const updateKPI = async (id, kpiData) => {
  try {
    const response = await fetch(`${api_url}/api/kpis/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        ...kpiData,
        lastUpdated: new Date().toISOString()
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update KPI: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Clear cache after successful update
    kpiCache.data = null;
    markKPIDataChanged();
    
    return result;
  } catch (error) {
    console.error('Error updating KPI:', error);
    
    // Fallback to localStorage
    try {
      const existingData = await fetchKPIs();
      const updatedData = existingData.map(kpi => 
        (kpi._id === id || kpi.id === id) 
          ? { ...kpi, ...kpiData, lastUpdated: new Date().toISOString() }
          : kpi
      );
      
      localStorage.setItem('kpiData', JSON.stringify(updatedData));
      
      // Clear cache to force refresh
      kpiCache.data = null;
      markKPIDataChanged();
      
      console.warn('KPI updated in localStorage due to API error');
      return { 
        message: 'KPI updated locally (API unavailable)',
        local: true 
      };
    } catch (localError) {
      console.error('Failed to update in localStorage:', localError);
      throw error;
    }
  }
};

// Delete a KPI
export const deleteKPI = async (id) => {
  try {
    const response = await fetch(`${api_url}/api/kpis/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete KPI: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Clear cache after successful deletion
    kpiCache.data = null;
    markKPIDataChanged();
    
    return result;
  } catch (error) {
    console.error('Error deleting KPI:', error);
    
    // Fallback to localStorage
    try {
      const existingData = await fetchKPIs();
      const updatedData = existingData.filter(kpi => 
        kpi._id !== id && kpi.id !== id
      );
      
      localStorage.setItem('kpiData', JSON.stringify(updatedData));
      
      // Clear cache to force refresh
      kpiCache.data = null;
      markKPIDataChanged();
      
      console.warn('KPI deleted from localStorage due to API error');
      return { 
        message: 'KPI deleted locally (API unavailable)',
        local: true 
      };
    } catch (localError) {
      console.error('Failed to delete from localStorage:', localError);
      throw error;
    }
  }
};

// Fetch KPI by ID
export const fetchKPIById = async (id) => {
  try {
    // Check cache first
    if (kpiCache.data) {
      const cachedKPI = kpiCache.data.find(kpi => 
        kpi._id === id || kpi.id === id
      );
      
      if (cachedKPI) {
        console.log('Using cached KPI data for ID:', id);
        return cachedKPI;
      }
    }
    
    const response = await fetch(`${api_url}/api/kpis/${id}`, {
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch KPI: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching KPI ID ${id}:`, error);
    
    // Try localStorage
    try {
      const storedData = localStorage.getItem('kpiData');
      if (storedData) {
        const data = JSON.parse(storedData);
        const kpi = data.find(k => k._id === id || k.id === id);
        if (kpi) {
          return kpi;
        }
      }
    } catch (localError) {
      console.error('Error reading KPI from localStorage:', localError);
    }
    
    throw error;
  }
};

// Get active KPIs for dashboard display
export const getActiveKPIs = async () => {
  try {
    const allKPIs = await fetchKPIs();
    return allKPIs.filter(kpi => kpi.isActive !== false);
  } catch (error) {
    console.error('Error fetching active KPIs:', error);
    return getDefaultKPIs();
  }
};

// Update KPI actual values (for dashboard updates)
export const updateKPIValues = async (kpiUpdates) => {
  try {
    const promises = kpiUpdates.map(update => 
      updateKPI(update.id, { actual: update.actual })
    );
    
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('Error updating KPI values:', error);
    throw error;
  }
};

// Get default KPIs (fallback when no data is available)
const getDefaultKPIs = () => {
  return [
    {
      id: 'nearMissRate',
      name: 'Near Miss Reporting Rate',
      description: 'Percentage of near miss incidents reported relative to target reporting levels',
      actual: 0,
      target: 100,
      unit: '%',
      category: 'Safety',
      frequency: 'Monthly',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'criticalRiskVerification',
      name: 'Critical Risk Control Verification',
      description: 'Percentage of critical risk controls verified as effective',
      actual: 0,
      target: 95,
      unit: '%',
      category: 'Safety',
      frequency: 'Monthly',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'electricalSafetyCompliance',
      name: 'Electrical Safety Compliance',
      description: 'Percentage compliance with electrical safety standards and procedures',
      actual: 0,
      target: 100,
      unit: '%',
      category: 'Safety',
      frequency: 'Monthly',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
  ];
};

// Sync KPIs with metrics data (for dashboard integration)
export const syncKPIsWithMetrics = async (metricsData) => {
  try {
    if (!metricsData || !metricsData.leading || !metricsData.leading.kpis) {
      return;
    }
    
    const existingKPIs = await fetchKPIs();
    const updates = [];
    
    // Update existing KPIs with new values from metrics
    metricsData.leading.kpis.forEach(metricKPI => {
      const existingKPI = existingKPIs.find(kpi => kpi.id === metricKPI.id);
      if (existingKPI && existingKPI.actual !== metricKPI.actual) {
        updates.push({
          id: existingKPI._id || existingKPI.id,
          actual: metricKPI.actual
        });
      }
    });
    
    if (updates.length > 0) {
      await updateKPIValues(updates);
      console.log(`Updated ${updates.length} KPI values from metrics`);
    }
  } catch (error) {
    console.error('Error syncing KPIs with metrics:', error);
  }
};