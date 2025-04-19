import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchInspections } from '../components/services/api';

export default function InspectionDetailsPage() {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getInspectionDetails = async () => {
      try {
        setLoading(true);
        // Fetch all inspections and find the one with matching ID
        // In a production app, you'd create a specific API endpoint for this
        const inspections = await fetchInspections();
        const found = inspections.find(insp => insp._id === id);
        
        if (found) {
          setInspection(found);
        } else {
          setError('Inspection not found');
        }
      } catch (err) {
        console.error('Error fetching inspection details:', err);
        setError('Failed to load inspection details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      getInspectionDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Loading inspection details...</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error || 'Inspection not found'}</p>
        </div>
        <Link to="/inspections" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Inspections
        </Link>
      </div>
    );
  }

  // Calculate statistics
  const highFindings = inspection.findings.filter(f => f.severity === 'High').length;
  const mediumFindings = inspection.findings.filter(f => f.severity === 'Medium').length;
  const lowFindings = inspection.findings.filter(f => f.severity === 'Low').length;
  const unresolvedFindings = inspection.findings.filter(f => !f.resolved).length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inspection Details</h1>
        <Link to="/inspections" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Inspections
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {inspection.type} Inspection at {inspection.location}
          </h2>
          <p className="text-gray-600 text-sm">
            Conducted by {inspection.inspector} on {new Date(inspection.date).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4 border-b">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Findings</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">{inspection.findings.length}</p>
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

        {inspection.notes && (
          <div className="px-6 py-4 border-b">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
            <p className="text-gray-800">{inspection.notes}</p>
          </div>
        )}

        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Findings ({unresolvedFindings} unresolved)</h3>
          
          {inspection.findings.length === 0 ? (
            <p className="text-gray-500 italic">No findings recorded for this inspection.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {inspection.findings.map((finding, index) => (
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          finding.resolved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {finding.resolved ? 'Resolved' : 'Unresolved'}
                        </span>
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