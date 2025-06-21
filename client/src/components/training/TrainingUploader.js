// client/src/components/training/TrainingUploader.js
import React, { useState } from 'react';
import Papa from 'papaparse';
import { parseTrainingExcel, validateTrainingData } from '../utils/excelUtils';

const TrainingUploader = ({ onDataProcessed }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Reset previous states
    setUploading(true);
    setError(null);
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type
    });
    
    // Check file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please upload a CSV or Excel file');
      setUploading(false);
      return;
    }
    
    // For CSV files, use Papa Parse
    if (file.name.endsWith('.csv')) {
      processCSV(file);
    } else {
      // For Excel files, use the Excel parser
      processExcel(file);
    }
  };
  
  const processCSV = (file) => {
    // Use FileReader to read the file
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Parse CSV data
        Papa.parse(e.target.result, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (header) => {
            // Normalize header names by removing spaces and making camelCase
            return header.trim()
              .replace(/\s+(.)/g, (match, group) => group.toUpperCase())
              .replace(/\s/g, '')
              .replace(/^(.)/, (match, group) => group.toLowerCase());
          },
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error('CSV parse errors:', results.errors);
              setError(`CSV parse error: ${results.errors[0].message}`);
              setUploading(false);
              return;
            }
            
            console.log('CSV parsed successfully with', results.data.length, 'records');
            
            // Validate data
            if (results.data.length === 0) {
              setError('No data found in the CSV file');
              setUploading(false);
              return;
            }
            
            // Map parsed data to our training record structure
            const trainingData = results.data.map(record => {
              return processTrainingRecord(record);
            }).filter(record => record.employee && record.courseTitle);
            
            console.log('Processed', trainingData.length, 'valid training records');
            
            if (trainingData.length === 0) {
              setError('No valid training records found in the file. Each record must have an employee name and course title.');
              setUploading(false);
              return;
            }
            
            // Send the processed data back to parent component
            onDataProcessed(trainingData);
            setUploading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setError(`Error parsing CSV: ${error.message}`);
            setUploading(false);
          }
        });
      } catch (error) {
        console.error('Error processing file:', error);
        setError(`Error processing file: ${error.message}`);
        setUploading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setUploading(false);
    };
    
    reader.readAsText(file);
  };

  const processExcel = async (file) => {
    try {
      // Parse Excel file
      const results = await parseTrainingExcel(file);
      
      console.log('Excel parsed successfully with', results.length, 'records');
      console.log('Sample record keys:', results.length > 0 ? Object.keys(results[0]) : 'No records');
      
      // Validate data
      const validation = validateTrainingData(results);
      if (!validation.isValid) {
        setError(`Missing required columns: ${validation.missingColumns.join(', ')}`);
        setUploading(false);
        return;
      }
      
      if (results.length === 0) {
        setError('No data found in the Excel file');
        setUploading(false);
        return;
      }
      
      // Map parsed data to our training record structure
      const trainingData = results.map(record => {
        const processed = processTrainingRecord(record);
        // Debug first few records
        if (results.indexOf(record) < 3) {
          console.log(`Record ${results.indexOf(record)}:`, {
            original: record,
            processed: processed,
            hasEmployee: !!processed.employee,
            hasCourseTitle: !!processed.courseTitle
          });
        }
        return processed;
      }).filter(record => record.employee && record.courseTitle);
      
      console.log('Processed', trainingData.length, 'valid training records');
      
      if (trainingData.length === 0) {
        setError('No valid training records found in the file. Each record must have an employee name and course title.');
        setUploading(false);
        return;
      }
      
      // Log the data structure being sent
      console.log('Final data structure being sent:', {
        totalRecords: trainingData.length,
        sampleRecord: trainingData[0],
        allRecordsHaveEmployee: trainingData.every(r => r.employee),
        allRecordsHaveCourseTitle: trainingData.every(r => r.courseTitle)
      });
      
      // Send the processed data back to parent component
      onDataProcessed(trainingData);
      setUploading(false);
    } catch (error) {
      console.error('Error processing Excel file:', error);
      setError(`Error processing Excel file: ${error.message}`);
      setUploading(false);
    }
  };
  
  // Process a training record to standardize fields
  const processTrainingRecord = (record) => {
    // Map common variations of field names
    const employeeName = record.employee || record.employeeName || record.name || '';
    const courseTitle = record.courseTitle || record.course || record.training || record.trainingType || record.certificate || '';
    
    // Parse dates
    let completionDate = null;
    if (record.completionDate || record.completed || record.dateCompleted) {
      completionDate = parseDate(record.completionDate || record.completed || record.dateCompleted);
    }
    
    let expiryDate = null;
    if (record.expiryDate || record.expiry || record.expires) {
      expiryDate = parseDate(record.expiryDate || record.expiry || record.expires);
    }
    
    // Determine status
    let status = record.status || 'Completed'; // Default to completed
    
    // If expiry date exists and is in the past, mark as expired
    if (expiryDate && new Date(expiryDate) < new Date()) {
      status = 'Expired';
    }
    
    // Return standardized record
    return {
      employee: employeeName,
      courseTitle: courseTitle,
      completionDate: completionDate,
      expiryDate: expiryDate,
      status: status,
      department: record.department || '',
      assignedBy: record.assignedBy || record.assignee || '',
      courseType: record.courseType || record.type || ''
    };
  };
  
  // Helper to parse dates in various formats
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Convert numeric Excel dates (days since 1/1/1900)
    if (typeof dateStr === 'number') {
      // Excel date origin is 1/1/1900, but Excel treats 1900 as a leap year incorrectly
      // So we need to adjust by subtracting 1 for dates after 2/28/1900
      const excelEpoch = new Date(1900, 0, 1);
      const daysSinceEpoch = dateStr - (dateStr > 60 ? 1 : 0);
      const milliseconds = daysSinceEpoch * 24 * 60 * 60 * 1000;
      return new Date(excelEpoch.getTime() + milliseconds).toISOString().split('T')[0];
    }
    
    // Handle string date formats
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn(`Could not parse date: ${dateStr}`);
    }
    
    return null;
  };
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Upload Training Data</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload CSV or Excel File
        </label>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
          disabled={uploading}
        />
      </div>
      
      {fileInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="text-sm text-gray-700">
            <div><span className="font-medium">File:</span> {fileInfo.name}</div>
            <div><span className="font-medium">Size:</span> {fileInfo.size}</div>
            <div><span className="font-medium">Type:</span> {fileInfo.type}</div>
          </div>
        </div>
      )}
      
      {uploading && (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing file...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 mt-3">
          {error}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p className="font-medium">File Format Requirements:</p>
        <ul className="list-disc list-inside pl-4 mt-1">
          <li>Required columns: Employee, CourseTitle (or Training/Course)</li>
          <li>Optional columns: CompletionDate, ExpiryDate, Status, Department</li>
          <li>Dates can be in any standard format (YYYY-MM-DD recommended)</li>
          <li>Supports CSV and Excel (.xlsx, .xls) files</li>
        </ul>
      </div>
    </div>
  );
};

export default TrainingUploader;