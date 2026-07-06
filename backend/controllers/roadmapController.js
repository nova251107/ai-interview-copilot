const prisma = require('../services/prisma');
const { generateRoadmapContent } = require('../services/roadmapAI');

/**
 * Generate a new roadmap for a user.
 * Body: { jobRole }
 * Headers: x-user-id, x-user-name, x-user-email
 */
const generateRoadmap = async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { jobRole: rawJobRole, duration } = req.body;

  // ─── Input validation ────────────────────────────────────────
  const jobRole = typeof rawJobRole === 'string' ? rawJobRole.trim() : '';
  if (!userId) return res.status(401).json({ success: false, message: 'User ID required' });
  if (!jobRole) return res.status(400).json({ success: false, message: 'Job role required' });
  if (jobRole.length > 100) return res.status(400).json({ success: false, message: 'Job role must be 100 characters or fewer' });

  try {
    // 1. Ensure user row exists (upsert)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: req.headers['x-user-name'] || 'User',
        email: req.headers['x-user-email'] || `${userId}@unknown.com`,
      },
    });

    // 2. Generate roadmap JSON via AI
    const durationVal = parseInt(duration) || 3;
    const roadmapJson = await generateRoadmapContent(jobRole, durationVal);

    // 3. Save roadmap to database
    const roadmap = await prisma.roadmap.create({
      data: {
        userId,
        role: jobRole,
        roadmapJson,
      },
    });

    return res.status(201).json({
      success: true,
      roadmapId: roadmap.id,
      roadmap,
    });
  } catch (error) {
    console.error('generateRoadmap error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate roadmap' });
  }
};

/**
 * Get a specific roadmap by ID.
 * Params: id
 */
const getRoadmap = async (req, res) => {
  try {
    const { id } = req.params;
    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
    });

    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    // Verify ownership
    const authUserId = req.headers['x-user-id'];
    if (roadmap.userId !== authUserId) {
      const authUser = await prisma.user.findUnique({ where: { id: authUserId } });
      if (authUser?.email !== 'vatsalyagadoya@gmail.com') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    return res.status(200).json({ success: true, roadmap });
  } catch (error) {
    console.error('getRoadmap error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch roadmap' });
  }
};

/**
 * Get all roadmaps for a specific user.
 * Params: userId
 */
const getAllRoadmaps = async (req, res) => {
  try {
    const { userId } = req.params;
    const roadmaps = await prisma.roadmap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, roadmaps });
  } catch (error) {
    console.error('getAllRoadmaps error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch roadmaps' });
  }
};

module.exports = {
  generateRoadmap,
  getRoadmap,
  getAllRoadmaps,
};
