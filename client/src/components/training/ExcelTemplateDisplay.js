// client/src/components/training/ExcelTemplateDisplay.js
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const ExcelTemplateDisplay = () => {
  const [showTemplate, setShowTemplate] = useState(false);
  
  // Sample data for the template
  const sampleData = [
    {
      Employee: "John Smith",
      TrainingType: "First Aid",
      CompletionDate: "2025-01-15",
      ExpirationDate: "2026-01-15",
      Status: "Current"
    },
    {
      Employee: "Jane Doe",
      TrainingType: "Fire Safety",
      CompletionDate: "2024-11-20",
      ExpirationDate: "2025-05-20",
      Status: "Due Soon"
    },
    {
      Employee: "Michael Johnson",
      TrainingType: "Hazardous Materials",
      CompletionDate: "2024-06-10",
      ExpirationDate: "2024-12-10",
      Status: "Expired"
    }
  ];

  // Function to generate and download Excel template
  const downloadTemplate = () => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert the sample data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Training Certificates");
    
    // Write the workbook and trigger a download
    XLSX.writeFile(workbook, "training_certificates_template.xlsx");
  };

  return (
    <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-medium text-blue-800">Excel Template</h3>
        <button
          onClick={() => setShowTemplate(!showTemplate)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showTemplate ? "Hide" : "Show"} Format
        </button>
      </div>
      
      {showTemplate && (
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 border">Employee</th>
                <th className="px-3 py-2 border">TrainingType</th>
                <th className="px-3 py-2 border">CompletionDate</th>
                <th className="px-3 py-2 border">ExpirationDate</th>
                <th className="px-3 py-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="px-3 py-2 border">{row.Employee}</td>
                  <td className="px-3 py-2 border">{row.TrainingType}</td>
                  <td className="px-3 py-2 border">{row.CompletionDate}</td>
                  <td className="px-3 py-2 border">{row.ExpirationDate}</td>
                  <td className="px-3 py-2 border">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                      row.Status === "Current" ? "bg-green-100 text-green-800" :
                      row.Status === "Due Soon" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {row.Status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="flex items-center">
        <button
          onClick={downloadTemplate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Download Template
        </button>
        <p className="ml-3 text-sm text-blue-800">
          Use this template to prepare your training certificate data
        </p>
      </div>
    </div>
  );
};

export default ExcelTemplateDisplay;