// client/src/components/forms/SafetyEventForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitInspection } from '../services/api';

export default function SafetyEventForm({ standalone = false }) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    facilitator: '', // Changed from 'inspector' to 'facilitator'
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
    if (!formData.facilitator || !formData.location || !formData.type) {
      setErrorMessage('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      // Map facilitator back to inspector for API compatibility
      const submissionData = {
        ...formData,
        inspector: formData.facilitator // API still expects 'inspector'
      };
      
      console.log('Submitting safety event:', submissionData);
      const response = await submitInspection(submissionData);
      console.log('Safety event submitted successfully:', response);
      
      navigate('/safety-events'); // Updated navigation path
    } catch (err) {
      console.error('Error submitting safety event:', err);
      setErrorMessage(`Failed to submit safety event: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className={`space-y-6 ${standalone ? 'p-6 bg-white rounded-lg shadow-md' : 'p-6 bg-white'}`}>
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Facilitator/Lead *
            <span className="text-xs text-gray-500 block mt-1">Person responsible for leading the event</span>
          </label>
          <input 
            name="facilitator" 
            value={formData.facilitator} 
            onChange={handleChange} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter facilitator name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Date *
            <span className="text-xs text-gray-500 block mt-1">When did this event occur?</span>
          </label>
          <input 
            type="date" 
            name="date" 
            value={formData.date} 
            onChange={handleChange} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location *
            <span className="text-xs text-gray-500 block mt-1">Where did this event take place?</span>
          </label>
          <input 
            name="location" 
            value={formData.location} 
            onChange={handleChange} 
            placeholder="Building/Area/Department/Meeting Room" 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Type *
            <span className="text-xs text-gray-500 block mt-1">Select the type of safety event</span>
          </label>
          <select 
            name="type" 
            value={formData.type} 
            onChange={handleChange} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          >
            <option value="">Select event type</option>
            
            {/* Inspection/Audit Events */}
            <optgroup label="Inspections & Audits">
              <option value="Weekly Safety Walkthrough">Weekly Safety Walkthrough</option>
              <option value="Monthly Compliance Check">Monthly Compliance Check</option>
              <option value="Quarterly Safety Audit">Quarterly Safety Audit</option>
              <option value="Annual Safety Assessment">Annual Safety Assessment</option>
              <option value="Equipment Inspection">Equipment Inspection</option>
              <option value="Pre-Startup Safety Review">Pre-Startup Safety Review</option>
            </optgroup>
            
            {/* Incident-Related Events */}
            <optgroup label="Incident Management">
              <option value="Incident Investigation">Incident Investigation</option>
              <option value="Incident Review Meeting">Incident Review Meeting</option>
              <option value="Root Cause Analysis">Root Cause Analysis</option>
              <option value="Post-Incident Assessment">Post-Incident Assessment</option>
              <option value="Corrective Action Review">Corrective Action Review</option>
            </optgroup>
            
            {/* Return to Work & Wellness */}
            <optgroup label="Return to Work & Wellness">
              <option value="Return to Work Meeting">Return to Work Meeting</option>
              <option value="Modified Duty Assessment">Modified Duty Assessment</option>
              <option value="Fitness for Duty Evaluation">Fitness for Duty Evaluation</option>
              <option value="Workplace Accommodation Review">Workplace Accommodation Review</option>
            </optgroup>
            
            {/* Training & Communication */}
            <optgroup label="Training & Communication">
              <option value="Safety Training Session">Safety Training Session</option>
              <option value="Safety Toolbox Talk">Safety Toolbox Talk</option>
              <option value="Emergency Drill">Emergency Drill</option>
              <option value="Safety Committee Meeting">Safety Committee Meeting</option>
              <option value="Safety Communication Session">Safety Communication Session</option>
            </optgroup>
            
            {/* Risk Management */}
            <optgroup label="Risk Management">
              <option value="Job Safety Analysis">Job Safety Analysis (JSA)</option>
              <option value="Risk Assessment">Risk Assessment</option>
              <option value="Hazard Identification Session">Hazard Identification Session</option>
              <option value="Safety Planning Meeting">Safety Planning Meeting</option>
            </optgroup>
            
            {/* Other */}
            <optgroup label="Other">
              <option value="Other Safety Event">Other Safety Event</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
          <span className="text-xs text-gray-500 block mt-1">Key discussion points, decisions made, or additional context</span>
        </label>
        <textarea 
          name="notes" 
          value={formData.notes} 
          onChange={handleChange}
          rows="4" 
          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Describe the key outcomes, decisions, or observations from this event..."
        ></textarea>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Action Items & Findings ({formData.findings.length})
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Record any safety issues found, actions required, or recommendations made during this event.
        </p>
        
        {formData.findings.length > 0 && (
          <div className="mb-6 bg-gray-50 p-4 rounded-md">
            <ul className="divide-y divide-gray-200">
              {formData.findings.map((item, index) => (
                <li key={index} className="py-3 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">{item.issue}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.severity === 'High' 
                          ? 'bg-red-100 text-red-800' 
                          : item.severity === 'Medium' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.severity} priority
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.resolved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.resolved ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeFinding(index)}
                    className="ml-4 text-red-600 hover:text-red-900 flex-shrink-0"
                    title="Remove this item"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Action Item/Finding</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <input 
                name="issue" 
                value={finding.issue} 
                onChange={handleFindingChange} 
                placeholder="Describe the action item, finding, or recommendation..."
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority Level</label>
              <select 
                name="severity" 
                value={finding.severity} 
                onChange={handleFindingChange}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
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
              Mark as completed/resolved
            </label>
          </div>
          <div className="mt-3">
            <button 
              type="button" 
              onClick={addFinding}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={!finding.issue.trim()}
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Item
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8 pt-4 border-t border-gray-200 space-x-3">
        <button 
          type="button" 
          onClick={() => navigate('/safety-events')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
            isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            'Submit Safety Event'
          )}
        </button>
      </div>
    </form>
  );

  // If standalone, wrap in a container
  if (standalone) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">New Safety Event</h1>
            <p className="text-sm text-gray-500 mt-1">Record inspections, meetings, training sessions, and other safety activities</p>
          </div>
          {formContent}
        </div>
      </div>
    );
  }

  // Otherwise return just the form
  return formContent;
}