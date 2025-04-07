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
    {/* Basic Info */}
    <div className="border-b pb-4 mb-6">
      <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>
      <p className="text-sm text-gray-500">Enter general report details</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Company Name</label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Report Type</label>
        <select
          name="reportType"
          value={formData.reportType}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
        >
          <option value="Monthly">Monthly</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Annual">Annual</option>
        </select>
      </div>
    </div>

    {/* Lagging Indicators */}
    <div className="pt-6 border-t mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Lagging Indicators</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Incidents', name: 'metrics.lagging.incidentCount' },
          { label: 'Near Misses', name: 'metrics.lagging.nearMissCount' },
          { label: 'First Aid Cases', name: 'metrics.lagging.firstAidCount' },
          { label: 'Medical Treatments', name: 'metrics.lagging.medicalTreatmentCount' },
          { label: 'Lost Time Injuries', name: 'metrics.lagging.lostTimeInjuryCount' },
        ].map((item) => (
          <div key={item.name}>
            <label className="block text-sm font-medium text-gray-700">{item.label}</label>
            <input
              type="number"
              name={item.name}
              value={item.name.split('.').reduce((o, i) => o?.[i], formData)}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            />
          </div>
        ))}
      </div>
    </div>

    {/* Leading Indicators */}
    <div className="pt-6 border-t mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Leading Indicators</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Training Completed</label>
          <input
            type="number"
            name="metrics.leading.trainingCompleted"
            value={formData.metrics.leading.trainingCompleted}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          />
        </div>
      </div>

      <h3 className="font-semibold text-gray-700 mt-6 mb-2">Key Performance Indicators</h3>
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
                className="block w-full rounded-md border-gray-300 shadow-sm p-2"
              />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Summary Metrics */}
    <div className="pt-6 border-t mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
        />
      </div>
    </div>

    {/* Submit */}
    <div className="pt-6 border-t mt-8 flex justify-end gap-4">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 border"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 ${
          isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </div>

    {submitError && (
      <div className="mt-4 p-4 border-l-4 border-red-500 bg-red-50 text-sm text-red-700">
        {submitError}
      </div>
    )}
  </form>
);
}