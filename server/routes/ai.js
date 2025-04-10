// server/routes/ai.js - Using native fetch instead of axios
const express = require('express');
const router = express.Router();
require('dotenv').config();

// Get OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Simple rate limiting implementation
const rateLimiter = {
  // Track request timestamps
  requests: [],
  // Maximum requests per minute - increased to handle the dashboard's needs
  maxRequestsPerMinute: 30,
  // Time window in milliseconds (1 minute)
  timeWindow: 60 * 1000,
  // In-memory cache for responses to reduce API calls
  responseCache: new Map(),
  // Cache TTL in milliseconds (1 hour)
  cacheTTL: 60 * 60 * 1000,
  
  // Check if a new request is allowed
  isAllowed: function() {
    const now = Date.now();
    
    // Remove requests outside the time window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    // Check if we're under the limit
    return this.requests.length < this.maxRequestsPerMinute;
  },
  
  // Record a new request
  recordRequest: function() {
    this.requests.push(Date.now());
  },
  
  // Get cached response if available
  getCachedResponse: function(key) {
    if (!this.responseCache.has(key)) return null;
    
    const cachedItem = this.responseCache.get(key);
    const now = Date.now();
    
    // Check if cache item is still valid
    if (now - cachedItem.timestamp > this.cacheTTL) {
      this.responseCache.delete(key);
      return null;
    }
    
    return cachedItem.data;
  },
  
  // Cache a response
  cacheResponse: function(key, data) {
    this.responseCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
};

/**
 * @route   POST /api/ai/safety-insights
 * @desc    Generate safety insights using OpenAI
 * @access  Private (if using auth middleware)
 */
router.post('/safety-insights', async (req, res) => {
  try {
    const { metrics, companyName } = req.body;
    
    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      console.log('OpenAI API key not configured, using fallback insights');
      return res.json({ 
        source: 'fallback',
        insights: generateFallbackInsights(metrics, companyName)
      });
    }
    
    // Generate a cache key based on the metrics and company name
    const cacheKey = JSON.stringify({
      metrics: {
        lagging: metrics?.lagging || {},
        leading: metrics?.leading || {},
        trainingCompliance: metrics?.trainingCompliance,
        riskScore: metrics?.riskScore
      },
      companyName
    });
    
    // Check cache first
    const cachedInsights = rateLimiter.getCachedResponse(cacheKey);
    if (cachedInsights) {
      console.log(`Using cached AI insights for ${companyName || 'all companies'}`);
      return res.json({ 
        source: 'cache',
        insights: cachedInsights 
      });
    }
    
    // Check rate limit before making API call
    if (!rateLimiter.isAllowed()) {
      console.log('Rate limit exceeded, using fallback insights');
      return res.json({ 
        source: 'rate-limited',
        insights: generateFallbackInsights(metrics, companyName)
      });
    }
    
    // Record this request against the rate limit
    rateLimiter.recordRequest();
    console.log(`Making OpenAI API request for ${companyName || 'all companies'}`);
    
    // Format the metrics data for the prompt
    const metricsDescription = formatMetricsForPrompt(metrics);
    
    // Create the prompt for OpenAI
    const prompt = `
    You are an expert safety consultant analyzing Environmental Health and Safety (EHS) metrics for ${companyName || 'a company'}.
    
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
    
    // Make the OpenAI API request using native fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            { role: 'system', content: 'You are an expert safety consultant providing actionable insights based on EHS metrics.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText}`);
      }
      
      // Parse the JSON response
      const openaiData = await openaiResponse.json();
      
      // Extract and process the insights
      const content = openaiData.choices[0].message.content;
      
      // Split the content into separate recommendations
      const insights = content
        .split('\n\n')
        .filter(item => item.trim().length > 0)
        .map(item => item.trim());
      
      // Cache the successful response
      rateLimiter.cacheResponse(cacheKey, insights);
      
      // Return the insights
      return res.json({ 
        source: 'openai',
        insights 
      });
    } catch (fetchError) {
      // Handle timeout or other fetch errors
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error generating AI insights:', error);
    
    // Generate fallback insights
    const fallbackInsights = generateFallbackInsights(
      req.body.metrics, 
      req.body.companyName
    );
    
    return res.json({ 
      source: 'error',
      error: error.message,
      insights: fallbackInsights
    });
  }
});

