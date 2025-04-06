import React, { useEffect, useState } from 'react';

export default function InspectionsPage() {
  const [inspections, setInspections] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/inspections`)
      .then(res => res.json())
      .then(data => setInspections(data))
      .catch(err => console.error('Error fetching inspections:', err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Inspections</h1>
      {inspections.length === 0 ? (
        <p className="text-gray-500">No inspections found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
                <th className="px-4 py-2">Inspector</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Findings</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((insp) => (
                <tr key={insp._id} className="border-t text-sm text-gray-800">
                  <td className="px-4 py-2">{insp.inspector}</td>
                  <td className="px-4 py-2">{new Date(insp.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{insp.location}</td>
                  <td className="px-4 py-2">{insp.type}</td>
                  <td className="px-4 py-2">{insp.findings.length} issue(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
