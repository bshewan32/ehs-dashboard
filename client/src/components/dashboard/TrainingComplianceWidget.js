// client/src/components/dashboard/TrainingComplianceWidget.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const TrainingComplianceWidget = ({ trainingData }) => {
  const [hoverSector, setHoverSector] = useState(null);
  
  // Default data for when no training data is available
  const defaultData = [
    { name: 'No Data', value: 1, color: '#d1d5db' }
  ];
  
  // Format training data for pie chart if available
  const statusData = React.useMemo(() => {
    if (!trainingData || !trainingData.stats) {
      return defaultData;
    }
    
    const { completed, expired, upcoming, total } = trainingData.stats;
    const notStarted = total - (completed + expired + upcoming);
    
    return [
      { name: 'Current', value: completed, color: '#10b981' },
      { name: 'Expired', value: expired, color: '#ef4444' },
      { name: 'Due Soon', value: upcoming, color: '#f59e0b' },
      { name: 'Not Started', value: notStarted > 0 ? notStarted : 0, color: '#6b7280' }
    ].filter(item => item.value > 0);
  }, [trainingData]);
  
  // Get compliance percentage and color
  const getComplianceDetails = () => {
    const compliance = trainingData?.compliance || 0;
    
    let color = '';
    let bgColor = '';
    if (compliance >= 90) {
      color = 'text-green-600';
      bgColor = 'bg-green-500';
    } else if (compliance >= 70) {
      color = 'text-yellow-600';
      bgColor = 'bg-yellow-500';
    } else {
      color = 'text-red-600';
      bgColor = 'bg-red-500';
    }
    
    return { value: compliance, color, bgColor };
  };
  
  // Format compliance percentage
  const { value: compliance, color: complianceColor, bgColor } = getComplianceDetails();

  // If no data, show upload prompt with improved styling
  if (!trainingData) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Training Compliance
          </h2>
          <p className="text-blue-100 text-sm">Track certification status</p>
        </div>
        
        <div className="flex flex-col items-center justify-center p-6 h-48">
          <svg className="w-16 h-16 text-blue-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-center text-gray-600 mb-4">No training data available</p>
          <Link to="/training" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm">
            Upload Training Data
          </Link>
        </div>
      </div>
    );
  }
  
  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value, color } = payload[0].payload;
      const percentage = ((value / trainingData.stats.total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 shadow-lg border rounded text-sm">
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 mr-2" style={{ backgroundColor: color }}></div>
            <p className="font-semibold">{name}</p>
          </div>
          <p className="text-gray-700">{value} certificates ({percentage}%)</p>
        </div>
      );
    }
    
    return null;
  };

  // Render pie chart legend items
  const renderLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {statusData.map((entry, index) => (
          <div 
            key={`legend-${index}`} 
            className={`flex items-center text-xs px-2 py-1 rounded-full ${
              hoverSector === entry.name ? 'bg-gray-100' : ''
            }`}
            onMouseEnter={() => setHoverSector(entry.name)}
            onMouseLeave={() => setHoverSector(null)}
          >
            <div 
              className="w-2 h-2 rounded-full mr-1" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="font-medium">{entry.name}</span>
            <span className="ml-1 text-gray-600">
              {((entry.value / trainingData.stats.total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Training Compliance
            </h2>
            <p className="text-blue-100 text-sm">Training certification status</p>
          </div>
          <Link to="/training" className="text-white bg-blue-700 bg-opacity-30 hover:bg-opacity-50 px-3 py-1 rounded-lg text-sm transition-colors duration-200">
            View All
          </Link>
        </div>
      </div>
      
      <div className="p-5">
        {/* Compliance percentage and progress bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-600">Overall Compliance</span>
            <span className={`text-xl font-bold ${complianceColor}`}>
              {compliance.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${bgColor}`}
              style={{ width: `${Math.min(100, compliance)}%` }}
            ></div>
          </div>
        </div>
        
        {/* Certification status breakdown */}
        <div className="flex flex-col justify-between h-40">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setHoverSector(statusData[index].name)}
                  onMouseLeave={() => setHoverSector(null)}
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="#fff"
                      strokeWidth={hoverSector === entry.name ? 2 : 1}
                      opacity={hoverSector === null || hoverSector === entry.name ? 1 : 0.7}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Custom legend */}
          {renderLegend()}
        </div>
        
        {/* Bottom alert if there are expired certifications */}
        {trainingData.stats.expired > 0 && (
          <div className="mt-3">
            <div className="flex items-center px-3 py-2 text-red-800 bg-red-100 border border-red-200 rounded-lg">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">
                <span className="font-semibold">{trainingData.stats.expired} expired certificates</span> require attention
              </span>
            </div>
          </div>
        )}
        
        {/* Bottom alert if certifications are due soon */}
        {!trainingData.stats.expired && trainingData.stats.upcoming > 0 && (
          <div className="mt-3">
            <div className="flex items-center px-3 py-2 text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-lg">
              <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">
                <span className="font-semibold">{trainingData.stats.upcoming} certifications</span> expiring soon
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingComplianceWidget;

// // client/src/components/dashboard/TrainingComplianceWidget.js
// import React from 'react';
// import { Link } from 'react-router-dom';
// import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// const TrainingComplianceWidget = ({ trainingData }) => {
//   // Default data for when no training data is available
//   const defaultData = [
//     { name: 'No Data', value: 1, color: '#d1d5db' }
//   ];
  
//   // Format training data for pie chart if available
//   const statusData = React.useMemo(() => {
//     if (!trainingData || !trainingData.stats) {
//       return defaultData;
//     }
    
//     const { completed, expired, upcoming, total } = trainingData.stats;
//     const notStarted = total - (completed + expired + upcoming);
    
//     return [
//       { name: 'Current', value: completed, color: '#10b981' },
//       { name: 'Expired', value: expired, color: '#ef4444' },
//       { name: 'Due Soon', value: upcoming, color: '#f59e0b' },
//       { name: 'Not Started', value: notStarted > 0 ? notStarted : 0, color: '#6b7280' }
//     ].filter(item => item.value > 0);
//   }, [trainingData]);
  
//   // Get compliance percentage and color
//   const getComplianceDetails = () => {
//     const compliance = trainingData?.compliance || 0;
    
//     let color = '';
//     if (compliance >= 90) color = 'text-green-600';
//     else if (compliance >= 70) color = 'text-yellow-500';
//     else color = 'text-red-500';
    
//     return { value: compliance, color };
//   };
  
//   // Format compliance percentage
//   const { value: compliance, color: complianceColor } = getComplianceDetails();
  
//   // If no data, show upload prompt
//   if (!trainingData) {
//     return (
//       <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 h-full">
//         <div className="flex justify-between items-start mb-3">
//           <h2 className="text-lg font-semibold">Training Compliance</h2>
//           <Link to="/training" className="text-blue-600 hover:text-blue-800 text-sm">
//             Manage Training
//           </Link>
//         </div>
//         <div className="flex flex-col items-center justify-center h-48">
//           <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
//                   d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//           </svg>
//           <p className="text-center text-gray-500 mb-3">No training data available</p>
//           <Link to="/training" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
//             Upload Training Data
//           </Link>
//         </div>
//       </div>
//     );
//   }
  
//   // Custom tooltip for pie chart
//   const CustomTooltip = ({ active, payload }) => {
//     if (active && payload && payload.length) {
//       const { name, value } = payload[0].payload;
//       const percentage = ((value / trainingData.stats.total) * 100).toFixed(1);
      
//       return (
//         <div className="bg-white p-2 shadow-md border rounded text-xs">
//           <p className="font-medium">{name}</p>
//           <p>{value} certificates ({percentage}%)</p>
//         </div>
//       );
//     }
    
//     return null;
//   };
  
//   return (
//     <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 h-full">
//       <div className="flex justify-between items-start mb-3">
//         <h2 className="text-lg font-semibold">Training Compliance</h2>
//         <Link to="/training" className="text-blue-600 hover:text-blue-800 text-sm">
//           View Details
//         </Link>
//       </div>
      
//       <div className="flex flex-col h-48">
//         <div className="text-center mb-2">
//           <p className="text-sm text-gray-600">Overall Compliance</p>
//           <div className={`text-2xl font-bold ${complianceColor}`}>
//             {compliance.toFixed(1)}%
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
//             <div 
//               className={`h-1.5 rounded-full ${
//                 compliance >= 90 ? 'bg-green-500' : 
//                 compliance >= 70 ? 'bg-yellow-500' : 
//                 'bg-red-500'
//               }`}
//               style={{ width: `${Math.min(100, compliance)}%` }}
//             ></div>
//           </div>
//         </div>
        
//         <div className="flex-1">
//           <ResponsiveContainer width="100%" height="100%">
//             <PieChart>
//               <Pie
//                 data={statusData}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={30}
//                 outerRadius={60}
//                 paddingAngle={1}
//                 dataKey="value"
//               >
//                 {statusData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//               </Pie>
//               <Tooltip content={<CustomTooltip />} />
//             </PieChart>
//           </ResponsiveContainer>
//         </div>
        
//         {trainingData.stats.expired > 0 && (
//           <div className="mt-auto">
//             <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
//               <span className="font-medium">{trainingData.stats.expired} expired certificates</span> require immediate action
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TrainingComplianceWidget;