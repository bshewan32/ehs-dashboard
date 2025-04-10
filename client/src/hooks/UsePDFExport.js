// client/src/hooks/usePDFExport.js
import { useState, useCallback } from 'react';

/**
 * Custom hook to handle PDF export using a web worker
 * 
 * @returns {Object} Export functions and state
 */
export const usePDFExport = () => {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Function to export dashboard data to PDF using a web worker
  const exportToPDF = useCallback((metrics, selectedCompany) => {
    return new Promise((resolve, reject) => {
      try {
        setExporting(true);
        setError(null);
        console.log("Starting PDF export in web worker...");
        
        // Create a web worker
        const worker = new Worker(new URL('../workers/PDFWorker.js', import.meta.url));
        
        // Listen for messages from the worker
        worker.onmessage = (e) => {
          const { status, pdfData, filename, error } = e.data;
          
          if (status === 'success' && pdfData) {
            console.log("PDF generated successfully in worker");
            
            // Create an anchor element to trigger the download
            const link = document.createElement('a');
            link.href = pdfData;
            link.download = filename;
            link.click();
            
            // Clean up
            setExporting(false);
            worker.terminate();
            resolve();
          } else if (status === 'error') {
            console.error('Error in PDF worker:', error);
            setError(error);
            setExporting(false);
            worker.terminate();
            reject(new Error(error));
          }
        };
        
        // Handle worker errors
        worker.onerror = (err) => {
          console.error('Worker error:', err);
          setError(err.message || 'Unknown worker error');
          setExporting(false);
          worker.terminate();
          reject(err);
        };
        
        // Send data to the worker
        worker.postMessage({ metrics, selectedCompany });
      } catch (err) {
        console.error('Error setting up PDF export:', err);
        setError(err.message);
        setExporting(false);
        reject(err);
      }
    });
  }, []);

  return {
    exportToPDF,
    exporting,
    exportError: error
  };
};