const prisma = require('../services/prisma');
const { analyzeResume } = require('../services/aiService');
const logger = require('../services/logger');

// ─── Upload Resume ────────────────────────────────────────────────
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId    = req.headers['x-user-id'];
    const userName  = req.headers['x-user-name']  || 'User';
    const userEmail = req.headers['x-user-email'] || `${userId}@placeholder.com`;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    // ── Ensure user exists in DB ───────────────────────────────────
    await prisma.user.upsert({
      where:  { id: userId },
      update: { name: userName },
      create: { id: userId, name: userName, email: userEmail },
    });

    const resumeUrl = req.file.path;

    // ── Save resume to DB ──────────────────────────────────────────
    const resume = await prisma.resume.create({
      data: { userId, resumeUrl, skills: [], suggestions: [] },
    });

    return res.status(201).json({
      success: true,
      message: 'Resume uploaded!',
      resume: {
        id: resume.id,
        resumeUrl: resume.resumeUrl,
        createdAt: resume.createdAt,
        analyzing: true,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'uploadResume failed');
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

// ─── Analyze Resume on Demand (called from frontend after upload) ──
const triggerAnalysis = async (req, res) => {
  const { resumeId } = req.params;

  try {
    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const authUserId = req.headers['x-user-id'];
    if (resume.userId !== authUserId) {
      const adminEmail = process.env.ADMIN_EMAIL;
      const authUser = await prisma.user.findUnique({ where: { id: authUserId } });
      if (!adminEmail || authUser?.email !== adminEmail) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    logger.info({ resumeId }, 'Analyzing resume with AI');

    // Send PDF directly to Gemini (no pdf-parse needed)
    const analysis = await analyzeResume(resume.resumeUrl);

    logger.info({ atsScore: analysis.atsScore }, 'Resume analysis complete');

    // Save results to DB
    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        atsScore:    analysis.atsScore,
        skills:      analysis.skills || [],
        suggestions: analysis.suggestions?.map(s => `${s.category}: ${s.tip}`) || [],
      },
    });

    return res.status(200).json({
      success: true,
      analysis: {
        atsScore:        analysis.atsScore,
        summary:         analysis.summary,
        skills:          analysis.skills,
        strengths:       analysis.strengths,
        suggestions:     analysis.suggestions,
        missingKeywords: analysis.missingKeywords,
        overallFeedback: analysis.overallFeedback,
      },
    });
  } catch (error) {
    logger.error({ err: error, resumeId }, 'triggerAnalysis failed');
    return res.status(500).json({ success: false, message: 'Analysis failed' });
  }
};

// ─── Get Latest Resume ────────────────────────────────────────────
const getResume = async (req, res) => {
  const { userId } = req.params;
  try {
    const resume = await prisma.resume.findFirst({
      where: { userId }, orderBy: { createdAt: 'desc' },
    });
    if (!resume) { return res.status(404).json({ success: false, message: 'No resume found' }); }
    return res.status(200).json({ success: true, resume });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch resume' });
  }
};

const getAllResumes = async (req, res) => {
  const { userId } = req.params;
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, resumes, total: resumes.length });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch resumes' });
  }
};

module.exports = { uploadResume, triggerAnalysis, getResume, getAllResumes };
