import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchInspectionById, fetchSafetyEventById } from '../components/services/api';
import { updateFindingStatus } from '../components/services/api';

export default function SafetyEventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventType, setEventType] = useState(null); // 'inspection' or 'safety-event'

  useEffect(() => {
    const getEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to fetch as a safety event
        try {
          const safetyEvent = await fetchSafetyEventById(id);
          if (safetyEvent) {
            setEvent(safetyEvent);
            setEventType('safety-event');
            return;
          }
        } catch (safetyEventError) {
          console.log('Not a safety event, trying inspection...');
        }
        
        // If not a safety event, try as an inspection
        try {
          const inspection = await fetchInspectionById(id);
          if (inspection) {
            setEvent(inspection);
            setEventType('inspection');
            return;
          }
        } catch (inspectionError) {
          console.log('Not an inspection either...');
        }
        
        // If neither worked, show error
        setError('Event not found');
        
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      getEventDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{error || 'Event not found'}</p>
          </div>
        </div>
        <div className="flex space-x-4">
          <Link to="/safety-events" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Safety Events
          </Link>
          <Link to="/inspections" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Inspections
          </Link>
        </div>
      </div>
    );
  }

  // Handle updating finding status (for inspections)
  const handleToggleResolved = async (findingIndex, currentStatus) => {
    if (eventType !== 'inspection') return;
    
    try {
      const newStatus = !currentStatus;
      await updateFindingStatus(event._id, findingIndex, newStatus);
      
      // Update the local state to reflect the change
      setEvent(prev => {
        const updatedFindings = [...prev.findings];
        updatedFindings[findingIndex] = {
          ...updatedFindings[findingIndex],
          resolved: newStatus
        };
        return { ...prev, findings: updatedFindings };
      });
    } catch (err) {
      console.error('Error updating finding status:', err);
      alert('Failed to update finding status. Please try again.');
    }
  };

  // Render based on event type
  if (eventType === 'inspection') {
    return renderInspectionDetails();
  } else if (eventType === 'safety-event') {
    return renderSafetyEventDetails();
  }

  function renderInspectionDetails() {
    // Calculate statistics
    const highFindings = event.findings.filter(f => f.severity === 'High').length;
    const mediumFindings = event.findings.filter(f => f.severity === 'Medium').length;
    const lowFindings = event.findings.filter(f => f.severity === 'Low').length;
    const unresolvedFindings = event.findings.filter(f => !f.resolved).length;

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Inspection Details</h1>
            <p className="text-sm text-gray-500">Inspection Event</p>
          </div>
          <Link to="/inspections" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Inspections
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="border-b px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {event.type} Inspection at {event.location}
            </h2>
            <p className="text-gray-600 text-sm">
              Conducted by {event.inspector} on {new Date(event.date).toLocaleDateString()}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4 border-b">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Findings</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900">{event.findings.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">High Severity</h3>
              <p className="mt-1 text-lg font-semibold text-red-600">{highFindings}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Medium Severity</h3>
              <p className="mt-1 text-lg font-semibold text-orange-500">{mediumFindings}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Low Severity</h3>
              <p className="mt-1 text-lg font-semibold text-green-600">{lowFindings}</p>
            </div>
          </div>

          {event.notes && (
            <div className="px-6 py-4 border-b">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-gray-800">{event.notes}</p>
            </div>
          )}

          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Findings ({unresolvedFindings} unresolved)</h3>
            
            {event.findings.length === 0 ? (
              <p className="text-gray-500 italic">No findings recorded for this inspection.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {event.findings.map((finding, index) => (
                  <li key={index} className="py-3">
                    <div className="flex items-start">
                      <div 
                        className={`mr-3 flex-shrink-0 h-5 w-5 rounded-full ${
                          finding.severity === 'High' 
                            ? 'bg-red-500' 
                            : finding.severity === 'Medium' 
                            ? 'bg-orange-500' 
                            : 'bg-green-500'
                        }`}
                      ></div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900">{finding.issue}</p>
                          <p className="text-sm text-gray-500">{finding.severity} severity</p>
                        </div>
                        <div className="mt-1 flex justify-between">
                          <button 
                            onClick={() => handleToggleResolved(index, finding.resolved)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              finding.resolved 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                          >
                            {finding.resolved ? 'Resolved' : 'Unresolved'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderSafetyEventDetails() {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Safety Event Details</h1>
            <p className="text-sm text-gray-500">Safety Event</p>
          </div>
          <Link to="/safety-events" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Safety Events
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="border-b px-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {event.title || event.type || 'Safety Event'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {event.location && `Location: ${event.location}`}
                  {event.reportedBy && ` • Reported by: ${event.reportedBy}`}
                </p>
                <p className="text-gray-600 text-sm">
                  Date: {new Date(event.date || event.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end">
                {event.severity && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.severity === 'High' ? 'bg-red-100 text-red-800' :
                    event.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {event.severity} Severity
                  </span>
                )}
                {event.status && (
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.status === 'Open' ? 'bg-red-100 text-red-800' :
                    event.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {event.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4 border-b bg-gray-50">
            {event.incidentType && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Incident Type</h3>
                <p className="mt-1 text-sm font-semibold text-gray-900">{event.incidentType}</p>
              </div>
            )}
            {event.department && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Department</h3>
                <p className="mt-1 text-sm font-semibold text-gray-900">{event.department}</p>
              </div>
            )}
            {event.workersInvolved !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Workers Involved</h3>
                <p className="mt-1 text-sm font-semibold text-gray-900">{event.workersInvolved}</p>
              </div>
            )}
            {event.injuryType && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Injury Type</h3>
                <p className="mt-1 text-sm font-semibold text-gray-900">{event.injuryType}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="px-6 py-4 border-b">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-800">{event.description}</p>
            </div>
          )}

          {/* Immediate Actions */}
          {event.immediateActions && (
            <div className="px-6 py-4 border-b">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Immediate Actions Taken</h3>
              <p className="text-gray-800">{event.immediateActions}</p>
            </div>
          )}

          {/* Root Cause */}
          {event.rootCause && (
            <div className="px-6 py-4 border-b">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Root Cause</h3>
              <p className="text-gray-800">{event.rootCause}</p>
            </div>
          )}

          {/* Corrective Actions */}
          {event.correctiveActions && (
            <div className="px-6 py-4 border-b">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Corrective Actions</h3>
              <p className="text-gray-800">{event.correctiveActions}</p>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Notes</h3>
              <p className="text-gray-800">{event.notes}</p>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Event Information</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {event._id && (
                <>
                  <dt className="font-medium text-gray-500">Event ID:</dt>
                  <dd className="text-gray-900 font-mono">{event._id}</dd>
                </>
              )}
              {event.createdAt && (
                <>
                  <dt className="font-medium text-gray-500">Created:</dt>
                  <dd className="text-gray-900">{new Date(event.createdAt).toLocaleString()}</dd>
                </>
              )}
              {event.updatedAt && (
                <>
                  <dt className="font-medium text-gray-500">Last Updated:</dt>
                  <dd className="text-gray-900">{new Date(event.updatedAt).toLocaleString()}</dd>
                </>
              )}
              {event.company && (
                <>
                  <dt className="font-medium text-gray-500">Company:</dt>
                  <dd className="text-gray-900">{event.company}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    );
  }
}