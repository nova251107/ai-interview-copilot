const prisma = require('../services/prisma');
const logger = require('../services/logger');
const { createUserSchema } = require('../validators/user');

const createUser = async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
  }
  const { id, name, email, image } = parsed.data;

  try {
    // Upsert: create if not exists, update if exists
    const user = await prisma.user.upsert({
      where: { id },
      update: { name, image },
      create: { id, name, email, image },
    });

    return res.status(201).json({ success: true, user });
  } catch (error) {
    logger.error({ err: error }, 'createUser failed');
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

// ─── Get User by ID ───────────────────────────────────────────────
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        resumes: true,
        interviews: { include: { questions: true } },
        roadmaps: true,
        dsa: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    logger.error({ err: error, userId: id }, 'getUserById failed');
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// ─── Get All Users (Admin) ────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, users, total: users.length });
  } catch (error) {
    logger.error({ err: error }, 'getAllUsers failed');
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// ─── Get User Analytics/Stats ────────────────────────────────────
const getUserStats = async (req, res) => {
  const { id } = req.params;

  try {
    const interviews = await prisma.interview.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'asc' },
      include: { questions: true },
    });

    const scoreHistory = interviews
      .filter(iv => iv.score !== null)
      .map(iv => ({ date: iv.createdAt, score: iv.score, role: iv.role }));

    const scores = scoreHistory.map(s => s.score);
    const avgScore = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
    const bestScore = scores.length ? Math.max(...scores) : null;
    const worstScore = scores.length ? Math.min(...scores) : null;

    const roleCounts = {};
    interviews.forEach(iv => {
      roleCounts[iv.role] = (roleCounts[iv.role] || 0) + 1;
    });
    const topRoles = Object.entries(roleCounts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);

    const recentInterviews = interviews
      .slice(-5)
      .reverse()
      .map(iv => ({
        id: iv.id,
        role: iv.role,
        score: iv.score,
        questionCount: iv.questions.length,
        createdAt: iv.createdAt,
      }));

    return res.status(200).json({
      success: true,
      stats: {
        totalInterviews: interviews.length,
        avgScore,
        bestScore,
        worstScore,
        scoreHistory,
        topRoles,
        recentInterviews,
      },
    });
  } catch (error) {
    logger.error({ err: error, userId: id }, 'getUserStats failed');
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

module.exports = { createUser, getUserById, getAllUsers, getUserStats };
