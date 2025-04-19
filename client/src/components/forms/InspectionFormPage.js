import React from 'react';
import { Link } from 'react-router-dom';
import InspectionForm from '../components/forms/InspectionForm';

export default function InspectionFormPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Create New Inspection</h1>
          <Link to="/inspections" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Inspections
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-green-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Safety Inspection Form</h2>
            <p className="text-green-100 text-sm">Record safety inspections and their findings</p>
          </div>
          
          <InspectionForm />
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Safety inspections help identify hazards before they cause incidents</p>
        </div>
      </div>
    </div>
  );
}