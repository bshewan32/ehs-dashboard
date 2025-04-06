// client/src/components/debug/FormDataDebug.js
import React, { useState } from 'react';

const FormDataDebug = ({ formData }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!formData) return null;
  
  return (
    <div className="mt-8 border-t pt-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
      >
        <span>{isOpen ? 'Hide' : 'Show'} Form Data Structure</span>
        <svg 
          className={`h-4 w-4 ml-1 transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
            clipRule="evenodd"
          />
        </svg>
      </button>
      
      {isOpen && (
        <div className="mt-4 bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">Form Data Structure (Debug View)</h3>
            <div className="text-xs text-gray-500">This is what will be sent to the server</div>
          </div>
          
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96 text-gray-800">
            {JSON.stringify(formData, null, 2)}
          </pre>
          
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <div>Remove this component in production</div>
            <div>Use this to verify data structure</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormDataDebug;