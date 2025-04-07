import React, { useState, useEffect } from 'react';
import { fetchReports } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CompanyComparison = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        // Format the data for the chart
        const comparisonMetrics = [
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
          },
          {
            name: 'Training Compliance',
            ...Object.fromEntries(
              latestReportsByCompany.map(report => [
                report.companyName,
                report.metrics?.trainingCompliance ?? 0
              ])
            )
          }
        ];
        
        setComparisonData(comparisonMetrics);
        setLoading(false);
      } catch (error) {
        console.error('Error generating comparison data:', error);
        setError('Failed to generate comparison');
        setLoading(false);
      }
    };
    
    generateComparisonData();
  }, [selectedCompanies]);

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

  if (loading && comparisonData.length === 0) {
    return <div className="text-center py-8">Loading company comparison data...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Company Comparison</h2>
      
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">Select Companies to Compare:</h3>
        <div className="flex flex-wrap gap-2">
          {companies.map((company, index) => (
            <button
              key={index}
              onClick={() => handleCompanyToggle(company)}
              className={`px-3 py-1 text-sm rounded-full ${
                selectedCompanies.includes(company)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {company}
            </button>
          ))}
        </div>
      </div>
      
      {selectedCompanies.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Select at least one company to compare</p>
      ) : (
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={comparisonData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
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
        </div>
      )}
    </div>
  );
};

export default CompanyComparison;