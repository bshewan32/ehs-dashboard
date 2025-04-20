// client/src/components/training/TrainingComplianceCharts.js
import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrainingComplianceCharts = ({ trainingData }) => {
  const [statusData, setStatusData] = useState([]);
  const [typeData, setTypeData] = useState([]);

  // Prepare status data with useMemo
  const preparedStatusData = useMemo(() => {
    if (!trainingData || !trainingData.stats) {
      return [];
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

  // Prepare type data with useMemo
  const preparedTypeData = useMemo(() => {
    if (!trainingData || !trainingData.records || !trainingData.records.length) {
      return [];
    }
    
    // Group by training type
    const typeGroups = trainingData.records.reduce((acc, record) => {
      const type = record.trainingType || 'Unknown';
      if (!acc[type]) {
        acc[type] = { 
          name: type, 
          total: 0, 
          current: 0, 
          expired: 0, 
          dueSoon: 0 
        };
      }
      
      acc[type].total += 1;
      
      // Categorize by status
      if (record.status === 'Expired') {
        acc[type].expired += 1;
      } else if (record.status === 'Due Soon') {
        acc[type].dueSoon += 1;
      } else if (['Completed', 'Current', 'Valid'].includes(record.status)) {
        acc[type].current += 1;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by total count (descending)
    return Object.values(typeGroups)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Take top 5 training types
  }, [trainingData]);

  // Update state when memo values change
  useEffect(() => {
    setStatusData(preparedStatusData);
  }, [preparedStatusData]);

  useEffect(() => {
    setTypeData(preparedTypeData);
  }, [preparedTypeData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length || !trainingData || !trainingData.stats) {
      return null;
    }
    
    return (
      <div className="bg-white p-2 border shadow-sm text-xs">
        <p className="font-medium">{`${label || payload[0].name}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color || entry.fill }}>
            {entry.name}: {entry.value} ({((entry.value / trainingData.stats.total) * 100).toFixed(1)}%)
          </p>
        ))}
      </div>
    );
  };

  if (!trainingData || !trainingData.stats) {
    return (
      <div className="text-gray-500 text-center py-10">
        No training data available for visualization
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Training Status</h3>
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Top Training Types</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={typeData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="current" stackId="a" name="Current" fill="#10b981" />
              <Bar dataKey="dueSoon" stackId="a" name="Due Soon" fill="#f59e0b" />
              <Bar dataKey="expired" stackId="a" name="Expired" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TrainingComplianceCharts;