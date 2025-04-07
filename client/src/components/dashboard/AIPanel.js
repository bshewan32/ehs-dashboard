import React, { useEffect, useState } from 'react';
import { fetchReports } from '../services/api';
import { generateSafetyInsights } from '../services/openaiService';

const AIPanel = ({ metrics, companyName }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        let metricsData = metrics;
        
        // If metrics weren't provided via props, fetch them
        if (!metrics) {
          // Fetch reports first
          const reports = await fetchReports();
          
          // Filter by company if specified
          let filteredReports = reports;
          if (companyName) {
            filteredReports = reports.filter(report => report.companyName === companyName);
          }
          
          // Get most recent report
          if (filteredReports && filteredReports.length > 0) {
            // Sort by date to get the most recent
            filteredReports.sort((a, b) => {
              return new Date(b.createdAt || b.updatedAt || 0) - 
                     new Date(a.createdAt || a.updatedAt || 0);
            });
            
            const mostRecent = filteredReports[0];
            metricsData = mostRecent.metrics;
          } else {
            throw new Error('No metrics data available');
          }
        }

        // Generate insights using OpenAI
        const insights = await generateSafetyInsights(metricsData, companyName);
        setRecommendations(insights);
        setError(null);
      } catch (err) {
        console.error("Error generating recommendations:", err);
        setError("Unable to generate AI insights. Using fallback recommendations.");
        
        // Generate basic recommendations based on available metrics
        const fallbackRecs = generateFallbackRecommendations(metrics, companyName);
        setRecommendations(fallbackRecs);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [metrics, companyName]); // Re-run when metrics or company changes

  // Fallback recommendation generator
  const generateFallbackRecommendations = (metrics, company) => {
    const recs = [];
    const companyContext = company ? ` for ${company}` : '';
    
    if (!metrics) {
      return ["No metrics data available to generate recommendations."];
    }

    // Extract metrics with fallbacks
    const incidentCount = metrics.lagging?.incidentCount ?? metrics.totalIncidents ?? 0;
    const nearMissCount = metrics.lagging?.nearMissCount ?? metrics.totalNearMisses ?? 0;
    const trainingCompliance = metrics.trainingCompliance ?? 0;

    if (incidentCount > 5) {
      recs.push(`High incident count${companyContext} indicates potential systemic issues. Consider conducting a comprehensive risk assessment and implementing targeted controls.`);
    }
    
    if (nearMissCount < 5) {
      recs.push(`Low near miss reporting${companyContext} may indicate underreporting. Create a non-punitive reporting system and emphasize the importance of near miss reporting.`);
    }
    
    if (trainingCompliance < 80) {
      recs.push(`Training compliance${companyContext} is below target. Identify barriers to completion and prioritize safety training programs.`);
    }
    
    if (incidentCount === 0 && nearMissCount === 0) {
      recs.push(`No reported incidents or near misses${companyContext}. Verify reporting processes are effective and encourage reporting of all safety concerns.`);
    }

    if (recs.length === 0) {
      recs.push(`Based on current metrics${companyContext}, continue maintaining safety protocols and look for continuous improvement opportunities.`);
    }

    return recs;
  };

  return (
    <div className="p-4 bg-white rounded shadow border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">
          AI Safety Recommendations
          {companyName && <span className="text-blue-600 ml-2">({companyName})</span>}
        </h2>
        {loading ? (
          <span className="text-sm text-gray-500 animate-pulse">Generating insights...</span>
        ) : error ? (
          <span className="text-sm text-orange-500">{error}</span>
        ) : (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">AI-powered</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-2 bg-gray-200 rounded-full w-32 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded-full w-full mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full w-full mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((rec, index) => (
            <li key={index} className="text-gray-700 leading-relaxed border-b pb-3 last:border-b-0">
              {rec}
            </li>
          ))}
        </ul>
      )}
      
      <div className="mt-4 text-xs text-gray-500 flex justify-between items-center">
        <span>Updated {new Date().toLocaleString()}</span>
        <span>Powered by OpenAI</span>
      </div>
    </div>
  );
};

export default AIPanel;