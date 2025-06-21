// client/src/components/kpi/KPIForm.js
import React, { useState, useEffect } from 'react';

const KPIForm = ({ kpi, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target: '',
    actual: '',
    unit: '%',
    category: 'Safety',
    frequency: 'Monthly',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (kpi) {
      setFormData({
        name: kpi.name || '',
        description: kpi.description || '',
        target: kpi.target || '',
        actual: kpi.actual || '',
        unit: kpi.unit || '%',
        category: kpi.category || 'Safety',
        frequency: kpi.frequency || 'Monthly',
        isActive: kpi.isActive !== undefined ? kpi.isActive : true
      });
    }
  }, [kpi]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'KPI name is required';
    }

    if (!formData.target || isNaN(formData.target) || parseFloat(formData.target) <= 0) {
      newErrors.target = 'Target must be a positive number';
    }

    if (!formData.actual || isNaN(formData.actual) || parseFloat(formData.actual) < 0) {
      newErrors.actual = 'Actual value must be a non-negative number';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Convert numeric fields
      const submitData = {
        ...formData,
        target: parseFloat(formData.target),
        actual: parseFloat(formData.actual),
        // Generate ID if not editing
        id: kpi?.id || `kpi_${Date.now()}`
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting KPI:', error);
      setErrors({ submit: 'Failed to save KPI. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {kpi ? 'Edit KPI' : 'Add New KPI'}
        </h2>
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
          {/* KPI Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              KPI Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Near Miss Reporting Rate"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what this KPI measures and its importance"
            />
          </div>

          {/* Target Value */}
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-1">
              Target Value*
            </label>
            <input
              type="number"
              id="target"
              name="target"
              value={formData.target}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.target ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="100"
            />
            {errors.target && (
              <p className="mt-1 text-sm text-red-600">{errors.target}</p>
            )}
          </div>

          {/* Actual Value */}
          <div>
            <label htmlFor="actual" className="block text-sm font-medium text-gray-700 mb-1">
              Current Value*
            </label>
            <input
              type="number"
              id="actual"
              name="actual"
              value={formData.actual}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.actual ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="85"
            />
            {errors.actual && (
              <p className="mt-1 text-sm text-red-600">{errors.actual}</p>
            )}
          </div>

          {/* Unit */}
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit*
            </label>
            <select
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.unit ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="%">Percentage (%)</option>
              <option value="count">Count</option>
              <option value="rate">Rate</option>
              <option value="days">Days</option>
              <option value="hours">Hours</option>
              <option value="score">Score</option>
            </select>
            {errors.unit && (
              <p className="mt-1 text-sm text-red-600">{errors.unit}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Safety">Safety</option>
              <option value="Training">Training</option>
              <option value="Compliance">Compliance</option>
              <option value="Environmental">Environmental</option>
              <option value="Health">Health</option>
              <option value="Quality">Quality</option>
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
              Reporting Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annually">Annually</option>
            </select>
          </div>

          {/* Active Status */}
          <div className="md:col-span-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active KPI (displayed on dashboard)
              </label>
            </div>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              submitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? 'Saving...' : (kpi ? 'Update KPI' : 'Create KPI')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KPIForm;