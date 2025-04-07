// client/src/components/dashboard/MetricsOverview.js
import React from 'react';

const MetricsOverview = ({ metrics, reports }) => {
  // First try to get data from metrics object
  let lagging = metrics?.lagging || {};
  let leading = metrics?.leading || {};
  
  // If metrics doesn't have the data but reports does, use that
  if ((!lagging || Object.keys(lagging).length === 0) && reports && reports.length > 0) {
    const mostRecent = reports[reports.length - 1];
    lagging = mostRecent?.metrics?.lagging || {};
  }
  
  if ((!leading || Object.keys(leading).length === 0) && reports && reports.length > 0) {
    const mostRecent = reports[reports.length - 1];
    leading = mostRecent?.metrics?.leading || {};
  }
  
  // Also check for legacy structure
  const totalIncidents = metrics?.totalIncidents;
  const totalNearMisses = metrics?.totalNearMisses;
  const firstAidCount = metrics?.firstAidCount;
  const medicalTreatmentCount = metrics?.medicalTreatmentCount;
  
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Lagging & Leading Indicators</h2>
      <div className="grid grid-cols-2 gap-4">
        <div><strong>Incidents:</strong> {lagging.incidentCount ?? totalIncidents ?? '-'}</div>
        <div><strong>Near Misses:</strong> {lagging.nearMissCount ?? totalNearMisses ?? '-'}</div>
        <div><strong>First Aid Cases:</strong> {lagging.firstAidCount ?? firstAidCount ?? '-'}</div>
        <div><strong>Medical Treatments:</strong> {lagging.medicalTreatmentCount ?? medicalTreatmentCount ?? '-'}</div>
        <div><strong>Training Completed:</strong> {leading.trainingCompleted ?? '-'}</div>
        <div><strong>Inspections Completed:</strong> {leading.inspectionsCompleted ?? '-'}</div>
      </div>
    </div>
  );
};

export default MetricsOverview;