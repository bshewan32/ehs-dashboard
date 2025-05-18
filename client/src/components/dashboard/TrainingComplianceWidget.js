// client/src/components/dashboard/TrainingComplianceWidget.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const TrainingComplianceWidget = ({ trainingData }) => {
  const [hoverSector, setHoverSector] = useState(null);
  
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
    if (compliance >= 90) {
      color = 'text-green-600';
    } else if (compliance >= 70) {
      color = 'text-yellow-600';
    } else {
      color = 'text-red-600';
    }
    
    return { value: compliance, color };
  };
  
  // Format compliance percentage
  const { value: compliance, color: complianceColor } = getComplianceDetails();

  // If no data, show upload prompt with matching styling
  if (!trainingData) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-3">Training Compliance</h2>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-center mb-4">No training data available</p>
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
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Training Compliance</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-green-50 p-3 rounded border border-green-200 text-center">
          <div className="text-xl font-bold text-green-600">{trainingData.stats.completed || 0}</div>
          <div className="text-xs text-green-500">Current</div>
        </div>
        
        <div className="bg-red-50 p-3 rounded border border-red-200 text-center">
          <div className="text-xl font-bold text-red-600">{trainingData.stats.expired || 0}</div>
          <div className="text-xs text-red-500">Expired</div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-center">
          <div className="text-xl font-bold text-yellow-600">{trainingData.stats.upcoming || 0}</div>
          <div className="text-xs text-yellow-500">Due Soon</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
          <div className="text-xl font-bold text-gray-800">{trainingData.stats.total || 0}</div>
          <div className="text-xs text-gray-500">Total Certifications</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Overall Compliance:</span>
        <span className={`text-lg font-bold ${complianceColor}`}>
          {compliance.toFixed(1)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
        <div 
          className={`h-1.5 rounded-full ${
            compliance >= 90 ? 'bg-green-500' : 
            compliance >= 70 ? 'bg-yellow-500' : 
            'bg-red-500'
          }`}
          style={{ width: `${Math.min(100, compliance)}%` }}
        ></div>
      </div>
      
      {/* Recent or upcoming trainings section */}
      {trainingData.upcoming && trainingData.upcoming.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Upcoming Renewals</h3>
          <div className="overflow-hidden rounded border border-gray-200 max-h-36">
            {trainingData.upcoming.slice(0, 3).map((training, idx) => (
              <div key={idx} className={`px-3 py-2 text-sm ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="flex justify-between">
                  <div>
                    <span className="font-medium">{training.name || 'Training'}</span>
                    {training.employee && <span className="text-gray-500"> - {training.employee}</span>}
                  </div>
                  <div className="text-gray-500">
                    {new Date(training.expiryDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {training.category && `Category: ${training.category}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-36">
          <ResponsiveContainer width="80%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={1}
                dataKey="value"
                onMouseEnter={(_, index) => setHoverSector(statusData[index].name)}
                onMouseLeave={() => setHoverSector(null)}
              >
                {statusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="#fff"
                    strokeWidth={1}
                    opacity={hoverSector === null || hoverSector === entry.name ? 1 : 0.7}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Alert for expired certifications */}
      {trainingData.stats.expired > 0 && (
        <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
          <span className="font-medium">{trainingData.stats.expired} expired certificates</span> require immediate action
        </div>
      )}
    </div>
  );
};

export default TrainingComplianceWidget;

