import React, { useEffect, useState } from 'react';
const api_url = process.env.REACT_APP_API_URL;

export default function ReportsPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch(`${api_url}/api/reports`);
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    }

    fetchReports();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Reports</h2>
      {reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border">Company</th>
                <th className="px-4 py-2 border">Period</th>
                <th className="px-4 py-2 border">Type</th>
                <th className="px-4 py-2 border">Incidents</th>
                <th className="px-4 py-2 border">Near Misses</th>
                <th className="px-4 py-2 border">First Aids</th>
                <th className="px-4 py-2 border">Medical Treatments</th>
                <th className="px-4 py-2 border">Training Compliance (%)</th>
                <th className="px-4 py-2 border">Avg Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report._id} className="border-t">
                  <td className="px-4 py-2 border">{report.companyName}</td>
                  <td className="px-4 py-2 border">{report.reportPeriod}</td>
                  <td className="px-4 py-2 border">{report.reportType}</td>
                  <td className="px-4 py-2 border">{report.metrics?.totalIncidents ?? report.metrics?.lagging?.incidentCount ?? 0}</td>
                  <td className="px-4 py-2 border">{report.metrics?.totalNearMisses ?? report.metrics?.lagging?.nearMissCount ?? 0}</td>
                  <td className="px-4 py-2 border">{report.metrics?.firstAidCount ?? 0}</td>
                  <td className="px-4 py-2 border">{report.metrics?.medicalTreatmentCount ?? 0}</td>
                  <td className="px-4 py-2 border">{report.metrics?.trainingCompliance ?? 0}</td>
                  <td className="px-4 py-2 border">{report.metrics?.riskScore ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