// Format metrics data for the prompt
function formatMetricsForPrompt(metrics) {
  if (!metrics) return 'No metrics data available.';
  
  let description = '';
  
  // Add lagging indicators
  if (metrics.lagging) {
    description += 'LAGGING INDICATORS:\n';
    description += `- Incidents: ${metrics.lagging.incidentCount || metrics.totalIncidents || 0}\n`;
    description += `- Near Misses: ${metrics.lagging.nearMissCount || metrics.totalNearMisses || 0}\n`;
    description += `- First Aid Cases: ${metrics.lagging.firstAidCount || metrics.firstAidCount || 0}\n`;
    description += `- Medical Treatments: ${metrics.lagging.medicalTreatmentCount || metrics.medicalTreatmentCount || 0}\n`;
    if (metrics.lagging.lostTimeInjuryCount !== undefined) {
      description += `- Lost Time Injuries: ${metrics.lagging.lostTimeInjuryCount}\n`;
    }
  }
  
  // Add leading indicators
  if (metrics.leading) {
    description += '\nLEADING INDICATORS:\n';
    description += `- Training Completed: ${metrics.leading.trainingCompleted || 0}\n`;
    description += `- Inspections Completed: ${metrics.leading.inspectionsCompleted || 0}\n`;
    
    // Add KPIs if available
    if (metrics.leading.kpis && metrics.leading.kpis.length > 0) {
      description += '\nKEY PERFORMANCE INDICATORS:\n';
      metrics.leading.kpis.forEach(kpi => {
        description += `- ${kpi.name}: ${kpi.actual}${kpi.unit || ''} (Target: ${kpi.target}${kpi.unit || ''})\n`;
      });
    }
  }
  
  // Add general metrics
  description += '\nGENERAL METRICS:\n';
  description += `- Training Compliance: ${metrics.trainingCompliance || 0}%\n`;
  description += `- Risk Score: ${metrics.riskScore || 0}\n`;
  
  return description;
}

// Generate fallback insights if OpenAI request fails
function generateFallbackInsights(metrics, companyName) {
  const insights = [];
  const companyContext = companyName ? ` for ${companyName}` : '';
  
  // Extract metrics with fallbacks
  const incidentCount = metrics?.lagging?.incidentCount || 
                       metrics?.totalIncidents || 0;
  const nearMissCount = metrics?.lagging?.nearMissCount || 
                       metrics?.totalNearMisses || 0;
  const trainingCompliance = metrics?.trainingCompliance || 0;
  
  // Generate basic insights based on metrics
  if (incidentCount > 5) {
    insights.push(`The high number of incidents${companyContext} (${incidentCount}) suggests potential systemic issues in risk controls. Consider conducting a comprehensive risk assessment focusing on areas with recurring incidents, and implement targeted control measures to address the root causes.`);
  }
  
  if (nearMissCount < 5) {
    insights.push(`The low near miss reporting${companyContext} (${nearMissCount}) may indicate underreporting of safety concerns. Develop a positive safety culture by implementing a non-punitive reporting system and regularly emphasizing the importance of near miss reporting as a preventive measure.`);
  }
  
  if (trainingCompliance < 80) {
    insights.push(`Training compliance${companyContext} is below target at ${trainingCompliance}%. Inadequate training is often a contributing factor in workplace incidents. Identify barriers to training completion and consider implementing a more accessible training program or dedicated time allocations for safety training.`);
  }
  
  if (incidentCount === 0 && nearMissCount === 0) {
    insights.push(`The absence of reported incidents and near misses${companyContext} may indicate excellent safety performance, but could also suggest reporting gaps. Conduct an audit to validate reporting processes and consider implementing positive incentives for safety observation reporting to ensure all safety concerns are captured.`);
  }
  
  // Add default insight if no specific ones were generated
  if (insights.length === 0) {
    insights.push(`Based on the current metrics${companyContext}, no significant safety concerns are identified. However, to drive continuous improvement, consider conducting regular safety perception surveys to identify potential safety culture gaps not captured in quantitative metrics.`);
  }
  
  return insights;
}

module.exports = router;