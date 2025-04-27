// server/routes/reports.js
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// In-memory cache for metrics
const metricsCache = {
  data: null,
  timestamp: null,
  requestCount: 0,
  cacheHits: 0,
  cacheMisses: 0,
  cacheItems: new Map(), // For storing multiple cache entries
  
  isValid: function() {
    // Cache is valid for 10 minutes
    if (!this.timestamp || !this.data) {
      console.log('Cache invalid - timestamp or data is missing');
      return false;
    }
    
    const now = Date.now();
    const cacheDuration = 10 * 60 * 1000; // 10 minutes
    const cacheAge = now - this.timestamp;
    const isValid = cacheAge < cacheDuration;
    
    if (isValid) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
      console.log(`Cache expired - age is ${Math.round(cacheAge/1000)}s, max is ${Math.round(cacheDuration/1000)}s`);
    }
    
    return isValid;
  },
  
  invalidate: function() {
    this.data = null;
    this.timestamp = null;
    this.cacheItems.clear();
    console.log('Metrics cache explicitly invalidated');
  },
  
  update: function(data) {
    this.data = JSON.parse(JSON.stringify(data)); // Deep clone to avoid reference issues
    this.timestamp = Date.now();
    console.log('Metrics cache updated at', new Date(this.timestamp).toISOString());
    
    // Log cache stats
    this.cacheMisses++;
    this.requestCount++;
    console.log(`Cache stats - Total: ${this.requestCount}, Hits: ${this.cacheHits}, Misses: ${this.cacheMisses}, Hit rate: ${Math.round((this.cacheHits/this.requestCount)*100)}%`);
  },
  
  // Methods for the cached items map
  has: function(key) {
    if (!this.cacheItems.has(key)) {
      return false;
    }
    
    const cacheItem = this.cacheItems.get(key);
    const now = Date.now();
    const cacheDuration = 10 * 60 * 1000; // 10 minutes
    const cacheAge = now - cacheItem.timestamp;
    
    // Check if the cache entry is still valid
    if (cacheAge < cacheDuration) {
      this.cacheHits++;
      return true;
    } else {
      // Cache entry has expired
      this.cacheItems.delete(key);
      return false;
    }
  },
  
  get: function(key) {
    if (!this.cacheItems.has(key)) {
      return null;
    }
    
    const cacheItem = this.cacheItems.get(key);
    return cacheItem.data;
  },
  
  set: function(key, data) {
    this.cacheItems.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now()
    });
    console.log(`Cache item '${key}' set at ${new Date().toISOString()}`);
  },
  
  // Get cache status for reporting
  getStats: function() {
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      total: this.requestCount,
      hitRate: this.requestCount > 0 ? Math.round((this.cacheHits/this.requestCount)*100) : 0,
      itemCount: this.cacheItems.size,
      cacheExists: !!this.data,
      cacheAge: this.timestamp ? Math.round((Date.now() - this.timestamp)/1000) + 's' : 'N/A',
      lastUpdate: this.timestamp ? new Date(this.timestamp).toISOString() : null
    };
  }
};

/**
 * @route   GET /api/reports
 * @desc    Get all reports
 * @access  Private (if using auth middleware)
 */
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/reports
 * @desc    Create a new report
 * @access  Private (if using auth middleware)
 */
router.post('/', async (req, res) => {
  try {
    // Log the incoming request body for debugging
    console.log('Received report submission:', JSON.stringify(req.body, null, 2));
    
    // Create a new report from the request body
    const newReport = new Report(req.body);
    
    // Save the report to the database
    const savedReport = await newReport.save();
    
    // Log the saved report
    console.log('Successfully saved report:', savedReport._id);
    
    // Invalidate metrics cache when a new report is added
    metricsCache.invalidate();
    
    // Return success response
    res.status(201).json({ 
      message: 'Report created successfully', 
      reportId: savedReport._id 
    });
  } catch (err) {
    console.error('Error creating report:', err);
    
    // Check for validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(err.errors).map(e => e.message) 
      });
    }
    
    // Return general server error
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reports/metrics/summary
 * @desc    Get summary metrics from most recent report
 * @access  Private (if using auth middleware)
 */
