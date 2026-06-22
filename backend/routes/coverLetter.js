const express = require('express');
const { generateCoverLetter } = require('../controllers/coverLetterController');

const router = express.Router();

// Generate a cover letter — expects { jobDescription, jobTitle?, companyName? } in body
router.post('/generate', generateCoverLetter);

module.exports = router;
