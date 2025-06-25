// server/routes/kpis.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// KPI Schema
const kpiSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  actual: {
    type: Number,
    required: true,
    default: 0
  },
  target: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: '%'
  },
  category: {
    type: String,
    default: 'Safety'
  },
  frequency: {
    type: String,
    default: 'Monthly'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create model (check if it already exists to avoid re-compilation error)
const KPI = mongoose.models.KPI || mongoose.model('KPI', kpiSchema);

// Middleware to log requests
router.use((req, res, next) => {
  console.log(`KPI API: ${req.method} ${req.originalUrl}`);
  next();
});

// GET /api/kpis - Get all KPIs (FIXED: changed from app.get to router.get)
router.get('/', async (req, res) => {
  try {
    console.log('KPI GET request - fetching from MongoDB');
    let kpis = await KPI.find().sort({ createdAt: -1 });
    
    // If no KPIs exist, create default ones
    if (kpis.length === 0) {
      console.log('No KPIs found in database, creating defaults');
      const defaultKPIs = [
        {
          id: 'nearMissRate',
          name: 'Near Miss Reporting Rate',
          description: 'Percentage of near miss incidents reported relative to target reporting levels',
          actual: 75,
          target: 100,
          unit: '%',
          category: 'Safety',
          frequency: 'Monthly',
          isActive: true
        },
        {
          id: 'criticalRiskVerification',
          name: 'Critical Risk Control Verification',
          description: 'Percentage of critical risk controls verified as effective',
          actual: 88,
          target: 95,
          unit: '%',
          category: 'Safety',
          frequency: 'Monthly',
          isActive: true
        },
        {
          id: 'electricalSafetyCompliance',
          name: 'Electrical Safety Compliance',
          description: 'Percentage compliance with electrical safety standards and procedures',
          actual: 92,
          target: 100,
          unit: '%',
          category: 'Safety',
          frequency: 'Monthly',
          isActive: true
        }
      ];
      
      kpis = await KPI.insertMany(defaultKPIs);
      console.log(`Created ${kpis.length} default KPIs in database`);
    }
    
    console.log(`Returning ${kpis.length} KPIs from database`);
    res.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs from database:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs', details: error.message });
  }
});

// GET /api/kpis/active - Get only active KPIs
router.get('/active', async (req, res) => {
  try {
    console.log('Fetching active KPIs from database');
    const activeKPIs = await KPI.find({ isActive: true }).sort({ createdAt: -1 });
    console.log(`Returning ${activeKPIs.length} active KPIs`);
    res.json(activeKPIs);
  } catch (error) {
    console.error('Error fetching active KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch active KPIs', details: error.message });
  }
});

// GET /api/kpis/:id - Get specific KPI
router.get('/:id', async (req, res) => {
  try {
    console.log(`Fetching KPI with id: ${req.params.id}`);
    const kpi = await KPI.findOne({
      $or: [
        { id: req.params.id },
        { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null }
      ]
    });
    
    if (!kpi) {
      console.log(`KPI not found: ${req.params.id}`);
      return res.status(404).json({ error: 'KPI not found' });
    }
    
    console.log(`Found KPI: ${kpi.name}`);
    res.json(kpi);
  } catch (error) {
    console.error('Error fetching KPI:', error);
    res.status(500).json({ error: 'Failed to fetch KPI', details: error.message });
  }
});

