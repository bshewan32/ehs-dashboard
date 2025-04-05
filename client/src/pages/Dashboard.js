import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reports/metrics/summary`);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    }

    fetchMetrics();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
      {/* Metrics Summary */}
      <section className="col-span-1 lg:col-span-3 bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-2">Metrics Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-100 p-4 rounded-xl">
            <p className="text-sm text-gray-600">Incidents</p>
            <p className="text-2xl font-bold">{metrics?.totalIncidents ?? '—'}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-xl">
            <p className="text-sm text-gray-600">Near Misses</p>
            <p className="text-2xl font-bold">{metrics?.totalNearMisses ?? '—'}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-xl">
            <p className="text-sm text-gray-600">First Aids</p>
            <p className="text-2xl font-bold">{metrics?.firstAidCount ?? '—'}</p>
          </div>
          <div className="bg-red-100 p-4 rounded-xl">
            <p className="text-sm text-gray-600">Medical Treatments</p>
            <p className="text-2xl font-bold">{metrics?.medicalTreatmentCount ?? '—'}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-xl">
            <p className="text-sm text-gray-600">Training %</p>
            <p className="text-2xl font-bold">{metrics?.trainingCompliance ?? '—'}</p>
          </div>
          <div className="bg-pink-100 p-4 rounded-xl">
            <p className="text-sm text-gray-600">Risk Score</p>
            <p className="text-2xl font-bold">{metrics?.riskScore ?? '—'}</p>
          </div>
        </div>
      </section>

      {/* KPI Section */}
      <section className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-2">Key Performance Indicators</h2>
        <ul className="space-y-2">
          {metrics?.kpis?.map((kpi, index) => (
            <li key={index} className="border p-3 rounded-md">
              <p className="text-sm font-semibold">{kpi.name}</p>
              <p className="text-xs text-gray-500">{kpi.description}</p>
              <p className="mt-1 text-sm">
                Actual: <span className="font-medium">{kpi.actual} {kpi.unit}</span> / Target: {kpi.target}
              </p>
            </li>
          )) ?? <li>—</li>}
        </ul>
      </section>

      {/* Trends Section */}
      <section className="bg-white p-6 rounded-2xl shadow lg:col-span-2">
        <h2 className="text-xl font-bold mb-4">Trends</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Incident Trend</p>
            <div className="h-3 bg-gray-200 rounded">
              <div className="h-3 bg-blue-500 rounded" style={{ width: `${metrics?.totalIncidents * 5 ?? 0}px` }}></div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Near Miss Trend</p>
            <div className="h-3 bg-gray-200 rounded">
              <div className="h-3 bg-green-500 rounded" style={{ width: `${metrics?.totalNearMisses * 5 ?? 0}px` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-2">AI Recommendations</h2>
        {metrics?.aiRecommendations && metrics.aiRecommendations.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            {metrics.aiRecommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">Recommendations will appear here based on report trends and insights.</p>
        )}
      </section>
    </div>
  );
}
