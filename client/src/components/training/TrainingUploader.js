// client/src/components/training/TrainingUploader.js
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const TrainingUploader = ({ onDataProcessed }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an Excel file
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid Excel file (.xls or .xlsx)');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Read the Excel file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Process the training data
          const processedData = processTrainingData(jsonData);
          
          // Pass the processed data up to parent component
          if (onDataProcessed) {
            onDataProcessed(processedData);
          }
          
          setIsUploading(false);
        } catch (error) {
          console.error('Error processing Excel file:', error);
          setUploadError('Failed to process the Excel file. Please check the format.');
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        setUploadError('Failed to read the file');
        setIsUploading(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error handling file upload:', error);
      setUploadError('An error occurred during file upload');
      setIsUploading(false);
    }
  };

  // Process the training data to calculate compliance metrics
  const processTrainingData = (trainingRecords) => {
    if (!trainingRecords || trainingRecords.length === 0) {
      return { 
        records: [], 
        compliance: 0, 
        upcomingRenewals: [], 
        stats: { total: 0, completed: 0, expired: 0, upcoming: 0 } 
      };
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    let completed = 0;
    let expired = 0;
    let upcoming = 0;
    const upcomingRenewals = [];

    // Normalize and process each record
    const normalizedRecords = trainingRecords.map(record => {
      // Expected fields: Employee, TrainingType, CompletionDate, ExpirationDate, Status
      const normalizedRecord = {
        employee: record.Employee || record.employee || '',
        trainingType: record.TrainingType || record['Training Type'] || record.trainingType || '',
        completionDate: record.CompletionDate || record['Completion Date'] || record.completionDate || null,
        expirationDate: record.ExpirationDate || record['Expiration Date'] || record.expirationDate || null,
        status: record.Status || record.status || ''
      };

      // Convert dates if they're strings
      if (normalizedRecord.completionDate && !(normalizedRecord.completionDate instanceof Date)) {
        normalizedRecord.completionDate = new Date(normalizedRecord.completionDate);
      }
      
      if (normalizedRecord.expirationDate && !(normalizedRecord.expirationDate instanceof Date)) {
        normalizedRecord.expirationDate = new Date(normalizedRecord.expirationDate);
      }

      // Determine status if not explicitly provided
      if (!normalizedRecord.status) {
        if (!normalizedRecord.completionDate) {
          normalizedRecord.status = 'Not Started';
        } else if (!normalizedRecord.expirationDate) {
          normalizedRecord.status = 'Completed';
          completed++;
        } else if (normalizedRecord.expirationDate < today) {
          normalizedRecord.status = 'Expired';
          expired++;
        } else if (normalizedRecord.expirationDate <= thirtyDaysFromNow) {
          normalizedRecord.status = 'Due Soon';
          upcoming++;
          
          // Add to upcoming renewals list
          upcomingRenewals.push({
            employee: normalizedRecord.employee,
            trainingType: normalizedRecord.trainingType,
            expirationDate: normalizedRecord.expirationDate,
            daysRemaining: Math.floor((normalizedRecord.expirationDate - today) / (1000 * 60 * 60 * 24))
          });
        } else {
          normalizedRecord.status = 'Current';
          completed++;
        }
      } else if (['Completed', 'Current', 'Valid'].includes(normalizedRecord.status)) {
        completed++;
      } else if (normalizedRecord.status === 'Expired') {
        expired++;
      } else if (['Due Soon', 'Renew'].includes(normalizedRecord.status)) {
        upcoming++;
        
        // Add to upcoming renewals list if we have an expiration date
        if (normalizedRecord.expirationDate) {
          upcomingRenewals.push({
            employee: normalizedRecord.employee,
            trainingType: normalizedRecord.trainingType,
            expirationDate: normalizedRecord.expirationDate,
            daysRemaining: Math.floor((normalizedRecord.expirationDate - today) / (1000 * 60 * 60 * 24))
          });
        }
      }

      return normalizedRecord;
    });

    const total = normalizedRecords.length;
    const compliance = total > 0 ? (completed / total) * 100 : 0;

    // Sort upcoming renewals by days remaining (ascending)
    upcomingRenewals.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      records: normalizedRecords,
      compliance: compliance,
      upcomingRenewals: upcomingRenewals,
      stats: {
        total,
        completed,
        expired,
        upcoming
      }
    };
  };

  return (
    <div className="mb-4">
      <div className="flex items-center space-x-3">
        <label htmlFor="training-file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition-colors">
          {isUploading ? 'Processing...' : 'Upload Training Data'}
          <input
            id="training-file-upload"
            type="file"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
        <span className="text-sm text-gray-600">
          Upload an Excel file with training records
        </span>
      </div>
      
      {uploadError && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {uploadError}
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        Required columns: Employee, TrainingType, CompletionDate, ExpirationDate (optional), Status (optional)
      </div>
    </div>
  );
};

export default TrainingUploader;