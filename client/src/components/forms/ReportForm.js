import React, { useState } from 'react';
import { submitReport } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ReportForm() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    companyName: '',
    reportPeriod: '',
    reportType: 'Monthly',
    totalIncidents: 0,
    totalNearMisses: 0,
    firstAidCount: 0,
    medicalTreatmentCount: 0,
    trainingCompliance: 0,
    riskScore: 0,
    // Added KPI data fields
    nearMissRate: 0,
    criticalRiskVerification: 0,
    electricalSafetyCompliance: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['totalIncidents', 'totalNearMisses', 'firstAidCount', 
                         'medicalTreatmentCount', 'trainingCompliance', 'riskScore',
                         'nearMissRate', 'criticalRiskVerification', 'electricalSafetyCompliance'];
    
    // Convert numeric fields to numbers
    const processedValue = numericFields.includes(name) 
      ? parseFloat(value) || 0 
      : value;
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create proper data structure with KPIs included
    const payload = {
      companyName: formData.companyName,
      reportPeriod: formData.reportPeriod,
      reportType: formData.reportType,
      metrics: {
        totalIncidents: parseInt(formData.totalIncidents),
        totalNearMisses: parseInt(formData.totalNearMisses),
        firstAidCount: parseInt(formData.firstAidCount),
        medicalTreatmentCount: parseInt(formData.medicalTreatmentCount),
        trainingCompliance: parseFloat(formData.trainingCompliance),
        riskScore: parseFloat(formData.riskScore),
        
        // Add leading indicators with KPIs
        leading: {
          trainingCompleted: parseFloat(formData.trainingCompliance),
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
        
        // Add lagging indicators
        lagging: {
          incidentCount: parseInt(formData.totalIncidents),
          nearMissCount: parseInt(formData.totalNearMisses),
          firstAidCount: parseInt(formData.firstAidCount),
          medicalTreatmentCount: parseInt(formData.medicalTreatmentCount)
        }
      }
    };

    try {
      const res = await submitReport(payload);
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
      </div>
      
      <h3 className="text-lg font-semibold mt-6 border-b pb-2">Lagging Indicators</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Incidents</label>
          <input
            type="number"
            name="totalIncidents"
            value={formData.totalIncidents}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Near Misses</label>
          <input
            type="number"
            name="totalNearMisses"
            value={formData.totalNearMisses}
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
      </div>
      
      <h3 className="text-lg font-semibold mt-6 border-b pb-2">Leading Indicators</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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