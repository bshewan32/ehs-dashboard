// client/src/pages/ReportFormPage.js
import React from 'react';
import ReportForm from '../components/forms/ReportForm';
import { Link } from 'react-router-dom';

export default function ReportFormPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Create New Report</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Safety Report Form</h2>
            <p className="text-blue-100 text-sm">Complete all fields to generate a comprehensive safety report</p>
          </div>
          
          <ReportForm />
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This data will be used to visualize safety metrics on your dashboard</p>
        </div>
      </div>
    </div>
  );
}