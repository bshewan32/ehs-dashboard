import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchInspections } from '../components/services/api';

export default function InspectionsPage() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getInspections = async () => {
      try {
        setLoading(true);
        const data = await fetchInspections();
        setInspections(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching inspections:', err);
        setError('Failed to load inspections. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getInspections();
  }, []);

  // Calculate inspection statistics
  const highSeverityCount = inspections.reduce((count, insp) => {
    return count + (insp.findings?.filter(f => f.severity === 'High')?.length || 0);
  }, 0);
  
  const unresolvedFindings = inspections.reduce((count, insp) => {
    return count + (insp.findings?.filter(f => !f.resolved)?.length || 0);
  }, 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inspections</h1>
        <div className="space-x-4">
          <Link to="/">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-xl shadow hover:bg-purple-700">
              Dashboard
            </button>
          </Link>
          <Link to="/reports">
            <button className="bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700">
              Reports
            </button>
          </Link>
          <Link to="/safety-events/new">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700">
              + New Safety Event
            </button>
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Inspections</h3>
          <p className="text-2xl font-bold">{inspections.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">High Severity Findings</h3>
          <p className="text-2xl font-bold text-orange-600">{highSeverityCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Unresolved Findings</h3>
          <p className="text-2xl font-bold text-red-600">{unresolvedFindings}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading inspections...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : inspections.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No inspections found.</p>
          <Link to="/inspections/new">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Create Your First Inspection
            </button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
                <th className="px-6 py-3">Inspector</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Findings</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inspections.map((insp) => (
                <tr key={insp._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{insp.inspector}</td>
                  <td className="px-6 py-4">{new Date(insp.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{insp.location}</td>
                  <td className="px-6 py-4">{insp.type}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-1">
                      {insp.findings.some(f => f.severity === 'High') && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          High
                        </span>
                      )}
                      {insp.findings.some(f => f.severity === 'Medium') && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Medium
                        </span>
                      )}
                      {insp.findings.some(f => f.severity === 'Low') && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Low
                        </span>
                      )}
                      <span className="ml-2">{insp.findings.length} total</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/inspections/${insp._id}`} className="text-blue-600 hover:text-blue-900">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}