// client/src/components/services/openaiService.js
const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Generate safety insights using OpenAI with improved error handling
 */
export const generateSafetyInsights = async (metricsData, companyName) => {
  try {
    console.log(`Requesting AI insights for ${companyName || 'all companies'}`);
    
    // Set up headers
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Prepare the token if it exists
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Prepare the data for the OpenAI API call
    const requestData = {
      metrics: metricsData,
      companyName: companyName || 'All Companies',
    };
    
    // Add caching information to localStorage for debugging
    const debugKey = `aiRequest_${companyName || 'all'}_debug`;
    localStorage.setItem(debugKey, JSON.stringify({
      requestTime: new Date().toISOString(),
      metricsHash: JSON.stringify({
        incidents: metricsData?.lagging?.incidentCount || 0,
        nearMisses: metricsData?.lagging?.nearMissCount || 0,
        kpiCount: metricsData?.leading?.kpis?.length || 0
      })
    }));
    
    // Make the API call to our backend with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch(`${api_url}/api/ai/safety-insights`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // The server now returns 200 even for fallbacks
      const data = await response.json();
      
      // Log the source of insights for debugging
      console.log(`Insights source: ${data.source || 'unknown'}`);
      
      if (data.error) {
        console.warn(`AI service warning: ${data.error}`);
      }
      
      // Return insights regardless of source (openai, cache, fallback, etc.)
      return data.insights || [];
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error in safety insights:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error generating safety insights:', error);
    
    // If we've already generated insights before, try to use them from cache
    try {
      const storageKey = `aiRecommendations_${companyName || 'all'}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const { recommendations } = JSON.parse(storedData);
        if (recommendations && recommendations.length > 0) {
          console.log('Using previously cached recommendations due to error');
          return recommendations;
        }
      }
    } catch (storageError) {
      console.error('Error accessing localStorage:', storageError);
    }
    
    // Last resort: generate recommendations client-side
    return generateFallbackRecommendations(metricsData, companyName);
  }
};

// Generate fallback recommendations if the API call fails
const generateFallbackRecommendations = (metrics, companyName) => {
  console.log('Generating client-side fallback recommendations');
  const recommendations = [];
  const companyContext = companyName ? ` for ${companyName}` : '';
  
  // Extract metrics data
  const incidentCount = metrics?.lagging?.incidentCount || 
                       metrics?.totalIncidents || 0;
  const nearMissCount = metrics?.lagging?.nearMissCount || 
                       metrics?.totalNearMisses || 0;
  const trainingCompliance = metrics?.trainingCompliance || 0;
  
  // Generate basic recommendations based on metrics
  if (incidentCount > 5) {
    recommendations.push(`High number of incidents detected${companyContext}. Consider reviewing recent risk assessments.`);
  }
  
  if (nearMissCount < 5) {
    recommendations.push(`Low near miss reporting${companyContext}. Reinforce importance of reporting minor events.`);
  }
  
  if (trainingCompliance < 80) {
    recommendations.push(`Training compliance${companyContext} is below target. Prioritize safety training completion.`);
  }
  
  if (incidentCount === 0 && nearMissCount === 0) {
    recommendations.push(`No reported incidents or near misses${companyContext}. Consider conducting an audit to validate reporting accuracy.`);
  }
  
  // Add a default recommendation if no specific ones were generated
  if (recommendations.length === 0) {
    recommendations.push(`No significant trends detected${companyContext}. Maintain current safety protocols.`);
  }
  
  return recommendations;
};