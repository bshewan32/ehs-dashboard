

// client/src/components/training/TrainingComplianceDisplay.js
import React, { useState } from 'react';

const TrainingComplianceDisplay = ({ trainingData }) => {
  const [activeTab, setActiveTab] = useState('summary');
  
  if (!trainingData || !trainingData.records || trainingData.records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 text-center">
        <div className="text-gray-700 py-6">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No Training Data Available</p>
          <p className="text-sm mt-1">Upload an Excel file to see training compliance stats</p>
        </div>
      </div>
    );
  }

  const { compliance, upcomingRenewals, stats } = trainingData;
  
  // Determine compliance color based on percentage
  const getComplianceColor = (percentage) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-500";
    return "text-red-600";
  };
  
  const complianceColor = getComplianceColor(compliance);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 px-4 py-3 text-white">
        <h2 className="text-lg font-semibold flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Training Compliance
        </h2>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`px-4 py-2 font-medium text-sm leading-5 ${
              activeTab === 'summary'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm leading-5 ${
              activeTab === 'upcoming'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Renewals
          </button>
        </nav>
      </div>

      <div className="p-4">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Overall Compliance</h3>
                <div className={`text-3xl font-bold ${complianceColor}`}>
                  {compliance.toFixed(1)}%
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-2 rounded-full ${
                      compliance >= 90 ? 'bg-green-500' : compliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, compliance)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status Breakdown</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <div className="text-sm text-gray-600">Completed/Current</div>
                    <div className="text-xl font-semibold text-green-600">{stats.completed}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Expired</div>
                    <div className="text-xl font-semibold text-red-600">{stats.expired}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Due Soon</div>
                    <div className="text-xl font-semibold text-yellow-500">{stats.upcoming}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-xl font-semibold text-gray-700">{stats.total}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-md font-medium text-gray-700 mb-2">Training Compliance Details</h3>
              <p className="text-sm text-gray-600">
                {compliance >= 90 
                  ? "Excellent compliance level. Continue maintaining current training standards."
                  : compliance >= 70
                  ? "Good compliance level but there's room for improvement. Focus on upcoming renewals."
                  : "Compliance level needs significant improvement. Address expired trainings immediately."}
              </p>
              
              {stats.expired > 0 && (
                <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                  <div className="font-medium">Action Required</div>
                  <div className="text-sm">{stats.expired} training certifications have expired. Please schedule renewal training.</div>
                </div>
              )}
              
              {stats.upcoming > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
                  <div className="font-medium">Upcoming Renewals</div>
                  <div className="text-sm">{stats.upcoming} training certifications will expire within 30 days. Click the "Upcoming Renewals" tab for details.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Renewals Tab */}
        {activeTab === 'upcoming' && (
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Training Certifications Expiring Soon</h3>
            
            {upcomingRenewals.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No upcoming training renewals in the next 30 days</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Training Type
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiration Date
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Remaining
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcomingRenewals.map((renewal, index) => (
                      <tr key={index} className={renewal.daysRemaining <= 7 ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {renewal.employee}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {renewal.trainingType}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {renewal.expirationDate instanceof Date 
                            ? renewal.expirationDate.toLocaleDateString() 
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            renewal.daysRemaining <= 7 
                              ? 'bg-red-100 text-red-800' 
                              : renewal.daysRemaining <= 14
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {renewal.daysRemaining} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
              <p className="font-medium">Training Renewal Recommendations</p>
              <ul className="list-disc list-inside mt-1">
                <li>Schedule renewals at least 2 weeks before expiration</li>
                <li>Prioritize certifications expiring within 7 days</li>
                <li>Consider group training sessions for common certifications</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingComplianceDisplay;