// client/src/components/services/openaiService.js
const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Generate safety insights using OpenAI
 */
export const generateSafetyInsights = async (metricsData, companyName) => {
  try {
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
    
    // Make the API call to our backend, which will forward to OpenAI
    const response = await fetch(`${api_url}/api/ai/safety-insights`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.insights || [];
  } catch (error) {
    console.error('Error generating safety insights:', error);
    // Return default recommendations if the API call fails
    return generateFallbackRecommendations(metricsData, companyName);
  }
};

// Generate fallback recommendations if the API call fails
const generateFallbackRecommendations = (metrics, companyName) => {
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