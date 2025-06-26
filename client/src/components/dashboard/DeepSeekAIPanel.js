import React, { useEffect, useState, useCallback } from 'react';

const DeepSeekAIPanel = ({ metrics, selectedPeriod, companyName }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState(null);
  const [lastMetricsHash, setLastMetricsHash] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [forceRefresh, setForceRefresh] = useState(false);

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
      
      // Include training data if available
      if (metricsData.trainingData) {
        keyMetrics.trainingData = {
          compliance: metricsData.trainingData.compliance || 0,
          total: metricsData.trainingData.stats?.total || 0,
          completed: metricsData.trainingData.stats?.completed || 0,
          expired: metricsData.trainingData.stats?.expired || 0,
          upcoming: metricsData.trainingData.stats?.upcoming || 0
        };
      }
      
      // Include KPI data if available - ensure we capture all meaningful data
      if (metricsData.leading?.kpis && metricsData.leading.kpis.length > 0) {
        keyMetrics.kpis = metricsData.leading.kpis.map(kpi => ({
          id: kpi.id || 'unknown',
          name: kpi.name || 'Unknown KPI',
          actual: kpi.actual || 0,
          target: kpi.target || 0,
          unit: kpi.unit || ''
        }));
      } else {
        keyMetrics.kpis = [];
      }
      
      // Create a string representation as the hash
      const hashString = JSON.stringify(keyMetrics, Object.keys(keyMetrics).sort());
      console.log('DeepSeek: Generated hash for metrics:', hashString.substring(0, 100) + '...');
      return hashString;
    } catch (err) {
      console.error('Error hashing metrics:', err);
      return `error-${Date.now()}`;
    }
  }, [selectedPeriod, companyName]);

  // Fetch recommendations from API
  const fetchRecommendationsFromAPI = useCallback(async (metricsData) => {
    try {
      setLoadingRecommendations(true);
      console.log('DeepSeek: Fetching recommendations from API...');
      
      // Format the metrics data for the API
      const formattedMetrics = formatMetricsForPrompt(metricsData);
      
      // Get the correct API URL
      const apiUrl = process.env.REACT_APP_API_URL || '';
      
      // Call DeepSeek API
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
        console.error(`DeepSeek API error: ${response.status}`);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('DeepSeek API response received:', data);
      
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
        console.log('DeepSeek: API response invalid, using fallback');
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
    const formattedMetrics = {
      incidents: metrics.lagging?.incidentCount || metrics.totalIncidents || 0,
      nearMisses: metrics.lagging?.nearMissCount || metrics.totalNearMisses || 0,
      firstAid: metrics.lagging?.firstAidCount || metrics.firstAidCount || 0,
      medicalTreatment: metrics.lagging?.medicalTreatmentCount || metrics.medicalTreatmentCount || 0,
      trainingCompliance: metrics.trainingCompliance || 0,
      riskScore: metrics.riskScore || 0,
      kpis: metrics.leading?.kpis || []
    };
    
    // Add training data if available
    if (metrics.trainingData) {
      // Override the general trainingCompliance with the more specific one from trainingData
      formattedMetrics.trainingCompliance = metrics.trainingData.compliance || metrics.trainingCompliance || 0;
      
      // Add detailed training stats
      formattedMetrics.trainingStats = {
        total: metrics.trainingData.stats?.total || 0,
        completed: metrics.trainingData.stats?.completed || 0,
        expired: metrics.trainingData.stats?.expired || 0,
        upcoming: metrics.trainingData.stats?.upcoming || 0
      };
      
      // Add an additional KPI for training compliance if not already present
      if (formattedMetrics.kpis && !formattedMetrics.kpis.find(k => k.id === 'trainingCompliance')) {
        formattedMetrics.kpis.push({
          id: 'trainingCompliance',
          name: 'Training Compliance',
          actual: metrics.trainingData.compliance || 0,
          target: 100,
          unit: '%'
        });
      }
    }
    
    return formattedMetrics;
  };

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
    
    // Get training data with fallbacks
    let trainingCompliance = metrics.trainingCompliance || 0;
    let trainingExpired = 0;
    let trainingUpcoming = 0;
    let trainingTotal = 0;
    
    // Use detailed training data if available
    if (metrics.trainingData) {
      trainingCompliance = metrics.trainingData.compliance || trainingCompliance;
      trainingExpired = metrics.trainingData.stats?.expired || 0;
      trainingUpcoming = metrics.trainingData.stats?.upcoming || 0;
      trainingTotal = metrics.trainingData.stats?.total || 0;
    }
    
    const riskScore = metrics.riskScore || 0;
    
    // Get KPI values if available
    const kpis = metrics.leading?.kpis || [];
    console.log('DeepSeek: Processing KPIs:', kpis);
    
    const nearMissRate = kpis.find(k => k.id === 'nearMissRate')?.actual || 0;
    const criticalRiskVerification = kpis.find(k => k.id === 'criticalRiskVerification')?.actual || 0;
    const electricalSafetyCompliance = kpis.find(k => k.id === 'electricalSafetyCompliance')?.actual || 0;
    
    console.log('DeepSeek: KPI values - Near Miss Rate:', nearMissRate, 'Critical Risk:', criticalRiskVerification, 'Electrical Safety:', electricalSafetyCompliance);
    
    // Generate recommendations based on metrics
    console.log('DeepSeek: Generating recommendations with values:', {
      incidentCount, nearMissCount, firstAidCount, medicalTreatmentCount,
      trainingCompliance, nearMissRate, criticalRiskVerification, electricalSafetyCompliance
    });
    
    // Prioritize KPI-based recommendations since we have actual data
    if (criticalRiskVerification > 0 && criticalRiskVerification < 90) {
      recommendations.push(`Critical Risk Control Verification${companyContext} is at ${criticalRiskVerification}%, below the target of 95%. Critical controls for high-consequence hazards should be prioritized to prevent serious injuries or fatalities. Implement a verification program that includes management reviews, scheduled inspections, and spot checks to ensure critical controls remain effective. Focus particularly on life-saving controls such as energy isolation, working at heights protections, and machine guarding.`);
    } else if (criticalRiskVerification >= 90) {
      recommendations.push(`Critical Risk Control Verification${companyContext} is performing well at ${criticalRiskVerification}%. To maintain this high performance, continue regular verification schedules and consider sharing best practices across other safety areas. Benchmark your verification process to identify opportunities for further improvement toward the 95% target.`);
    }
    
    if (electricalSafetyCompliance > 0 && electricalSafetyCompliance < 95) {
      recommendations.push(`Electrical Safety Compliance${companyContext} is at ${electricalSafetyCompliance}%, which requires immediate attention given the high-risk nature of electrical hazards. Conduct a thorough review of electrical safety procedures, ensure proper lockout/tagout implementation, and verify that all electrical work is performed by qualified personnel. Consider implementing an electrical safety audit program with specialized checklists to target common electrical hazards.`);
    } else if (electricalSafetyCompliance >= 95) {
      recommendations.push(`Electrical Safety Compliance${companyContext} is excellent at ${electricalSafetyCompliance}%. This strong performance in a high-risk area demonstrates effective safety management. Continue current practices and consider mentoring other safety areas to achieve similar high compliance levels.`);
    }
    
    if (nearMissRate > 0 && nearMissRate < 50) {
      recommendations.push(`Near Miss Reporting Rate${companyContext} is at ${nearMissRate}%, indicating significant room for improvement in proactive hazard identification. A higher reporting rate typically correlates with better safety outcomes as it allows for preventive action before incidents occur. Implement initiatives to encourage reporting such as positive recognition programs, simplified reporting processes, and regular communication about the value of near miss reporting.`);
    } else if (nearMissRate >= 50 && nearMissRate < 80) {
      recommendations.push(`Near Miss Reporting Rate${companyContext} is at ${nearMissRate}%, showing good progress but with room for improvement. Continue building the reporting culture by providing feedback on actions taken from reports and ensuring reporters see the value of their contributions. Consider expanding reporting categories to capture more types of precursor events.`);
    } else if (nearMissRate >= 80) {
      recommendations.push(`Near Miss Reporting Rate${companyContext} is strong at ${nearMissRate}%. This excellent reporting culture provides valuable data for preventing incidents. Focus on analyzing trends in the near miss data to identify systemic issues and ensure that all reports receive appropriate follow-up actions.`);
    }
    
    // Only add incident-based recommendations if we don't have strong KPI data or if incidents are significant
    if (incidentCount > 3) {
    // Only add incident-based recommendations if we don't have strong KPI data or if incidents are significant
    if (incidentCount > 3) {
      recommendations.push(`The number of incidents${companyContext}${periodContext} (${incidentCount}) suggests potential issues in risk controls. Consider conducting a comprehensive risk assessment focusing on areas with recurring incidents, and implement targeted control measures to address the root causes. Prioritize high-risk areas identified in previous reports to allocate resources effectively.`);
    } else if (incidentCount > 0 && incidentCount <= 3) {
      recommendations.push(`The ${incidentCount} incident${incidentCount === 1 ? '' : 's'}${companyContext}${periodContext} should be thoroughly investigated to prevent recurrence. Each incident represents an opportunity to strengthen safety systems. Conduct root cause analysis and implement corrective actions, focusing on systemic improvements rather than individual blame.`);
    }
    
    // Recommendation based on near misses - adjust thresholds for better sensitivity
    if (nearMissCount === 0) {
      recommendations.push(`The absence of near miss reports${companyContext}${periodContext} may indicate underreporting of safety concerns or exceptional safety performance. Validate your reporting systems and encourage proactive hazard identification. Consider implementing safety observation programs and regular safety tours to capture potential issues before they become incidents.`);
    } else if (nearMissCount > 0 && nearMissCount < 5) {
      recommendations.push(`The low number of near miss reports${companyContext}${periodContext} (${nearMissCount}) may indicate underreporting. Develop a positive safety culture by implementing a non-punitive reporting system and regularly emphasizing the importance of near miss reporting as a preventive measure. Consider introducing a simplified reporting process through mobile applications or QR codes to make reporting more accessible.`);
    } else if (nearMissCount > 20) {
      recommendations.push(`While the high number of near misses${companyContext}${periodContext} (${nearMissCount}) demonstrates good reporting culture, it may indicate underlying hazards that require attention. Analyze the near miss data to identify patterns and implement preventive controls. Create a categorization system for near misses based on potential severity to prioritize follow-up actions appropriately.`);
    }
    
    // Training compliance recommendation
    if (trainingCompliance < 80) {
      recommendations.push(`Training compliance${companyContext} is below target at ${trainingCompliance.toFixed(1)}%. Inadequate training is often a contributing factor in workplace incidents. Identify barriers to training completion and consider implementing a more accessible training program or dedicated time allocations for safety training. Develop role-specific training matrices to ensure all employees receive training relevant to their specific job hazards.`);
    }
    
    // Add specific training recommendations based on detailed training data
    if (trainingExpired > 0) {
      recommendations.push(`There are ${trainingExpired} expired training certifications${companyContext} that require immediate attention. Expired certifications may create regulatory compliance issues and safety risks. Create a prioritized action plan to update these certifications based on risk level, and develop a better tracking system to ensure renewals are scheduled well before expiration dates. Consider implementing automated reminders at 60, 30, and 15 days before certification expiry.`);
    }
    
    if (trainingUpcoming > 0) {
      recommendations.push(`There are ${trainingUpcoming} training certifications due for renewal soon${companyContext}. Being proactive about upcoming renewals helps maintain consistent compliance levels. Create a structured renewal schedule with specified timeframes for each certification type, and group similar certifications together when possible to optimize training resources and minimize operational disruptions.`);
    }
    
    // First aid and medical treatment recommendation - be more nuanced
    if (firstAidCount === 1 && medicalTreatmentCount === 0) {
      recommendations.push(`The single first aid case${companyContext}${periodContext} should be investigated to understand the circumstances and prevent similar occurrences. While one incident may seem minor, it represents an opportunity to strengthen preventive measures. Review the specific hazards that led to this incident and assess whether additional controls or training are needed.`);
    } else if (firstAidCount > 1 || medicalTreatmentCount > 0) {
      recommendations.push(`The presence of ${firstAidCount} first aid ${firstAidCount === 1 ? 'case' : 'cases'} and ${medicalTreatmentCount} medical ${medicalTreatmentCount === 1 ? 'treatment' : 'treatments'}${companyContext}${periodContext} indicates opportunities for injury prevention. Conduct a detailed analysis of these incidents to identify common causes and implement targeted prevention strategies. Consider ergonomic assessments in areas with repetitive strain injuries and review personal protective equipment requirements for tasks associated with cuts or abrasions.`);
    }
    
    // KPI-based recommendations - removed duplicate since we handle these above
    // These are now handled in the prioritized KPI section above
    
    // Risk score recommendation
    if (riskScore > 50) {
      recommendations.push(`The elevated risk score of ${riskScore}${companyContext} suggests a need for more robust risk management. Implement a formal risk register that tracks identified hazards, associated controls, and verification activities. Prioritize resources based on risk levels and ensure regular review of high-risk activities. Consider adopting a bow-tie analysis method for critical risks to visualize prevention and mitigation measures more effectively.`);
    }
    
    // If no incidents/near misses and good KPI performance
    if (incidentCount === 0 && nearMissCount === 0 && criticalRiskVerification >= 90 && electricalSafetyCompliance >= 95) {
      recommendations.push(`Excellent safety performance${companyContext}${periodContext} with no incidents, no near misses, and strong KPI performance. This demonstrates effective safety management systems. To maintain this excellence, continue current practices, conduct regular management reviews of safety performance, and consider sharing your successful approaches with other locations or departments.`);
    } else if (incidentCount === 0 && nearMissCount === 0) {
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
      
      console.log('DeepSeek: Using cached recommendations');
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
      console.log('DeepSeek: Cached recommendations');
    } catch (err) {
      console.error('Error caching recommendations:', err);
    }
  }, []);

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    console.log('DeepSeek: Manual refresh triggered');
    setForceRefresh(true);
    setLastMetricsHash(''); // Clear hash to force regeneration
    setLastFetchTime(0); // Reset rate limiting
    setError(null); // Clear any existing errors
    
    // Clear cache
    try {
      localStorage.removeItem('aiRecommendations');
      console.log('DeepSeek: Cache cleared');
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }, []);

  // Main function to get recommendations
  const getRecommendations = useCallback(async () => {
    if (!metrics) {
      console.log('DeepSeek: No metrics provided');
      setRecommendations([]);
      return;
    }
    
    try {
      // Create hash of current metrics
      const currentHash = hashMetrics(metrics);
      console.log('DeepSeek: Current hash:', currentHash.substring(0, 50) + '...');
      console.log('DeepSeek: Last hash:', lastMetricsHash.substring(0, 50) + '...');
      
      // If force refresh is not triggered and metrics haven't changed, use existing recommendations
      if (!forceRefresh && currentHash === lastMetricsHash && recommendations.length > 0) {
        console.log('DeepSeek: Metrics unchanged, using existing recommendations');
        return;
      }
      
      // Reset force refresh flag
      setForceRefresh(false);
      
      // Check if we need to rate limit the API call (no more than once every 2 minutes)
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      const needsRateLimit = timeSinceLastFetch < 2 * 60 * 1000;
      
      console.log('DeepSeek: Time since last fetch:', Math.round(timeSinceLastFetch / 1000), 'seconds');
      
      // Check cache first (but not if forced refresh)
      if (!forceRefresh) {
        const cachedRecommendations = getCachedRecommendations(currentHash);
        if (cachedRecommendations) {
          setRecommendations(cachedRecommendations);
          setLastMetricsHash(currentHash);
          return;
        }
      }
      
      // If we need to rate limit and have existing recommendations, try fallback first
      if (needsRateLimit && recommendations.length > 0) {
        console.log('DeepSeek: Rate limiting API call, generating fallback recommendations');
        const fallbackRecs = generateFallbackRecommendations(metrics);
        setRecommendations(fallbackRecs);
        setLastMetricsHash(currentHash);
        cacheRecommendations(currentHash, fallbackRecs);
        return;
      }
      
      // Call the API for new recommendations
      console.log('DeepSeek: Calling API for new recommendations');
      let newRecommendations;
      
      try {
        newRecommendations = await fetchRecommendationsFromAPI(metrics);
      } catch (apiError) {
        console.warn('DeepSeek: API call failed, using fallback recommendations');
        newRecommendations = generateFallbackRecommendations(metrics);
        setError(apiError.message);
      }
      
      // Update state
      setRecommendations(newRecommendations);
      setLastMetricsHash(currentHash);
      setLastFetchTime(Date.now());
      if (!error) setError(null);
      
      // Cache the new recommendations
      cacheRecommendations(currentHash, newRecommendations);
      
      console.log('DeepSeek: Updated recommendations, count:', newRecommendations.length);
    } catch (err) {
      console.error('DeepSeek: Error getting recommendations:', err);
      setError(err.message);
      
      // If we have no recommendations, generate fallbacks
      if (recommendations.length === 0) {
        const fallbackRecs = generateFallbackRecommendations(metrics);
        setRecommendations(fallbackRecs);
      }
    }
  }, [metrics, lastMetricsHash, recommendations, lastFetchTime, forceRefresh, hashMetrics, 
      fetchRecommendationsFromAPI, getCachedRecommendations, cacheRecommendations, error]);

  // Fetch recommendations when metrics, period, or company changes
  useEffect(() => {
    console.log('DeepSeek: useEffect triggered - metrics changed');
    // Add a small delay to ensure all data is loaded
    const timeoutId = setTimeout(() => {
      getRecommendations();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [getRecommendations]);

  return (
    <div className="p-4 bg-white rounded shadow border-l-4 border-indigo-500">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        DeepSeek AI Safety Recommendations
        {companyName && (
          <span className="ml-2 text-sm text-gray-500">for {companyName}</span>
        )}
      </h2>
      
      {loadingRecommendations ? (
        <div className="animate-pulse space-y-3">
          <div className="flex items-center mb-2">
            <svg className="animate-spin h-4 w-4 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-600">Generating AI recommendations...</span>
          </div>
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
      ) : (
        <>
          {error && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <div className="flex items-center text-yellow-800">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                API issue: {error} - Showing fallback recommendations
              </div>
            </div>
          )}
          
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 mr-3 flex-shrink-0 text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700 text-sm leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
        <div>
          Recommendations generated using {error ? 'fallback analysis' : 'DeepSeek AI'} based on safety metrics
          {selectedPeriod && selectedPeriod !== 'current' && (
            <span className="ml-1">for {selectedPeriod} period</span>
          )}
        </div>
        <button 
          onClick={handleManualRefresh}
          disabled={loadingRecommendations}
          className={`text-indigo-600 hover:text-indigo-800 flex items-center transition-colors ${
            loadingRecommendations ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg className={`w-4 h-4 mr-1 ${loadingRecommendations ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loadingRecommendations ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default DeepSeekAIPanel;

// import React, { useEffect, useState, useCallback } from 'react';

// const DeepSeekAIPanel = ({ metrics, selectedPeriod, companyName }) => {
//   const [recommendations, setRecommendations] = useState([]);
//   const [loadingRecommendations, setLoadingRecommendations] = useState(false);
//   const [error, setError] = useState(null);
//   const [lastMetricsHash, setLastMetricsHash] = useState('');
//   const [lastFetchTime, setLastFetchTime] = useState(0);

//   // Function to create a hash of metrics to detect changes
//   const hashMetrics = useCallback((metricsData) => {
//     if (!metricsData) return 'no-metrics';
    
//     try {
//       // Extract key metrics that would affect recommendations
//       const keyMetrics = {
//         incidents: metricsData.lagging?.incidentCount || metricsData.totalIncidents || 0,
//         nearMisses: metricsData.lagging?.nearMissCount || metricsData.totalNearMisses || 0,
//         firstAid: metricsData.lagging?.firstAidCount || metricsData.firstAidCount || 0,
//         medicalTreatment: metricsData.lagging?.medicalTreatmentCount || metricsData.medicalTreatmentCount || 0,
//         trainingCompliance: metricsData.trainingCompliance || 0,
//         riskScore: metricsData.riskScore || 0,
//         period: selectedPeriod || 'all',
//         company: companyName || 'All Companies'
//       };
      
//       // Include training data if available
//       if (metricsData.trainingData) {
//         keyMetrics.trainingData = {
//           compliance: metricsData.trainingData.compliance || 0,
//           total: metricsData.trainingData.stats?.total || 0,
//           completed: metricsData.trainingData.stats?.completed || 0,
//           expired: metricsData.trainingData.stats?.expired || 0,
//           upcoming: metricsData.trainingData.stats?.upcoming || 0
//         };
//       }
      
//       // Include KPI data if available
//       if (metricsData.leading?.kpis && metricsData.leading.kpis.length > 0) {
//         keyMetrics.kpis = metricsData.leading.kpis.map(kpi => ({
//           id: kpi.id,
//           actual: kpi.actual
//         }));
//       }
      
//       // Create a string representation as the hash
//       return JSON.stringify(keyMetrics);
//     } catch (err) {
//       console.error('Error hashing metrics:', err);
//       return `error-${Date.now()}`;
//     }
//   }, [selectedPeriod, companyName]);


// // In your DeepSeekAIPanel.js, update the fetchRecommendationsFromAPI function:

// const fetchRecommendationsFromAPI = useCallback(async (metricsData) => {
//   try {
//     setLoadingRecommendations(true);
    
//     // Format the metrics data for the API
//     const formattedMetrics = formatMetricsForPrompt(metricsData);
    
//     // Get the correct API URL
//     const apiUrl = process.env.REACT_APP_API_URL || '';
    
//     // Call DeepSeek API
//     console.log('Sending request to DeepSeek API endpoint');
//     const response = await fetch(`${apiUrl}/api/ai/deepseek`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         metrics: formattedMetrics,
//         companyName: companyName || 'All Companies',
//         period: selectedPeriod || 'All Time'
//       })
//     });
    
//     if (!response.ok) {
//       console.error(`API error: ${response.status}`);
//       throw new Error(`API error: ${response.status}`);
//     }
    
//     const data = await response.json();
//     console.log('DeepSeek API response:', data);
    
//     if (data.recommendations && Array.isArray(data.recommendations)) {
//       return data.recommendations;
//     } else if (data.error) {
//       console.warn('API returned error:', data.error);
//       // If the API returned recommendations despite the error, use those
//       if (data.recommendations && Array.isArray(data.recommendations)) {
//         return data.recommendations;
//       }
//       throw new Error(data.error);
//     } else {
//       return generateFallbackRecommendations(metricsData);
//     }
//   } catch (err) {
//     console.error('Error calling DeepSeek API:', err);
//     throw err; // Rethrow to be handled by caller
//   } finally {
//     setLoadingRecommendations(false);
//   }
// }, [companyName, selectedPeriod]);

//   // Format metrics for API prompt
//   const formatMetricsForPrompt = (metrics) => {
//     if (!metrics) return {};
    
//     // Create a simplified metrics object for the API
//     const formattedMetrics = {
//       incidents: metrics.lagging?.incidentCount || metrics.totalIncidents || 0,
//       nearMisses: metrics.lagging?.nearMissCount || metrics.totalNearMisses || 0,
//       firstAid: metrics.lagging?.firstAidCount || metrics.firstAidCount || 0,
//       medicalTreatment: metrics.lagging?.medicalTreatmentCount || metrics.medicalTreatmentCount || 0,
//       trainingCompliance: metrics.trainingCompliance || 0,
//       riskScore: metrics.riskScore || 0,
//       kpis: metrics.leading?.kpis || []
//     };
    
//     // Add training data if available
//     if (metrics.trainingData) {
//       // Override the general trainingCompliance with the more specific one from trainingData
//       formattedMetrics.trainingCompliance = metrics.trainingData.compliance || metrics.trainingCompliance || 0;
      
//       // Add detailed training stats
//       formattedMetrics.trainingStats = {
//         total: metrics.trainingData.stats?.total || 0,
//         completed: metrics.trainingData.stats?.completed || 0,
//         expired: metrics.trainingData.stats?.expired || 0,
//         upcoming: metrics.trainingData.stats?.upcoming || 0
//       };
      
//       // Add an additional KPI for training compliance if not already present
//       if (formattedMetrics.kpis && !formattedMetrics.kpis.find(k => k.id === 'trainingCompliance')) {
//         formattedMetrics.kpis.push({
//           id: 'trainingCompliance',
//           name: 'Training Compliance',
//           actual: metrics.trainingData.compliance || 0,
//           target: 100,
//           unit: '%'
//         });
//       }
//     }
    
//     return formattedMetrics;
//   };

//   // Replace the current generateFallbackRecommendations function with this improved version

// // Generate fallback recommendations if API call fails
// const generateFallbackRecommendations = (metrics) => {
//   if (!metrics) return [];
  
//   const recommendations = [];
//   const companyContext = companyName ? ` for ${companyName}` : '';
//   const periodContext = selectedPeriod ? ` during the ${selectedPeriod} period` : '';
  
//   // Extract metrics data with proper fallbacks
//   const incidentCount = metrics.lagging?.incidentCount || metrics.totalIncidents || 0;
//   const nearMissCount = metrics.lagging?.nearMissCount || metrics.totalNearMisses || 0;
//   const firstAidCount = metrics.lagging?.firstAidCount || metrics.firstAidCount || 0;
//   const medicalTreatmentCount = metrics.lagging?.medicalTreatmentCount || metrics.medicalTreatmentCount || 0;
  
//   // Get training data with fallbacks
//   let trainingCompliance = metrics.trainingCompliance || 0;
//   let trainingExpired = 0;
//   let trainingUpcoming = 0;
//   let trainingTotal = 0;
  
//   // Use detailed training data if available
//   if (metrics.trainingData) {
//     trainingCompliance = metrics.trainingData.compliance || trainingCompliance;
//     trainingExpired = metrics.trainingData.stats?.expired || 0;
//     trainingUpcoming = metrics.trainingData.stats?.upcoming || 0;
//     trainingTotal = metrics.trainingData.stats?.total || 0;
//   }
  
//   const riskScore = metrics.riskScore || 0;
  
//   // Get KPI values if available
//   const kpis = metrics.leading?.kpis || [];
//   const nearMissRate = kpis.find(k => k.id === 'nearMissRate')?.actual || 0;
//   const criticalRiskVerification = kpis.find(k => k.id === 'criticalRiskVerification')?.actual || 0;
//   const electricalSafetyCompliance = kpis.find(k => k.id === 'electricalSafetyCompliance')?.actual || 0;
  
//   // Generate recommendations based on metrics
//   if (incidentCount > 5) {
//     recommendations.push(`The high number of incidents${companyContext}${periodContext} (${incidentCount}) suggests potential systemic issues in risk controls. Consider conducting a comprehensive risk assessment focusing on areas with recurring incidents, and implement targeted control measures to address the root causes. Prioritize high-risk areas identified in previous reports to allocate resources effectively.`);
//   }
  
//   // Recommendation based on near misses
//   if (nearMissCount < 3) {
//     recommendations.push(`The low near miss reporting${companyContext}${periodContext} (${nearMissCount}) may indicate underreporting of safety concerns. Develop a positive safety culture by implementing a non-punitive reporting system and regularly emphasizing the importance of near miss reporting as a preventive measure. Consider introducing a simplified reporting process through mobile applications or QR codes to make reporting more accessible.`);
//   } else if (nearMissCount > 15) {
//     recommendations.push(`While the high number of near misses${companyContext}${periodContext} (${nearMissCount}) demonstrates good reporting culture, it may indicate underlying hazards that require attention. Analyze the near miss data to identify patterns and implement preventive controls. Create a categorization system for near misses based on potential severity to prioritize follow-up actions appropriately.`);
//   }
  
//   // Training compliance recommendation
//   if (trainingCompliance < 80) {
//     recommendations.push(`Training compliance${companyContext} is below target at ${trainingCompliance.toFixed(1)}%. Inadequate training is often a contributing factor in workplace incidents. Identify barriers to training completion and consider implementing a more accessible training program or dedicated time allocations for safety training. Develop role-specific training matrices to ensure all employees receive training relevant to their specific job hazards.`);
//   }
  
//   // Add specific training recommendations based on detailed training data
//   if (trainingExpired > 0) {
//     recommendations.push(`There are ${trainingExpired} expired training certifications${companyContext} that require immediate attention. Expired certifications may create regulatory compliance issues and safety risks. Create a prioritized action plan to update these certifications based on risk level, and develop a better tracking system to ensure renewals are scheduled well before expiration dates. Consider implementing automated reminders at 60, 30, and 15 days before certification expiry.`);
//   }
  
//   if (trainingUpcoming > 0) {
//     recommendations.push(`There are ${trainingUpcoming} training certifications due for renewal soon${companyContext}. Being proactive about upcoming renewals helps maintain consistent compliance levels. Create a structured renewal schedule with specified timeframes for each certification type, and group similar certifications together when possible to optimize training resources and minimize operational disruptions.`);
//   }
  
//   // First aid and medical treatment recommendation
//   if (firstAidCount > 0 || medicalTreatmentCount > 0) {
//     recommendations.push(`The presence of ${firstAidCount} first aid ${firstAidCount === 1 ? 'case' : 'cases'} and ${medicalTreatmentCount} medical ${medicalTreatmentCount === 1 ? 'treatment' : 'treatments'}${companyContext}${periodContext} indicates opportunities for injury prevention. Conduct a detailed analysis of these incidents to identify common causes and implement targeted prevention strategies. Consider ergonomic assessments in areas with repetitive strain injuries and review personal protective equipment requirements for tasks associated with cuts or abrasions.`);
//   }
  
//   // KPI-based recommendations
//   if (criticalRiskVerification < 90) {
//     recommendations.push(`Critical Risk Control Verification${companyContext} is at ${criticalRiskVerification}%, below the target of 95%. Critical controls for high-consequence hazards should be prioritized to prevent serious injuries or fatalities. Implement a verification program that includes management reviews, scheduled inspections, and spot checks to ensure critical controls remain effective. Focus particularly on life-saving controls such as energy isolation, working at heights protections, and machine guarding.`);
//   }
  
//   if (electricalSafetyCompliance < 95) {
//     recommendations.push(`Electrical Safety Compliance${companyContext} is at ${electricalSafetyCompliance}%, which requires immediate attention given the high-risk nature of electrical hazards. Conduct a thorough review of electrical safety procedures, ensure proper lockout/tagout implementation, and verify that all electrical work is performed by qualified personnel. Consider implementing an electrical safety audit program with specialized checklists to target common electrical hazards.`);
//   }
  
//   // Risk score recommendation
//   if (riskScore > 50) {
//     recommendations.push(`The elevated risk score of ${riskScore}${companyContext} suggests a need for more robust risk management. Implement a formal risk register that tracks identified hazards, associated controls, and verification activities. Prioritize resources based on risk levels and ensure regular review of high-risk activities. Consider adopting a bow-tie analysis method for critical risks to visualize prevention and mitigation measures more effectively.`);
//   }
  
//   // If no incidents/near misses
//   if (incidentCount === 0 && nearMissCount === 0) {
//     recommendations.push(`The absence of reported incidents and near misses${companyContext}${periodContext} may indicate excellent safety performance, but could also suggest reporting gaps. Conduct an audit to validate reporting processes and consider implementing positive incentives for safety observation reporting to ensure all safety concerns are captured. Benchmark your reporting rates against industry standards to evaluate reporting effectiveness.`);
//   }
  
//   // Add default recommendation if no specific ones were generated
//   if (recommendations.length === 0) {
//     recommendations.push(`Based on the current metrics${companyContext}${periodContext}, no significant safety concerns are identified. However, to drive continuous improvement, consider conducting regular safety perception surveys to identify potential safety culture gaps not captured in quantitative metrics. Implementing leading indicators such as percent of required inspections completed and management safety walks can provide earlier warning signs before incidents occur.`);
//   }
  
//   // Limit to 3-5 recommendations
//   return recommendations.slice(0, Math.min(5, recommendations.length));
// };


//   // Check local storage for cached recommendations
//   const getCachedRecommendations = useCallback((hash) => {
//     try {
//       const cachedData = localStorage.getItem('aiRecommendations');
//       if (!cachedData) return null;
      
//       const parsedData = JSON.parse(cachedData);
//       if (parsedData.hash !== hash) return null;
      
//       // Check if the cache is too old (more than 24 hours)
//       const cacheAge = Date.now() - parsedData.timestamp;
//       if (cacheAge > 24 * 60 * 60 * 1000) return null;
      
//       console.log('Using cached recommendations');
//       return parsedData.recommendations;
//     } catch (err) {
//       console.error('Error retrieving cached recommendations:', err);
//       return null;
//     }
//   }, []);

//   // Cache recommendations to localStorage
//   const cacheRecommendations = useCallback((hash, recommendations) => {
//     try {
//       localStorage.setItem('aiRecommendations', JSON.stringify({
//         hash,
//         recommendations,
//         timestamp: Date.now()
//       }));
//     } catch (err) {
//       console.error('Error caching recommendations:', err);
//     }
//   }, []);

//   // Main function to get recommendations
//   const getRecommendations = useCallback(async () => {
//     if (!metrics) {
//       setRecommendations([]);
//       return;
//     }
    
//     try {
//       // Create hash of current metrics
//       const currentHash = hashMetrics(metrics);
      
//       // If metrics haven't changed, use existing recommendations
//       if (currentHash === lastMetricsHash && recommendations.length > 0) {
//         console.log('Metrics unchanged, using existing recommendations');
//         return;
//       }
      
//       // Check if we need to rate limit the API call (no more than once every 5 minutes)
//       const timeSinceLastFetch = Date.now() - lastFetchTime;
//       const needsRateLimit = timeSinceLastFetch < 5 * 60 * 1000;
      
//       // Check cache first
//       const cachedRecommendations = getCachedRecommendations(currentHash);
//       if (cachedRecommendations) {
//         setRecommendations(cachedRecommendations);
//         setLastMetricsHash(currentHash);
//         return;
//       }
      
//       // If we need to rate limit and have existing recommendations, keep using those
//       if (needsRateLimit && recommendations.length > 0) {
//         console.log('Rate limiting API call, using existing recommendations');
//         return;
//       }
      
//       // Call the API for new recommendations
//       console.log('Fetching new recommendations from DeepSeek API');
//       const newRecommendations = await fetchRecommendationsFromAPI(metrics);
      
//       // Update state
//       setRecommendations(newRecommendations);
//       setLastMetricsHash(currentHash);
//       setLastFetchTime(Date.now());
//       setError(null);
      
//       // Cache the new recommendations
//       cacheRecommendations(currentHash, newRecommendations);
//     } catch (err) {
//       console.error('Error getting recommendations:', err);
//       setError(err.message);
      
//       // If we have no recommendations, generate fallbacks
//       if (recommendations.length === 0) {
//         const fallbackRecs = generateFallbackRecommendations(metrics);
//         setRecommendations(fallbackRecs);
//       }
//     }
//   }, [metrics, lastMetricsHash, recommendations, lastFetchTime, hashMetrics, 
//       fetchRecommendationsFromAPI, getCachedRecommendations, cacheRecommendations]);

//   // Fetch recommendations when metrics or period changes
//   useEffect(() => {
//     getRecommendations();
//   }, [getRecommendations]);

//   return (
//     <div className="p-4 bg-white rounded shadow border-l-4 border-indigo-500">
//       <h2 className="text-xl font-semibold mb-4 flex items-center">
//         <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
//         </svg>
//         DeepSeek AI Safety Recommendations
//       </h2>
      
//       {loadingRecommendations ? (
//         <div className="animate-pulse space-y-3">
//           <div className="flex items-start">
//             <div className="h-6 w-6 rounded-full bg-indigo-100 mr-3 flex-shrink-0"></div>
//             <div className="h-4 bg-gray-200 rounded w-3/4"></div>
//           </div>
//           <div className="flex items-start">
//             <div className="h-6 w-6 rounded-full bg-indigo-100 mr-3 flex-shrink-0"></div>
//             <div className="h-4 bg-gray-200 rounded w-full"></div>
//           </div>
//           <div className="flex items-start">
//             <div className="h-6 w-6 rounded-full bg-indigo-100 mr-3 flex-shrink-0"></div>
//             <div className="h-4 bg-gray-200 rounded w-5/6"></div>
//           </div>
//         </div>
//       ) : error ? (
//         <div>
//           <p className="text-red-600 mb-2">Error loading AI recommendations: {error}</p>
//           <ul className="space-y-3">
//             {recommendations.map((rec, index) => (
//               <li key={index} className="flex items-start">
//                 <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 mr-3 flex-shrink-0">
//                   <span className="text-xs font-medium">{index + 1}</span>
//                 </span>
//                 <span className="text-gray-700">{rec}</span>
//               </li>
//             ))}
//           </ul>
//         </div>
//       ) : (
//         <ul className="space-y-3">
//           {recommendations.map((rec, index) => (
//             <li key={index} className="flex items-start">
//               <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 mr-3 flex-shrink-0">
//                 {index + 1}
//               </span>
//               <span className="text-gray-700">{rec}</span>
//             </li>
//           ))}
//         </ul>
//       )}
      
//       <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
//         <div>
//           Recommendations are generated based on safety metrics using DeepSeek AI.
//         </div>
//         {!loadingRecommendations && (
//           <button 
//             onClick={() => {
//               setLastMetricsHash('');  // Force refresh
//               setLastFetchTime(0);
//               getRecommendations();
//             }}
//             className="text-indigo-600 hover:text-indigo-800 flex items-center"
//           >
//             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
//                 d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//             Refresh
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DeepSeekAIPanel;