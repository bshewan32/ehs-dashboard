// server/routes/kpis.js
const express = require('express');
const router = express.Router();

// In-memory storage for KPIs (replace with database in production)
let kpis = [
  {
    id: 'nearMissRate',
    _id: 'nearMissRate',
    name: 'Near Miss Reporting Rate',
    description: 'Percentage of near miss incidents reported relative to target reporting levels',
    actual: 75,
    target: 100,
    unit: '%',
    category: 'Safety',
    frequency: 'Monthly',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'criticalRiskVerification',
    _id: 'criticalRiskVerification',
    name: 'Critical Risk Control Verification',
    description: 'Percentage of critical risk controls verified as effective',
    actual: 88,
    target: 95,
    unit: '%',
    category: 'Safety',
    frequency: 'Monthly',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'electricalSafetyCompliance',
    _id: 'electricalSafetyCompliance',
    name: 'Electrical Safety Compliance',
    description: 'Percentage compliance with electrical safety standards and procedures',
    actual: 92,
    target: 100,
    unit: '%',
    category: 'Safety',
    frequency: 'Monthly',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
];

// GET /api/kpis - Get all KPIs
router.get('/', (req, res) => {
  try {
    console.log(`Fetching ${kpis.length} KPIs`);
    res.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

// GET /api/kpis/active - Get only active KPIs
router.get('/active', (req, res) => {
  try {
    const activeKPIs = kpis.filter(kpi => kpi.isActive !== false);
    console.log(`Fetching ${activeKPIs.length} active KPIs`);
    res.json(activeKPIs);
  } catch (error) {
    console.error('Error fetching active KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch active KPIs' });
  }
});

// GET /api/kpis/:id - Get specific KPI
router.get('/:id', (req, res) => {
  try {
    const kpi = kpis.find(k => k.id === req.params.id || k._id === req.params.id);
    
    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }
    
    console.log(`Fetching KPI: ${kpi.name}`);
    res.json(kpi);
  } catch (error) {
    console.error('Error fetching KPI:', error);
    res.status(500).json({ error: 'Failed to fetch KPI' });
  }
});

// POST /api/kpis - Create new KPI
router.post('/', (req, res) => {
  try {
    const {
      name,
      description,
      actual,
      target,
      unit,
      category,
      frequency,
      isActive,
      id
    } = req.body;

    // Validate required fields
    if (!name || actual === undefined || target === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, actual, and target are required' 
      });
    }

    // Generate ID if not provided
    const kpiId = id || `kpi_${Date.now()}`;

    // Check if KPI with this ID already exists
    if (kpis.find(k => k.id === kpiId || k._id === kpiId)) {
      return res.status(409).json({ error: 'KPI with this ID already exists' });
    }

    const newKPI = {
      id: kpiId,
      _id: kpiId,
      name,
      description: description || '',
      actual: parseFloat(actual),
      target: parseFloat(target),
      unit: unit || '%',
      category: category || 'Safety',
      frequency: frequency || 'Monthly',
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    kpis.push(newKPI);
    
    console.log(`Created new KPI: ${newKPI.name}`);
    res.status(201).json(newKPI);
  } catch (error) {
    console.error('Error creating KPI:', error);
    res.status(500).json({ error: 'Failed to create KPI' });
  }
});

// PUT /api/kpis/:id - Update KPI
router.put('/:id', (req, res) => {
  try {
    const kpiIndex = kpis.findIndex(k => k.id === req.params.id || k._id === req.params.id);
    
    if (kpiIndex === -1) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    const {
      name,
      description,
      actual,
      target,
      unit,
      category,
      frequency,
      isActive
    } = req.body;

    // Update KPI with new values
    const updatedKPI = {
      ...kpis[kpiIndex],
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(actual !== undefined && { actual: parseFloat(actual) }),
      ...(target !== undefined && { target: parseFloat(target) }),
      ...(unit !== undefined && { unit }),
      ...(category !== undefined && { category }),
      ...(frequency !== undefined && { frequency }),
      ...(isActive !== undefined && { isActive }),
      lastUpdated: new Date().toISOString()
    };

    kpis[kpiIndex] = updatedKPI;
    
    console.log(`Updated KPI: ${updatedKPI.name}`);
    res.json(updatedKPI);
  } catch (error) {
    console.error('Error updating KPI:', error);
    res.status(500).json({ error: 'Failed to update KPI' });
  }
});

// DELETE /api/kpis/:id - Delete KPI
router.delete('/:id', (req, res) => {
  try {
    const kpiIndex = kpis.findIndex(k => k.id === req.params.id || k._id === req.params.id);
    
    if (kpiIndex === -1) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    const deletedKPI = kpis[kpiIndex];
    kpis.splice(kpiIndex, 1);
    
    console.log(`Deleted KPI: ${deletedKPI.name}`);
    res.json({ message: 'KPI deleted successfully', kpi: deletedKPI });
  } catch (error) {
    console.error('Error deleting KPI:', error);
    res.status(500).json({ error: 'Failed to delete KPI' });
  }
});

// PATCH /api/kpis/:id/toggle - Toggle KPI active status
router.patch('/:id/toggle', (req, res) => {
  try {
    const kpiIndex = kpis.findIndex(k => k.id === req.params.id || k._id === req.params.id);
    
    if (kpiIndex === -1) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    kpis[kpiIndex].isActive = !kpis[kpiIndex].isActive;
    kpis[kpiIndex].lastUpdated = new Date().toISOString();
    
    console.log(`Toggled KPI status: ${kpis[kpiIndex].name} - ${kpis[kpiIndex].isActive ? 'Active' : 'Inactive'}`);
    res.json(kpis[kpiIndex]);
  } catch (error) {
    console.error('Error toggling KPI status:', error);
    res.status(500).json({ error: 'Failed to toggle KPI status' });
  }
});

// POST /api/kpis/bulk-update - Update multiple KPI values
router.post('/bulk-update', (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates must be an array' });
    }

    const results = [];
    const errors = [];

    updates.forEach(update => {
      const { id, actual } = update;
      const kpiIndex = kpis.findIndex(k => k.id === id || k._id === id);
      
      if (kpiIndex === -1) {
        errors.push(`KPI with id ${id} not found`);
        return;
      }

      if (actual !== undefined) {
        kpis[kpiIndex].actual = parseFloat(actual);
        kpis[kpiIndex].lastUpdated = new Date().toISOString();
        results.push(kpis[kpiIndex]);
      }
    });

    console.log(`Bulk updated ${results.length} KPIs`);
    
    res.json({
      success: true,
      updated: results.length,
      errors: errors.length > 0 ? errors : undefined,
      kpis: results
    });
  } catch (error) {
    console.error('Error bulk updating KPIs:', error);
    res.status(500).json({ error: 'Failed to bulk update KPIs' });
  }
});

module.exports = router;

// To use this in your main server file (e.g., server.js or app.js), add:
// const kpiRoutes = require('./routes/kpis');
// app.use('/api/kpis', kpiRoutes);