// client/src/components/dashboard/AIPanel.js
import React, { useEffect, useState } from 'react';

const AIPanel = ({ metrics, reports }) => {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const generateRecommendations = () => {
      try {
        // Use either the metrics prop or get data from the most recent report
        let incidentCount = 0;
        let nearMissCount = 0;
        
        if (metrics && metrics.lagging) {
          incidentCount = metrics.lagging.incidentCount ?? 0;
          nearMissCount = metrics.lagging.nearMissCount ?? 0;
        } else if (reports && reports.length > 0) {
          const mostRecent = reports[reports.length - 1];
          incidentCount = mostRecent?.metrics?.lagging?.incidentCount ?? 
                          mostRecent?.metrics?.totalIncidents ?? 0;
          nearMissCount = mostRecent?.metrics?.lagging?.nearMissCount ?? 
                          mostRecent?.metrics?.totalNearMisses ?? 0;
        }

        const recs = [];

        if (incidentCount > 5) {
          recs.push("High number of incidents detected. Consider reviewing recent risk assessments.");
        }
        if (nearMissCount < 5) {
          recs.push("Low near miss reporting. Reinforce importance of reporting minor events.");
        }
        if (incidentCount === 0 && nearMissCount === 0) {
          recs.push("No reported incidents or near misses. Consider conducting an audit to validate reporting accuracy.");
        }

        if (recs.length === 0) {
          recs.push("No significant trends detected. Maintain current safety protocols.");
        }

        setRecommendations(recs);
      } catch (err) {
        console.error("Error generating recommendations:", err);
        setRecommendations(["Unable to generate recommendations at this time."]);
      }
    };

    generateRecommendations();
  }, [metrics, reports]);

  return (
    <div className="p-4 bg-white rounded shadow border-l-4 border-blue-500">
      <h2 className="text-xl font-semibold mb-2">AI Safety Recommendations</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-1">
        {recommendations.map((rec, index) => (
          <li key={index}>{rec}</li>
        ))}
      </ul>
    </div>
  );
};

export default AIPanel;

// import React, { useEffect, useState } from 'react';
// import { fetchReports } from '../services/api';

// const AIPanel = () => {
//   const [recommendations, setRecommendations] = useState([]);

//   useEffect(() => {
//     const generateRecommendations = async () => {
//       try {
//         const reports = await fetchReports();
//         const mostRecent = reports[reports.length - 1];
//         const incidentCount = mostRecent?.metrics?.lagging?.incidentCount ?? 0;
//         const nearMissCount = mostRecent?.metrics?.lagging?.nearMissCount ?? 0;

//         const recs = [];

//         if (incidentCount > 5) {
//           recs.push("High number of incidents detected. Consider reviewing recent risk assessments.");
//         }
//         if (nearMissCount < 5) {
//           recs.push("Low near miss reporting. Reinforce importance of reporting minor events.");
//         }
//         if (incidentCount === 0 && nearMissCount === 0) {
//           recs.push("No reported incidents or near misses. Consider conducting an audit to validate reporting accuracy.");
//         }

//         if (recs.length === 0) {
//           recs.push("No significant trends detected. Maintain current safety protocols.");
//         }

//         setRecommendations(recs);
//       } catch (err) {
//         console.error("Error generating recommendations:", err);
//         setRecommendations(["Unable to generate recommendations at this time."]);
//       }
//     };

//     generateRecommendations();
//   }, []);

//   return (
//     <div className="p-4 bg-white rounded shadow border-l-4 border-blue-500">
//       <h2 className="text-xl font-semibold mb-2">AI Safety Recommendations</h2>
//       <ul className="list-disc list-inside text-gray-700 space-y-1">
//         {recommendations.map((rec, index) => (
//           <li key={index}>{rec}</li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default AIPanel;