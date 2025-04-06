import React, { useState } from 'react';

export default function InspectionForm() {
  const [formData, setFormData] = useState({
    inspector: '',
    date: '',
    location: '',
    type: '',
    findings: [],
    notes: '',
  });

  const [finding, setFinding] = useState({ issue: '', severity: 'Low', resolved: false });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFindingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFinding({ ...finding, [name]: type === 'checkbox' ? checked : value });
  };

  const addFinding = () => {
    setFormData({ ...formData, findings: [...formData.findings, finding] });
    setFinding({ issue: '', severity: 'Low', resolved: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      alert('Inspection submitted successfully');
    } catch (err) {
      console.error('Error submitting inspection:', err);
      alert('Error submitting inspection');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white shadow rounded">
      <h2 className="text-xl font-semibold text-gray-800">New Inspection</h2>
      <input name="inspector" placeholder="Inspector Name" onChange={handleChange} value={formData.inspector} className="w-full p-2 border rounded" />
      <input name="date" type="date" onChange={handleChange} value={formData.date} className="w-full p-2 border rounded" />
      <input name="location" placeholder="Location" onChange={handleChange} value={formData.location} className="w-full p-2 border rounded" />
      <input name="type" placeholder="Inspection Type" onChange={handleChange} value={formData.type} className="w-full p-2 border rounded" />
      
      <div className="border-t pt-4">
        <h3 className="font-semibold">Add Finding</h3>
        <input name="issue" placeholder="Issue" onChange={handleFindingChange} value={finding.issue} className="w-full p-2 border rounded" />
        <select name="severity" onChange={handleFindingChange} value={finding.severity} className="w-full p-2 border rounded mt-2">
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <label className="block mt-2">
          <input type="checkbox" name="resolved" checked={finding.resolved} onChange={handleFindingChange} className="mr-2" />
          Resolved
        </label>
        <button type="button" onClick={addFinding} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Add Finding</button>
      </div>

      <textarea name="notes" placeholder="Notes" onChange={handleChange} value={formData.notes} className="w-full p-2 border rounded" />

      <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Submit Inspection</button>
    </form>
  );
}