router.get('/metrics/summary', async (req, res) => {
  // Generate a unique request ID
  const requestId = Math.random().toString(36).substring(7);
  
  // Track the request
  metricsCache.requestCount++;
  
  // Log request details including headers
  console.log(`[${requestId}] Metrics summary request #${metricsCache.requestCount} at ${new Date().toISOString()}`);
  console.log(`[${requestId}] User-Agent: ${req.headers['user-agent'] || 'Not provided'}`);
  console.log(`[${requestId}] Referer: ${req.headers['referer'] || 'Not provided'}`);
  
  try {
    // Check if we have valid cached metrics
    if (metricsCache.isValid()) {
      console.log(`[${requestId}] Cache hit: Using cached metrics (age:`,
        Math.round((Date.now() - metricsCache.timestamp) / 1000), 'seconds)');
      // Return cached data with cache stats in headers
      res.setHeader('X-Cache-Stats', JSON.stringify(metricsCache.getStats()));
      return res.json(metricsCache.data);
    }
    
    console.log(`[${requestId}] Cache miss: fetching fresh metrics from database`);
    
    // Get the most recent report
    const latestReport = await Report.findOne().sort({ createdAt: -1 });
    
    if (!latestReport) {
      return res.status(404).json({ message: 'No reports found' });
    }
    
    // Clone the metrics from the latest report
    let metrics = JSON.parse(JSON.stringify(latestReport.metrics || {}));
    
    // Ensure the structure is complete
    if (!metrics.lagging) {
      metrics.lagging = {
        incidentCount: 0,
        nearMissCount: 0,
        firstAidCount: 0,
        medicalTreatmentCount: 0,
        lostTimeInjuryCount: 0
      };
    }
    
    if (!metrics.leading) {
      metrics.leading = {
        trainingCompleted: 0,
        inspectionsCompleted: 0,
        kpis: []
      };
    } else if (!metrics.leading.kpis) {
      metrics.leading.kpis = [];
    }
    
    // If KPIs exist at top level, move them to the leading.kpis array
    if (Array.isArray(metrics.kpis) && metrics.kpis.length > 0) {
      metrics.leading.kpis = metrics.kpis;
      delete metrics.kpis;
    }
    
    // Update the cache with latest metrics
    metricsCache.update(metrics);
    
    // Return the structured metrics with cache stats in headers
    res.setHeader('X-Cache-Stats', JSON.stringify(metricsCache.getStats()));
    console.log(`[${requestId}] Returning fresh metrics data to client`);
    res.json(metrics);
  } catch (err) {
    console.error('Error fetching metrics summary:', err.message);
    
    // If we have cached data, return it as a fallback despite the error
    if (metricsCache.data) {
      console.log('Error occurred, returning cached data as fallback');
      return res.json(metricsCache.data);
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reports/metrics/current-year
 * @desc    Get metrics summary for current year only
 * @access  Private (if using auth middleware)
 */
router.get('/metrics/current-year', async (req, res) => {
  try {
    const requestId = Date.now().toString();
    console.log(`[${requestId}] Fetching current year metrics summary`);
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Check if we have the current year metrics in cache
    const cacheKey = `currentYearMetrics_${currentYear}`;
    if (metricsCache.has(cacheKey)) {
      console.log(`[${requestId}] Cache hit: returning cached current year metrics`);
      return res.json(metricsCache.get(cacheKey));
    }
    
    // Fetch all reports from current year
    const currentYearReports = await Report.find({
      reportPeriod: { $regex: currentYear.toString() }
    }).sort({ reportPeriod: 1 });
    
    console.log(`[${requestId}] Found ${currentYearReports.length} reports for ${currentYear}`);
    
    if (currentYearReports.length === 0) {
      // If no reports for current year, try to get the most recent report
      const latestReport = await Report.findOne().sort({ createdAt: -1 });
      
      if (!latestReport) {
        return res.status(404).json({ 
          message: 'No reports found',
          year: currentYear,
          isEmpty: true
        });
      }
      
      // Return the metrics from the latest report, but mark as not current year
      const latestMetrics = {
        ...(latestReport.metrics || {}),
        year: new Date(latestReport.createdAt).getFullYear(),
        isCurrentYear: false,
        totalIncidents: latestReport.metrics?.lagging?.incidentCount || 0,
        totalNearMisses: latestReport.metrics?.lagging?.nearMissCount || 0,
        firstAidCount: latestReport.metrics?.lagging?.firstAidCount || 0,
        medicalTreatmentCount: latestReport.metrics?.lagging?.medicalTreatmentCount || 0,
        lostTimeInjuryCount: latestReport.metrics?.lagging?.lostTimeInjuryCount || 0,
        trainingCompliance: latestReport.metrics?.trainingCompliance || 0,
        riskScore: latestReport.metrics?.riskScore || 0,
      };
      
      // Ensure the metrics structure is complete
      if (!latestMetrics.lagging) {
        latestMetrics.lagging = {
          incidentCount: latestMetrics.totalIncidents || 0,
          nearMissCount: latestMetrics.totalNearMisses || 0,
          firstAidCount: latestMetrics.firstAidCount || 0,
          medicalTreatmentCount: latestMetrics.medicalTreatmentCount || 0,
          lostTimeInjuryCount: latestMetrics.lostTimeInjuryCount || 0
        };
      }
      
      if (!latestMetrics.leading) {
        latestMetrics.leading = {
          trainingCompleted: 0,
          inspectionsCompleted: 0,
          kpis: []
        };
      }
      
      // Cache the results
      metricsCache.set(cacheKey, latestMetrics);
      
      console.log(`[${requestId}] No current year data, returning latest report data`);
      return res.json(latestMetrics);
    }
    
    // Initialize aggregated metrics
    const aggregatedMetrics = {
      lagging: {
        incidentCount: 0,
        nearMissCount: 0,
        firstAidCount: 0,
        medicalTreatmentCount: 0,
        lostTimeInjuryCount: 0
      },
      leading: {
        trainingCompleted: 0,
        inspectionsCompleted: 0,
        kpis: []
      },
      year: currentYear,
      isCurrentYear: true,
      reportCount: currentYearReports.length
    };
    
    // Get the latest report for leading indicators and KPIs
    const latestReport = currentYearReports[currentYearReports.length - 1];
    
    // For leading indicators and KPIs, use the latest values from the most recent report
    if (latestReport?.metrics) {
      // For training compliance and risk score, use the latest values
      aggregatedMetrics.trainingCompliance = latestReport.metrics.trainingCompliance || 0;
      aggregatedMetrics.riskScore = latestReport.metrics.riskScore || 0;
      
      if (latestReport.metrics.leading) {
        aggregatedMetrics.leading.trainingCompleted = 
          latestReport.metrics.leading.trainingCompleted || 0;
        aggregatedMetrics.leading.inspectionsCompleted = 
          latestReport.metrics.leading.inspectionsCompleted || 0;
        
        // Use latest KPIs
        if (latestReport.metrics.leading.kpis && latestReport.metrics.leading.kpis.length > 0) {
          aggregatedMetrics.leading.kpis = JSON.parse(JSON.stringify(latestReport.metrics.leading.kpis));
        }
      }
    }
    
    // For lagging indicators (incidents, etc), sum up all reports from current year
    currentYearReports.forEach(report => {
      if (report.metrics) {
        // Handle lagging indicators - ensure they're treated as numbers
        if (report.metrics.lagging) {
          aggregatedMetrics.lagging.incidentCount += Number(report.metrics.lagging.incidentCount || 0);
          aggregatedMetrics.lagging.nearMissCount += Number(report.metrics.lagging.nearMissCount || 0);
          aggregatedMetrics.lagging.firstAidCount += Number(report.metrics.lagging.firstAidCount || 0);
          aggregatedMetrics.lagging.medicalTreatmentCount += Number(report.metrics.lagging.medicalTreatmentCount || 0);
          aggregatedMetrics.lagging.lostTimeInjuryCount += Number(report.metrics.lagging.lostTimeInjuryCount || 0);
        } else if (report.metrics.totalIncidents !== undefined || report.metrics.totalNearMisses !== undefined) {
          // Handle legacy format
          aggregatedMetrics.lagging.incidentCount += Number(report.metrics.totalIncidents || 0);
          aggregatedMetrics.lagging.nearMissCount += Number(report.metrics.totalNearMisses || 0);
          aggregatedMetrics.lagging.firstAidCount += Number(report.metrics.firstAidCount || 0);
          aggregatedMetrics.lagging.medicalTreatmentCount += Number(report.metrics.medicalTreatmentCount || 0);
          aggregatedMetrics.lagging.lostTimeInjuryCount += Number(report.metrics.lostTimeInjuryCount || 0);
        }
      }
    });
    
    // Include top-level metrics for backward compatibility
    aggregatedMetrics.totalIncidents = aggregatedMetrics.lagging.incidentCount;
    aggregatedMetrics.totalNearMisses = aggregatedMetrics.lagging.nearMissCount;
    aggregatedMetrics.firstAidCount = aggregatedMetrics.lagging.firstAidCount;
    aggregatedMetrics.medicalTreatmentCount = aggregatedMetrics.lagging.medicalTreatmentCount;
    aggregatedMetrics.lostTimeInjuryCount = aggregatedMetrics.lagging.lostTimeInjuryCount;
    
    console.log(`[${requestId}] Aggregated ${currentYearReports.length} reports for ${currentYear}`);
    console.log(`Incidents: ${aggregatedMetrics.totalIncidents}, Near Misses: ${aggregatedMetrics.totalNearMisses}, LTI: ${aggregatedMetrics.lostTimeInjuryCount}`);
    
    // Cache the results
    metricsCache.set(cacheKey, aggregatedMetrics);
    
    // Return the aggregated metrics
    res.json(aggregatedMetrics);
  } catch (err) {
    console.error('Error fetching current year metrics:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reports/metrics/cache-status
 * @desc    Get cache status
 * @access  Private (if using auth middleware)
 */
router.get('/metrics/cache-status', (req, res) => {
  res.json({
    status: 'ok',
    cache: metricsCache.getStats()
  });
});

/**
 * @route   GET /api/reports/:id
 * @desc    Get report by ID
 * @access  Private (if using auth middleware)
 */
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.json(report);
  } catch (err) {
    console.error('Error fetching report:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;