// POST /api/kpis - Create new KPI
router.post('/', async (req, res) => {
  try {
    console.log('Creating new KPI:', req.body);
    
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
    const existingKPI = await KPI.findOne({ id: kpiId });
    if (existingKPI) {
      return res.status(409).json({ error: 'KPI with this ID already exists' });
    }

    const newKPI = new KPI({
      id: kpiId,
      name,
      description: description || '',
      actual: parseFloat(actual),
      target: parseFloat(target),
      unit: unit || '%',
      category: category || 'Safety',
      frequency: frequency || 'Monthly',
      isActive: isActive !== undefined ? isActive : true
    });

    const savedKPI = await newKPI.save();
    console.log(`Created new KPI: ${savedKPI.name} (ID: ${savedKPI.id})`);
    res.status(201).json(savedKPI);
  } catch (error) {
    console.error('Error creating KPI:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ error: 'KPI with this ID already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create KPI', details: error.message });
  }
});

// PUT /api/kpis/:id - Update KPI
router.put('/:id', async (req, res) => {
  try {
    console.log(`Updating KPI with id: ${req.params.id}`, req.body);
    
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

    // Build update object with only provided fields
    const updateData = {
      lastUpdated: new Date()
    };
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (actual !== undefined) updateData.actual = parseFloat(actual);
    if (target !== undefined) updateData.target = parseFloat(target);
    if (unit !== undefined) updateData.unit = unit;
    if (category !== undefined) updateData.category = category;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedKPI = await KPI.findOneAndUpdate(
      {
        $or: [
          { id: req.params.id },
          { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null }
        ]
      },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedKPI) {
      console.log(`KPI not found for update: ${req.params.id}`);
      return res.status(404).json({ error: 'KPI not found' });
    }
    
    console.log(`Updated KPI: ${updatedKPI.name}`);
    res.json(updatedKPI);
  } catch (error) {
    console.error('Error updating KPI:', error);
    res.status(500).json({ error: 'Failed to update KPI', details: error.message });
  }
});

// DELETE /api/kpis/:id - Delete KPI
router.delete('/:id', async (req, res) => {
  try {
    console.log(`Deleting KPI with id: ${req.params.id}`);
    
    const deletedKPI = await KPI.findOneAndDelete({
      $or: [
        { id: req.params.id },
        { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null }
      ]
    });
    
    if (!deletedKPI) {
      console.log(`KPI not found for deletion: ${req.params.id}`);
      return res.status(404).json({ error: 'KPI not found' });
    }
    
    console.log(`Deleted KPI: ${deletedKPI.name}`);
    res.json({ message: 'KPI deleted successfully', kpi: deletedKPI });
  } catch (error) {
    console.error('Error deleting KPI:', error);
    res.status(500).json({ error: 'Failed to delete KPI', details: error.message });
  }
});

// PATCH /api/kpis/:id/toggle - Toggle KPI active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    console.log(`Toggling KPI status for id: ${req.params.id}`);
    
    const kpi = await KPI.findOne({
      $or: [
        { id: req.params.id },
        { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null }
      ]
    });
    
    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    kpi.isActive = !kpi.isActive;
    kpi.lastUpdated = new Date();
    
    const updatedKPI = await kpi.save();
    
    console.log(`Toggled KPI status: ${updatedKPI.name} - ${updatedKPI.isActive ? 'Active' : 'Inactive'}`);
    res.json(updatedKPI);
  } catch (error) {
    console.error('Error toggling KPI status:', error);
    res.status(500).json({ error: 'Failed to toggle KPI status', details: error.message });
  }
});

// POST /api/kpis/bulk-update - Update multiple KPI values
router.post('/bulk-update', async (req, res) => {
  try {
    console.log('Bulk updating KPIs:', req.body);
    
    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates must be an array' });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { id, actual } = update;
        
        const updatedKPI = await KPI.findOneAndUpdate(
          {
            $or: [
              { id: id },
              { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }
            ]
          },
          {
            actual: parseFloat(actual),
            lastUpdated: new Date()
          },
          { new: true }
        );
        
        if (updatedKPI) {
          results.push(updatedKPI);
        } else {
          errors.push(`KPI with id ${id} not found`);
        }
      } catch (updateError) {
        errors.push(`Error updating KPI ${update.id}: ${updateError.message}`);
      }
    }

    console.log(`Bulk updated ${results.length} KPIs, ${errors.length} errors`);
    
    res.json({
      success: true,
      updated: results.length,
      errors: errors.length > 0 ? errors : undefined,
      kpis: results
    });
  } catch (error) {
    console.error('Error bulk updating KPIs:', error);
    res.status(500).json({ error: 'Failed to bulk update KPIs', details: error.message });
  }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('KPI Router Error:', error);
  res.status(500).json({ 
    error: 'KPI operation failed', 
    details: error.message 
  });
});

module.exports = router;