// client/src/components/training/TrainingComplianceCharts.js
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const TrainingComplianceCharts = ({ trainingData }) => {
  // Prepare status data for pie chart
  const statusData = React.useMemo(() => {
    if (!trainingData || !trainingData.stats) return [];
    
    const { completed, expired, upcoming, total } = trainingData.stats;
    const notStarted = total - (completed + expired + upcoming);
    
    return [
      { name: 'Current', value: completed, color: '#10b981' },
      { name: 'Expired', value: expired, color: '#ef4444' },
      { name: 'Due Soon', value: upcoming, color: '#f59e0b' },
      { name: 'Not Started', value: notStarted > 0 ? notStarted : 0, color: '#6b7280' }
    ].filter(item => item.value > 0);
  }, [trainingData]);

  // Prepare data for training types chart
  const trainingTypeData = React.useMemo(() => {
    if (!trainingData || !trainingData.records) return [];
    
    // Count occurrences of each training type
    const typeCount = trainingData.records.reduce((acc, record) => {
      const type = record.trainingType;
      if (!type) return acc;
      
      if (!acc[type]) {
        acc[type] = { name: type, total: 0, current: 0, expired: 0, upcoming: 0 };
      }
      
      acc[type].total += 1;
      
      if (record.status === 'Current' || record.status === 'Completed' || record.status === 'Valid') {
        acc[type].current += 1;
      } else if (record.status === 'Expired') {
        acc[type].expired += 1;
      } else if (record.status === 'Due Soon' || record.status === 'Renew') {
        acc[type].upcoming += 1;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by total count
    return Object.values(typeCount)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6); // Show top 6 training types
  }, [trainingData]);

  // Early return if no data is available
  if (!trainingData || !trainingData.records || trainingData.records.length === 0) {
    return null;
  }

  // Custom tooltip for the pie chart
  const CustomPieTooltip = ({ active, payload }) => {
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-blue-600 text-white">
        <h2 className="text-lg font-semibold">Training Compliance Charts</h2>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Distribution Chart */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-4">Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Training Types Chart */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-4">Training Type Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trainingTypeData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} height={60} tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" name="Current" fill="#10b981" />
                  <Bar dataKey="expired" name="Expired" fill="#ef4444" />
                  <Bar dataKey="upcoming" name="Due Soon" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingComplianceCharts;