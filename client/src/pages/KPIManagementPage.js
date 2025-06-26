// client/src/pages/KPIManagementPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchKPIs, saveKPI, deleteKPI, updateKPI, markKPIDataChanged } from '../components/services/kpiApi';
import KPIForm from '../components/kpi/KPIForm';
import KPIList from '../components/kpi/KPIList';

const KPIManagementPage = () => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Load KPIs on component mount and when refresh is triggered
  useEffect(() => {
    loadKPIs();
  }, [refreshTrigger]);

  const loadKPIs = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      console.log('KPIManagementPage: Loading KPIs...', forceRefresh ? '(forced)' : '');
      
      // Force refresh to bypass cache
      const data = await fetchKPIs(forceRefresh);
      setKpis(data || []);
      console.log('KPIManagementPage: Loaded', data?.length || 0, 'KPIs');
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
    setError(null); // Clear any existing errors
  };

  const handleEditKPI = (kpi) => {
    setEditingKPI(kpi);
    setShowForm(true);
    setError(null); // Clear any existing errors
  };

  const handleFormSubmit = async (kpiData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      console.log('KPIManagementPage: Submitting KPI data:', kpiData);
      
      let result;
      if (editingKPI) {
        // Update existing KPI
        console.log('KPIManagementPage: Updating KPI with ID:', editingKPI.id || editingKPI._id);
        result = await updateKPI(editingKPI.id || editingKPI._id, kpiData);
      } else {
        // Create new KPI
        console.log('KPIManagementPage: Creating new KPI');
        result = await saveKPI(kpiData);
      }
      
      console.log('KPIManagementPage: KPI operation completed:', result);
      
      // Mark data as changed for cross-component synchronization
      markKPIDataChanged();
      
      // Force refresh the local list
      await loadKPIs(true);
      
      // Close the form
      setShowForm(false);
      setEditingKPI(null);
      
      // Show success message briefly
      const successMessage = editingKPI ? 'KPI updated successfully!' : 'KPI created successfully!';
      console.log(successMessage);
      
    } catch (err) {
      console.error('Error saving KPI:', err);
      setError(`Failed to ${editingKPI ? 'update' : 'create'} KPI: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKPI = async (kpiId) => {
    if (!window.confirm('Are you sure you want to delete this KPI? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      console.log('KPIManagementPage: Deleting KPI with ID:', kpiId);
      
      await deleteKPI(kpiId);
      console.log('KPIManagementPage: KPI deleted successfully');
      
      // Mark data as changed for cross-component synchronization
      markKPIDataChanged();
      
      // Force refresh the local list
      await loadKPIs(true);
      
    } catch (err) {
      console.error('Error deleting KPI:', err);
      setError(`Failed to delete KPI: ${err.message}`);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingKPI(null);
    setError(null); // Clear any form-related errors
  };

  const handleRefreshClick = () => {
    console.log('KPIManagementPage: Manual refresh triggered');
    loadKPIs(true); // Force refresh
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
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
            <div className="flex">
              <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-700 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
              {submitting && (
                <div className="flex items-center text-blue-500">
                  <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefreshClick}
                disabled={loading || submitting}
                className={`px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                  (loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className={`w-4 h-4 mr-1 inline ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleAddKPI}
                disabled={loading || submitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                  (loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
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

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>KPIs loaded: {kpis.length}</div>
              <div>Loading: {loading.toString()}</div>
              <div>Submitting: {submitting.toString()}</div>
              <div>Show form: {showForm.toString()}</div>
              <div>Editing: {editingKPI ? (editingKPI.name || editingKPI.id) : 'none'}</div>
              <div>Refresh trigger: {refreshTrigger}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPIManagementPage;