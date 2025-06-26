// client/src/components/forms/SafetyEventFormPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { submitInspection } from '../services/api';

export default function SafetyEventFormPage() {
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
      const response = await submitInspection(submissionData);
      navigate('/safety-events'); // Updated navigation path
    } catch (err) {
      console.error('Error submitting safety event:', err);
      setErrorMessage('Failed to submit safety event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Create New Safety Event</h1>
          <Link to="/safety-events" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Safety Events
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-green-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Safety Event Form</h2>
            <p className="text-green-100 text-sm">Record inspections, meetings, training sessions, and other safety activities</p>
          </div>
          
          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-red-700">{errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Facilitator/Lead *</label>
                <input 
                  name="facilitator" 
                  value={formData.facilitator} 
                  onChange={handleChange} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Person leading the event"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Event Date *</label>
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
                  placeholder="Building/Area/Department/Meeting Room" 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Event Type *</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange} 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange}
                rows="3" 
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Key discussion points, decisions made, or additional context"
              ></textarea>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Action Items & Findings ({formData.findings.length})</h3>
              
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
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add Action Item/Finding</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Action Item or Finding</label>
                    <input 
                      name="issue" 
                      value={finding.issue} 
                      onChange={handleFindingChange} 
                      placeholder="Describe the action item, finding, or recommendation"
                      className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Priority</label>
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
                    Already Completed
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
                    Add Action Item
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-4 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => navigate('/safety-events')}
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
                {isSubmitting ? 'Submitting...' : 'Submit Safety Event'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Safety events help us track and improve our safety culture through systematic documentation</p>
        </div>
      </div>
    </div>
  );
}