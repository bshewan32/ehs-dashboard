import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ReportForm from './components/forms/ReportForm';
import InspectionsPage from './pages/InspectionsPage';
import InspectionFormPage from './pages/InspectionFormPage';
import InspectionDetailsPage from './pages/InspectionDetailsPage';
import ReportsPage from './pages/ReportsPage';
import Navigation from './components/layout/Navigation.js';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/report/new" element={<ReportForm />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/inspections/new" element={<InspectionFormPage />} />
            <Route path="/inspections/:id" element={<InspectionDetailsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;