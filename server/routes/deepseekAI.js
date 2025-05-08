// server/routes/deepseekAI.js
const express = require('express');
const router = express.Router();
require('dotenv').config();

// Get DeepSeek API key from environment variables
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * @route   POST /api/ai/deepseek
 * @desc    Generate safety insights using DeepSeek API
 * @access  Private (if using auth middleware)
 */
router.post('/deepseek', async (req, res) => {
  try {
    // Check if DeepSeek API key is configured
    if (!DEEPSEEK_API_KEY) {
      console.log('DeepSeek API key not configured, returning fallback recommendations');
      return res.status(200).json({ 
        error: 'DeepSeek API key not configured',
        recommendations: generateFallbackRecommendations(req.body.metrics, req.body.companyName)
      });
    }
    
    const { metrics, companyName, period } = req.body;
    console.log(`Generating insights for ${companyName || 'All Companies'} during ${period || 'All Time'}`);
    
    // Format the metrics data for the prompt
    const metricsDescription = formatMetricsForPrompt(metrics);
    
    // Create the prompt for DeepSeek
    const prompt = `
    You are an expert safety consultant analyzing Environmental Health and Safety (EHS) metrics for ${companyName || 'a company'} during the period: ${period || 'All Time'}.
    
    Here are the current metrics:
    ${metricsDescription}
    
    Based on these metrics, provide 3-5 specific, actionable safety recommendations from an EHS professional perspective.
    Each recommendation should:
    1. Identify a specific pattern or concern in the data
    2. Explain why it matters in terms of workplace safety and compliance
    3. Suggest a specific, practical action to address it, considering industry best practices
    
    Consider factors like:
    - Relationship between leading and lagging indicators
    - Trends that might indicate systemic issues
    - Potential regulatory compliance concerns
    - Industry benchmarks and best practices
    - Opportunities for safety culture improvement
    
    Format each recommendation as a single paragraph. Be specific, data-driven, and provide insights that would not be obvious from just looking at the numbers.
    `;
    
    try {
      // Make the DeepSeek API request using native fetch
      console.log('Calling DeepSeek API...');
      const deepseekResponse = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an expert safety consultant providing actionable insights based on EHS metrics.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      if (!deepseekResponse.ok) {
        console.error(`DeepSeek API error: ${deepseekResponse.status} ${deepseekResponse.statusText}`);
        throw new Error(`DeepSeek API error: ${deepseekResponse.status} ${deepseekResponse.statusText}`);
      }
      
      // Parse the JSON response
      const deepseekData = await deepseekResponse.json();
      console.log('Received response from DeepSeek API');
      
      // Extract and process the insights
      const content = deepseekData.choices[0].message.content;
      
      // Split the content into separate recommendations
      const recommendations = content
        .split('\n\n')
        .filter(item => item.trim().length > 0)
        .map(item => item.trim());
      
      // Return the recommendations
      return res.json({ recommendations });
    } catch (apiError) {
      console.error('Error calling external API:', apiError);
      // Generate fallback insights
      const fallbackRecommendations = generateFallbackRecommendations(metrics, companyName);
      return res.status(200).json({ 
        error: 'Failed to call DeepSeek API',
        recommendations: fallbackRecommendations
      });
    }
  } catch (error) {
    console.error('Error in route handler:', error);
    
    // Generate fallback insights
    const fallbackRecommendations = generateFallbackRecommendations(
      req.body.metrics, 
      req.body.companyName
    );
    
    return res.status(200).json({ 
      error: 'General error processing request',
      recommendations: fallbackRecommendations
    });
  }
});

// Format metrics data for the prompt
function formatMetricsForPrompt(metrics) {
  if (!metrics) return 'No metrics data available.';
  
  let description = '';
  
  // Add lagging indicators
  description += 'LAGGING INDICATORS:\n';
  description += `- Incidents: ${metrics.incidents || 0}\n`;
  description += `- Near Misses: ${metrics.nearMisses || 0}\n`;
  description += `- First Aid Cases: ${metrics.firstAid || 0}\n`;
  description += `- Medical Treatments: ${metrics.medicalTreatment || 0}\n`;
  
  // Add leading indicators
  description += '\nLEADING INDICATORS:\n';
  description += `- Training Compliance: ${metrics.trainingCompliance || 0}%\n`;
  description += `- Risk Score: ${metrics.riskScore || 0}\n`;
  
  // Add KPIs if available
  if (metrics.kpis && metrics.kpis.length > 0) {
    description += '\nKEY PERFORMANCE INDICATORS:\n';
    metrics.kpis.forEach(kpi => {
      description += `- ${kpi.name}: ${kpi.actual}${kpi.unit || ''} (Target: ${kpi.target}${kpi.unit || ''})\n`;
    });
  }
  
  return description;
}

// Generate fallback recommendations if DeepSeek request fails
function generateFallbackRecommendations(metrics, companyName) {
  const recommendations = [];
  const companyContext = companyName ? ` for ${companyName}` : '';
  
  // Extract metrics with fallbacks
  const incidentCount = metrics?.incidents || 0;
  const nearMissCount = metrics?.nearMisses || 0;
  const trainingCompliance = metrics?.trainingCompliance || 0;
  
  // Generate basic recommendations based on metrics
  if (incidentCount > 5) {
    recommendations.push(`The high number of incidents${companyContext} (${incidentCount}) suggests potential systemic issues in risk controls. Consider conducting a comprehensive risk assessment focusing on areas with recurring incidents, and implement targeted control measures to address the root causes.`);
  }
  
  if (nearMissCount < 5) {
    recommendations.push(`The low near miss reporting${companyContext} (${nearMissCount}) may indicate underreporting of safety concerns. Develop a positive safety culture by implementing a non-punitive reporting system and regularly emphasizing the importance of near miss reporting as a preventive measure.`);
  }
  
  if (trainingCompliance < 80) {
    recommendations.push(`Training compliance${companyContext} is below target at ${trainingCompliance}%. Inadequate training is often a contributing factor in workplace incidents. Identify barriers to training completion and consider implementing a more accessible training program or dedicated time allocations for safety training.`);
  }
  
  if (incidentCount === 0 && nearMissCount === 0) {
    recommendations.push(`The absence of reported incidents and near misses${companyContext} may indicate excellent safety performance, but could also suggest reporting gaps. Conduct an audit to validate reporting processes and consider implementing positive incentives for safety observation reporting to ensure all safety concerns are captured.`);
  }
  
  // Add default insight if no specific ones were generated
  if (recommendations.length === 0) {
    recommendations.push(`Based on the current metrics${companyContext}, no significant safety concerns are identified. However, to drive continuous improvement, consider conducting regular safety perception surveys to identify potential safety culture gaps not captured in quantitative metrics.`);
  }
  
  return recommendations;
}

module.exports = router;