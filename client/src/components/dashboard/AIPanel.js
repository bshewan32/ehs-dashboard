import React, { useEffect, useState, useCallback } from 'react';

const AIPanel = ({ metrics }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [lastMetricsHash, setLastMetricsHash] = useState('');
  
  // Function to create a simple hash of metrics (removed riskScore)
  const hashMetrics = useCallback((metricsData) => {
    if (!metricsData) return '';
    const keyMetrics = {
      incidents: metricsData.lagging?.incidentCount || 0,
      nearMisses: metricsData.lagging?.nearMissCount || 0,
      firstAid: metricsData.lagging?.firstAidCount || 0,
      medicalTreatment: metricsData.lagging?.medicalTreatmentCount || 0,
      trainingCompliance: metricsData.trainingCompliance || 0
    };
    return JSON.stringify(keyMetrics);
  }, []);

  // Memoized function to generate recommendations based on metrics
  const generateRecommendations = useCallback(() => {
    if (!metrics) return; // Nothing to do without metrics
    
    try {
      // Create hash of current metrics for comparison
      const currentHash = hashMetrics(metrics);
      
      // Check if we have stored recommendations
      const storedData = localStorage.getItem('aiRecommendations');
      if (storedData) {
        const { hash, recommendations: storedRecs } = JSON.parse(storedData);
        
        // If hash matches, use stored recommendations
        if (hash === currentHash) {
          console.log('Using stored AI recommendations');
          setRecommendations(storedRecs);
          setLastMetricsHash(currentHash);
          setInitialized(true);
          return;
        }
      }
      
      // Only generate new recommendations if metrics have changed
      if (currentHash !== lastMetricsHash || !initialized) {
        console.log('Generating new AI recommendations');
        
        // Extract metrics from props (removed riskScore)
        const incidentCount = metrics.lagging?.incidentCount ?? metrics.totalIncidents ?? 0;
        const nearMissCount = metrics.lagging?.nearMissCount ?? metrics.totalNearMisses ?? 0;
        const firstAidCount = metrics.lagging?.firstAidCount ?? metrics.firstAidCount ?? 0;
        const medicalTreatmentCount = metrics.lagging?.medicalTreatmentCount ?? metrics.medicalTreatmentCount ?? 0;
        const trainingCompliance = metrics.trainingCompliance ?? 0;

        const recs = [];

        // Generate recommendations based on metrics
        if (incidentCount > 3) {
          recs.push(`With ${incidentCount} incidents reported, consider conducting a comprehensive incident analysis to identify common root causes and implement targeted preventive measures.`);
        }
        
        if (nearMissCount < 3 && incidentCount > 0) {
          recs.push("The ratio of near miss reports to incidents suggests potential underreporting. Encourage a positive safety culture where near miss reporting is viewed as proactive safety management.");
        }
        
        if (nearMissCount > 10) {
          recs.push(`${nearMissCount} near misses reported indicates good safety awareness. Analyze trends to identify systemic issues and prevent escalation to actual incidents.`);
        }
        
        if (medicalTreatmentCount > 0) {
          recs.push(`${medicalTreatmentCount} medical treatment cases reported. Ensure comprehensive incident investigations are completed and corrective actions are implemented to prevent recurrence.`);
        }
        
        if (firstAidCount > medicalTreatmentCount * 2 && firstAidCount > 0) {
          recs.push("High ratio of first aid cases to medical treatments suggests effective early intervention. Continue promoting immediate care protocols.");
        }
        
        if (trainingCompliance < 85 && trainingCompliance > 0) {
          recs.push(`Training compliance at ${trainingCompliance}% is below optimal levels. Identify barriers to training completion and implement strategies to improve participation.`);
        }
        
        if (trainingCompliance >= 95) {
          recs.push(`Excellent training compliance at ${trainingCompliance}%. Consider implementing advanced safety training modules to further enhance safety culture.`);
        }
        
        if (incidentCount === 0 && nearMissCount === 0 && firstAidCount === 0) {
          recs.push("No safety events reported this period. While this may indicate good safety performance, verify that reporting systems are functioning effectively and employees feel comfortable reporting issues.");
        }
        
        // Calculate total safety events for additional insights
        const totalEvents = incidentCount + nearMissCount + firstAidCount + medicalTreatmentCount;
        
        if (totalEvents > 15) {
          recs.push("High volume of safety events indicates active reporting culture. Focus on trend analysis to identify patterns and implement systematic improvements.");
        }

        // Ensure we always have at least one recommendation
        if (recs.length === 0) {
          recs.push("Current safety metrics appear stable. Continue monitoring trends and maintain proactive safety management practices.");
        }

        // Store recommendations with hash
        localStorage.setItem('aiRecommendations', JSON.stringify({
          hash: currentHash,
          recommendations: recs,
          timestamp: Date.now()
        }));
        
        // Update state
        setRecommendations(recs);
        setLastMetricsHash(currentHash);
        setInitialized(true);
      }
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setRecommendations(["Unable to generate recommendations at this time."]);
      setInitialized(true);
    }
  }, [metrics, lastMetricsHash, initialized, hashMetrics]);

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
        <div className="flex items-center space-x-2 text-gray-500">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="italic">Analyzing safety metrics...</span>
        </div>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mr-3 flex-shrink-0">
                {index + 1}
              </span>
              <span className="text-gray-700 leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Recommendations are generated based on current safety metrics and industry best practices.
      </div>
    </div>
  );
};

export default AIPanel;