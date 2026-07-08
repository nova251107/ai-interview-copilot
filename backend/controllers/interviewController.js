const prisma = require('../services/prisma');
const { generateQuestions, evaluateAnswer } = require('../services/interviewAI');
const { extractTextFromPdfUrl } = require('../services/pdfParser');
const logger = require('../services/logger');
const { startInterviewSchema, submitAnswerSchema } = require('../validators/interview');

const startInterview = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {return res.status(401).json({ success: false, message: 'User ID required' });}

  const parsed = startInterviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
  }
  const { jobRole, questionCount } = parsed.data;

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

    const questions = await generateQuestions(jobRole, resumeText, questionCount);

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
    logger.error({ err: error, userId }, 'startInterview failed');
    return res.status(500).json({ success: false, message: 'Failed to start interview' });
  }
};

/**
 * Submit answer for one question and evaluate it via AI.
 * Body: { interviewId, questionId, answer }
 */
const submitAnswer = async (req, res) => {
  const parsed = submitAnswerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
  }
  const { interviewId, questionId, answer } = parsed.data;

  try {
    // Fetch question text and include parent interview for ownership check
    const q = await prisma.question.findUnique({
      where: { id: questionId },
      include: { interview: true },
    });
    if (!q) {return res.status(404).json({ success: false, message: 'Question not found' });}

    const authUserId = req.headers['x-user-id'];
    if (q.interview.userId !== authUserId) {
      const adminEmail = process.env.ADMIN_EMAIL;
      const authUser = await prisma.user.findUnique({ where: { id: authUserId } });
      if (!adminEmail || authUser?.email !== adminEmail) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

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
      .filter((s) => s !== null);
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
    logger.error({ err: error, interviewId }, 'submitAnswer failed');
    return res.status(500).json({ success: false, message: 'Failed to submit answer' });
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
    if (!interview) {return res.status(404).json({ success: false, message: 'Interview not found' });}

    const authUserId = req.headers['x-user-id'];
    if (interview.userId !== authUserId) {
      const adminEmail = process.env.ADMIN_EMAIL;
      const authUser = await prisma.user.findUnique({ where: { id: authUserId } });
      if (!adminEmail || authUser?.email !== adminEmail) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

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
    logger.error({ err: error, interviewId }, 'getInterview failed');
    return res.status(500).json({ success: false, message: 'Failed to fetch interview' });
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
    logger.error({ err: error, userId }, 'getAllInterviews failed');
    return res.status(500).json({ success: false, message: 'Failed to fetch interviews' });
  }
};

module.exports = { startInterview, submitAnswer, getInterview, getAllInterviews };
