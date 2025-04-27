import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
const api_url = process.env.REACT_APP_API_URL;

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('reportPeriod');
  const [sortDirection, setSortDirection] = useState('desc');
  const [companyFilter, setCompanyFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const response = await fetch(`${api_url}/api/reports`);
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        const data = await response.json();
        setReports(data);
        
        // Extract unique companies and periods for filters
        const uniqueCompanies = [...new Set(data.map(report => report.companyName))].filter(Boolean);
        const uniquePeriods = [...new Set(data.map(report => report.reportPeriod))].filter(Boolean);
        
        setCompanies(uniqueCompanies);
        setPeriods(uniquePeriods);
        setError(null);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  // Sort reports based on current sort field and direction
  const sortedReports = [...reports]
    .filter(report => !companyFilter || report.companyName === companyFilter)
    .filter(report => !periodFilter || report.reportPeriod === periodFilter)
    .sort((a, b) => {
      let aValue, bValue;
      
      // Handle nested properties based on sortField
      if (sortField === 'incidents') {
        aValue = a.metrics?.lagging?.incidentCount ?? a.metrics?.totalIncidents ?? 0;
        bValue = b.metrics?.lagging?.incidentCount ?? b.metrics?.totalIncidents ?? 0;
      } else if (sortField === 'nearMisses') {
        aValue = a.metrics?.lagging?.nearMissCount ?? a.metrics?.totalNearMisses ?? 0;
        bValue = b.metrics?.lagging?.nearMissCount ?? b.metrics?.totalNearMisses ?? 0;
      } else if (sortField === 'firstAids') {
        aValue = a.metrics?.lagging?.firstAidCount ?? a.metrics?.firstAidCount ?? 0;
        bValue = b.metrics?.lagging?.firstAidCount ?? b.metrics?.firstAidCount ?? 0;
      } else if (sortField === 'medicalTreatments') {
        aValue = a.metrics?.lagging?.medicalTreatmentCount ?? a.metrics?.medicalTreatmentCount ?? 0;
        bValue = b.metrics?.lagging?.medicalTreatmentCount ?? b.metrics?.medicalTreatmentCount ?? 0;
      } else if (sortField === 'lostTimeInjuries') {
        aValue = a.metrics?.lagging?.lostTimeInjuryCount ?? 0;
        bValue = b.metrics?.lagging?.lostTimeInjuryCount ?? 0;
      } else if (sortField === 'trainingCompliance') {
        aValue = a.metrics?.trainingCompliance ?? 0;
        bValue = b.metrics?.trainingCompliance ?? 0;
      } else if (sortField === 'riskScore') {
        aValue = a.metrics?.riskScore ?? 0;
        bValue = b.metrics?.riskScore ?? 0;
      } else {
        // Default to direct property
        aValue = a[sortField] || '';
        bValue = b[sortField] || '';
      }
      
      // Sort strings properly
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      // Sort numbers properly
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

  // Handle column header click to change sort
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending for dates and ascending for others
      setSortField(field);
      setSortDirection(field === 'reportPeriod' ? 'desc' : 'asc');
    }
  };

  // Helper to render sort indicator arrow
  const getSortIndicator = (field) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  // Reset all filters
  const clearFilters = () => {
    setCompanyFilter('');
    setPeriodFilter('');
  };

  // Export to PDF
  const exportToPDF = async () => {
    const reportsElement = document.getElementById('reports-table');
    if (!reportsElement) return;
    
    try {
      setExporting(true);
      
      // Create a PDF document
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape mode
      
      // Add title
      pdf.setFontSize(16);
      pdf.text('EHS Reports', 149, 15, { align: 'center' });
      pdf.setFontSize(12);
      
      // Add filters information if applied
      if (companyFilter || periodFilter) {
        let filterText = 'Filters applied: ';
        if (companyFilter) filterText += `Company: ${companyFilter} `;
        if (periodFilter) filterText += `Period: ${periodFilter}`;
        pdf.text(filterText, 149, 22, { align: 'center' });
      }
      
      // Create a canvas from the table
      const canvas = await html2canvas(reportsElement, {
        scale: 1.5,
        useCORS: true,
        logging: false
      });
      
      // Add canvas image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 30, 277, 0);
      
      // Download the PDF
      pdf.save(`EHS_Reports_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting reports to PDF:', error);
      alert('Failed to export reports to PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reports</h2>
        <div className="space-x-4">
          <button
            onClick={exportToPDF}
            className="bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700"
            disabled={exporting || reports.length === 0}
          >
            {exporting ? 'Exporting...' : 'Export to PDF'}
          </button>
          <Link to="/">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-xl shadow hover:bg-purple-700">
              Dashboard
            </button>
          </Link>
          <Link to="/report/new">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700">
              + Create New Report
            </button>
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="company-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <select
              id="company-filter"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Companies</option>
              {companies.map((company, index) => (
                <option key={index} value={company}>{company}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="period-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Reporting Period
            </label>
            <select
              id="period-filter"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Periods</option>
              {periods.map((period, index) => (
                <option key={index} value={period}>{period}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={clearFilters}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded shadow hover:bg-gray-300"
          >
            Clear Filters
          </button>
          
          <div className="ml-auto text-gray-500 text-sm">
            Showing {sortedReports.length} of {reports.length} reports
          </div>
        </div>
      </div>
      
      {/* Loading and error states */}
      {loading ? (
        <div className="text-center p-10 text-gray-500">
          <div className="text-xl">Loading reports data...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded shadow mb-4">
          <div className="font-bold">Error loading reports</div>
          <div>{error}</div>
        </div>
      ) : sortedReports.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 p-8 rounded shadow mb-4 text-center">
          <div className="text-xl mb-2">No reports found</div>
          <p className="mb-4">
            {reports.length > 0 ? 'Try adjusting your filters to see more results.' : 'Create your first report to get started.'}
          </p>
          <Link to="/report/new">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700">
              Create New Report
            </button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow" id="reports-container">
          <table className="min-w-full" id="reports-table">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200" 
                  onClick={() => handleSort('companyName')}
                >
                  Company{getSortIndicator('companyName')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200" 
                  onClick={() => handleSort('reportPeriod')}
                >
                  Period{getSortIndicator('reportPeriod')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200" 
                  onClick={() => handleSort('reportType')}
                >
                  Type{getSortIndicator('reportType')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200" 
                  onClick={() => handleSort('incidents')}
                >
                  Incidents{getSortIndicator('incidents')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200" 
                  onClick={() => handleSort('nearMisses')}
                >
                  Near Misses{getSortIndicator('nearMisses')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200" 
                  onClick={() => handleSort('firstAids')}
                >
                  First Aids{getSortIndicator('firstAids')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200" 
                  onClick={() => handleSort('medicalTreatments')}
                >
                  Medical Treatments{getSortIndicator('medicalTreatments')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200" 
                  onClick={() => handleSort('lostTimeInjuries')}
                >
                  Lost Time Injuries{getSortIndicator('lostTimeInjuries')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200" 
                  onClick={() => handleSort('trainingCompliance')}
                >
                  Training Compliance (%){getSortIndicator('trainingCompliance')}
                </th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200" 
                  onClick={() => handleSort('riskScore')}
                >
                  Risk Score{getSortIndicator('riskScore')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.map((report) => (
                <tr key={report._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{report.companyName}</td>
                  <td className="px-4 py-3">{report.reportPeriod}</td>
                  <td className="px-4 py-3">{report.reportType}</td>
                  <td className="px-4 py-3">{report.metrics?.lagging?.incidentCount ?? report.metrics?.totalIncidents ?? 0}</td>
                  <td className="px-4 py-3">{report.metrics?.lagging?.nearMissCount ?? report.metrics?.totalNearMisses ?? 0}</td>
                  <td className="px-4 py-3">{report.metrics?.lagging?.firstAidCount ?? report.metrics?.firstAidCount ?? 0}</td>
                  <td className="px-4 py-3">{report.metrics?.lagging?.medicalTreatmentCount ?? report.metrics?.medicalTreatmentCount ?? 0}</td>
                  <td className="px-4 py-3">{report.metrics?.lagging?.lostTimeInjuryCount ?? 0}</td>
                  <td className="px-4 py-3">{report.metrics?.trainingCompliance ?? 0}</td>
                  <td className="px-4 py-3">{report.metrics?.riskScore ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}