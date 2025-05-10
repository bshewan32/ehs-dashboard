import React, { useEffect, useState } from 'react';
import { fetchInspections } from '../services/api';

const InspectionsWidget = ({ periodFilter, companyFilter }) => {
  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    highRisk: 0
  });

  useEffect(() => {
    const loadInspections = async () => {
      setIsLoading(true);
      try {
        const data = await fetchInspections();
        
        // Filter inspections by period if needed
        let filteredInspections = data;
        
        if (periodFilter && periodFilter.type === 'month') {
          // Filter for specific month
          filteredInspections = data.filter(insp => {
            const inspDate = new Date(insp.date);
            return inspDate.getMonth() === periodFilter.month && 
                   inspDate.getFullYear() === periodFilter.year;
          });
        } else if (periodFilter && periodFilter.type === 'range') {
          // Filter for last X months
          const monthsAgo = new Date();
          monthsAgo.setMonth(monthsAgo.getMonth() - periodFilter.months);
          
          filteredInspections = data.filter(insp => {
            const inspDate = new Date(insp.date);
            return inspDate >= monthsAgo;
          });
        } else if (periodFilter && periodFilter.type === 'quarter') {
          // Filter for specific quarter
          const quarterStartMonth = (periodFilter.quarter - 1) * 3;
          const quarterEndMonth = quarterStartMonth + 2;
          
          filteredInspections = data.filter(insp => {
            const inspDate = new Date(insp.date);
            return inspDate.getMonth() >= quarterStartMonth && 
                   inspDate.getMonth() <= quarterEndMonth && 
                   inspDate.getFullYear() === periodFilter.year;
          });
        }
        
        // Filter by company if needed
        if (companyFilter) {
          filteredInspections = filteredInspections.filter(insp => 
            insp.company === companyFilter || 
            insp.location?.includes(companyFilter)
          );
        }
        
        // Calculate stats
        const openFindings = filteredInspections.reduce((count, insp) => {
          return count + (insp.findings?.filter(f => !f.resolved)?.length || 0);
        }, 0);
        
        const closedFindings = filteredInspections.reduce((count, insp) => {
          return count + (insp.findings?.filter(f => f.resolved)?.length || 0);
        }, 0);
        
        const highRiskFindings = filteredInspections.reduce((count, insp) => {
          return count + (insp.findings?.filter(f => f.severity === 'High')?.length || 0);
        }, 0);
        
        setInspections(filteredInspections);
        setStats({
          total: filteredInspections.length,
          open: openFindings,
          closed: closedFindings,
          highRisk: highRiskFindings
        });
      } catch (error) {
        console.error('Error fetching inspections:', error);
        setStats({
          total: 0,
          open: 0,
          closed: 0,
          highRisk: 0
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInspections();
  }, [periodFilter, companyFilter]);

  if (isLoading) {
    return <div className="p-4 bg-white rounded shadow animate-pulse h-48"></div>;
  }
  
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Safety Inspections</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
          <div className="text-xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Inspections</div>
        </div>
        
        <div className="bg-red-50 p-3 rounded border border-red-200 text-center">
          <div className="text-xl font-bold text-red-600">{stats.open}</div>
          <div className="text-xs text-red-500">Open Findings</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded border border-green-200 text-center">
          <div className="text-xl font-bold text-green-600">{stats.closed}</div>
          <div className="text-xs text-green-500">Closed Findings</div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-center">
          <div className="text-xl font-bold text-yellow-600">{stats.highRisk}</div>
          <div className="text-xs text-yellow-500">High Risk Findings</div>
        </div>
      </div>
      
      {inspections.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No inspections found for this period</div>
      ) : (
        <div className="mt-3">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Inspections</h3>
          <div className="overflow-hidden rounded border border-gray-200 max-h-36">
            {inspections.slice(0, 3).map((insp, idx) => (
              <div key={idx} className={`px-3 py-2 text-sm ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="flex justify-between">
                  <div>
                    <span className="font-medium">{insp.type || 'Inspection'}</span>
                    {insp.location && <span className="text-gray-500"> - {insp.location}</span>}
                  </div>
                  <div className="text-gray-500">
                    {new Date(insp.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {insp.findings?.length || 0} findings
                  {insp.inspector && ` • Inspector: ${insp.inspector}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionsWidget;