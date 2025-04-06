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
    
    // Handle nested properties
    if (name.includes('.')) {
      const [section, subsection, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [subsection]: {
            ...prev[section][subsection],
            [field]: value === '' ? 0 : Number(value)
          }
        }
      }));
    } 
    // Handle KPI changes
    else if (name.startsWith('kpi_')) {
      const [_, kpiId] = name.split('_');
      setFormData(prev => {
        const updatedKpis = prev.metrics.leading.kpis.map(kpi => {
          if (kpi.id === kpiId) {
            return {
              ...kpi,
              actual: value === '' ? 0 : Number(value)
            };
          }
          return kpi;
        });
        
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            leading: {
              ...prev.metrics.leading,
              kpis: updatedKpis
            }
          }
        };
      });
    }
    // Handle direct properties
    else if (name === 'trainingCompliance' || name === 'riskScore') {
      setFormData(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [name]: value === '' ? 0 : Number(value)
        }
      }));
    }
    // Handle top-level fields like companyName
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
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
              name="trainingCompliance"
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
              name="riskScore"
              value={formData.metrics.riskScore}
              onChange={handleChange}
              min="0"
              max="10"
              step="0.1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
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

// import React, { useState } from 'react';

// export default function ReportForm() {
//   const [formData, setFormData] = useState({
//     companyName: '',
//     reportPeriod: '',
//     reportType: 'Monthly',
//     totalIncidents: 0,
//     totalNearMisses: 0,
//     firstAidCount: 0,
//     medicalTreatmentCount: 0,
//     trainingCompliance: 0,
//     riskScore: 0,
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const payload = {
//       companyName: formData.companyName,
//       reportPeriod: formData.reportPeriod,
//       reportType: formData.reportType,
//       metrics: {
//         totalIncidents: parseInt(formData.totalIncidents),
//         totalNearMisses: parseInt(formData.totalNearMisses),
//         firstAidCount: parseInt(formData.firstAidCount),
//         medicalTreatmentCount: parseInt(formData.medicalTreatmentCount),
//         trainingCompliance: parseFloat(formData.trainingCompliance),
//         riskScore: parseFloat(formData.riskScore),
//       },
//     };

//     try {
//       const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reports`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       alert(data.message);
//     } catch (err) {
//       console.error('Error submitting report:', err);
//       alert('Submission failed.');
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow max-w-xl mx-auto mt-6">
//       <h2 className="text-xl font-bold">Submit New Report</h2>
//       <div>
//         <label className="block text-sm font-medium">Company Name</label>
//         <input
//           type="text"
//           name="companyName"
//           value={formData.companyName}
//           onChange={handleChange}
//           className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
//           required
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium">Report Period</label>
//         <input
//           type="text"
//           name="reportPeriod"
//           value={formData.reportPeriod}
//           onChange={handleChange}
//           placeholder="e.g. Q1 2025"
//           className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
//           required
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium">Total Incidents</label>
//         <input
//           type="number"
//           name="totalIncidents"
//           value={formData.totalIncidents}
//           onChange={handleChange}
//           className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium">Total Near Misses</label>
//         <input
//           type="number"
//           name="totalNearMisses"
//           value={formData.totalNearMisses}
//           onChange={handleChange}
//           className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium">First Aid Cases</label>
//         <input
//           type="number"
//           name="firstAidCount"
//           value={formData.firstAidCount}
//           onChange={handleChange}
//           className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium">Medical Treatments</label>
//         <input
//           type="number"
//           name="medicalTreatmentCount"
//           value={formData.medicalTreatmentCount}
//           onChange={handleChange}
//           className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium">Training Compliance (%)</label>
//         <input
//           type="number"
//           name="trainingCompliance"
//           value={formData.trainingCompliance}
//           onChange={handleChange}
//           step="0.1"
//           className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium">Average Risk Score</label>
//         <input
//           type="number"
//           name="riskScore"
//           value={formData.riskScore}
//           onChange={handleChange}
//           step="0.1"
//           className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
//         />
//       </div>
//       <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
//         Submit Report
//       </button>
//     </form>
//   );
// }