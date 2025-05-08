// client/src/utils/periodUtils.js

// Format period value into a human-readable string
export const formatPeriodDisplay = (periodId, periodValue) => {
  if (!periodValue) return 'All Time';
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentDate = new Date();
  
  switch (periodValue.type) {
    case 'month':
      // Format as "May 2025"
      return `${months[periodValue.month]} ${periodValue.year}`;
      
    case 'range':
      // Format as "Last 3 Months (Feb-May 2025)"
      const endMonth = currentDate.getMonth();
      const endYear = currentDate.getFullYear();
      
      const startDate = new Date(endYear, endMonth - (periodValue.months - 1), 1);
      const startMonthName = months[startDate.getMonth()];
      const endMonthName = months[endMonth];
      
      if (startDate.getFullYear() === endYear) {
        return `Last ${periodValue.months} Months (${startMonthName}-${endMonthName} ${endYear})`;
      } else {
        return `Last ${periodValue.months} Months (${startMonthName} ${startDate.getFullYear()}-${endMonthName} ${endYear})`;
      }
      
    case 'quarter':
      // Format as "Q1 2025 (Jan-Mar)"
      const quarterStartMonth = (periodValue.quarter - 1) * 3;
      const quarterStartMonthName = months[quarterStartMonth];
      const quarterEndMonthName = months[quarterStartMonth + 2];
      
      return `Q${periodValue.quarter} ${periodValue.year} (${quarterStartMonthName}-${quarterEndMonthName})`;
      
    case 'ytd':
      // Format as "2025 Year to Date (Jan-May)"
      const currentMonth = currentDate.getMonth();
      const currentMonthName = months[currentMonth];
      
      return `${periodValue.year} Year to Date (January-${currentMonthName})`;
      
    case 'all':
      return 'All Time';
      
    default:
      return periodId ? periodId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Time';
  }
};

// Generate timestamp for current period
export const getPeriodTimestamp = (periodId, periodValue) => {
  if (!periodValue) return 'Data as of ' + new Date().toLocaleDateString();
  
  const currentDate = new Date();
  let reportingDate = 'Data as of ' + currentDate.toLocaleDateString();
  
  switch (periodValue.type) {
    case 'month':
      reportingDate = `Data for ${formatPeriodDisplay(periodId, periodValue)}`;
      break;
      
    case 'range':
      reportingDate = `Data for ${formatPeriodDisplay(periodId, periodValue)}`;
      break;
      
    case 'quarter':
      reportingDate = `Data for ${formatPeriodDisplay(periodId, periodValue)}`;
      break;
      
    case 'ytd':
      reportingDate = `Data for ${formatPeriodDisplay(periodId, periodValue)}`;
      break;
      
    case 'all':
      reportingDate = 'Data for all time';
      break;
  }
  
  return reportingDate + ' (Updated: ' + currentDate.toLocaleString() + ')';
};

// Get color for period badge
export const getPeriodColor = (periodId) => {
  switch (periodId) {
    case 'current':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'last-month':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'last-3-months':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'last-6-months':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'current-quarter':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'last-quarter':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'ytd':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'all':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};