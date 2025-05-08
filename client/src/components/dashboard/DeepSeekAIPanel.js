import React, { useEffect, useState, useCallback } from 'react';

const DeepSeekAIPanel = ({ metrics, selectedPeriod, companyName }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState(null);
  const [lastMetricsHash, setLastMetricsHash] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Function to create a hash of metrics to detect changes
  const hashMetrics = useCallback((metricsData) => {
    if (!metricsData) return 'no-metrics';
    
    try {
      // Extract key metrics that would affect recommendations
      const keyMetrics = {
        incidents: metricsData.lagging?.incidentCount || metricsData.totalIncidents || 0,
        nearMisses: metricsData.lagging?.nearMissCount || metricsData.totalNearMisses || 0,
        firstAid: metricsData.lagging?.firstAidCount || metricsData.firstAidCount || 0,
        medicalTreatment: metricsData.lagging?.medicalTreatmentCount || metricsData.medicalTreatmentCount || 0,
        trainingCompliance: metricsData.trainingCompliance || 0,
        riskScore: metricsData.riskScore || 0,
        period: selectedPeriod || 'all',
        company: companyName || 'All Companies'
      };
      
      // Include KPI data if available
      if (metricsData.leading?.kpis && metricsData.leading.kpis.length > 0) {
        keyMetrics.kpis = metricsData.leading.kpis.map(kpi => ({
          id: kpi.id,
          actual: kpi.actual
        }));
      }
      
      // Create a string representation as the hash
      return JSON.stringify(keyMetrics);
    } catch (err) {
      console.error('Error hashing metrics:', err);
      return `error-${Date.now()}`;
    }
  }, [selectedPeriod, companyName]);


// In your DeepSeekAIPanel.js, update the fetchRecommendationsFromAPI function:

const fetchRecommendationsFromAPI = useCallback(async (metricsData) => {
  try {
    setLoadingRecommendations(true);
    
    // Format the metrics data for the API
    const formattedMetrics = formatMetricsForPrompt(metricsData);
    
    // Get the correct API URL
    const apiUrl = process.env.REACT_APP_API_URL || '';
    
    // Call DeepSeek API
    console.log('Sending request to DeepSeek API endpoint');
    const response = await fetch(`${apiUrl}/api/ai/deepseek`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: formattedMetrics,
        companyName: companyName || 'All Companies',
        period: selectedPeriod || 'All Time'
      })
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('DeepSeek API response:', data);
    
    if (data.recommendations && Array.isArray(data.recommendations)) {
      return data.recommendations;
    } else if (data.error) {
      console.warn('API returned error:', data.error);
      // If the API returned recommendations despite the error, use those
      if (data.recommendations && Array.isArray(data.recommendations)) {
        return data.recommendations;
      }
      throw new Error(data.error);
    } else {
      return generateFallbackRecommendations(metricsData);
    }
  } catch (err) {
    console.error('Error calling DeepSeek API:', err);
    throw err; // Rethrow to be handled by caller
  } finally {
    setLoadingRecommendations(false);
  }
}, [companyName, selectedPeriod]);

  // Format metrics for API prompt
  const formatMetricsForPrompt = (metrics) => {
    if (!metrics) return {};
    
    // Create a simplified metrics object for the API
    return {
      incidents: metrics.lagging?.incidentCount || metrics.totalIncidents || 0,
      nearMisses: metrics.lagging?.nearMissCount || metrics.totalNearMisses || 0,
      firstAid: metrics.lagging?.firstAidCount || metrics.firstAidCount || 0,
      medicalTreatment: metrics.lagging?.medicalTreatmentCount || metrics.medicalTreatmentCount || 0,
      trainingCompliance: metrics.trainingCompliance || 0,
      riskScore: metrics.riskScore || 0,
      kpis: metrics.leading?.kpis || []
    };
  };

  // Replace the current generateFallbackRecommendations function with this improved version

