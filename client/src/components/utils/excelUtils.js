// client/src/utils/excelUtils.js
import * as XLSX from 'xlsx';

/**
 * Parse an Excel file and extract training certificate data
 * @param {File} file - The Excel file to parse
 * @returns {Promise<Array>} - Array of training certificate records
 */
export const parseTrainingExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd' 
        });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          defval: '',
          blankrows: false
        });
        
        // Normalize column names and handle variations
        const normalizedData = normalizeColumnNames(jsonData);
        
        resolve(normalizedData);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Normalize column names from Excel file to handle variations in naming
 * @param {Array} data - JSON data from Excel
 * @returns {Array} - Data with normalized column names
 */
const normalizeColumnNames = (data) => {
  const columnMappings = {
    // Map variations of column names to standardized names
    'employee': ['Employee', 'EmployeeName', 'Employee Name', 'Name', 'Staff'],
    'courseTitle': ['Training Type', 'TrainingType', 'Training', 'Certificate', 'Course', 'CertificateType', 'Course Title', 'CourseTitle'],
    'completionDate': ['Completion Date', 'CompletionDate', 'Date Completed', 'DateCompleted', 'Completed'],
    'expirationDate': ['Expiration Date', 'ExpirationDate', 'Expires', 'Valid Until', 'ValidUntil'],
    'status': ['Status', 'CertificateStatus', 'Certificate Status', 'State']
  };
  
  if (!data || data.length === 0) return [];
  
  // Create a map of the actual column names to our standard names
  const actualColumnMap = {};
  
  // Get all the keys from the first row
  const sampleKeys = Object.keys(data[0]);
  
  // For each standard column, check if any of its variations exist in our data
  Object.entries(columnMappings).forEach(([standardName, variations]) => {
    // First check for exact match with standard name
    if (sampleKeys.includes(standardName)) {
      actualColumnMap[standardName] = standardName;
      return;
    }
    
    // Check for variations
    for (const variation of variations) {
      if (sampleKeys.includes(variation)) {
        actualColumnMap[variation] = standardName;
        return;
      }
    }
  });
  
  // Now map the data to our standard column names
  return data.map(row => {
    const normalizedRow = {};
    
    Object.entries(row).forEach(([key, value]) => {
      // If this key maps to a standard name, use that
      if (actualColumnMap[key]) {
        normalizedRow[actualColumnMap[key]] = value;
      } else {
        // Otherwise keep the original key
        normalizedRow[key] = value;
      }
    });
    
    return normalizedRow;
  });
};

/**
 * Validate that the Excel file contains the required columns
 * @param {Array} data - JSON data from Excel
 * @returns {Object} - Validation result {isValid: boolean, missingColumns: string[]}
 */
export const validateTrainingData = (data) => {
  if (!data || data.length === 0) {
    return { isValid: false, missingColumns: ['No data found'] };
  }
  
  const requiredColumns = ['employee', 'courseTitle'];
  const firstRowKeys = Object.keys(data[0]);
  
  const missingColumns = requiredColumns.filter(
    column => !firstRowKeys.includes(column)
  );
  
  return {
    isValid: missingColumns.length === 0,
    missingColumns
  };
};

/**
 * Parse various date formats into Date objects
 * @param {string|number|Date} dateInput - Date to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
export const parseDate = (dateInput) => {
  if (!dateInput) return null;
  
  // Handle existing Date objects
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : new Date(dateInput);
  }
  
  // Handle Excel numeric dates
  if (typeof dateInput === 'number') {
    const excelEpoch = new Date(1900, 0, 1);
    const days = dateInput - (dateInput > 60 ? 1 : 0); // Excel 1900 leap year bug
    const date = new Date(excelEpoch.getTime() + days * 86400000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Handle string input
  if (typeof dateInput === 'string') {
    // Try ISO format first (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Fallback to Date constructor
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
};

/**
 * Format date to YYYY-MM-DD string
 * @param {Date|string|number} dateInput - Date to format
 * @returns {string} - Formatted date string or empty string if invalid
 */
export const formatDate = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};