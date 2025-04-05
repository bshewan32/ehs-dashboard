import React from 'react';

export default function Dashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
      {/* Metrics Summary */}
      <section className="col-span-1 lg:col-span-3 bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-2">Metrics Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-100 p-4 rounded-xl">Incidents</div>
          <div className="bg-green-100 p-4 rounded-xl">Near Misses</div>
          <div className="bg-yellow-100 p-4 rounded-xl">First Aids</div>
          <div className="bg-red-100 p-4 rounded-xl">Medical Treatments</div>
          <div className="bg-purple-100 p-4 rounded-xl">Training %</div>
          <div className="bg-pink-100 p-4 rounded-xl">Risk Score</div>
        </div>
      </section>

      {/* KPI Section */}
      <section className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-2">Key Performance Indicators</h2>
        <ul className="space-y-2">
          <li>Near Miss Reporting Rate</li>
          <li>Critical Risk Verification</li>
          <li>Electrical Safety Compliance</li>
        </ul>
      </section>

      {/* Trends Section */}
      <section className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-2">Trends & Graphs</h2>
        <div className="text-gray-500">[Charts will go here]</div>
      </section>

      {/* Recommendations Section */}
      <section className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-2">AI Recommendations</h2>
        <p className="text-gray-600">We noticed a spike in electrical incidents. Consider targeted training or audits.</p>
      </section>
    </div>
  );
}