// Generate fallback recommendations if API call fails
const generateFallbackRecommendations = (metrics) => {
  if (!metrics) return [];
  
  const recommendations = [];
  const companyContext = companyName ? ` for ${companyName}` : '';
  const periodContext = selectedPeriod ? ` during the ${selectedPeriod} period` : '';
  
  // Extract metrics data with proper fallbacks
  const incidentCount = metrics.lagging?.incidentCount || metrics.totalIncidents || 0;
  const nearMissCount = metrics.lagging?.nearMissCount || metrics.totalNearMisses || 0;
  const firstAidCount = metrics.lagging?.firstAidCount || metrics.firstAidCount || 0;
  const medicalTreatmentCount = metrics.lagging?.medicalTreatmentCount || metrics.medicalTreatmentCount || 0;
  const trainingCompliance = metrics.trainingCompliance || 0;
  const riskScore = metrics.riskScore || 0;
  
  // Get KPI values if available
  const kpis = metrics.leading?.kpis || [];
  const nearMissRate = kpis.find(k => k.id === 'nearMissRate')?.actual || 0;
  const criticalRiskVerification = kpis.find(k => k.id === 'criticalRiskVerification')?.actual || 0;
  const electricalSafetyCompliance = kpis.find(k => k.id === 'electricalSafetyCompliance')?.actual || 0;
  
  // Generate recommendations based on metrics
  if (incidentCount > 5) {
    recommendations.push(`The high number of incidents${companyContext}${periodContext} (${incidentCount}) suggests potential systemic issues in risk controls. Consider conducting a comprehensive risk assessment focusing on areas with recurring incidents, and implement targeted control measures to address the root causes. Prioritize high-risk areas identified in previous reports to allocate resources effectively.`);
  }
  
  // Recommendation based on near misses
  if (nearMissCount < 3) {
    recommendations.push(`The low near miss reporting${companyContext}${periodContext} (${nearMissCount}) may indicate underreporting of safety concerns. Develop a positive safety culture by implementing a non-punitive reporting system and regularly emphasizing the importance of near miss reporting as a preventive measure. Consider introducing a simplified reporting process through mobile applications or QR codes to make reporting more accessible.`);
  } else if (nearMissCount > 15) {
    recommendations.push(`While the high number of near misses${companyContext}${periodContext} (${nearMissCount}) demonstrates good reporting culture, it may indicate underlying hazards that require attention. Analyze the near miss data to identify patterns and implement preventive controls. Create a categorization system for near misses based on potential severity to prioritize follow-up actions appropriately.`);
  }
  
  // Training compliance recommendation
  if (trainingCompliance < 80) {
    recommendations.push(`Training compliance${companyContext} is below target at ${trainingCompliance}%. Inadequate training is often a contributing factor in workplace incidents. Identify barriers to training completion and consider implementing a more accessible training program or dedicated time allocations for safety training. Develop role-specific training matrices to ensure all employees receive training relevant to their specific job hazards.`);
  }
  
  // First aid and medical treatment recommendation
  if (firstAidCount > 0 || medicalTreatmentCount > 0) {
    recommendations.push(`The presence of ${firstAidCount} first aid ${firstAidCount === 1 ? 'case' : 'cases'} and ${medicalTreatmentCount} medical ${medicalTreatmentCount === 1 ? 'treatment' : 'treatments'}${companyContext}${periodContext} indicates opportunities for injury prevention. Conduct a detailed analysis of these incidents to identify common causes and implement targeted prevention strategies. Consider ergonomic assessments in areas with repetitive strain injuries and review personal protective equipment requirements for tasks associated with cuts or abrasions.`);
  }
  
  // KPI-based recommendations
  if (criticalRiskVerification < 90) {
    recommendations.push(`Critical Risk Control Verification${companyContext} is at ${criticalRiskVerification}%, below the target of 95%. Critical controls for high-consequence hazards should be prioritized to prevent serious injuries or fatalities. Implement a verification program that includes management reviews, scheduled inspections, and spot checks to ensure critical controls remain effective. Focus particularly on life-saving controls such as energy isolation, working at heights protections, and machine guarding.`);
  }
  
  if (electricalSafetyCompliance < 95) {
    recommendations.push(`Electrical Safety Compliance${companyContext} is at ${electricalSafetyCompliance}%, which requires immediate attention given the high-risk nature of electrical hazards. Conduct a thorough review of electrical safety procedures, ensure proper lockout/tagout implementation, and verify that all electrical work is performed by qualified personnel. Consider implementing an electrical safety audit program with specialized checklists to target common electrical hazards.`);
  }
  
  // Risk score recommendation
  if (riskScore > 50) {
    recommendations.push(`The elevated risk score of ${riskScore}${companyContext} suggests a need for more robust risk management. Implement a formal risk register that tracks identified hazards, associated controls, and verification activities. Prioritize resources based on risk levels and ensure regular review of high-risk activities. Consider adopting a bow-tie analysis method for critical risks to visualize prevention and mitigation measures more effectively.`);
  }
  
  // If no incidents/near misses
  if (incidentCount === 0 && nearMissCount === 0) {
    recommendations.push(`The absence of reported incidents and near misses${companyContext}${periodContext} may indicate excellent safety performance, but could also suggest reporting gaps. Conduct an audit to validate reporting processes and consider implementing positive incentives for safety observation reporting to ensure all safety concerns are captured. Benchmark your reporting rates against industry standards to evaluate reporting effectiveness.`);
  }
  
  // Add default recommendation if no specific ones were generated
  if (recommendations.length === 0) {
    recommendations.push(`Based on the current metrics${companyContext}${periodContext}, no significant safety concerns are identified. However, to drive continuous improvement, consider conducting regular safety perception surveys to identify potential safety culture gaps not captured in quantitative metrics. Implementing leading indicators such as percent of required inspections completed and management safety walks can provide earlier warning signs before incidents occur.`);
  }
  
  // Limit to 3-5 recommendations
  return recommendations.slice(0, Math.min(5, recommendations.length));
};


  // Check local storage for cached recommendations
  const getCachedRecommendations = useCallback((hash) => {
    try {
      const cachedData = localStorage.getItem('aiRecommendations');
      if (!cachedData) return null;
      
      const parsedData = JSON.parse(cachedData);
      if (parsedData.hash !== hash) return null;
      
      // Check if the cache is too old (more than 24 hours)
      const cacheAge = Date.now() - parsedData.timestamp;
      if (cacheAge > 24 * 60 * 60 * 1000) return null;
      
      console.log('Using cached recommendations');
      return parsedData.recommendations;
    } catch (err) {
      console.error('Error retrieving cached recommendations:', err);
      return null;
    }
  }, []);

  // Cache recommendations to localStorage
  const cacheRecommendations = useCallback((hash, recommendations) => {
    try {
      localStorage.setItem('aiRecommendations', JSON.stringify({
        hash,
        recommendations,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Error caching recommendations:', err);
    }
  }, []);

  // Main function to get recommendations
  const getRecommendations = useCallback(async () => {
    if (!metrics) {
      setRecommendations([]);
      return;
    }
    
    try {
      // Create hash of current metrics
      const currentHash = hashMetrics(metrics);
      
      // If metrics haven't changed, use existing recommendations
      if (currentHash === lastMetricsHash && recommendations.length > 0) {
        console.log('Metrics unchanged, using existing recommendations');
        return;
      }
      
      // Check if we need to rate limit the API call (no more than once every 5 minutes)
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      const needsRateLimit = timeSinceLastFetch < 5 * 60 * 1000;
      
      // Check cache first
      const cachedRecommendations = getCachedRecommendations(currentHash);
      if (cachedRecommendations) {
        setRecommendations(cachedRecommendations);
        setLastMetricsHash(currentHash);
        return;
      }
      
      // If we need to rate limit and have existing recommendations, keep using those
      if (needsRateLimit && recommendations.length > 0) {
        console.log('Rate limiting API call, using existing recommendations');
        return;
      }
      
      // Call the API for new recommendations
      console.log('Fetching new recommendations from DeepSeek API');
      const newRecommendations = await fetchRecommendationsFromAPI(metrics);
      
      // Update state
      setRecommendations(newRecommendations);
      setLastMetricsHash(currentHash);
      setLastFetchTime(Date.now());
      setError(null);
      
      // Cache the new recommendations
      cacheRecommendations(currentHash, newRecommendations);
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setError(err.message);
      
      // If we have no recommendations, generate fallbacks
      if (recommendations.length === 0) {
        const fallbackRecs = generateFallbackRecommendations(metrics);
        setRecommendations(fallbackRecs);
      }
    }
  }, [metrics, lastMetricsHash, recommendations, lastFetchTime, hashMetrics, 
      fetchRecommendationsFromAPI, getCachedRecommendations, cacheRecommendations]);

  // Fetch recommendations when metrics or period changes
  useEffect(() => {
    getRecommendations();
  }, [getRecommendations]);

  return (
    <div className="p-4 bg-white rounded shadow border-l-4 border-indigo-500">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        DeepSeek AI Safety Recommendations
      </h2>
      
      {loadingRecommendations ? (
        <div className="animate-pulse space-y-3">
          <div className="flex items-start">
            <div className="h-6 w-6 rounded-full bg-indigo-100 mr-3 flex-shrink-0"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="flex items-start">
            <div className="h-6 w-6 rounded-full bg-indigo-100 mr-3 flex-shrink-0"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="flex items-start">
            <div className="h-6 w-6 rounded-full bg-indigo-100 mr-3 flex-shrink-0"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ) : error ? (
        <div>
          <p className="text-red-600 mb-2">Error loading AI recommendations: {error}</p>
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 mr-3 flex-shrink-0">
                  <span className="text-xs font-medium">{index + 1}</span>
                </span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 mr-3 flex-shrink-0">
                {index + 1}
              </span>
              <span className="text-gray-700">{rec}</span>
            </li>
          ))}
        </ul>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
        <div>
          Recommendations are generated based on safety metrics using DeepSeek AI.
        </div>
        {!loadingRecommendations && (
          <button 
            onClick={() => {
              setLastMetricsHash('');  // Force refresh
              setLastFetchTime(0);
              getRecommendations();
            }}
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        )}
      </div>
    </div>
  );
};

export default DeepSeekAIPanel;