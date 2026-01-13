const express = require('express');
const router = express.Router();
const Career = require('../models/Career');

// @route   GET /api/careers
// @desc    Get all active careers
// @access  Public
router.get('/', async (req, res) => {
    try {
        const careers = await Career.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(careers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/careers
// @desc    Create a new career
// @access  Private (Admin)
router.post('/', async (req, res) => {
    try {
        const { title, type, location, description, requirements, contactEmail } = req.body;
        const career = new Career({
            title,
            type,
            location,
            description,
            requirements,
            contactEmail
        });
        const newCareer = await career.save();
        res.status(201).json(newCareer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   DELETE /api/careers/:id
// @desc    Delete a career
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const career = await Career.findById(req.params.id);
        if (!career) return res.status(404).json({ message: 'Job not found' });

        await Career.findByIdAndDelete(req.params.id);
        res.json({ message: 'Job deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
