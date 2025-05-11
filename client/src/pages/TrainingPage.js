// client/src/pages/TrainingPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TrainingUploader from '../components/training/TrainingUploader';
import TrainingComplianceDisplay from '../components/training/TrainingComplianceDisplay';
import TrainingComplianceCharts from '../components/training/TrainingComplianceCharts';
import ExcelTemplateDisplay from '../components/training/ExcelTemplateDisplay';
import { saveTrainingData, fetchTrainingData } from '../components/services/trainingApi';

const TrainingPage = () => {
  const [trainingData, setTrainingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Load existing training data if available
  useEffect(() => {
    const loadTrainingData = async () => {
      try {
        setLoading(true);
        const data = await fetchTrainingData();
        if (data) {
          setTrainingData(data);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading training data:', err);
        setError('Failed to load training data');
      } finally {
        setLoading(false);
      }
    };

    loadTrainingData();
  }, []);

  // Handle data from the uploader component
  const handleTrainingDataProcessed = async (data) => {
    setTrainingData(data);
    setError(null); // Clear any previous errors
    
    try {
      console.log('Processing training data before API save:', data);
      
      // Save the processed data to the server
      const result = await saveTrainingData(data);
      console.log('Server response after saving:', result);
      
      // Set success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Refresh data from server to confirm it was saved correctly
      setTimeout(async () => {
        try {
          const refreshedData = await fetchTrainingData(true);
          if (refreshedData) {
            console.log('Refreshed training data after save:', refreshedData);
            setTrainingData(refreshedData);
          }
        } catch (refreshError) {
          console.warn('Could not refresh data after save:', refreshError);
          // Continue using the locally processed data
        }
      }, 1000);
    } catch (err) {
      console.error('Error saving training data:', err);
      setError(`Failed to save training data to server: ${err.message}. Data is available for your current session only.`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Training Dashboard</h1>
        <div className="space-x-4">
          <Link to="/">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-xl shadow hover:bg-purple-700">
              Dashboard
            </button>
          </Link>
          <Link to="/reports">
            <button className="bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700">
              Reports
            </button>
          </Link>
          <Link to="/inspections">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700">
              Inspections
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <div className="mt-2 text-sm">
            <button 
              onClick={() => setError(null)} 
              className="text-red-700 underline hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
          <p className="font-bold">Success</p>
          <p>Training data saved successfully!</p>
        </div>
      )}
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700 mb-4">
        <p className="font-bold">Connection Information</p>
        <p>API URL: {process.env.REACT_APP_API_URL || 'http://localhost:5000'}</p>
        <p className="text-xs mt-1">If you're experiencing connection issues, check that this API URL is correct.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Training Certificate Data</h2>
        <p className="text-gray-600 mb-4">
          Upload an Excel file containing training certificates to analyze compliance status and upcoming renewals.
        </p>
        
        <TrainingUploader onDataProcessed={handleTrainingDataProcessed} />
        
        <ExcelTemplateDisplay />
        
        <div className="mt-4 text-sm text-gray-500">
          <p>The system will automatically calculate compliance and identify certificates that are expiring soon.</p>
          <p>Training compliance will be included in the overall safety metrics for your dashboard.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading training data...</p>
        </div>
      ) : (
        <>
          <TrainingComplianceDisplay trainingData={trainingData} />
          
          {trainingData && trainingData.records && trainingData.records.length > 0 && (
            <div className="mt-6">
              <TrainingComplianceCharts trainingData={trainingData} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainingPage;