

import React, { useState } from 'react';

export default function ReportForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    reportPeriod: '',
    reportType: 'Monthly',
    totalIncidents: 0,
    totalNearMisses: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      companyName: formData.companyName,
      reportPeriod: formData.reportPeriod,
      reportType: formData.reportType,
      metrics: {
        totalIncidents: parseInt(formData.totalIncidents),
        totalNearMisses: parseInt(formData.totalNearMisses),
      },
    };

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Submission failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow max-w-xl mx-auto mt-6">
      <h2 className="text-xl font-bold">Submit New Report</h2>
      <div>
        <label className="block text-sm font-medium">Company Name</label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Report Period</label>
        <input
          type="text"
          name="reportPeriod"
          value={formData.reportPeriod}
          onChange={handleChange}
          placeholder="e.g. Q1 2025"
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Total Incidents</label>
        <input
          type="number"
          name="totalIncidents"
          value={formData.totalIncidents}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Total Near Misses</label>
        <input
          type="number"
          name="totalNearMisses"
          value={formData.totalNearMisses}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Submit Report
      </button>
    </form>
  );
}