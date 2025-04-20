// client/src/components/dashboard/TrainingSummary.js
import React, { useState, useEffect } from 'react';
import { fetchTrainingData } from '../services/trainingApi';
import { Link } from 'react-router-dom';

const TrainingSummary = () => {
  const [trainingData, setTrainingData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadTrainingData = async () => {
      try {
        setLoading(true);
        const data = await fetchTrainingData();
        setTrainingData(data);
      } catch (error) {
        console.error('Error loading training data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTrainingData();
  }, []);
  
  // Get the appropriate color based on compliance percentage
  const getComplianceColor = (percentage) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-500";
    return "text-red-500";
  };
  
  // Handle missing training data
  if (!trainingData && !loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
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
  
  // Handle loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold mb-3">Training Compliance</h2>
        <div className="flex justify-center items-center py-4">
          <div className="animate-pulse flex space-x-4">
            <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
            <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
            <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Extract data from trainingData
  const {
    compliance = 0,
    stats = { completed: 0, expired: 0, upcoming: 0, total: 0 },
    upcomingRenewals = []
  } = trainingData;
  
  // Get color for compliance percentage
  const complianceColor = getComplianceColor(compliance);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-lg font-semibold">Training Compliance</h2>
        <Link to="/training" className="text-blue-600 hover:text-blue-800 text-sm">
          Manage Training
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <div className="text-sm text-gray-500">Compliance Rate</div>
          <div className={`text-xl font-bold ${complianceColor}`}>
            {compliance.toFixed(1)}%
          </div>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
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
        
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <div className="text-sm text-gray-500">Certificate Status</div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div>
              <div className="text-xs text-gray-500">Current</div>
              <div className="text-base font-medium text-green-600">{stats.completed}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Expiring</div>
              <div className="text-base font-medium text-yellow-500">{stats.upcoming}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Expired</div>
              <div className="text-base font-medium text-red-600">{stats.expired}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Show upcoming renewals if available */}
      {upcomingRenewals.length > 0 && (
        <div className="mt-3">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Upcoming Renewals</h3>
          <div className="max-h-24 overflow-y-auto">
            {upcomingRenewals.slice(0, 3).map((renewal, index) => (
              <div key={index} className="flex justify-between items-center text-xs py-1 border-b">
                <span className="text-gray-800">{renewal.employee} - {renewal.trainingType}</span>
                <span className={`${
                  renewal.daysRemaining <= 7 ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {renewal.daysRemaining} days
                </span>
              </div>
            ))}
            {upcomingRenewals.length > 3 && (
              <Link to="/training" className="text-xs text-blue-600 block mt-1">
                View all {upcomingRenewals.length} upcoming renewals
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingSummary;