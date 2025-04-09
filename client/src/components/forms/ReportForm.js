import React, { useState } from 'react';
import { submitReport } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ReportForm() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
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
    const { name, value } = e.target;
    const numericFields = [
      'incidentCount', 'nearMissCount', 'firstAidCount', 
      'medicalTreatmentCount', 'lostTimeInjuryCount',
      'trainingCompleted', 'inspectionsCompleted', 
      'trainingCompliance', 'riskScore',
      'nearMissRate', 'criticalRiskVerification', 'electricalSafetyCompliance'
    ];
    
    // Convert numeric fields to numbers
    const processedValue = numericFields.includes(name) 
      ? parseFloat(value) || 0 
      : value;
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // IMPORTANT: Create a structure that exactly matches the MongoDB model
    const payload = {
      companyName: formData.companyName,
      reportPeriod: formData.reportPeriod,
      reportType: formData.reportType,
      metrics: {
        // Nested structure matching backend model
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
      markDataChanged(); // Mark that data has changed
      alert(res.message || 'Report submitted successfully');
      navigate('/'); // Redirect to dashboard after success
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Submission failed: ' + (err.message || 'Unknown error'));
    }
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
            placeholder="e.g. Q1 2025"
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            required
          />
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
      
      <div className="pt-4 border-t mt-6">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Submit Report
        </button>
      </div>
    </form>
  );
}