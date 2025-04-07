import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import KPIOverview from '../components/dashboard/KPIOverview';
import AIPanel from '../components/dashboard/AIPanel';
import TrendCharts from '../components/dashboard/TrendCharts';
import CompanyFilter from '../components/dashboard/CompanyFilter';
import CompanyComparison from '../components/dashboard/CompanyComparison';
import { fetchReports, fetchMetricsSummary, fetchCompanyMetrics } from '../components/services/api';

const api_url = process.env.REACT_APP_API_URL;

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [reports, setReports] = useState([]);

  // Setup default KPIs to ensure they're always available
  const defaultKpis = [
    { 
      id: 'nearMissRate',
      name: 'Near Miss Reporting Rate',
      actual: 0,
      target: 100,
      unit: '%' 
    },
    { 
      id: 'criticalRiskVerification',
      name: 'Critical Risk Control Verification',
      actual: 0,
      target: 95,
      unit: '%' 
    },
    { 
      id: 'electricalSafetyCompliance',
      name: 'Electrical Safety Compliance',
      actual: 0,
      target: 100,
      unit: '%' 
    },
  ];

  // Handle company filter change
  const handleCompanyChange = (company) => {
    setSelectedCompany(company);
    processMetricsForCompany(company);
  };

  // Process metrics based on selected company
  const processMetricsForCompany = async (company) => {
    if (!reports || reports.length === 0) return;

    try {
      if (company) {
        // Use the specialized company metrics API
        const companyMetrics = await fetchCompanyMetrics(company);
        setMetrics(companyMetrics);
      } else {
        // Use the general metrics summary API
        const data = await fetchMetricsSummary();
        
        // Create a properly structured metrics object
        const processedMetrics = {
          // Ensure these properties exist with fallbacks
          totalIncidents: data.totalIncidents ?? 0,
          totalNearMisses: data.totalNearMisses ?? 0,
          firstAidCount: data.firstAidCount ?? 0,
          medicalTreatmentCount: data.medicalTreatmentCount ?? 0,
          trainingCompliance: data.trainingCompliance ?? 0,
          riskScore: data.riskScore ?? 0,
          
          // Ensure the leading object exists
          leading: {
            ...data.leading,
            // Either use existing KPIs or defaults
            kpis: (data.leading?.kpis && data.leading.kpis.length > 0) 
              ? data.leading.kpis 
              : defaultKpis
          },
          
          // Create lagging metrics if they don't exist
          lagging: data.lagging || {
            incidentCount: data.totalIncidents ?? 0,
            nearMissCount: data.totalNearMisses ?? 0,
            firstAidCount: data.firstAidCount ?? 0,
            medicalTreatmentCount: data.medicalTreatmentCount ?? 0
          }
        };
        
        // Store processed metrics
        setMetrics(processedMetrics);
      }
    } catch (error) {
      console.error('Error processing metrics for company:', error);
      setMetrics(createDefaultMetrics());
    }
  };

  // Create default metrics object for fallback
  const createDefaultMetrics = () => {
    return {
      totalIncidents: 0,
      totalNearMisses: 0,
      firstAidCount: 0,
      medicalTreatmentCount: 0,
      trainingCompliance: 0,
      riskScore: 0,
      lagging: {
        incidentCount: 0,
        nearMissCount: 0,
        firstAidCount: 0,
        medicalTreatmentCount: 0
      },
      leading: {
        trainingCompleted: 0,
        inspectionsCompleted: 0,
        kpis: defaultKpis
      }
    };
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch all reports first
        const reportData = await fetchReports();
        setReports(reportData);
        
        if (selectedCompany) {
          // Process metrics for selected company
          processMetricsForCompany(selectedCompany);
        } else {
          // Use the API service to get metrics summary
          const data = await fetchMetricsSummary();
          
          // Create a properly structured metrics object
          const processedMetrics = {
            // Ensure these properties exist with fallbacks
            totalIncidents: data.totalIncidents ?? 0,
            totalNearMisses: data.totalNearMisses ?? 0,
            firstAidCount: data.firstAidCount ?? 0,
            medicalTreatmentCount: data.medicalTreatmentCount ?? 0,
            trainingCompliance: data.trainingCompliance ?? 0,
            riskScore: data.riskScore ?? 0,
            
            // Ensure the leading object exists
            leading: {
              ...data.leading,
              // Either use existing KPIs or defaults
              kpis: (data.leading?.kpis && data.leading.kpis.length > 0) 
                ? data.leading.kpis 
                : defaultKpis
            },
            
            // Create lagging metrics if they don't exist
            lagging: data.lagging || {
              incidentCount: data.totalIncidents ?? 0,
              nearMissCount: data.totalNearMisses ?? 0,
              firstAidCount: data.firstAidCount ?? 0,
              medicalTreatmentCount: data.medicalTreatmentCount ?? 0
            }
          };
          
          // Store processed metrics
          setMetrics(processedMetrics);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setMetrics(createDefaultMetrics());
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    
    // Refresh data every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [selectedCompany]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section with gradient background */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-md">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold">EHS Dashboard</h1>
              <p className="mt-1 text-blue-100">Environmental Health & Safety Metrics</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Link to="/report/new">
                <button className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg shadow-sm font-medium transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50">
                  + Create Report
                </button>
              </Link>
              <Link to="/inspections">
                <button className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm font-medium border border-blue-400 transition duration-150 ease-in-out">
                  View Inspections
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Loading and error states */}
        {loading && !metrics ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-400 mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-24 mb-6"></div>
              <div className="h-2 bg-gray-300 rounded w-32"></div>
              <div className="mt-4 text-gray-500">Loading dashboard data...</div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow mb-6 animate-bounce">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="font-medium">Error loading dashboard data</h3>
                <p className="text-sm">{error}</p>
                <p className="text-sm mt-2">Using fallback data for display purposes.</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Company filter card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition duration-300 ease-in-out transform hover:shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Filter</h2>
          <CompanyFilter 
            onChange={handleCompanyChange}
            selectedCompany={selectedCompany}
          />
          
          {selectedCompany && (
            <div className="mt-3 flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                </svg>
                Showing data for: {selectedCompany}
              </span>
              <button 
                onClick={() => handleCompanyChange(null)} 
                className="ml-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* Main dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pass the metrics explicitly to each component */}
          <MetricsOverview metrics={metrics} companyName={selectedCompany} />
          <KPIOverview metrics={metrics} companyName={selectedCompany} />
        </div>

        <div className="mt-6">
          <TrendCharts selectedCompany={selectedCompany} />
        </div>

        <div className="mt-6">
          <AIPanel metrics={metrics} companyName={selectedCompany} />
        </div>
        
        {/* Only show company comparison when not filtering to a specific company */}
        {!selectedCompany && (
          <div className="mt-6">
            <CompanyComparison />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold">EHS Dashboard</h3>
              <p className="text-sm text-gray-400">Version 1.0</p>
            </div>
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}