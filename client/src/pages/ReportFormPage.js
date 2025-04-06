import React from 'react';
import ReportForm from '../components/forms/ReportForm';

export default function ReportFormPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Create New Monthly Report</h1>
        <ReportForm />
      </div>
    </div>
  );
}
