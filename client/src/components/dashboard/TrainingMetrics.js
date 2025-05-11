// client/src/components/dashboard/TrainingMetrics.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrainingMetrics } from '../services/trainingApi';

const TrainingMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTrainingMetrics = async () => {
      try {
        setLoading(true);
        const data = await fetchTrainingMetrics();
        setMetrics(data);
        setError(null);
      } catch (err) {
        console.error('Error loading training metrics:', err);
        setError('Failed to load training data');
      } finally {
        setLoading(false);
      }
    };

    loadTrainingMetrics();
  }, []);

  // Function to get color class based on compliance percentage
  const getComplianceColorClass = (compliance) => {
    if (compliance >= 90) return 'text-green-600';
    if (compliance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Function to get color class based on expiry count
  const getExpiryColorClass = (count, total) => {
    if (!total) return 'text-gray-600';
    const percentage = (count / total) * 100;
    if (percentage <= 5) return 'text-green-600';
    if (percentage <= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-24 bg-gray-100 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Training Compliance</h2>
        <div className="bg-red-50 p-3 rounded text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  // Use default values if metrics not available
  const compliance = metrics?.trainingCompliance || 0;
  const expired = metrics?.expiredCertificates || 0;
  const upcoming = metrics?.upcomingRenewals || 0;
  const total = metrics?.totalCertificates || 0;
  const completed = metrics?.completedCertificates || 0;

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Training Compliance</h2>
        <Link to="/training" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          View All
        </Link>
      </div>

      {/* Compliance Gauge */}
      <div className="relative pt-1 mb-6">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-100 text-blue-800">
              Compliance Rate
            </span>
          </div>
          <div className={`text-right ${getComplianceColorClass(compliance)}`}>
            <span className="text-xl font-bold">
              {compliance}%
            </span>
          </div>
        </div>
        <div className="flex h-2 mb-4 overflow-hidden bg-gray-200 rounded">
          <div 
            style={{ width: `${compliance}%` }} 
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
              compliance >= 90 ? 'bg-green-500' : compliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
          </div>
        </div>
      </div>

      {/* Training Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <div className="text-sm text-gray-500">Total Certificates</div>
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-xs text-gray-500 mt-1">
            {completed} Completed | {expired} Expired
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <div className="text-sm text-gray-500">Expiring Soon</div>
          <div className={`text-2xl font-bold ${getExpiryColorClass(upcoming, total)}`}>
            {upcoming}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Renewals needed within 90 days
          </div>
        </div>
      </div>

      {/* Only show this section if there are any expired certificates */}
      {expired > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
          <div className="flex items-center text-red-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-medium">Action Required: </span>
            <span className="ml-1">{expired} expired certificate{expired !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrainingMetrics;