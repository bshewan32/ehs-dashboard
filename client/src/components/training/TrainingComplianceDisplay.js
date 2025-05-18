// client/src/components/training/TrainingComplianceDisplay.js
import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { utils, write } from 'xlsx';
import { saveAs } from 'file-saver';

const TrainingComplianceDisplay = ({ trainingData }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const reportRef = useRef(null);

  // Export to Excel function
  const exportToExcel = () => {
    try {
      setExportingExcel(true);
      
      // Prepare data for export
      let dataToExport = [];
      
      // If we have training records, add them to export
      if (trainingData.records && trainingData.records.length > 0) {
        dataToExport = trainingData.records.map(record => ({
          'Employee': record.employee || record.employeeName,
          'Training Type': record.trainingType,
          'Certification': record.certificationName || record.training,
          'Completion Date': record.completionDate instanceof Date 
            ? record.completionDate.toLocaleDateString() 
            : new Date(record.completionDate).toLocaleDateString(),
          'Expiry Date': record.expiryDate instanceof Date 
            ? record.expiryDate.toLocaleDateString() 
            : new Date(record.expiryDate || record.expirationDate).toLocaleDateString(),
          'Status': record.status,
          'Department': record.department,
          'Days Remaining': record.daysRemaining || 'N/A'
        }));
      } 
      // If we only have upcoming renewals, use those
      else if (trainingData.upcomingRenewals && trainingData.upcomingRenewals.length > 0) {
        dataToExport = trainingData.upcomingRenewals.map(renewal => ({
          'Employee': renewal.employee || renewal.employeeName,
          'Training Type': renewal.trainingType,
          'Certification': renewal.certificationName || renewal.training,
          'Expiry Date': renewal.expirationDate instanceof Date 
            ? renewal.expirationDate.toLocaleDateString() 
            : new Date(renewal.expirationDate).toLocaleDateString(),
          'Status': 'Due Soon',
          'Days Remaining': renewal.daysRemaining
        }));
      }
      
      if (dataToExport.length === 0) {
        throw new Error('No data available to export');
      }
      
      // Create worksheet
      const worksheet = utils.json_to_sheet(dataToExport);
      
      // Set column widths
      const wscols = [
        { wch: 20 }, // Employee name
        { wch: 20 }, // Training type
        { wch: 25 }, // Certification name
        { wch: 15 }, // Completion date
        { wch: 15 }, // Expiry date
        { wch: 12 }, // Status
        { wch: 15 }, // Department
        { wch: 12 }  // Days Remaining
      ];
      worksheet['!cols'] = wscols;
      
      // Add summary sheet
      const summaryData = [
        { 'Metric': 'Overall Compliance', 'Value': `${trainingData.compliance?.toFixed(1) || 0}%` },
        { 'Metric': 'Total Certifications', 'Value': trainingData.stats?.total || 0 },
        { 'Metric': 'Current/Completed', 'Value': trainingData.stats?.completed || 0 },
        { 'Metric': 'Expired', 'Value': trainingData.stats?.expired || 0 },
        { 'Metric': 'Due Soon', 'Value': trainingData.stats?.upcoming || 0 },
        { 'Metric': 'Report Generated', 'Value': new Date().toLocaleString() }
      ];
      
      const summarySheet = utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
      
      // Create workbook with both sheets
      const workbook = {
        SheetNames: ['Summary', 'Training Records'],
        Sheets: {
          'Summary': summarySheet,
          'Training Records': worksheet
        }
      };
      
      // Convert workbook to binary
      const excelBuffer = write(workbook, { 
        bookType: 'xlsx', 
        type: 'array' 
      });
      
      // Create blob and save file
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(blob, `Training_Compliance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel: ' + (error.message || 'Unknown error'));
    } finally {
      setExportingExcel(false);
    }
  };

  // Export to PDF function
  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      setExporting(true);
      
      // Create a PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add title and header
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 150);
      pdf.text('Training Compliance Report', pageWidth / 2, 15, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });
      
      // Capture summary section
      const summaryTab = document.getElementById('summary-tab');
      if (activeTab !== 'summary') {
        setActiveTab('summary');
        // Small timeout to ensure the DOM has updated
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Capture the summary content
      const summaryCanvas = await html2canvas(summaryTab, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const summaryImgData = summaryCanvas.toDataURL('image/png');
      const summaryImgWidth = pageWidth - 20;
      const summaryImgHeight = (summaryCanvas.height * summaryImgWidth) / summaryCanvas.width;
      
      // Add summary to PDF
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Compliance Summary', 10, 30);
      pdf.addImage(summaryImgData, 'PNG', 10, 35, summaryImgWidth, summaryImgHeight);
      
      // If we have upcoming renewals, add them on a new page
      if (trainingData.upcomingRenewals && trainingData.upcomingRenewals.length > 0) {
        // Switch to upcoming tab and wait for DOM update
        setActiveTab('upcoming');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture upcoming renewals content
        const upcomingTab = document.getElementById('upcoming-tab');
        const upcomingCanvas = await html2canvas(upcomingTab, {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const upcomingImgData = upcomingCanvas.toDataURL('image/png');
        const upcomingImgWidth = pageWidth - 20;
        const upcomingImgHeight = (upcomingCanvas.height * upcomingImgWidth) / upcomingCanvas.width;
        
        // Add a new page if the summary is large
        if (35 + summaryImgHeight + 40 + upcomingImgHeight > pageHeight) {
          pdf.addPage();
          // Add title to new page
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Upcoming Renewals', 10, 15);
          pdf.addImage(upcomingImgData, 'PNG', 10, 20, upcomingImgWidth, upcomingImgHeight);
        } else {
          // Add upcoming renewals below summary
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Upcoming Renewals', 10, 35 + summaryImgHeight + 10);
          pdf.addImage(upcomingImgData, 'PNG', 10, 35 + summaryImgHeight + 15, upcomingImgWidth, upcomingImgHeight);
        }
      }
      
      // Return to original tab
      setActiveTab(activeTab);
      
      // Add footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Page ${i} of ${totalPages} - EHS Dashboard Training Compliance Report`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      
      // Download the PDF
      pdf.save(`Training_Compliance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error exporting training compliance report to PDF:', error);
      alert('Failed to export report to PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Check if we have valid data to display
  if (!trainingData || !trainingData.stats || 
      ((!trainingData.records || trainingData.records.length === 0) && 
       (!trainingData.upcomingRenewals || trainingData.upcomingRenewals.length === 0))) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 text-center">
        <div className="text-gray-700 py-6">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No Training Data Available</p>
          <p className="text-sm mt-1">Upload an Excel file to see training compliance stats</p>
        </div>
      </div>
    );
  }

  const { compliance = 0, upcomingRenewals = [], stats = {} } = trainingData;
  
  // Determine compliance color based on percentage
  const getComplianceColor = (percentage) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-500";
    return "text-red-600";
  };
  
  const complianceColor = getComplianceColor(compliance);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden" ref={reportRef}>
      <div className="bg-blue-600 px-4 py-3 text-white flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Training Compliance
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={exportToExcel}
            disabled={exportingExcel}
            className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exportingExcel ? 'Exporting...' : 'Excel'}
          </button>
          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="flex items-center px-3 py-1 bg-white text-blue-800 text-sm rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`px-4 py-2 font-medium text-sm leading-5 ${
              activeTab === 'summary'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm leading-5 ${
              activeTab === 'upcoming'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Renewals
          </button>
        </nav>
      </div>

      <div className="p-4">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div id="summary-tab">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Overall Compliance</h3>
                <div className={`text-3xl font-bold ${complianceColor}`}>
                  {compliance.toFixed(1)}%
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-2 rounded-full ${
                      compliance >= 90 ? 'bg-green-500' : compliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, compliance)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status Breakdown</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <div className="text-sm text-gray-600">Completed/Current</div>
                    <div className="text-xl font-semibold text-green-600">{stats.completed || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Expired</div>
                    <div className="text-xl font-semibold text-red-600">{stats.expired || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Due Soon</div>
                    <div className="text-xl font-semibold text-yellow-500">{stats.upcoming || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-xl font-semibold text-gray-700">{stats.total || 0}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-md font-medium text-gray-700 mb-2">Training Compliance Details</h3>
              <p className="text-sm text-gray-600">
                {compliance >= 90 
                  ? "Excellent compliance level. Continue maintaining current training standards."
                  : compliance >= 70
                  ? "Good compliance level but there's room for improvement. Focus on upcoming renewals."
                  : "Compliance level needs significant improvement. Address expired trainings immediately."}
              </p>
              
              {stats.expired > 0 && (
                <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                  <div className="font-medium">Action Required</div>
                  <div className="text-sm">{stats.expired} training certifications have expired. Please schedule renewal training.</div>
                </div>
              )}
              
              {stats.upcoming > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
                  <div className="font-medium">Upcoming Renewals</div>
                  <div className="text-sm">{stats.upcoming} training certifications will expire within 30 days. Click the "Upcoming Renewals" tab for details.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Renewals Tab */}
        {activeTab === 'upcoming' && (
          <div id="upcoming-tab">
            <h3 className="text-md font-medium text-gray-700 mb-3">Training Certifications Expiring Soon</h3>
            
            {!upcomingRenewals || upcomingRenewals.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No upcoming training renewals in the next 30 days</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Training Type
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expiration Date
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Remaining
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcomingRenewals.map((renewal, index) => (
                      <tr key={index} className={renewal.daysRemaining <= 7 ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {renewal.employee}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {renewal.trainingType}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {renewal.expirationDate instanceof Date 
                            ? renewal.expirationDate.toLocaleDateString() 
                            : new Date(renewal.expirationDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            renewal.daysRemaining <= 7 
                              ? 'bg-red-100 text-red-800' 
                              : renewal.daysRemaining <= 14
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {renewal.daysRemaining} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
              <p className="font-medium">Training Renewal Recommendations</p>
              <ul className="list-disc list-inside mt-1">
                <li>Schedule renewals at least 2 weeks before expiration</li>
                <li>Prioritize certifications expiring within 7 days</li>
                <li>Consider group training sessions for common certifications</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingComplianceDisplay;

// // client/src/components/training/TrainingComplianceDisplay.js
// import React, { useState, useRef } from 'react';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

// const TrainingComplianceDisplay = ({ trainingData }) => {
//   const [activeTab, setActiveTab] = useState('summary');
//   const [exporting, setExporting] = useState(false);
//   const reportRef = useRef(null);

//   // Export to PDF function
//   const exportToPDF = async () => {
//     if (!reportRef.current) return;
    
//     try {
//       setExporting(true);
      
//       // Create a PDF document
//       const pdf = new jsPDF('p', 'mm', 'a4');
//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
      
//       // Add title and header
//       pdf.setFontSize(16);
//       pdf.setTextColor(0, 0, 150);
//       pdf.text('Training Compliance Report', pageWidth / 2, 15, { align: 'center' });
      
//       // Add date
//       pdf.setFontSize(10);
//       pdf.setTextColor(100, 100, 100);
//       pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });
      
//       // Capture summary section
//       const summaryTab = document.getElementById('summary-tab');
//       if (activeTab !== 'summary') {
//         setActiveTab('summary');
//         // Small timeout to ensure the DOM has updated
//         await new Promise(resolve => setTimeout(resolve, 100));
//       }
      
//       // Capture the summary content
//       const summaryCanvas = await html2canvas(summaryTab, {
//         scale: 2,
//         useCORS: true,
//         logging: false
//       });
      
//       const summaryImgData = summaryCanvas.toDataURL('image/png');
//       const summaryImgWidth = pageWidth - 20;
//       const summaryImgHeight = (summaryCanvas.height * summaryImgWidth) / summaryCanvas.width;
      
//       // Add summary to PDF
//       pdf.setFontSize(14);
//       pdf.setTextColor(0, 0, 0);
//       pdf.text('Compliance Summary', 10, 30);
//       pdf.addImage(summaryImgData, 'PNG', 10, 35, summaryImgWidth, summaryImgHeight);
      
//       // If we have upcoming renewals, add them on a new page
//       if (trainingData.upcomingRenewals && trainingData.upcomingRenewals.length > 0) {
//         // Switch to upcoming tab and wait for DOM update
//         setActiveTab('upcoming');
//         await new Promise(resolve => setTimeout(resolve, 100));
        
//         // Capture upcoming renewals content
//         const upcomingTab = document.getElementById('upcoming-tab');
//         const upcomingCanvas = await html2canvas(upcomingTab, {
//           scale: 2,
//           useCORS: true,
//           logging: false
//         });
        
//         const upcomingImgData = upcomingCanvas.toDataURL('image/png');
//         const upcomingImgWidth = pageWidth - 20;
//         const upcomingImgHeight = (upcomingCanvas.height * upcomingImgWidth) / upcomingCanvas.width;
        
//         // Add a new page if the summary is large
//         if (35 + summaryImgHeight + 40 + upcomingImgHeight > pageHeight) {
//           pdf.addPage();
//           // Add title to new page
//           pdf.setFontSize(14);
//           pdf.setTextColor(0, 0, 0);
//           pdf.text('Upcoming Renewals', 10, 15);
//           pdf.addImage(upcomingImgData, 'PNG', 10, 20, upcomingImgWidth, upcomingImgHeight);
//         } else {
//           // Add upcoming renewals below summary
//           pdf.setFontSize(14);
//           pdf.setTextColor(0, 0, 0);
//           pdf.text('Upcoming Renewals', 10, 35 + summaryImgHeight + 10);
//           pdf.addImage(upcomingImgData, 'PNG', 10, 35 + summaryImgHeight + 15, upcomingImgWidth, upcomingImgHeight);
//         }
//       }
      
//       // Return to original tab
//       setActiveTab(activeTab);
      
//       // Add footer
//       const totalPages = pdf.internal.getNumberOfPages();
//       for (let i = 1; i <= totalPages; i++) {
//         pdf.setPage(i);
//         pdf.setFontSize(8);
//         pdf.setTextColor(100, 100, 100);
//         pdf.text(
//           `Page ${i} of ${totalPages} - EHS Dashboard Training Compliance Report`,
//           pageWidth / 2,
//           pageHeight - 10,
//           { align: 'center' }
//         );
//       }
      
//       // Download the PDF
//       pdf.save(`Training_Compliance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
//     } catch (error) {
//       console.error('Error exporting training compliance report to PDF:', error);
//       alert('Failed to export report to PDF. Please try again.');
//     } finally {
//       setExporting(false);
//     }
//   };

//   // Check if we have valid data to display
//   if (!trainingData || !trainingData.stats || 
//       ((!trainingData.records || trainingData.records.length === 0) && 
//        (!trainingData.upcomingRenewals || trainingData.upcomingRenewals.length === 0))) {
//     return (
//       <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 text-center">
//         <div className="text-gray-700 py-6">
//           <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//           </svg>
//           <p className="text-lg font-medium">No Training Data Available</p>
//           <p className="text-sm mt-1">Upload an Excel file to see training compliance stats</p>
//         </div>
//       </div>
//     );
//   }

//   const { compliance = 0, upcomingRenewals = [], stats = {} } = trainingData;
  
//   // Determine compliance color based on percentage
//   const getComplianceColor = (percentage) => {
//     if (percentage >= 90) return "text-green-600";
//     if (percentage >= 70) return "text-yellow-500";
//     return "text-red-600";
//   };
  
//   const complianceColor = getComplianceColor(compliance);
  
//   return (
//     <div className="bg-white rounded-lg shadow-md overflow-hidden" ref={reportRef}>
//       <div className="bg-blue-600 px-4 py-3 text-white flex justify-between items-center">
//         <h2 className="text-lg font-semibold flex items-center">
//           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//           </svg>
//           Training Compliance
//         </h2>
//         <button
//           onClick={exportToPDF}
//           disabled={exporting}
//           className="flex items-center px-3 py-1 bg-white text-blue-800 text-sm rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
//         >
//           <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//           </svg>
//           {exporting ? 'Exporting...' : 'Export PDF'}
//         </button>
//       </div>
      
//       {/* Tabs */}
//       <div className="border-b border-gray-200">
//         <nav className="flex -mb-px">
//           <button
//             className={`px-4 py-2 font-medium text-sm leading-5 ${
//               activeTab === 'summary'
//                 ? 'border-b-2 border-blue-500 text-blue-600'
//                 : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
//             }`}
//             onClick={() => setActiveTab('summary')}
//           >
//             Summary
//           </button>
//           <button
//             className={`px-4 py-2 font-medium text-sm leading-5 ${
//               activeTab === 'upcoming'
//                 ? 'border-b-2 border-blue-500 text-blue-600'
//                 : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
//             }`}
//             onClick={() => setActiveTab('upcoming')}
//           >
//             Upcoming Renewals
//           </button>
//         </nav>
//       </div>

//       <div className="p-4">
//         {/* Summary Tab */}
//         {activeTab === 'summary' && (
//           <div id="summary-tab">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//               <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
//                 <h3 className="text-sm font-medium text-gray-500 mb-1">Overall Compliance</h3>
//                 <div className={`text-3xl font-bold ${complianceColor}`}>
//                   {compliance.toFixed(1)}%
//                 </div>
//                 <div className="mt-2 h-2 bg-gray-200 rounded-full">
//                   <div
//                     className={`h-2 rounded-full ${
//                       compliance >= 90 ? 'bg-green-500' : compliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
//                     }`}
//                     style={{ width: `${Math.min(100, compliance)}%` }}
//                   ></div>
//                 </div>
//               </div>
              
//               <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
//                 <h3 className="text-sm font-medium text-gray-500 mb-1">Status Breakdown</h3>
//                 <div className="grid grid-cols-2 gap-2 mt-2">
//                   <div>
//                     <div className="text-sm text-gray-600">Completed/Current</div>
//                     <div className="text-xl font-semibold text-green-600">{stats.completed || 0}</div>
//                   </div>
//                   <div>
//                     <div className="text-sm text-gray-600">Expired</div>
//                     <div className="text-xl font-semibold text-red-600">{stats.expired || 0}</div>
//                   </div>
//                   <div>
//                     <div className="text-sm text-gray-600">Due Soon</div>
//                     <div className="text-xl font-semibold text-yellow-500">{stats.upcoming || 0}</div>
//                   </div>
//                   <div>
//                     <div className="text-sm text-gray-600">Total</div>
//                     <div className="text-xl font-semibold text-gray-700">{stats.total || 0}</div>
//                   </div>
//                 </div>
//               </div>
//             </div>
            
//             <div className="mt-4">
//               <h3 className="text-md font-medium text-gray-700 mb-2">Training Compliance Details</h3>
//               <p className="text-sm text-gray-600">
//                 {compliance >= 90 
//                   ? "Excellent compliance level. Continue maintaining current training standards."
//                   : compliance >= 70
//                   ? "Good compliance level but there's room for improvement. Focus on upcoming renewals."
//                   : "Compliance level needs significant improvement. Address expired trainings immediately."}
//               </p>
              
//               {stats.expired > 0 && (
//                 <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
//                   <div className="font-medium">Action Required</div>
//                   <div className="text-sm">{stats.expired} training certifications have expired. Please schedule renewal training.</div>
//                 </div>
//               )}
              
//               {stats.upcoming > 0 && (
//                 <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
//                   <div className="font-medium">Upcoming Renewals</div>
//                   <div className="text-sm">{stats.upcoming} training certifications will expire within 30 days. Click the "Upcoming Renewals" tab for details.</div>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Upcoming Renewals Tab */}
//         {activeTab === 'upcoming' && (
//           <div id="upcoming-tab">
//             <h3 className="text-md font-medium text-gray-700 mb-3">Training Certifications Expiring Soon</h3>
            
//             {!upcomingRenewals || upcomingRenewals.length === 0 ? (
//               <div className="text-center py-6 text-gray-500">
//                 <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 <p>No upcoming training renewals in the next 30 days</p>
//               </div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Employee
//                       </th>
//                       <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Training Type
//                       </th>
//                       <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Expiration Date
//                       </th>
//                       <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Days Remaining
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {upcomingRenewals.map((renewal, index) => (
//                       <tr key={index} className={renewal.daysRemaining <= 7 ? 'bg-red-50' : ''}>
//                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
//                           {renewal.employee}
//                         </td>
//                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
//                           {renewal.trainingType}
//                         </td>
//                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
//                           {renewal.expirationDate instanceof Date 
//                             ? renewal.expirationDate.toLocaleDateString() 
//                             : new Date(renewal.expirationDate).toLocaleDateString()}
//                         </td>
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             renewal.daysRemaining <= 7 
//                               ? 'bg-red-100 text-red-800' 
//                               : renewal.daysRemaining <= 14
//                               ? 'bg-yellow-100 text-yellow-800'
//                               : 'bg-green-100 text-green-800'
//                           }`}>
//                             {renewal.daysRemaining} days
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
            
//             <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
//               <p className="font-medium">Training Renewal Recommendations</p>
//               <ul className="list-disc list-inside mt-1">
//                 <li>Schedule renewals at least 2 weeks before expiration</li>
//                 <li>Prioritize certifications expiring within 7 days</li>
//                 <li>Consider group training sessions for common certifications</li>
//               </ul>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TrainingComplianceDisplay;

// // // client/src/components/training/TrainingComplianceDisplay.js
// // import React, { useState } from 'react';

// // const TrainingComplianceDisplay = ({ trainingData }) => {
// //   const [activeTab, setActiveTab] = useState('summary');
  
// //   if (!trainingData || !trainingData.records || trainingData.records.length === 0) {
// //     return (
// //       <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 text-center">
// //         <div className="text-gray-700 py-6">
// //           <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
// //           </svg>
// //           <p className="text-lg font-medium">No Training Data Available</p>
// //           <p className="text-sm mt-1">Upload an Excel file to see training compliance stats</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   const { compliance, upcomingRenewals, stats } = trainingData;
  
// //   // Determine compliance color based on percentage
// //   const getComplianceColor = (percentage) => {
// //     if (percentage >= 90) return "text-green-600";
// //     if (percentage >= 70) return "text-yellow-500";
// //     return "text-red-600";
// //   };
  
// //   const complianceColor = getComplianceColor(compliance);
  
// //   return (
// //     <div className="bg-white rounded-lg shadow-md overflow-hidden">
// //       <div className="bg-blue-600 px-4 py-3 text-white">
// //         <h2 className="text-lg font-semibold flex items-center">
// //           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
// //           </svg>
// //           Training Compliance
// //         </h2>
// //       </div>
      
// //       {/* Tabs */}
// //       <div className="border-b border-gray-200">
// //         <nav className="flex -mb-px">
// //           <button
// //             className={`px-4 py-2 font-medium text-sm leading-5 ${
// //               activeTab === 'summary'
// //                 ? 'border-b-2 border-blue-500 text-blue-600'
// //                 : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
// //             }`}
// //             onClick={() => setActiveTab('summary')}
// //           >
// //             Summary
// //           </button>
// //           <button
// //             className={`px-4 py-2 font-medium text-sm leading-5 ${
// //               activeTab === 'upcoming'
// //                 ? 'border-b-2 border-blue-500 text-blue-600'
// //                 : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
// //             }`}
// //             onClick={() => setActiveTab('upcoming')}
// //           >
// //             Upcoming Renewals
// //           </button>
// //         </nav>
// //       </div>

// //       <div className="p-4">
// //         {/* Summary Tab */}
// //         {activeTab === 'summary' && (
// //           <div>
// //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
// //               <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
// //                 <h3 className="text-sm font-medium text-gray-500 mb-1">Overall Compliance</h3>
// //                 <div className={`text-3xl font-bold ${complianceColor}`}>
// //                   {compliance.toFixed(1)}%
// //                 </div>
// //                 <div className="mt-2 h-2 bg-gray-200 rounded-full">
// //                   <div
// //                     className={`h-2 rounded-full ${
// //                       compliance >= 90 ? 'bg-green-500' : compliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
// //                     }`}
// //                     style={{ width: `${Math.min(100, compliance)}%` }}
// //                   ></div>
// //                 </div>
// //               </div>
              
// //               <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
// //                 <h3 className="text-sm font-medium text-gray-500 mb-1">Status Breakdown</h3>
// //                 <div className="grid grid-cols-2 gap-2 mt-2">
// //                   <div>
// //                     <div className="text-sm text-gray-600">Completed/Current</div>
// //                     <div className="text-xl font-semibold text-green-600">{stats.completed}</div>
// //                   </div>
// //                   <div>
// //                     <div className="text-sm text-gray-600">Expired</div>
// //                     <div className="text-xl font-semibold text-red-600">{stats.expired}</div>
// //                   </div>
// //                   <div>
// //                     <div className="text-sm text-gray-600">Due Soon</div>
// //                     <div className="text-xl font-semibold text-yellow-500">{stats.upcoming}</div>
// //                   </div>
// //                   <div>
// //                     <div className="text-sm text-gray-600">Total</div>
// //                     <div className="text-xl font-semibold text-gray-700">{stats.total}</div>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
            
// //             <div className="mt-4">
// //               <h3 className="text-md font-medium text-gray-700 mb-2">Training Compliance Details</h3>
// //               <p className="text-sm text-gray-600">
// //                 {compliance >= 90 
// //                   ? "Excellent compliance level. Continue maintaining current training standards."
// //                   : compliance >= 70
// //                   ? "Good compliance level but there's room for improvement. Focus on upcoming renewals."
// //                   : "Compliance level needs significant improvement. Address expired trainings immediately."}
// //               </p>
              
// //               {stats.expired > 0 && (
// //                 <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
// //                   <div className="font-medium">Action Required</div>
// //                   <div className="text-sm">{stats.expired} training certifications have expired. Please schedule renewal training.</div>
// //                 </div>
// //               )}
              
// //               {stats.upcoming > 0 && (
// //                 <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
// //                   <div className="font-medium">Upcoming Renewals</div>
// //                   <div className="text-sm">{stats.upcoming} training certifications will expire within 30 days. Click the "Upcoming Renewals" tab for details.</div>
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         )}

// //         {/* Upcoming Renewals Tab */}
// //         {activeTab === 'upcoming' && (
// //           <div>
// //             <h3 className="text-md font-medium text-gray-700 mb-3">Training Certifications Expiring Soon</h3>
            
// //             {upcomingRenewals.length === 0 ? (
// //               <div className="text-center py-6 text-gray-500">
// //                 <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
// //                 </svg>
// //                 <p>No upcoming training renewals in the next 30 days</p>
// //               </div>
// //             ) : (
// //               <div className="overflow-x-auto">
// //                 <table className="min-w-full divide-y divide-gray-200">
// //                   <thead className="bg-gray-50">
// //                     <tr>
// //                       <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                         Employee
// //                       </th>
// //                       <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                         Training Type
// //                       </th>
// //                       <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                         Expiration Date
// //                       </th>
// //                       <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                         Days Remaining
// //                       </th>
// //                     </tr>
// //                   </thead>
// //                   <tbody className="bg-white divide-y divide-gray-200">
// //                     {upcomingRenewals.map((renewal, index) => (
// //                       <tr key={index} className={renewal.daysRemaining <= 7 ? 'bg-red-50' : ''}>
// //                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
// //                           {renewal.employee}
// //                         </td>
// //                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
// //                           {renewal.trainingType}
// //                         </td>
// //                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
// //                           {renewal.expirationDate instanceof Date 
// //                             ? renewal.expirationDate.toLocaleDateString() 
// //                             : 'N/A'}
// //                         </td>
// //                         <td className="px-4 py-3 whitespace-nowrap">
// //                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
// //                             renewal.daysRemaining <= 7 
// //                               ? 'bg-red-100 text-red-800' 
// //                               : renewal.daysRemaining <= 14
// //                               ? 'bg-yellow-100 text-yellow-800'
// //                               : 'bg-green-100 text-green-800'
// //                           }`}>
// //                             {renewal.daysRemaining} days
// //                           </span>
// //                         </td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             )}
            
// //             <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
// //               <p className="font-medium">Training Renewal Recommendations</p>
// //               <ul className="list-disc list-inside mt-1">
// //                 <li>Schedule renewals at least 2 weeks before expiration</li>
// //                 <li>Prioritize certifications expiring within 7 days</li>
// //                 <li>Consider group training sessions for common certifications</li>
// //               </ul>
// //             </div>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default TrainingComplianceDisplay;