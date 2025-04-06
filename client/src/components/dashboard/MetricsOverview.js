// client/src/components/dashboard/MetricsOverview.js
import React from 'react';

const MetricsOverview = ({ metrics, reports }) => {
  // Use either metrics from props or extract from reports
  const metricsData = metrics || (reports && reports.length > 0 
    ? reports[reports.length - 1]?.metrics || {}
    : {});
  
  if (Object.keys(metricsData).length === 0) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Lagging & Leading Indicators</h2>
        <p className="text-gray-500 italic">No metrics data available.</p>
      </div>
    );
  }

  // Extract lagging and leading metrics
  const lagging = metricsData.lagging || {};
  const leading = metricsData.leading || {};

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Lagging & Leading Indicators</h2>
      <div className="grid grid-cols-2 gap-4">
        <div><strong>Incidents:</strong> {lagging.incidentCount ?? metricsData.totalIncidents ?? '-'}</div>
        <div><strong>Near Misses:</strong> {lagging.nearMissCount ?? metricsData.totalNearMisses ?? '-'}</div>
        <div><strong>First Aid Cases:</strong> {lagging.firstAidCount ?? metricsData.firstAidCount ?? '-'}</div>
        <div><strong>Medical Treatments:</strong> {lagging.medicalTreatmentCount ?? metricsData.medicalTreatmentCount ?? '-'}</div>
        <div><strong>Training Completed:</strong> {leading.trainingCompleted ?? metricsData.trainingCompliance ?? '-'}</div>
        <div><strong>Inspections Completed:</strong> {leading.inspectionsCompleted ?? '-'}</div>
      </div>
    </div>
  );
};

export default MetricsOverview;

// import React, { useEffect, useState } from 'react';
// import { fetchReports } from '../services/api';

// const MetricsOverview = () => {
//   const [metrics, setMetrics] = useState(null);

//   useEffect(() => {
//     const getMetrics = async () => {
//       try {
//         const reports = await fetchReports();
//         const mostRecent = reports[reports.length - 1]; // latest report
//         setMetrics(mostRecent?.metrics || {});
//       } catch (err) {
//         console.error('Error loading metrics:', err);
//       }
//     };

//     getMetrics();
//   }, []);

//   if (!metrics) return <div>Loading metrics...</div>;

//   return (
//     <div className="p-4 bg-white rounded shadow">
//       <h2 className="text-xl font-semibold mb-4">Lagging & Leading Indicators</h2>
//       <div className="grid grid-cols-2 gap-4">
//         <div><strong>Incidents:</strong> {metrics.lagging?.incidentCount ?? '-'}</div>
//         <div><strong>Near Misses:</strong> {metrics.lagging?.nearMissCount ?? '-'}</div>
//         <div><strong>First Aid Cases:</strong> {metrics.lagging?.firstAidCount ?? '-'}</div>
//         <div><strong>Medical Treatments:</strong> {metrics.lagging?.medicalTreatmentCount ?? '-'}</div>
//         <div><strong>Training Completed:</strong> {metrics.leading?.trainingCompleted ?? '-'}</div>
//         <div><strong>Inspections Completed:</strong> {metrics.leading?.inspectionsCompleted ?? '-'}</div>
//       </div>
//     </div>
//   );
// };

// export default MetricsOverview;