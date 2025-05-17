// client/src/components/training/SingleRecordForm.js
import React, { useState } from 'react';

const SingleRecordForm = ({ onRecordSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    employee: '',
    courseTitle: '',
    courseType: '',
    status: 'Completed',
    completionDate: '',
    expiryDate: '',
    department: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error on change
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.employee.trim()) {
      newErrors.employee = 'Employee name is required';
    }
    
    if (!formData.courseTitle.trim()) {
      newErrors.courseTitle = 'Course title is required';
    }
    
    if (!formData.status.trim()) {
      newErrors.status = 'Status is required';
    }
    
    // Validate dates based on the status
    if (formData.status === 'Completed' && !formData.completionDate) {
      newErrors.completionDate = 'Completion date is required for completed courses';
    }
    
    // If expiry date is entered, make sure it's after completion date
    if (formData.completionDate && formData.expiryDate) {
      const completionDate = new Date(formData.completionDate);
      const expiryDate = new Date(formData.expiryDate);
      
      if (expiryDate <= completionDate) {
        newErrors.expiryDate = 'Expiry date must be after completion date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Format dates for consistency
      const record = {
        ...formData,
        completionDate: formData.completionDate ? new Date(formData.completionDate).toISOString().split('T')[0] : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : null
      };
      
      onRecordSubmit(record);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Add New Training Record</h2>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Employee */}
          <div>
            <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
              Employee Name*
            </label>
            <input
              type="text"
              id="employee"
              name="employee"
              value={formData.employee}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.employee ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.employee && (
              <p className="mt-1 text-sm text-red-600">{errors.employee}</p>
            )}
          </div>
          
          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Course Title */}
          <div>
            <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Course Title*
            </label>
            <input
              type="text"
              id="courseTitle"
              name="courseTitle"
              value={formData.courseTitle}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.courseTitle ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.courseTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.courseTitle}</p>
            )}
          </div>
          
          {/* Course Type */}
          <div>
            <label htmlFor="courseType" className="block text-sm font-medium text-gray-700 mb-1">
              Course Type
            </label>
            <input
              type="text"
              id="courseType"
              name="courseType"
              value={formData.courseType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status*
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.status ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Expired">Expired</option>
              <option value="Not Started">Not Started</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status}</p>
            )}
          </div>
          
          {/* Completion Date */}
          <div>
            <label htmlFor="completionDate" className="block text-sm font-medium text-gray-700 mb-1">
              Completion Date{formData.status === 'Completed' ? '*' : ''}
            </label>
            <input
              type="date"
              id="completionDate"
              name="completionDate"
              value={formData.completionDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.completionDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.completionDate && (
              <p className="mt-1 text-sm text-red-600">{errors.completionDate}</p>
            )}
          </div>
          
          {/* Expiry Date */}
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.expiryDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.expiryDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
            )}
          </div>
        </div>
        
        {/* Notes */}
        <div className="mb-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Record
          </button>
        </div>
      </form>
    </div>
  );
};

export default SingleRecordForm;