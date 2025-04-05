import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">EHS Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome to your environmental health and safety dashboard.</p>
      </header>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-700">This is where your dashboard content will appear.</p>
      </div>
    </div>
  );
}

export default App;
