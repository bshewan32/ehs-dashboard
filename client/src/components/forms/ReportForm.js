// client/src/components/forms/ReportForm.js
import React, { useState } from 'react';
import { submitReport, markDataChanged } from '../services/api';
import { useNavigate } from 'react-router-dom';
import FormDataDebug from '../debug/FormDataDebug';

export default function ReportForm() {
  const navigate = useNavigate();
  const [showDebug, setShowDebug] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic report info
    companyName: '',
    reportPeriod: '',
    reportType: 'Monthly',
    
    // Lagging indicators
    incidentCount: 0,
    nearMissCount: 0,
    firstAidCount: 0,
    medicalTreatmentCount: 0,
    lostTimeInjuryCount: 0,
    
    // Leading indicators
    trainingCompleted: 0,
    inspectionsCompleted: 0,
    trainingCompliance: 0,
    riskScore: 0,
    
    // KPIs
    nearMissRate: 0,
    criticalRiskVerification: 0,
    electricalSafetyCompliance: 0
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const numericFields = [
      'incidentCount', 'nearMissCount', 'firstAidCount', 
      'medicalTreatmentCount', 'lostTimeInjuryCount',
      'trainingCompleted', 'inspectionsCompleted', 
      'trainingCompliance', 'riskScore',
      'nearMissRate', 'criticalRiskVerification', 'electricalSafetyCompliance'
    ];
    
    // Convert numeric fields to numbers, handle empty strings
    const processedValue = numericFields.includes(name) 
      ? (value === '' ? 0 : parseFloat(value) || 0) 
      : value;
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const validateForm = () => {
    // Required fields
    if (!formData.companyName) return "Company name is required";
    if (!formData.reportPeriod) return "Report period is required";
    
    // Validate numeric values are positive
    const numericFields = [
      'incidentCount', 'nearMissCount', 'firstAidCount', 
      'medicalTreatmentCount', 'lostTimeInjuryCount',
      'trainingCompleted', 'inspectionsCompleted', 
      'trainingCompliance', 'riskScore'
    ];
    
    for (const field of numericFields) {
      if (formData[field] < 0) return `${field} cannot be negative`;
    }
    
    // Validate percentages are between 0-100
    const percentageFields = [
      'trainingCompliance', 'nearMissRate', 
      'criticalRiskVerification', 'electricalSafetyCompliance'
    ];
    
    for (const field of percentageFields) {
      if (formData[field] < 0 || formData[field] > 100) {
        return `${field} must be between 0 and 100`;
      }
    }
    
    return null; // No validation errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    setSubmitting(true);
  
    // Create payload with the exact structure expected by the backend model
    const payload = {
      companyName: formData.companyName,
      reportPeriod: formData.reportPeriod,
      reportType: formData.reportType,
      metrics: {
        // Structured exactly as expected in the MongoDB model
        lagging: {
          incidentCount: parseInt(formData.incidentCount),
          nearMissCount: parseInt(formData.nearMissCount),
          firstAidCount: parseInt(formData.firstAidCount),
          medicalTreatmentCount: parseInt(formData.medicalTreatmentCount),
          lostTimeInjuryCount: parseInt(formData.lostTimeInjuryCount)
        },
        leading: {
          trainingCompleted: parseFloat(formData.trainingCompleted),
          inspectionsCompleted: parseInt(formData.inspectionsCompleted),
          // KPIs array exactly as expected by the model
          kpis: [
            { 
              id: 'nearMissRate',
              name: 'Near Miss Reporting Rate',
              actual: parseFloat(formData.nearMissRate),
              target: 100,
              unit: '%' 
            },
            { 
              id: 'criticalRiskVerification',
              name: 'Critical Risk Control Verification',
              actual: parseFloat(formData.criticalRiskVerification),
              target: 95,
              unit: '%' 
            },
            { 
              id: 'electricalSafetyCompliance',
              name: 'Electrical Safety Compliance',
              actual: parseFloat(formData.electricalSafetyCompliance),
              target: 100,
              unit: '%' 
            }
          ]
        },
        // These are at the top level of metrics in your model
        trainingCompliance: parseFloat(formData.trainingCompliance),
        riskScore: parseFloat(formData.riskScore)
      }
    };
  
    console.log('Submitting report with payload:', JSON.stringify(payload, null, 2));
  
    try {
      const res = await submitReport(payload);
      markDataChanged(); // Mark that data has changed for the dashboard
      alert(res.message || 'Report submitted successfully');
      navigate('/'); // Redirect to dashboard after success
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Submission failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to get current month and year for default period suggestion
  const getSuggestedPeriod = () => {
    const now = new Date();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow max-w-2xl mx-auto mt-6">
      <h2 className="text-xl font-bold border-b pb-2">Submit New Report</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Report Period</label>
          <input
            type="text"
            name="reportPeriod"
            value={formData.reportPeriod}
            onChange={handleChange}
            placeholder={getSuggestedPeriod()}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            e.g. "May 2025", "Q2 2025"
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Report Type</label>
          <select
            name="reportType"
            value={formData.reportType}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            required
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annual">Annual</option>
          </select>
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mt-6 border-b pb-2">Lagging Indicators</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Incidents</label>
          <input
            type="number"
            name="incidentCount"
            value={formData.incidentCount}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Near Misses</label>
          <input
            type="number"
            name="nearMissCount"
            value={formData.nearMissCount}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">First Aid Cases</label>
          <input
            type="number"
            name="firstAidCount"
            value={formData.firstAidCount}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Medical Treatments</label>
          <input
            type="number"
            name="medicalTreatmentCount"
            value={formData.medicalTreatmentCount}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Lost Time Injuries</label>
          <input
            type="number"
            name="lostTimeInjuryCount"
            value={formData.lostTimeInjuryCount}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mt-6 border-b pb-2">Leading Indicators</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Training Completed</label>
          <input
            type="number"
            name="trainingCompleted"
            value={formData.trainingCompleted}
            onChange={handleChange}
            step="0.1"
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Inspections Completed</label>
          <input
            type="number"
            name="inspectionsCompleted"
            value={formData.inspectionsCompleted}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Training Compliance (%)</label>
          <input
            type="number"
            name="trainingCompliance"
            value={formData.trainingCompliance}
            onChange={handleChange}
            step="0.1"
            min="0"
            max="100"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Average Risk Score</label>
          <input
            type="number"
            name="riskScore"
            value={formData.riskScore}
            onChange={handleChange}
            step="0.1"
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mt-6 border-b pb-2">Key Performance Indicators</h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Near Miss Reporting Rate (%)</label>
          <input
            type="number"
            name="nearMissRate"
            value={formData.nearMissRate}
            onChange={handleChange}
            step="0.1"
            min="0"
            max="100"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Critical Risk Control Verification (%)</label>
          <input
            type="number"
            name="criticalRiskVerification"
            value={formData.criticalRiskVerification}
            onChange={handleChange}
            step="0.1"
            min="0" 
            max="100"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Electrical Safety Compliance (%)</label>
          <input
            type="number"
            name="electricalSafetyCompliance"
            value={formData.electricalSafetyCompliance}
            onChange={handleChange}
            step="0.1"
            min="0"
            max="100"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>
      
      <div className="pt-4 border-t mt-6 flex justify-between items-center">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300" disabled={submitting}>
          {submitting ? 
            'Submitting...' : 'Submit Report'
          }
        </button>
        <button 
          type="button" 
          onClick={() => setShowDebug(!showDebug)}
          className="text-gray-600 text-sm hover:text-gray-800 underline"
        >
          {showDebug ? 'Hide' : 'Show'} Debug View
        </button>
      </div>
      
      {/* Conditionally render the debug component */}
      {showDebug && <FormDataDebug formData={getPayloadPreview(formData)} />}
    </form>
  );
  
  // Helper function to preview the payload structure
  function getPayloadPreview(formData) {
    return {
      companyName: formData.companyName,
      reportPeriod: formData.reportPeriod,
      reportType: formData.reportType,
      metrics: {
        lagging: {
          incidentCount: parseInt(formData.incidentCount),
          nearMissCount: parseInt(formData.nearMissCount),
          firstAidCount: parseInt(formData.firstAidCount),
          medicalTreatmentCount: parseInt(formData.medicalTreatmentCount),
          lostTimeInjuryCount: parseInt(formData.lostTimeInjuryCount)
        },
        leading: {
          trainingCompleted: parseFloat(formData.trainingCompleted),
          inspectionsCompleted: parseInt(formData.inspectionsCompleted),
          kpis: [
            { 
              id: 'nearMissRate',
              name: 'Near Miss Reporting Rate',
              actual: parseFloat(formData.nearMissRate),
              target: 100,
              unit: '%' 
            },
            { 
              id: 'criticalRiskVerification',
              name: 'Critical Risk Control Verification',
              actual: parseFloat(formData.criticalRiskVerification),
              target: 95,
              unit: '%' 
            },
            { 
              id: 'electricalSafetyCompliance',
              name: 'Electrical Safety Compliance',
              actual: parseFloat(formData.electricalSafetyCompliance),
              target: 100,
              unit: '%' 
            }
          ]
        },
        trainingCompliance: parseFloat(formData.trainingCompliance),
        riskScore: parseFloat(formData.riskScore)
      }
    };
  }