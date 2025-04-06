import React, { useEffect, useState } from 'react';
import { fetchReports } from '../../services/api';

const MetricsOverview = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const getMetrics = async () => {
      try {
        const reports = await fetchReports();
        const mostRecent = reports[reports.length - 1]; // latest report
        setMetrics(mostRecent?.metrics || {});
      } catch (err) {
        console.error('Error loading metrics:', err);
      }
    };

    getMetrics();
  }, []);

  if (!metrics) return <div>Loading metrics...</div>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Lagging & Leading Indicators</h2>
      <div className="grid grid-cols-2 gap-4">
        <div><strong>Incidents:</strong> {metrics.lagging?.incidentCount ?? '-'}</div>
        <div><strong>Near Misses:</strong> {metrics.lagging?.nearMissCount ?? '-'}</div>
        <div><strong>First Aid Cases:</strong> {metrics.lagging?.firstAidCount ?? '-'}</div>
        <div><strong>Medical Treatments:</strong> {metrics.lagging?.medicalTreatmentCount ?? '-'}</div>
        <div><strong>Training Completed:</strong> {metrics.leading?.trainingCompleted ?? '-'}</div>
        <div><strong>Inspections Completed:</strong> {metrics.leading?.inspectionsCompleted ?? '-'}</div>
      </div>
    </div>
  );
};

export default MetricsOverview;