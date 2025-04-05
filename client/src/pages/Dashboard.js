import React from 'react';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import AIPanel from '../components/dashboard/AIPanel';
import KPIOverview from '../components/dashboard/KPIOverview';

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">EHS Executive Dashboard</h1>

      {/* KPI Metrics and Lagging/Leading Overview */}
      <MetricsOverview />

      {/* KPI Overview (Custom KPIs, Critical Risk Verifications, etc) */}
      <KPIOverview />

      {/* AI-Driven Safety Recommendations */}
      <AIPanel />
    </div>
  );
};

export default Dashboard;