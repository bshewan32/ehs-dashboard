// client/src/pages/KPIManagementPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchKPIs, saveKPI, deleteKPI, updateKPI } from '../components/services/kpiApi';
import KPIForm from '../components/kpi/KPIForm';
import KPIList from '../components/kpi/KPIList';

const KPIManagementPage = () => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load KPIs on component mount and when refresh is triggered
  useEffect(() => {
    loadKPIs();
  }, [refreshTrigger]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchKPIs();
      setKpis(data || []);
    } catch (err) {
      console.error('Error loading KPIs:', err);
      setError('Failed to load KPIs');
      setKpis([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKPI = () => {
    setEditingKPI(null);
    setShowForm(true);
  };

  const handleEditKPI = (kpi) => {
    setEditingKPI(kpi);
    setShowForm(true);
  };

  const handleFormSubmit = async (kpiData) => {
    try {
      if (editingKPI) {
        // Update existing KPI
        await updateKPI(editingKPI._id || editingKPI.id, kpiData);
      } else {
        // Create new KPI
        await saveKPI(kpiData);
      }
      
      // Refresh the list
      setRefreshTrigger(prev => prev + 1);
      setShowForm(false);
      setEditingKPI(null);
    } catch (err) {
      console.error('Error saving KPI:', err);
      setError(`Failed to ${editingKPI ? 'update' : 'create'} KPI: ${err.message}`);
    }
  };

  const handleDeleteKPI = async (kpiId) => {
    if (!window.confirm('Are you sure you want to delete this KPI?')) {
      return;
    }

    try {
      await deleteKPI(kpiId);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error deleting KPI:', err);
      setError('Failed to delete KPI');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingKPI(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">KPI Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your Key Performance Indicators for safety metrics
            </p>
          </div>
          <Link 
            to="/" 
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Current KPIs ({kpis.length})
              </h2>
              {loading && (
                <div className="flex items-center text-gray-500">
                  <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadKPIs}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={handleAddKPI}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New KPI
              </button>
            </div>
          </div>
        </div>

        {/* KPI Form */}
        {showForm && (
          <div className="mb-6">
            <KPIForm
              kpi={editingKPI}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {/* KPI List */}
        <KPIList
          kpis={kpis}
          loading={loading}
          onEdit={handleEditKPI}
          onDelete={handleDeleteKPI}
        />
      </div>
    </div>
  );
};

export default KPIManagementPage;