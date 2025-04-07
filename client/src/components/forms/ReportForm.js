import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitReport } from '../services/api';

export default function ReportForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Create structured form data that matches how Dashboard expects it
  const [formData, setFormData] = useState({
    companyName: '',
    reportPeriod: '',
    reportType: 'Monthly',
    metrics: {
      lagging: {
        incidentCount: 0,
        nearMissCount: 0,
        firstAidCount: 0,
        medicalTreatmentCount: 0,
        lostTimeInjuryCount: 0
      },
      leading: {
        trainingCompleted: 0,
        inspectionsCompleted: 0,
        kpis: [
          {
            id: 'nearMissRate',
            name: 'Near Miss Reporting Rate',
            actual: 0,
            target: 100,
            unit: '%'
          },
          {
            id: 'criticalRiskVerification',
            name: 'Critical Risk Control Verification',
            actual: 0,
            target: 95,
            unit: '%'
          },
          {
            id: 'electricalSafetyCompliance',
            name: 'Electrical Safety Compliance',
            actual: 0,
            target: 100,
            unit: '%'
          }
        ]
      },
      riskScore: 0,
      trainingCompliance: 0
    }
  });

  const handleChange = (e) => {
  const { name, value } = e.target;
  
  // Handle KPI fields
  if (name.startsWith('kpi_')) {
    const [_, kpiId] = name.split('_');
    
    setFormData(prev => {
      // Create a copy of the current state
      const newState = { ...prev };
      
      // Make sure the nested structure exists
      if (!newState.metrics) newState.metrics = {};
      if (!newState.metrics.leading) newState.metrics.leading = { trainingCompleted: 0, inspectionsCompleted: 0, kpis: [] };
      if (!Array.isArray(newState.metrics.leading.kpis)) newState.metrics.leading.kpis = [];
      
      // Find the KPI with this ID if it exists
      const kpiIndex = newState.metrics.leading.kpis.findIndex(k => k.id === kpiId);
      
      if (kpiIndex !== -1) {
        // Update the existing KPI
        newState.metrics.leading.kpis[kpiIndex].actual = value === '' ? 0 : Number(value);
      } else {
        // Add a new KPI with this ID
        let kpiName = 'KPI';
        let kpiUnit = '%';
        let kpiTarget = 100;
        
        // Set defaults based on ID
        switch (kpiId) {
          case 'nearMissRate':
            kpiName = 'Near Miss Reporting Rate';
            break;
          case 'criticalRiskVerification':
            kpiName = 'Critical Risk Control Verification';
            kpiTarget = 95;
            break;
          case 'electricalSafetyCompliance':
            kpiName = 'Electrical Safety Compliance';
            break;
        }
        
        // Add the new KPI
        newState.metrics.leading.kpis.push({
          id: kpiId,
          name: kpiName,
          actual: value === '' ? 0 : Number(value),
          target: kpiTarget,
          unit: kpiUnit
        });
      }
      
      console.log('Updated KPIs:', newState.metrics.leading.kpis);
      return newState;
    });
  }
  // Handle metrics.trainingCompliance and metrics.riskScore specifically
  else if (name === 'metrics.trainingCompliance' || name === 'metrics.riskScore') {
    const field = name.split('.')[1]; // Get either 'trainingCompliance' or 'riskScore'
    
    setFormData(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [field]: value === '' ? 0 : Number(value)
      }
    }));
    
    console.log(`Updated ${field}:`, value);
  }
  // Handle other nested metrics fields
  else if (name.includes('.')) {
    const parts = name.split('.');
    
    // Handle two-level nesting (e.g., metrics.lagging)
    if (parts.length === 2) {
      const [section, field] = parts;
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value === '' ? 0 : Number(value)
        }
      }));
    } 
    // Handle three-level nesting (e.g., metrics.lagging.incidentCount)
    else if (parts.length === 3) {
      const [section, subsection, field] = parts;
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [subsection]: {
            ...prev[section]?.[subsection],
            [field]: value === '' ? 0 : Number(value)
          }
        }
      }));
    }
  }
  // Handle direct properties like companyName
  else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
};      
  
  // client/src/components/forms/ReportForm.js - handleSubmit update

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitError(null);

  // Log the form data structure before submission
  console.log('Form data before submission:', formData);

  try {
    // Make sure KPIs are properly nested
    if (!formData.metrics.leading) {
      formData.metrics.leading = {
        trainingCompleted: 0,
        inspectionsCompleted: 0,
        kpis: []
      };
    }
    
    // Ensure KPIs array exists and has values
    if (!Array.isArray(formData.metrics.leading.kpis) || formData.metrics.leading.kpis.length === 0) {
      // Add default KPIs with the form values
      formData.metrics.leading.kpis = [
        {
          id: 'nearMissRate',
          name: 'Near Miss Reporting Rate',
          actual: parseFloat(formData.kpi_nearMissRate || 0),
          target: 100,
          unit: '%'
        },
        {
          id: 'criticalRiskVerification',
          name: 'Critical Risk Control Verification',
          actual: parseFloat(formData.kpi_criticalRiskVerification || 0),
          target: 95,
          unit: '%'
        },
        {
          id: 'electricalSafetyCompliance',
          name: 'Electrical Safety Compliance',
          actual: parseFloat(formData.kpi_electricalSafetyCompliance || 0),
          target: 100,
          unit: '%'
        }
      ];
    }
    
    // Log the final structure to verify
    console.log('Final data structure for submission:', formData);
    
    // Submit the report
    await submitReport(formData);
    alert('Report submitted successfully!');
    navigate('/');
  } catch (err) {
    console.error('Error submitting report:', err);
    setSubmitError(err.message || 'Failed to submit report. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>
        <p className="text-sm text-gray-500">Enter general report details</p>
      </div>
      
      {/* Basic Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
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
            placeholder="e.g. Jan 2025"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Report Type</label>
          <select
            name="reportType"
            value={formData.reportType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annual">Annual</option>
          </select>
        </div>
      </div>

      {/* Lagging Indicators Section */}
      <div className="pt-6 border-t mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Lagging Indicators</h2>
        <p className="text-sm text-gray-500 mb-4">Enter incident and hazard data</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Incidents</label>
            <input
              type="number"
              name="metrics.lagging.incidentCount"
              value={formData.metrics.lagging.incidentCount}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Near Misses</label>
            <input
              type="number"
              name="metrics.lagging.nearMissCount"
              value={formData.metrics.lagging.nearMissCount}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">First Aid Cases</label>
            <input
              type="number"
              name="metrics.lagging.firstAidCount"
              value={formData.metrics.lagging.firstAidCount}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Medical Treatments</label>
            <input
              type="number"
              name="metrics.lagging.medicalTreatmentCount"
              value={formData.metrics.lagging.medicalTreatmentCount}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lost Time Injuries</label>
            <input
              type="number"
              name="metrics.lagging.lostTimeInjuryCount"
              value={formData.metrics.lagging.lostTimeInjuryCount}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
        </div>
      </div>

      {/* Leading Indicators Section */}
      <div className="pt-6 border-t mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Leading Indicators</h2>
        <p className="text-sm text-gray-500 mb-4">Enter preventative safety metrics</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Training Completed</label>
            <input
              type="number"
              name="metrics.leading.trainingCompleted"
              value={formData.metrics.leading.trainingCompleted}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Inspections Completed</label>
            <input
              type="number"
              name="metrics.leading.inspectionsCompleted"
              value={formData.metrics.leading.inspectionsCompleted}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
        </div>
        
        <h3 className="font-semibold text-gray-700 mb-2">Key Performance Indicators</h3>
        <div className="space-y-4">
          {formData.metrics.leading.kpis.map((kpi) => (
            <div key={kpi.id} className="flex items-center">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700">{kpi.name}</label>
                <div className="text-xs text-gray-500">Target: {kpi.target}{kpi.unit}</div>
              </div>
              <div className="w-1/2">
                <input
                  type="number"
                  name={`kpi_${kpi.id}`}
                  value={kpi.actual}
                  onChange={handleChange}
                  min="0"
                  max={kpi.unit === '%' ? 100 : undefined}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Summary Metrics Section */}
      <div className="pt-6 border-t mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Summary Metrics</h2>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Training Compliance (%)</label>
          <input
            type="number"
            name="metrics.trainingCompliance"
            value={formData.metrics.trainingCompliance}
            onChange={handleChange}
            min="0"
            max="100"
            step="0.1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Risk Score (1-10)</label>
          <input
            type="number"
            name="metrics.riskScore"
            value={formData.metrics.riskScore}
            onChange={handleChange}
            min="0"
            max="10"
            step="0.1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>
      </div>

      {/* Form Data Preview */}
      <div className="pt-6 border-t mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Form Data Preview</h2>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => {
              // Log KPI data specifically
              console.log('KPI data in form:', formData.metrics?.leading?.kpis || 'Not found');
              console.log('Complete form data:', formData);
            }}
          >
            Log Data
          </button>
        </div>
        <div className="bg-gray-100 p-4 rounded-md">
          <h3 className="text-sm font-medium mb-2">KPIs to be submitted:</h3>
          {Array.isArray(formData.metrics?.leading?.kpis) && formData.metrics.leading.kpis.length > 0 ? (
            <ul className="text-xs space-y-1">
              {formData.metrics.leading.kpis.map((kpi, index) => (
                <li key={index}>
                  {kpi.name}: {kpi.actual} {kpi.unit} (Target: {kpi.target} {kpi.unit})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-red-500">No KPIs found in form data structure</p>
          )}
        </div>
      </div>
      

      {/* Submit buttons */}
      <div className="pt-6 border-t mt-8 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>

      {submitError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

