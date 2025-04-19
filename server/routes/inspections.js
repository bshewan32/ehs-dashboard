// server/routes/inspections.js
const express = require('express');
const router = express.Router();
const Inspection = require('../models/Inspections');

// POST /api/inspections - Create a new inspection
router.post('/', async (req, res) => {
  try {
    const newInspection = new Inspection(req.body);
    await newInspection.save();
    res.status(201).json({ message: 'Inspection saved', inspection: newInspection });
  } catch (error) {
    console.error('Error saving inspection:', error);
    res.status(500).json({ error: 'Failed to save inspection' });
  }
});

// GET /api/inspections - Get all inspections
router.get('/', async (req, res) => {
  try {
    const inspections = await Inspection.find().sort({ date: -1 });
    res.status(200).json(inspections);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ error: 'Failed to fetch inspections' });
  }
});

// GET /api/inspections/:id - Get a specific inspection
router.get('/:id', async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id);
    
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    res.status(200).json(inspection);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    res.status(500).json({ error: 'Failed to fetch inspection' });
  }
});

// PUT /api/inspections/:id - Update an inspection
router.put('/:id', async (req, res) => {
  try {
    const updatedInspection = await Inspection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedInspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    res.status(200).json({ message: 'Inspection updated', inspection: updatedInspection });
  } catch (error) {
    console.error('Error updating inspection:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    res.status(500).json({ error: 'Failed to update inspection' });
  }
});

// PATCH /api/inspections/:id/findings/:index - Update a specific finding
router.patch('/:id/findings/:index', async (req, res) => {
  try {
    const { id, index } = req.params;
    const { resolved } = req.body;
    
    // Get the inspection
    const inspection = await Inspection.findById(id);
    
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    // Check if the finding exists
    if (!inspection.findings[index]) {
      return res.status(404).json({ error: 'Finding not found' });
    }
    
    // Update the finding
    inspection.findings[index].resolved = resolved;
    
    // Save the updated inspection
    await inspection.save();
    
    res.status(200).json({ message: 'Finding updated', inspection });
  } catch (error) {
    console.error('Error updating finding:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    res.status(500).json({ error: 'Failed to update finding' });
  }
});

// DELETE /api/inspections/:id - Delete an inspection
router.delete('/:id', async (req, res) => {
  try {
    const deletedInspection = await Inspection.findByIdAndDelete(req.params.id);
    
    if (!deletedInspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    res.status(200).json({ message: 'Inspection deleted' });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete inspection' });
  }
});

module.exports = router;