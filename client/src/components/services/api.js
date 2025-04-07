// client/src/components/services/api.js - Add company-specific API method
export const fetchCompanyMetrics = async (companyName) => {
  try {
    if (!companyName) {
      return await fetchMetricsSummary();
    }
    
    // Get token if it exists
    const token = localStorage.getItem('token');
    
    // Setup headers with optional authentication
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // First get all reports
    const reports = await fetchReports();
    
    // Filter by company name
    const companyReports = reports.filter(report => report.companyName === companyName);
    
    if (companyReports.length === 0) {
      console.warn(`No reports found for company: ${companyName}`);
      return createDefaultMetrics();
    }
    
    // Sort to get most recent
    companyReports.sort((a, b) => {
      return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
    });
    
    const mostRecent = companyReports[0];
    console.log(`Using most recent report from ${mostRecent.reportPeriod} for ${companyName}`);
    
    // Extract and format metrics from the most recent report
    const metrics = {
      // Combine both the top-level metrics and nested structure
      totalIncidents: mostRecent.metrics?.totalIncidents ?? mostRecent.metrics?.lagging?.incidentCount ?? 0,
      totalNearMisses: mostRecent.metrics?.totalNearMisses ?? mostRecent.metrics?.lagging?.nearMissCount ?? 0,
      firstAidCount: mostRecent.metrics?.firstAidCount ?? mostRecent.metrics?.lagging?.firstAidCount ?? 0,
      medicalTreatmentCount: mostRecent.metrics?.medicalTreatmentCount ?? mostRecent.metrics?.lagging?.medicalTreatmentCount ?? 0,
      trainingCompliance: mostRecent.metrics?.trainingCompliance ?? 0,
      riskScore: mostRecent.metrics?.riskScore ?? 0,
      
      // Extract nested structures
      lagging: mostRecent.metrics?.lagging ?? {
        incidentCount: mostRecent.metrics?.totalIncidents ?? 0,
        nearMissCount: mostRecent.metrics?.totalNearMisses ?? 0,
        firstAidCount: mostRecent.metrics?.firstAidCount ?? 0,
        medicalTreatmentCount: mostRecent.metrics?.medicalTreatmentCount ?? 0
      },
      leading: mostRecent.metrics?.leading ?? {
        trainingCompleted: 0,
        inspectionsCompleted: 0,
        kpis: createDefaultKpis()
      }
    };
    
    // Make sure KPIs exist within the leading object
    if (!metrics.leading.kpis || metrics.leading.kpis.length === 0) {
      metrics.leading.kpis = createDefaultKpis();
    }
    
    return metrics;
  } catch (error) {
    console.error('Error fetching company metrics:', error);
    return createDefaultMetrics();
  }
};

// Helper function to create default KPIs
function createDefaultKpis() {
  return [
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
    }
  ];
}

// Helper function to create default metrics
function createDefaultMetrics() {
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
      kpis: createDefaultKpis()
    }
  };
}