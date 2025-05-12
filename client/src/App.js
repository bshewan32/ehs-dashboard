import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ReportForm from './components/forms/ReportForm';
import InspectionsPage from './pages/InspectionsPage';
import InspectionForm from './components/forms/InspectionFormPage'
import ReportsPage from './pages/ReportsPage';
import TrainingPage from './pages/TrainingPage';


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">EHS Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome to your environmental health and safety dashboard.</p>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/report/new" element={<ReportForm />} />
          <Route path="/inspections" element={<InspectionsPage />} />
          <Route path="/inspections/new" element={<InspectionForm />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/training" element={<TrainingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;