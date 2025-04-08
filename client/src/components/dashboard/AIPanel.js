import React, { useEffect, useState, useCallback } from 'react';

const AIPanel = ({ metrics }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Memoized function to generate recommendations based on metrics
  const generateRecommendations = useCallback(() => {
    if (!metrics && initialized) return; // Don't regenerate if no new metrics and already initialized
    
    try {
      let incidentCount = 0;
      let nearMissCount = 0;
      let medicalTreatmentCount = 0;
      let trainingCompliance = 0;

      // Extract metrics from props if available
      if (metrics) {
        incidentCount = metrics.lagging?.incidentCount ?? metrics.totalIncidents ?? 0;
        nearMissCount = metrics.lagging?.nearMissCount ?? metrics.totalNearMisses ?? 0;
        medicalTreatmentCount = metrics.lagging?.medicalTreatmentCount ?? metrics.medicalTreatmentCount ?? 0;
        trainingCompliance = metrics.trainingCompliance ?? 0;
      }

      const recs = [];

      // Generate recommendations based on metrics
      if (incidentCount > 5) {
        recs.push("High number of incidents detected. Consider reviewing recent risk assessments and implementing additional safety measures.");
      }
      
      if (nearMissCount < 5) {
        recs.push("Low near miss reporting detected. This could indicate underreporting. Consider reinforcing the importance of reporting minor events.");
      }
      
      if (medicalTreatmentCount > 0) {
        recs.push("Medical treatments reported. Ensure all incidents have been properly investigated and corrective actions implemented.");
      }
      
      if (trainingCompliance < 90 && trainingCompliance > 0) {
        recs.push(`Training compliance is at ${trainingCompliance}%. Consider ways to increase participation in safety training programs.`);
      }
      
      if (incidentCount === 0 && nearMissCount === 0) {
        recs.push("No reported incidents or near misses. Consider conducting an audit to validate reporting accuracy.");
      }

      if (recs.length === 0) {
        recs.push("No significant safety concerns detected. Maintain current safety protocols and continue monitoring trends.");
      }

      setRecommendations(recs);
      setInitialized(true);
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setRecommendations(["Unable to generate recommendations at this time."]);
      setInitialized(true);
    }
  }, [metrics, initialized]);

  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  return (
    <div className="p-4 bg-white rounded shadow border-l-4 border-blue-500">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        AI Safety Recommendations
      </h2>
      
      {!initialized ? (
        <p className="text-gray-500 italic">Generating recommendations...</p>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-3 flex-shrink-0">
                {index + 1}
              </span>
              <span className="text-gray-700">{rec}</span>
            </li>
          ))}
        </ul>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        Recommendations are generated based on current safety metrics and industry best practices.
      </div>
    </div>
  );
};

export default AIPanel;