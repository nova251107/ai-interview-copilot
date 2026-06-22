const express = require('express');
const { getDSAStats, syncLeetCode, updateDSAStats } = require('../controllers/dsaController');

const router = express.Router();

// Get DSA stats for a user
router.get('/user/:userId', getDSAStats);

// Sync real stats from LeetCode — expects { leetcodeUsername } in body, userId in header
router.post('/sync', syncLeetCode);

// Manually update DSA stats — expects { easy, medium, hard } in body, userId in header
router.post('/update', updateDSAStats);

module.exports = router;
