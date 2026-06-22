const express = require('express');
const {
  generateRoadmap,
  getRoadmap,
  getAllRoadmaps,
} = require('../controllers/roadmapController');

const router = express.Router();

// Generate new roadmap – expects { jobRole } in body, userId in header
router.post('/generate', generateRoadmap);

// Get all roadmaps for a user
router.get('/user/:userId', getAllRoadmaps);

// Get a single roadmap
router.get('/:id', getRoadmap);

module.exports = router;
