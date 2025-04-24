// client/src/components/dashboard/TrainingSummary.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const TrainingSummary = ({ trainingData, showPieChart = false }) => {
  const [statusData, setStatusData] = useState([]);
  
  // Prepare data for status pie chart
  useEffect(() => {
    if (trainingData && trainingData.stats) {
      const { completed, expired, upcoming, total } = trainingData.stats;
      const notStarted = total - (completed + expired + upcoming);
      
      setStatusData([
        { name: 'Current', value: completed, color: '#10b981' },
        { name: 'Expired', value: expired, color: '#ef4444' },
        { name: 'Due Soon', value: upcoming, color: '#f59e0b' },
        { name: 'Not Started', value: notStarted > 0 ? notStarted : 0, color: '#6b7280' }
      ].filter(item => item.value > 0));
    }
  }, [trainingData]);
  
  // Get the appropriate color based on compliance percentage
  const getComplianceColor = (percentage) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-500";
    return "text-red-500";
  };
  
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
  
  // Handle missing training data
  if (!trainingData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 h-full" style={{ minHeight: "300px", maxHeight: "300px" }}>
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-lg font-semibold">Training Compliance</h2>
          <Link to="/training" className="text-blue-600 hover:text-blue-800 text-sm">
            Manage Training
          </Link>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-600">No training data available</p>
          <Link to="/training" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
            Upload training certificates
          </Link>
        </div>
      </div>
    );
  }
  
  // Extract data from trainingData
  const compliance = trainingData.compliance || 0;
  const complianceColor = getComplianceColor(compliance);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500" style={{ minHeight: "300px", maxHeight: "300px", height: "300px" }}>
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-lg font-semibold">Training Compliance</h2>
        <Link to="/training" className="text-blue-600 hover:text-blue-800 text-sm">
          View Details
        </Link>
      </div>
      
      <div className="flex flex-col" style={{ height: "calc(100% - 40px)" }}>
        <div className="text-center mb-3">
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
        
        {showPieChart && statusData.length > 0 ? (
          <div className="flex-grow" style={{ height: "150px", minHeight: "150px", maxHeight: "150px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={50}
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
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <div className="text-xs text-gray-500">Current</div>
              <div className="text-base font-medium text-green-600">{trainingData.stats.completed || 0}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Expiring</div>
              <div className="text-base font-medium text-yellow-500">{trainingData.stats.upcoming || 0}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Expired</div>
              <div className="text-base font-medium text-red-600">{trainingData.stats.expired || 0}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-base font-medium text-gray-700">{trainingData.stats.total || 0}</div>
            </div>
          </div>
        )}
        
        {trainingData.stats.expired > 0 && (
          <div className="mt-auto pt-2">
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              <span className="font-medium">{trainingData.stats.expired} expired certificates</span> require action
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingSummary;