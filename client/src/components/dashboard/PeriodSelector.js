// client/src/components/dashboard/PeriodSelector.js
import React, { useState, useEffect } from 'react';

const PeriodSelector = ({ onPeriodChange, selectedPeriod }) => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Generate period options - Current Month, Last Month, Last 3 Months, Last 6 Months, etc.
    const generatePeriodOptions = () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const options = [
        { id: 'current', label: 'Current Month', value: { month: currentMonth, year: currentYear, type: 'month' } },
        { id: 'last-month', label: 'Last Month', value: { month: currentMonth - 1 < 0 ? 11 : currentMonth - 1, year: currentMonth - 1 < 0 ? currentYear - 1 : currentYear, type: 'month' } },
        { id: 'last-3-months', label: 'Last 3 Months', value: { months: 3, type: 'range' } },
        { id: 'last-6-months', label: 'Last 6 Months', value: { months: 6, type: 'range' } },
        { id: 'current-quarter', label: 'Current Quarter', value: { quarter: Math.floor(currentMonth / 3) + 1, year: currentYear, type: 'quarter' } },
        { id: 'last-quarter', label: 'Last Quarter', value: { quarter: currentMonth < 3 ? 4 : Math.floor(currentMonth / 3), year: currentMonth < 3 ? currentYear - 1 : currentYear, type: 'quarter' } },
        { id: 'ytd', label: 'Year to Date', value: { year: currentYear, type: 'ytd' } },
        { id: 'all', label: 'All Time', value: { type: 'all' } }
      ];
      
      return options;
    };
    
    const options = generatePeriodOptions();
    setPeriods(options);
    
    // If no period is selected, default to current month
    if (!selectedPeriod) {
      onPeriodChange(options[0].id, options[0].value);
    }
    
    setLoading(false);
  }, [onPeriodChange, selectedPeriod]);
  
  const handleChange = (e) => {
    const periodId = e.target.value;
    const periodObj = periods.find(p => p.id === periodId);
    
    if (periodObj) {
      onPeriodChange(periodId, periodObj.value);
    }
  };
  
  if (loading) {
    return <div className="animate-pulse h-10 bg-gray-200 rounded w-full"></div>;
  }
  
  return (
    <div className="mb-4">
      <label htmlFor="period-selector" className="block text-sm font-medium text-gray-700 mb-1">
        Time Period:
      </label>
      <select
        id="period-selector"
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        onChange={handleChange}
        value={selectedPeriod || 'current'}
      >
        {periods.map((period) => (
          <option key={period.id} value={period.id}>
            {period.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PeriodSelector;