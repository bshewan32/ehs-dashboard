import React from 'react';
import './App.css';
import Dashboard from './Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">EHS Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome to your environmental health and safety dashboard.</p>
      </header>

      <Dashboard />
    </div>
  );
}

export default App;
