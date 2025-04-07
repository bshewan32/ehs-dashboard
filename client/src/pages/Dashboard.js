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
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Link to="/report/new">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700">
            + Create New Report
          </button>
        </Link>
      </div>

      {loading && !metrics ? (
        <div className="text-center p-10 text-gray-500">
          <div className="text-xl">Loading dashboard data...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded shadow mb-4">
          <div className="font-bold">Error loading dashboard data</div>
          <div>{error}</div>
          <div className="mt-2">Using fallback data for display purposes.</div>
        </div>
      ) : null}

      <div className="bg-white p-4 rounded shadow">
        <CompanyFilter 
          onChange={handleCompanyChange}
          selectedCompany={selectedCompany}
        />
        
        {selectedCompany && (
          <div className="mt-2 text-sm text-blue-600">
            Showing metrics for: <span className="font-semibold">{selectedCompany}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Pass the metrics explicitly to each component */}
        <MetricsOverview metrics={metrics} companyName={selectedCompany} />
        <KPIOverview metrics={metrics} companyName={selectedCompany} />
        <TrendCharts selectedCompany={selectedCompany} />
        <AIPanel metrics={metrics} companyName={selectedCompany} />
        {/* Only show company comparison when not filtering to a specific company */}
        {!selectedCompany && <CompanyComparison />}
      </div>
    </div>
  );
}