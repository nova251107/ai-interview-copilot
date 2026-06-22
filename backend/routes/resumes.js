const express = require('express');
const { upload } = require('../services/cloudinary');
const { uploadResume, triggerAnalysis, getResume, getAllResumes } = require('../controllers/resumeController');

const router = express.Router();

// POST /api/resume/upload         → Upload PDF to Cloudinary + trigger AI analysis
router.post('/upload', upload.single('resume'), uploadResume);

// POST /api/resume/analyze/:resumeId → Run Gemini AI analysis on demand
router.post('/analyze/:resumeId', triggerAnalysis);

// GET  /api/resume/:userId         → Get latest resume with analysis
router.get('/:userId', getResume);

// GET  /api/resume/:userId/all     → Get all resumes
router.get('/:userId/all', getAllResumes);

module.exports = router;
