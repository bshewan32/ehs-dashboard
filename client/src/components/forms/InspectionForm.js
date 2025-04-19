import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitInspection } from '../services/api';

export default function InspectionForm() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    inspector: '',
    date: new Date().toISOString().split('T')[0], // Today's date as default
    location: '',
    type: '',
    findings: [],
    notes: '',
  });

  const [finding, setFinding] = useState({ issue: '', severity: 'Low', resolved: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFindingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFinding({ ...finding, [name]: type === 'checkbox' ? checked : value });
  };

  const addFinding = () => {
    // Validate finding has an issue
    if (!finding.issue.trim()) {
      setErrorMessage('Please enter an issue description before adding a finding');
      return;
    }

    setFormData({ ...formData, findings: [...formData.findings, finding] });
    setFinding({ issue: '', severity: 'Low', resolved: false });
    setErrorMessage('');
  };

  const removeFinding = (index) => {
    const updatedFindings = [...formData.findings];
    updatedFindings.splice(index, 1);
    setFormData({ ...formData, findings: updatedFindings });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    // Basic validation
    if (!formData.inspector || !formData.location || !formData.type) {
      setErrorMessage('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await submitInspection(formData);
      navigate('/inspections');
    } catch (err) {
      console.error('Error submitting inspection:', err);
      setErrorMessage('Failed to submit inspection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white">
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Inspector Name *</label>
          <input 
            name="inspector" 
            value={formData.inspector} 
            onChange={handleChange} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Inspection Date *</label>
          <input 
            type="date" 
            name="date" 
            value={formData.date} 
            onChange={handleChange} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location *</label>
          <input 
            name="location" 
            value={formData.location} 
            onChange={handleChange} 
            placeholder="Building/Area/Department" 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Inspection Type *</label>
          <select 
            name="type" 
            value={formData.type} 
            onChange={handleChange} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a type</option>
            <option value="Weekly Safety Walkthrough">Weekly Safety Walkthrough</option>
            <option value="Monthly Compliance Check">Monthly Compliance Check</option>
            <option value="Quarterly Audit">Quarterly Audit</option>
            <option value="Annual Safety Assessment">Annual Safety Assessment</option>
            <option value="Post-Incident">Post-Incident</option>
            <option value="Pre-Startup">Pre-Startup</option>
            <option value="Equipment Inspection">Equipment Inspection</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
        <textarea 
          name="notes" 
          value={formData.notes} 
          onChange={handleChange}
          rows="3" 
          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Additional observations or context"
        ></textarea>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Findings ({formData.findings.length})</h3>
        
        {formData.findings.length > 0 && (
          <div className="mb-6 bg-gray-50 p-4 rounded-md">
            <ul className="divide-y divide-gray-200">
              {formData.findings.map((item, index) => (
                <li key={index} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.issue}</p>
                    <div className="flex mt-1 space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.severity === 'High' 
                          ? 'bg-red-100 text-red-800' 
                          : item.severity === 'Medium' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.severity} severity
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.resolved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.resolved ? 'Resolved' : 'Unresolved'}
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeFinding(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Finding</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Issue Description</label>
              <input 
                name="issue" 
                value={finding.issue} 
                onChange={handleFindingChange} 
                placeholder="Describe the safety issue or hazard"
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Severity</label>
              <select 
                name="severity" 
                value={finding.severity} 
                onChange={handleFindingChange}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <input 
              type="checkbox" 
              id="resolved" 
              name="resolved" 
              checked={finding.resolved} 
              onChange={handleFindingChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="resolved" className="ml-2 block text-sm text-gray-900">
              Already Resolved
            </label>
          </div>
          <div className="mt-3">
            <button 
              type="button" 
              onClick={addFinding}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Finding
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8 pt-4 border-t border-gray-200">
        <button 
          type="button" 
          onClick={() => navigate('/inspections')}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
            isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
        </button>
      </div>
    </form>
  );
}