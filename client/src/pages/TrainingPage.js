// client/src/pages/TrainingPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TrainingUploader from '../components/training/TrainingUploader';
import TrainingComplianceDisplay from '../components/training/TrainingComplianceDisplay';
import { fetchTrainingData, saveTrainingData, deleteTrainingRecord } from '../components/services/trainingApi';

export default function TrainingPage() {
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [trainingComplianceData, setTrainingComplianceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveResponse, setSaveResponse] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [filter, setFilter] = useState('');
  const [filterBy, setFilterBy] = useState('employee');
  
  // Load training data on component mount
  useEffect(() => {
    loadTrainingData();
  }, []);
  
  // Function to load training data
  const loadTrainingData = async () => {
    try {
      setLoading(true);
      const data = await fetchTrainingData(true); // Force refresh
      
      // Process and store compliance data for the dashboard
      if (data && typeof data === 'object') {
        // If data is in the expected API structure with compliance info
        if (data.compliance !== undefined || data.stats !== undefined) {
          setTrainingComplianceData(data);
          
          if (data.records && Array.isArray(data.records)) {
            setTrainingRecords(data.records);
          }
        } else if (data.records && Array.isArray(data.records)) {
          // If only records are available but no compliance info
          setTrainingRecords(data.records);
          
          // Generate basic compliance stats from records
          const complianceData = generateComplianceData(data.records);
          setTrainingComplianceData(complianceData);
        } else if (Array.isArray(data)) {
          // If API returns just an array of records
          setTrainingRecords(data);
          
          // Generate basic compliance stats from records
          const complianceData = generateComplianceData(data);
          setTrainingComplianceData(complianceData);
        } else {
          console.log('No valid training data received:', data);
          setTrainingRecords([]);
        }
      } else if (Array.isArray(data)) {
        // Handle case where API returns an array directly
        setTrainingRecords(data);
        
        // Generate basic compliance stats from records
        const complianceData = generateComplianceData(data);
        setTrainingComplianceData(complianceData);
      } else {
        console.log('No valid training data received:', data);
        setTrainingRecords([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading training data:', err);
      setError('Failed to load training data: ' + (err.message || 'Unknown error'));
      setTrainingRecords([]);
      setTrainingComplianceData(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate compliance data from records
  const generateComplianceData = (records) => {
    if (!records || !Array.isArray(records) || records.length === 0) {
      return null;
    }
    
    const total = records.length;
    const completed = records.filter(r => r.status === 'Completed').length;
    const expired = records.filter(r => r.status === 'Expired').length;
    
    // Find upcoming renewals (records with expiry dates in next 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const upcomingRenewals = records
      .filter(record => {
        if (!record.expiryDate) return false;
        
        const expiryDate = new Date(record.expiryDate);
        return !isNaN(expiryDate.getTime()) && 
               expiryDate > today && 
               expiryDate <= thirtyDaysFromNow;
      })
      .map(record => {
        const expiryDate = new Date(record.expiryDate);
        const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          employee: record.employee,
          trainingType: record.courseTitle || record.courseType || 'Training',
          expirationDate: expiryDate,
          daysRemaining
        };
      });
    
    // Sort by days remaining (ascending)
    upcomingRenewals.sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    return {
      compliance: total > 0 ? (completed / total) * 100 : 0,
      stats: {
        total,
        completed,
        expired,
        upcoming: upcomingRenewals.length
      },
      upcomingRenewals,
      records
    };
  };
  
  // Handle data from CSV upload
  const onDataProcessed = async (data) => {
    try {
      // Ensure we have data to save
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('No valid training data to save');
      }
      
      console.log('Processing training data before API save:');
      
      // Generate compliance data
      const complianceData = generateComplianceData(data);
      
      // Create a properly structured payload for the API
      const payload = {
        records: data,
        ...complianceData
      };
      
      console.log(payload);
      
      // Save the data to the API
      const serverResponse = await saveTrainingData(payload);
      
      // Display success message
      setSaveResponse({
        success: true,
        message: `Successfully saved ${data.length} training records${serverResponse.local ? ' to local storage (server unavailable)' : ''}`,
      });
      
      // Reload the data to show the new records
      loadTrainingData();
      
      // Hide the uploader after successful save
      setTimeout(() => {
        setShowUploader(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving training data:', err);
      setSaveResponse({
        success: false,
        message: `Error: ${err.message || 'Unknown error'}`,
      });
    }
  };
  
  // Handle record deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this training record?')) {
      return;
    }
    
    try {
      await deleteTrainingRecord(id);
      // Reload data after deletion
      loadTrainingData();
      setSaveResponse({
        success: true,
        message: 'Training record deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting training record:', err);
      setSaveResponse({
        success: false,
        message: `Error: ${err.message || 'Unknown error'}`,
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  // Filter training records based on search input
  const filteredRecords = trainingRecords.filter(record => {
    if (!filter) return true;
    
    const searchValue = filter.toLowerCase();
    
    switch (filterBy) {
      case 'employee':
        return (record.employee || '').toLowerCase().includes(searchValue);
      case 'course':
        return (record.courseTitle || '').toLowerCase().includes(searchValue);
      case 'status':
        return (record.status || '').toLowerCase().includes(searchValue);
      case 'department':
        return (record.department || '').toLowerCase().includes(searchValue);
      default:
        return true;
    }
  });
  
  // Get status badge color based on status
  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Training Management</h1>
        <div className="space-x-4">
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            {showUploader ? 'Hide Uploader' : 'Upload Training Data'}
          </button>
          <Link to="/debug">
            <button className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700">
              Debug Tools
            </button>
          </Link>
          <Link to="/">
            <button className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
      
      {/* Response Message */}
      {saveResponse && (
        <div className={`p-4 mb-4 rounded ${saveResponse.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {saveResponse.message}
        </div>
      )}
      
      {/* CSV Uploader */}
      {showUploader && (
        <div className="mb-6">
          <TrainingUploader onDataProcessed={onDataProcessed} />
        </div>
      )}
      
      {/* Training Compliance Dashboard */}
      {!loading && trainingComplianceData && (
        <div className="mb-8">
          <TrainingComplianceDisplay trainingData={trainingComplianceData} />
        </div>
      )}
      
      <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Training Records</h2>
      
      {/* Search and Filter */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search training records..."
            className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter By</label>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="employee">Employee</option>
            <option value="course">Course</option>
            <option value="status">Status</option>
            <option value="department">Department</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => loadTrainingData()}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded shadow-sm hover:bg-gray-200"
            title="Refresh Data"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Error State */}
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          <div className="font-bold">Error:</div>
          <p>{error}</p>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">Loading training records...</p>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && filteredRecords.length === 0 && (
        <div className="text-center py-8 bg-white rounded shadow-md">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Training Records</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter ? 'No records match your search criteria.' : 'Get started by uploading training data.'}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowUploader(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Upload Training Data
            </button>
          </div>
        </div>
      )}
      
      {/* Data Table */}
      {!loading && filteredRecords.length > 0 && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record, index) => (
                <tr key={record._id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.employee}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{record.courseTitle}</div>
                    {record.courseType && (
                      <div className="text-xs text-gray-500">{record.courseType}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(record.status)}`}>
                      {record.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(record.completionDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(record.expiryDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(record._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="bg-gray-50 px-4 py-3 text-right">
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredRecords.length}</span> of <span className="font-medium">{trainingRecords.length}</span> records
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// // client/src/pages/TrainingPage.js
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import TrainingUploader from '../components/training/TrainingUploader';
// import { fetchTrainingData, saveTrainingData, deleteTrainingRecord } from '../components/services/trainingApi';

// export default function TrainingPage() {
//   const [trainingRecords, setTrainingRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [saveResponse, setSaveResponse] = useState(null);
//   const [showUploader, setShowUploader] = useState(false);
//   const [filter, setFilter] = useState('');
//   const [filterBy, setFilterBy] = useState('employee');
  
//   // Load training data on component mount
//   useEffect(() => {
//     loadTrainingData();
//   }, []);
  
//   // Function to load training data
//   const loadTrainingData = async () => {
//     try {
//       setLoading(true);
//       const data = await fetchTrainingData(true); // Force refresh
      
//       if (data && data.records && Array.isArray(data.records)) {
//         setTrainingRecords(data.records);
//       } else if (data && Array.isArray(data)) {
//         // Handle case where API returns an array directly
//         setTrainingRecords(data);
//       } else {
//         console.log('No valid training data received:', data);
//         setTrainingRecords([]);
//       }
      
//       setError(null);
//     } catch (err) {
//       console.error('Error loading training data:', err);
//       setError('Failed to load training data: ' + (err.message || 'Unknown error'));
//       setTrainingRecords([]);
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   // Handle data from CSV upload
//   const onDataProcessed = async (data) => {
//     try {
//       // Ensure we have data to save
//       if (!data || !Array.isArray(data) || data.length === 0) {
//         throw new Error('No valid training data to save');
//       }
      
//       console.log('Processing training data before API save:');
      
//       // Create a properly structured payload for the API
//       const payload = {
//         records: data,
//         compliance: 100, // Calculate this server-side
//         upcomingRenewals: [],
//         stats: {
//           total: data.length,
//           completed: data.filter(item => item.status === 'Completed').length || 0,
//           expired: data.filter(item => item.status === 'Expired').length || 0,
//           upcoming: 0
//         }
//       };
      
//       console.log(payload);
      
//       // Save the data to the API
//       const serverResponse = await saveTrainingData(payload);
      
//       // Display success message
//       setSaveResponse({
//         success: true,
//         message: `Successfully saved ${data.length} training records${serverResponse.local ? ' to local storage (server unavailable)' : ''}`,
//       });
      
//       // Reload the data to show the new records
//       loadTrainingData();
      
//       // Hide the uploader after successful save
//       setTimeout(() => {
//         setShowUploader(false);
//       }, 3000);
//     } catch (err) {
//       console.error('Error saving training data:', err);
//       setSaveResponse({
//         success: false,
//         message: `Error: ${err.message || 'Unknown error'}`,
//       });
//     }
//   };
  
//   // Handle record deletion
//   const handleDelete = async (id) => {
//     if (!window.confirm('Are you sure you want to delete this training record?')) {
//       return;
//     }
    
//     try {
//       await deleteTrainingRecord(id);
//       // Reload data after deletion
//       loadTrainingData();
//       setSaveResponse({
//         success: true,
//         message: 'Training record deleted successfully',
//       });
//     } catch (err) {
//       console.error('Error deleting training record:', err);
//       setSaveResponse({
//         success: false,
//         message: `Error: ${err.message || 'Unknown error'}`,
//       });
//     }
//   };
  
//   // Format date for display
//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
    
//     try {
//       const date = new Date(dateString);
//       return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
//     } catch (e) {
//       return 'Invalid Date';
//     }
//   };
  
//   // Filter training records based on search input
//   const filteredRecords = trainingRecords.filter(record => {
//     if (!filter) return true;
    
//     const searchValue = filter.toLowerCase();
    
//     switch (filterBy) {
//       case 'employee':
//         return (record.employee || '').toLowerCase().includes(searchValue);
//       case 'course':
//         return (record.courseTitle || '').toLowerCase().includes(searchValue);
//       case 'status':
//         return (record.status || '').toLowerCase().includes(searchValue);
//       case 'department':
//         return (record.department || '').toLowerCase().includes(searchValue);
//       default:
//         return true;
//     }
//   });
  
//   // Get status badge color based on status
//   const getStatusBadgeColor = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'completed':
//         return 'bg-green-100 text-green-800';
//       case 'expired':
//         return 'bg-red-100 text-red-800';
//       case 'in progress':
//         return 'bg-yellow-100 text-yellow-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };
  
//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-bold text-gray-800">Training Records</h1>
//         <div className="space-x-4">
//           <button
//             onClick={() => setShowUploader(!showUploader)}
//             className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
//           >
//             {showUploader ? 'Hide Uploader' : 'Upload Training Data'}
//           </button>
//           <Link to="/debug">
//             <button className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700">
//               Debug Tools
//             </button>
//           </Link>
//           <Link to="/">
//             <button className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700">
//               Back to Dashboard
//             </button>
//           </Link>
//         </div>
//       </div>
      
//       {/* Response Message */}
//       {saveResponse && (
//         <div className={`p-4 mb-4 rounded ${saveResponse.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
//           {saveResponse.message}
//         </div>
//       )}
      
//       {/* CSV Uploader */}
//       {showUploader && (
//         <div className="mb-6">
//           <TrainingUploader onDataProcessed={onDataProcessed} />
//         </div>
//       )}
      
//       {/* Search and Filter */}
//       <div className="mb-6 flex flex-wrap gap-4">
//         <div className="flex-1 min-w-[300px]">
//           <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
//           <input
//             type="text"
//             value={filter}
//             onChange={(e) => setFilter(e.target.value)}
//             placeholder="Search training records..."
//             className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Filter By</label>
//           <select
//             value={filterBy}
//             onChange={(e) => setFilterBy(e.target.value)}
//             className="px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//           >
//             <option value="employee">Employee</option>
//             <option value="course">Course</option>
//             <option value="status">Status</option>
//             <option value="department">Department</option>
//           </select>
//         </div>
//         <div className="flex items-end">
//           <button
//             onClick={() => loadTrainingData()}
//             className="px-3 py-2 bg-gray-100 text-gray-700 rounded shadow-sm hover:bg-gray-200"
//             title="Refresh Data"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
//             </svg>
//           </button>
//         </div>
//       </div>
      
//       {/* Error State */}
//       {error && (
//         <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md text-red-800">
//           <div className="font-bold">Error:</div>
//           <p>{error}</p>
//         </div>
//       )}
      
//       {/* Loading State */}
//       {loading && (
//         <div className="text-center py-8">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
//           <p className="mt-2 text-gray-500">Loading training records...</p>
//         </div>
//       )}
      
//       {/* Empty State */}
//       {!loading && filteredRecords.length === 0 && (
//         <div className="text-center py-8 bg-white rounded shadow-md">
//           <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
//           </svg>
//           <h3 className="mt-2 text-sm font-medium text-gray-900">No Training Records</h3>
//           <p className="mt-1 text-sm text-gray-500">
//             {filter ? 'No records match your search criteria.' : 'Get started by uploading training data.'}
//           </p>
//           <div className="mt-6">
//             <button
//               type="button"
//               onClick={() => setShowUploader(true)}
//               className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
//               </svg>
//               Upload Training Data
//             </button>
//           </div>
//         </div>
//       )}
      
//       {/* Data Table */}
//       {!loading && filteredRecords.length > 0 && (
//         <div className="overflow-x-auto rounded-lg shadow">
//           <table className="min-w-full divide-y divide-gray-200 bg-white">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
//                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
//                 <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredRecords.map((record, index) => (
//                 <tr key={record._id || index} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm font-medium text-gray-900">{record.employee}</div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="text-sm text-gray-900">{record.courseTitle}</div>
//                     {record.courseType && (
//                       <div className="text-xs text-gray-500">{record.courseType}</div>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(record.status)}`}>
//                       {record.status || 'Unknown'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {formatDate(record.completionDate)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {formatDate(record.expiryDate)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {record.department || '-'}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                     <button
//                       onClick={() => handleDelete(record._id)}
//                       className="text-red-600 hover:text-red-900"
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
          
//           <div className="bg-gray-50 px-4 py-3 text-right">
//             <span className="text-sm text-gray-700">
//               Showing <span className="font-medium">{filteredRecords.length}</span> of <span className="font-medium">{trainingRecords.length}</span> records
//             </span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }