const express = require('express');
const { createUser, getUserById, getAllUsers, getUserStats } = require('../controllers/userController');
const { verifyOwnership } = require('../middleware/auth');

const router = express.Router();

// POST /api/users        → Create a new user
router.post('/', createUser);

// GET  /api/users        → Get all users (admin)
router.get('/', getAllUsers);

// GET  /api/users/:id/stats → Get analytics stats for a user
router.get('/:id/stats', verifyOwnership, getUserStats);

// GET  /api/users/:id    → Get user by Clerk ID (with all data)
router.get('/:id', verifyOwnership, getUserById);

module.exports = router;
