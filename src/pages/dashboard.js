import React from 'react';
import MetricsOverview from '../components/Dashboard/MetricsOverview';
import AIPanel from '../components/Dashboard/AIPanel';

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">EHS Executive Dashboard</h1>
      <MetricsOverview />
      <AIPanel />
    </div>
  );
};

export default Dashboard;