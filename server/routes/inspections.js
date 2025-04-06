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

module.exports = router;
