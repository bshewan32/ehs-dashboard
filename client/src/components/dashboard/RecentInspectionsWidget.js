import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchInspections } from '../services/api';

const RecentInspectionsWidget = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getRecentInspections = async () => {
      try {
        setLoading(true);
        const data = await fetchInspections();
        // Get only the 5 most recent inspections
        setInspections(data.slice(0, 5));
        setError(null);
      } catch (err) {
        console.error('Error fetching recent inspections:', err);
        setError('Could not load recent inspections');
      } finally {
        setLoading(false);
      }
    };

    getRecentInspections();
  }, []);

  // Calculate statistics
  const unresolvedFindings = inspections.reduce((total, insp) => {
    return total + (insp.findings?.filter(f => !f.resolved)?.length || 0);
  }, 0);

  const highSeverityCount = inspections.reduce((total, insp) => {
    return total + (insp.findings?.filter(f => f.severity === 'High')?.length || 0);
  }, 0);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Recent Inspections</h3>
        <Link to="/inspections" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="px-4 py-5 sm:p-6 text-center">
          <p className="text-gray-500">Loading inspections...</p>
        </div>
      ) : error ? (
        <div className="px-4 py-5 sm:p-6 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : inspections.length === 0 ? (
        <div className="px-4 py-5 sm:p-6 text-center">
          <p className="text-gray-500 mb-4">No inspections found</p>
          <Link to="/inspections/new">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              Create First Inspection
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-px bg-gray-200">
            <div className="bg-white px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500">Unresolved Findings</dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">{unresolvedFindings}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500">High Severity Issues</dt>
              <dd className="mt-1 text-3xl font-semibold text-orange-500">{highSeverityCount}</dd>
            </div>
          </div>

          <div className="border-t border-gray-200">
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                {inspections.map((inspection) => (
                  <li key={inspection._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <Link to={`/inspections/${inspection._id}`} className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {inspection.type} at {inspection.location}
                        </p>
                        <p className="text-sm text-gray-500">
                          By {inspection.inspector} on {new Date(inspection.date).toLocaleDateString()}
                        </p>
                        <div className="flex mt-1">
                          <span 
                            className={`inline-flex items-center mr-2 px-2 py-0.5 rounded text-xs font-medium 
                              ${inspection.findings.some(f => f.severity === 'High') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                          >
                            {inspection.findings.length} {inspection.findings.length === 1 ? 'finding' : 'findings'}
                          </span>
                          {inspection.findings.filter(f => !f.resolved).length > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              {inspection.findings.filter(f => !f.resolved).length} unresolved
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-gray-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RecentInspectionsWidget;