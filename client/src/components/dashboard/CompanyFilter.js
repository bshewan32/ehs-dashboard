// client/src/components/dashboard/CompanyFilter.js
import React, { useEffect, useState } from 'react';
import { fetchReports } from '../services/api';

const CompanyFilter = ({ onChange, selectedCompany }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const reports = await fetchReports();
        
        // Extract unique company names
        const uniqueCompanies = [...new Set(reports.map(report => report.companyName))];
        setCompanies(['All Companies', ...uniqueCompanies]);
      } catch (error) {
        console.error('Error loading companies:', error);
        setCompanies(['All Companies']);
      } finally {
        setLoading(false);
      }
    };
    
    loadCompanies();
  }, []);
  
  const handleChange = (e) => {
    const company = e.target.value === 'All Companies' ? null : e.target.value;
    onChange(company);
  };
  
  return (
    <div className="mb-4">
      <label htmlFor="company-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Filter by Company:
      </label>
      <select
        id="company-filter"
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        onChange={handleChange}
        value={selectedCompany || 'All Companies'}
        disabled={loading}
      >
        {companies.map((company, index) => (
          <option key={index} value={company}>
            {company}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CompanyFilter;