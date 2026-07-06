const express = require('express');
const { startInterview, submitAnswer, getInterview, getAllInterviews } = require('../controllers/interviewController');
const { verifyOwnership } = require('../middleware/auth');

const router = express.Router();

// Start a new interview session – expects { jobRole } in body, userId in header
router.post('/start', startInterview);

// Submit answer for a question – expects { interviewId, questionId, answer } in body
router.post('/answer', submitAnswer);

// Get a single interview with all Q&A
router.get('/:interviewId', getInterview);

// Get all interviews for a specific user – userId in params
router.get('/user/:userId/all', verifyOwnership, getAllInterviews);

module.exports = router;
