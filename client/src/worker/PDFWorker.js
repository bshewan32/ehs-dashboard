// client/src/workers/PDFWorker.js
// Web worker for PDF generation

// Import libraries
importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

// Listen for messages from the main thread
self.onmessage = function(e) {
  try {
    const { metrics, selectedCompany } = e.data;
    
    // Create PDF using jsPDF
    const { jsPDF } = self.jspdf;
    const pdf = new jsPDF();
    
    // Add title and basic info
    pdf.setFontSize(16);
    pdf.text('EHS Dashboard Report', 105, 20, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
    
    if (selectedCompany) {
      pdf.text(`Company: ${selectedCompany}`, 105, 40, { align: 'center' });
    }
    
    // Basic metrics - just numbers
    pdf.text("BASIC METRICS:", 20, 60);
    
    if (metrics && metrics.lagging) {
      pdf.text(`Incidents: ${metrics.lagging.incidentCount || 0}`, 20, 70);
      pdf.text(`Near Misses: ${metrics.lagging.nearMissCount || 0}`, 20, 80);
      pdf.text(`First Aid Cases: ${metrics.lagging.firstAidCount || 0}`, 20, 90);
      pdf.text(`Medical Treatments: ${metrics.lagging.medicalTreatmentCount || 0}`, 20, 100);
    } else {
      pdf.text("No metrics available", 20, 70);
    }
    
    // Add KPI section if available
    if (metrics && metrics.leading && metrics.leading.kpis) {
      pdf.text("KEY PERFORMANCE INDICATORS:", 20, 120);
      let yPos = 130;
      
      metrics.leading.kpis.forEach(kpi => {
        pdf.text(`${kpi.name}: ${kpi.actual}${kpi.unit} (Target: ${kpi.target}${kpi.unit})`, 20, yPos);
        yPos += 10;
      });
    }
    
    // Generate PDF as base64 string
    const pdfOutput = pdf.output('datauristring');
    
    // Send the PDF data back to the main thread
    self.postMessage({ 
      status: 'success', 
      pdfData: pdfOutput,
      filename: `EHS_Dashboard_${selectedCompany || 'All'}_${new Date().toISOString().split('T')[0]}.pdf`
    });
  } catch (error) {
    // Send error back to main thread
    self.postMessage({ 
      status: 'error', 
      error: error.message || 'Unknown error during PDF generation'
    });
  }
};