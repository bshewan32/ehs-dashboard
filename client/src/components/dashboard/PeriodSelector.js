// client/src/components/dashboard/PeriodSelector.js
import React from 'react';

const PeriodSelector = ({ selectedPeriod, onChange }) => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <span className="text-sm font-medium text-gray-600">Time Period:</span>
      <div className="inline-flex shadow-sm rounded-md">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
            selectedPeriod === 'current'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => onChange('current')}
        >
          Current Month
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-t border-b ${
            selectedPeriod === 'ytd'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => onChange('ytd')}
        >
          Year to Date
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
            selectedPeriod === 'lastYear'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => onChange('lastYear')}
        >
          Last Year
        </button>
      </div>
    </div>
  );
};

export default PeriodSelector;