import React, { useState, useEffect } from 'react';
import { fetchReports } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CompanyComparison = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('lagging'); // 'lagging' or 'leading'

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const reports = await fetchReports();
        
        // Extract unique company names
        const uniqueCompanies = [...new Set(reports.map(report => report.companyName))];
        setCompanies(uniqueCompanies);
        
        // Default: select up to 3 companies for comparison if available
        const initialSelected = uniqueCompanies.slice(0, Math.min(3, uniqueCompanies.length));
        setSelectedCompanies(initialSelected);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading companies:', error);
        setError('Failed to load company data');
        setLoading(false);
      }
    };
    
    loadCompanies();
  }, []);

  // When selected companies change, update comparison data
  useEffect(() => {
    const generateComparisonData = async () => {
      if (selectedCompanies.length === 0) return;
      
      try {
        setLoading(true);
        const reports = await fetchReports();
        
        // Get the most recent report for each selected company
        const latestReportsByCompany = selectedCompanies.map(company => {
          const companyReports = reports.filter(report => report.companyName === company);
          // Sort by date to get most recent
          companyReports.sort((a, b) => 
            new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0)
          );
          return companyReports[0] || null;
        }).filter(report => report !== null);
        
        // Format lagging indicator data
        const laggingMetrics = [
          {
            name: 'Incidents',
            ...Object.fromEntries(
              latestReportsByCompany.map(report => [
                report.companyName,
                report.metrics?.lagging?.incidentCount ?? 
                report.metrics?.totalIncidents ?? 0
              ])
            )
          },
          {
            name: 'Near Misses',
            ...Object.fromEntries(
              latestReportsByCompany.map(report => [
                report.companyName,
                report.metrics?.lagging?.nearMissCount ?? 
                report.metrics?.totalNearMisses ?? 0
              ])
            )
          },
          {
            name: 'First Aid Cases',
            ...Object.fromEntries(
              latestReportsByCompany.map(report => [
                report.companyName,
                report.metrics?.lagging?.firstAidCount ?? 
                report.metrics?.firstAidCount ?? 0
              ])
            )
          },
          {
            name: 'Medical Treatments',
            ...Object.fromEntries(
              latestReportsByCompany.map(report => [
                report.companyName,
                report.metrics?.lagging?.medicalTreatmentCount ?? 
                report.metrics?.medicalTreatmentCount ?? 0
              ])
            )
          }
        ];
        
        // Format leading indicator data
        const leadingMetrics = [
          {
            name: 'Training Compliance',
            ...Object.fromEntries(
              latestReportsByCompany.map(report => [
                report.companyName,
                report.metrics?.trainingCompliance ?? 0
              ])
            )
          },
          {
            name: 'Risk Score',
            ...Object.fromEntries(
              latestReportsByCompany.map(report => [
                report.companyName,
                report.metrics?.riskScore ?? 0
              ])
            )
          }
        ];
        
        // Add KPI data if available
        latestReportsByCompany.forEach(report => {
          const kpis = report.metrics?.leading?.kpis || [];
          
          kpis.forEach(kpi => {
            // Check if this KPI name already exists in leadingMetrics
            const existingKpi = leadingMetrics.find(item => item.name === kpi.name);
            
            if (existingKpi) {
              // Update existing KPI with this company's value
              existingKpi[report.companyName] = kpi.actual || 0;
            } else {
              // Create a new KPI entry
              const newKpi = {
                name: kpi.name,
                [report.companyName]: kpi.actual || 0
              };
              leadingMetrics.push(newKpi);
            }
          });
        });
        
        // Set the data based on active tab
        setComparisonData(activeTab === 'lagging' ? laggingMetrics : leadingMetrics);
        setLoading(false);
      } catch (error) {
        console.error('Error generating comparison data:', error);
        setError('Failed to generate comparison');
        setLoading(false);
      }
    };
    
    generateComparisonData();
  }, [selectedCompanies, activeTab]);

  const handleCompanyToggle = (company) => {
    setSelectedCompanies(prev => {
      if (prev.includes(company)) {
        return prev.filter(c => c !== company);
      } else {
        return [...prev, company];
      }
    });
  };

  const getRandomColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
    return colors[index % colors.length];
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="text-gray-700 font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center mb-1">
              <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.color }}></div>
              <span className="text-sm">{entry.name}: <b>{entry.value}</b></span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-700 text-white">
        <h2 className="text-xl font-semibold flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Company Comparison
        </h2>
        <p className="text-sm text-gray-300">Compare safety metrics across companies</p>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`pb-2 px-4 ${activeTab === 'lagging' 
              ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('lagging')}
          >
            Lagging Indicators
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'leading' 
              ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('leading')}
          >
            Leading Indicators
          </button>
        </div>
        
        {/* Company Selection */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-gray-700">Select Companies to Compare:</h3>
          <div className="flex flex-wrap gap-2">
            {companies.map((company, index) => (
              <button
                key={index}
                onClick={() => handleCompanyToggle(company)}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
                  selectedCompanies.includes(company)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {company}
              </button>
            ))}
          </div>
        </div>

        {/* Loading, Error, or Empty States */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-24 w-24 bg-gray-200 rounded-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <svg className="w-10 h-10 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
            <p className="text-red-600 text-sm mt-1">Please try again later</p>
          </div>
        ) : selectedCompanies.length === 0 ? (
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <svg className="w-10 h-10 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-blue-700 font-medium">Select at least one company to compare</p>
          </div>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {selectedCompanies.map((company, index) => (
                  <Bar 
                    key={company} 
                    dataKey={company} 
                    fill={getRandomColor(index)} 
                    name={company}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            
            {/* Chart notes */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-sm">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">
                  {activeTab === 'lagging' 
                    ? 'Lower values for lagging indicators (incidents, etc.) are generally better.' 
                    : 'Higher values for leading indicators (compliance, etc.) are generally better.'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyComparison;