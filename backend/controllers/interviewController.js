const prisma = require('../services/prisma');
const { generateQuestions, evaluateAnswer } = require('../services/interviewAI');
const { extractTextFromPdfUrl } = require('../services/pdfParser');

/**
 * Start a new mock interview session.
 * Body: { jobRole }   Header: x-user-id
 */
const startInterview = async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { jobRole: rawJobRole, questionCount } = req.body;

  // ─── Input validation ────────────────────────────────────────
  const jobRole = typeof rawJobRole === 'string' ? rawJobRole.trim().slice(0, 100) : '';
  if (!userId)  return res.status(401).json({ success: false, message: 'User ID required' });
  if (!jobRole) return res.status(400).json({ success: false, message: 'Job role required' });
  if (jobRole.length > 100) return res.status(400).json({ success: false, message: 'Job role must be 100 characters or fewer' });

  try {
    // ── Optional: load resume text ──────────────────────────────────────────
    let resumeText = '';
    try {
      const resume = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (resume?.resumeUrl) {
        resumeText = await extractTextFromPdfUrl(resume.resumeUrl);
      }
    } catch {
      // No resume found — proceed with generic questions
    }

    // ── Generate questions via Groq ─────────────────────────────────────────
    // Determine number of questions (default 5)
    const count = [5,10,15].includes(Number(questionCount)) ? Number(questionCount) : 5;
    const questions = await generateQuestions(jobRole, resumeText, count);

    // ── Ensure user row exists ──────────────────────────────────────────────
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: req.headers['x-user-name'] || 'User',
        email: req.headers['x-user-email'] || `${userId}@placeholder.com`,
      },
    });

    // ── Create interview (schema field is `role`) ───────────────────────────
    const interview = await prisma.interview.create({
      data: { userId, role: jobRole },
    });

    // ── Save questions ──────────────────────────────────────────────────────
    const createdQuestions = await Promise.all(
      questions.map((q) =>
        prisma.question.create({
          data: { interviewId: interview.id, question: q.question },
        })
      )
    );

    return res.status(201).json({
      success: true,
      interviewId: interview.id,
      questions: createdQuestions.map((q) => ({ id: q.id, question: q.question })),
    });
  } catch (error) {
    console.error('startInterview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to start interview', error: error.message });
  }
};

/**
 * Submit answer for one question and evaluate it via AI.
 * Body: { interviewId, questionId, answer }
 */
const submitAnswer = async (req, res) => {
  const { interviewId, questionId, answer } = req.body;

  if (!interviewId || !questionId || !answer) {
    return res.status(400).json({ success: false, message: 'interviewId, questionId and answer required' });
  }

  try {
    // Fetch question text
    const q = await prisma.question.findUnique({ where: { id: questionId } });
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });

    // AI evaluation — returns { score, feedback }
    const { score, feedback } = await evaluateAnswer(q.question, answer);

    // Save answer + evaluation in Question (schema: answer, evaluation JSON)
    await prisma.question.update({
      where: { id: questionId },
      data: {
        answer,
        evaluation: { score, feedback },
      },
    });

    // Recalculate overall score (average of evaluated questions)
    const allQuestions = await prisma.question.findMany({
      where: { interviewId },
      select: { evaluation: true },
    });
    const scores = allQuestions
      .map((qt) => qt.evaluation?.score)
      .filter((s) => s != null);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    // Update interview overall score
    await prisma.interview.update({
      where: { id: interviewId },
      data: { score: avgScore },
    });

    return res.status(200).json({ success: true, questionId, score, feedback, overallScore: avgScore });
  } catch (error) {
    console.error('submitAnswer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit answer', error: error.message });
  }
};

/**
 * Get a single interview with all questions & answers.
 */
const getInterview = async (req, res) => {
  const { interviewId } = req.params;
  try {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { questions: true },
    });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });

    // Flatten evaluation JSON into score/feedback fields for the frontend
    const questions = interview.questions.map((qt) => ({
      id: qt.id,
      question: qt.question,
      answer: qt.answer,
      score: qt.evaluation?.score ?? null,
      feedback: qt.evaluation?.feedback ?? null,
    }));

    return res.status(200).json({
      success: true,
      interview: { ...interview, questions },
    });
  } catch (error) {
    console.error('getInterview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch interview', error: error.message });
  }
};

/**
 * Get all interviews for a user.
 */
const getAllInterviews = async (req, res) => {
  const { userId } = req.params;
  try {
    const interviews = await prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { questions: true },
    });
    return res.status(200).json({ success: true, interviews, total: interviews.length });
  } catch (error) {
    console.error('getAllInterviews error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch interviews', error: error.message });
  }
};

module.exports = { startInterview, submitAnswer, getInterview, getAllInterviews };
