import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ReportForm from './components/forms/ReportForm';
import InspectionsPage from './pages/InspectionsPage.js';
import InspectionFormPage from './components/forms/InspectionFormPage.js';
import InspectionDetailsPage from './pages/InspectionDetailsPage';
import ReportsPage from './pages/ReportsPage';
import TrainingPage from './pages/TrainingPage';

// Navigation removed as per requirements to use top buttons instead

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/report/new" element={<ReportForm />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/inspections/new" element={<InspectionFormPage />} />
            <Route path="/inspections/:id" element={<InspectionDetailsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/training" element={<TrainingPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;