// client/src/components/kpi/KPIList.js
import React from 'react';

const KPIList = ({ kpis, loading, onEdit, onDelete }) => {
  // Helper function to get color based on completion percentage
  const getPerformanceColor = (actual, target) => {
    const percentage = (actual / target) * 100;
    
    if (percentage >= 90) {
      return 'text-green-600 bg-green-50';
    } else if (percentage >= 70) {
      return 'text-yellow-600 bg-yellow-50';
    } else {
      return 'text-red-600 bg-red-50';
    }
  };

  const getProgressBarColor = (actual, target) => {
    const percentage = (actual / target) * 100;
    
    if (percentage >= 90) {
      return 'bg-green-500';
    } else if (percentage >= 70) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  };

  const formatValue = (value, unit) => {
    if (unit === '%') {
      return `${value}%`;
    }
    return `${value} ${unit}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!kpis || kpis.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No KPIs Found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first Key Performance Indicator</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">KPI Dashboard</h3>
        <p className="text-sm text-gray-500">Monitor your key performance indicators</p>
      </div>

      <div className="divide-y divide-gray-200">
        {kpis.map((kpi, index) => {
          const percentage = Math.min(100, (kpi.actual / kpi.target) * 100);
          const performanceColor = getPerformanceColor(kpi.actual, kpi.target);
          const progressColor = getProgressBarColor(kpi.actual, kpi.target);

          return (
            <div key={kpi.id || index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  {/* KPI Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {kpi.name}
                      </h4>
                      {!kpi.isActive && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {kpi.category}
                      </span>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${performanceColor}`}>
                      {formatValue(kpi.actual, kpi.unit)} / {formatValue(kpi.target, kpi.unit)}
                    </div>
                  </div>

                  {/* Description */}
                  {kpi.description && (
                    <p className="text-sm text-gray-600 mb-3">{kpi.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <span>Frequency: {kpi.frequency}</span>
                    {kpi.lastUpdated && (
                      <span>Updated: {new Date(kpi.lastUpdated).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onEdit(kpi)}
                    className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Edit KPI"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(kpi._id || kpi.id)}
                    className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    title="Delete KPI"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KPIList;