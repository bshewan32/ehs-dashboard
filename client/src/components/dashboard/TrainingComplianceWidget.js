// client/src/components/dashboard/TrainingComplianceWidget.js
import React from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const TrainingComplianceWidget = ({ trainingData }) => {
  // Default data for when no training data is available
  const defaultData = [
    { name: 'No Data', value: 1, color: '#d1d5db' }
  ];
  
  // Format training data for pie chart if available
  const statusData = React.useMemo(() => {
    if (!trainingData || !trainingData.stats) {
      return defaultData;
    }
    
    const { completed, expired, upcoming, total } = trainingData.stats;
    const notStarted = total - (completed + expired + upcoming);
    
    return [
      { name: 'Current', value: completed, color: '#10b981' },
      { name: 'Expired', value: expired, color: '#ef4444' },
      { name: 'Due Soon', value: upcoming, color: '#f59e0b' },
      { name: 'Not Started', value: notStarted > 0 ? notStarted : 0, color: '#6b7280' }
    ].filter(item => item.value > 0);
  }, [trainingData]);
  
  // Get compliance percentage and color
  const getComplianceDetails = () => {
    const compliance = trainingData?.compliance || 0;
    
    let color = '';
    if (compliance >= 90) color = 'text-green-600';
    else if (compliance >= 70) color = 'text-yellow-500';
    else color = 'text-red-500';
    
    return { value: compliance, color };
  };
  
  // Format compliance percentage
  const { value: compliance, color: complianceColor } = getComplianceDetails();
  
  // If no data, show upload prompt
  if (!trainingData) {
    return (
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 h-full">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-lg font-semibold">Training Compliance</h2>
          <Link to="/training" className="text-blue-600 hover:text-blue-800 text-sm">
            Manage Training
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center h-48">
          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-center text-gray-500 mb-3">No training data available</p>
          <Link to="/training" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            Upload Training Data
          </Link>
        </div>
      </div>
    );
  }
  
  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      const percentage = ((value / trainingData.stats.total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-2 shadow-md border rounded text-xs">
          <p className="font-medium">{name}</p>
          <p>{value} certificates ({percentage}%)</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 h-full">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-lg font-semibold">Training Compliance</h2>
        <Link to="/training" className="text-blue-600 hover:text-blue-800 text-sm">
          View Details
        </Link>
      </div>
      
      <div className="flex flex-col h-48">
        <div className="text-center mb-2">
          <p className="text-sm text-gray-600">Overall Compliance</p>
          <div className={`text-2xl font-bold ${complianceColor}`}>
            {compliance.toFixed(1)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className={`h-1.5 rounded-full ${
                compliance >= 90 ? 'bg-green-500' : 
                compliance >= 70 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, compliance)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={1}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {trainingData.stats.expired > 0 && (
          <div className="mt-auto">
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              <span className="font-medium">{trainingData.stats.expired} expired certificates</span> require immediate action
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingComplianceWidget;