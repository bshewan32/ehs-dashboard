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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header section */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-purple-500 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              AI Safety Insights
              {companyName && <span className="ml-2 text-purple-100">({companyName})</span>}
            </h2>
            <p className="text-sm text-purple-100">Intelligent safety recommendations</p>
          </div>
          
          {loading ? (
            <div className="text-sm bg-purple-800 px-3 py-1 rounded-full animate-pulse flex items-center">
              <div className="w-2 h-2 bg-purple-100 rounded-full mr-2"></div>
              Processing
            </div>
          ) : error ? (
            <div className="text-sm bg-orange-600 px-3 py-1 rounded-full flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Fallback
            </div>
          ) : (
            <div className="text-sm bg-green-600 px-3 py-1 rounded-full flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              AI-powered
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-200 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-32 mb-6"></div>
              <div className="h-2 bg-gray-200 rounded w-full mb-2.5"></div>
              <div className="h-2 bg-gray-200 rounded w-full mb-2.5"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* Recommendations list */}
          <ul className="space-y-4">
            {recommendations.map((rec, index) => (
              <li key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500 hover:shadow-md transition-shadow duration-200">
                <div className="flex">
                  <span className="flex-shrink-0 bg-indigo-100 text-indigo-800 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 leading-relaxed">{rec}</p>
                </div>
              </li>
            ))}
          </ul>
          
          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {new Date().toLocaleString()}
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.5 2c-5.629 0-10.212 4.436-10.475 10h-3.025l4.537 5.917 4.463-5.917h-2.975c.26-3.902 3.508-7 7.475-7 4.136 0 7.5 3.364 7.5 7.5s-3.364 7.5-7.5 7.5c-2.381 0-4.502-1.119-5.876-2.854l-1.847 2.449c1.919 2.088 4.664 3.405 7.723 3.405 5.798 0 10.5-4.702 10.5-10.5s-4.702-10.5-10.5-10.5z"/>
              </svg>
              <span>Powered by OpenAI</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPanel;