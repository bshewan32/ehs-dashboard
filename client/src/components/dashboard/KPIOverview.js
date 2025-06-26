// client/src/components/dashboard/KPIOverview.js
import React, { useState, useEffect, useCallback } from 'react';
import { getActiveKPIs, syncKPIsWithMetrics } from '../services/kpiApi';

const KPIOverview = ({ metrics, refreshTrigger }) => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load KPIs when component mounts, metrics change, or refresh is triggered
  const loadKPIs = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('KPIOverview: Loading KPIs...', forceRefresh ? '(forced refresh)' : '');
      
      // Sync any KPI updates from metrics first
      if (metrics) {
        await syncKPIsWithMetrics(metrics);
      }
      
      // Fetch active KPIs (force refresh if requested)
      const activeKPIs = await getActiveKPIs(forceRefresh);
      setKpis(activeKPIs || []);
      
      console.log('KPIOverview: Loaded', activeKPIs?.length || 0, 'active KPIs');
    } catch (err) {
      console.error('Error loading KPIs:', err);
      setError('Failed to load KPI data');
      setKpis([]);
    } finally {
      setLoading(false);
    }
  }, [metrics]);

  // Initial load
  useEffect(() => {
    loadKPIs();
  }, [loadKPIs]);

  // Refresh when refreshTrigger changes (passed from parent)
  useEffect(() => {
    if (refreshTrigger) {
      console.log('KPIOverview: Refresh triggered');
      loadKPIs(true); // Force refresh
    }
  }, [refreshTrigger, loadKPIs]);

  // Manual refresh handler
  const handleRefresh = () => {
    loadKPIs(true); // Force refresh
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">KPI Metrics</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">KPI Metrics</h2>
        <div className="text-center py-4">
          <svg className="w-12 h-12 text-red-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!kpis || kpis.length === 0) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">KPI Metrics</h2>
        <div className="text-center py-6">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-600 font-medium">No KPIs configured</p>
          <p className="text-gray-500 text-sm mt-1">Create KPIs to track your safety performance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">KPI Metrics</h2>
        <button
          onClick={handleRefresh}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center transition-colors"
          title="Refresh KPIs"
          disabled={loading}
        >
          <svg 
            className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="space-y-4">
        {kpis.map((kpi, index) => {
          const percentage = Math.min(100, (kpi.actual / kpi.target) * 100);
          const colorClass = getColorByCompletion(kpi.actual, kpi.target);
          
          return (
            <div key={kpi.id || kpi._id || index} className="relative">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <span className="font-medium text-gray-700">{kpi.name}</span>
                  {kpi.category && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {kpi.category}
                    </span>
                  )}
                  {kpi._local && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      Local
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-gray-600 text-sm">
                    {formatValue(kpi.actual, kpi.unit)} / {formatValue(kpi.target, kpi.unit)}
                  </span>
                  <div className="text-xs text-gray-500">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${colorClass}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              
              {/* Description (if available) */}
              {kpi.description && (
                <p className="text-xs text-gray-500 mt-1">{kpi.description}</p>
              )}
              
              {/* Frequency indicator */}
              {kpi.frequency && (
                <div className="text-xs text-gray-400 mt-1">
                  Updated: {kpi.frequency}
                  {kpi.lastUpdated && (
                    <span className="ml-2">
                      Last: {new Date(kpi.lastUpdated).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <span>
            {kpis.length} active KPI{kpis.length !== 1 ? 's' : ''} displayed
          </span>
          {kpis.some(kpi => kpi._local) && (
            <span className="text-orange-500">
              ⚠ Some data stored locally
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to format values with units
const formatValue = (value, unit) => {
  if (unit === '%') {
    return `${value}%`;
  }
  return `${value} ${unit}`;
};

// Helper function to get color based on completion percentage
const getColorByCompletion = (actual, target) => {
  const percentage = (actual / target) * 100;
  
  if (percentage >= 90) {
    return 'bg-green-600';
  } else if (percentage >= 70) {
    return 'bg-yellow-500';
  } else {
    return 'bg-red-500';
  }
};

export default KPIOverview;