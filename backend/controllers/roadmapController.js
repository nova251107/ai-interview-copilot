const prisma = require('../services/prisma');
const { generateRoadmapContent } = require('../services/roadmapAI');
const logger = require('../services/logger');
const { generateRoadmapSchema } = require('../validators/roadmap');

/**
 * Generate a new roadmap for a user.
 * Body: { jobRole }
 * Headers: x-user-id, x-user-name, x-user-email
 */
const generateRoadmap = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {return res.status(401).json({ success: false, message: 'User ID required' });}

  const parsed = generateRoadmapSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
  }
  const { jobRole, duration } = parsed.data;

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

    const roadmapJson = await generateRoadmapContent(jobRole, duration);

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
    logger.error({ err: error, userId }, 'generateRoadmap failed');
    return res.status(500).json({ success: false, message: 'Failed to generate roadmap' });
  }
};

/**
 * Get a specific roadmap by ID.
 * Params: id
 */
const getRoadmap = async (req, res) => {
  const { id } = req.params;

  try {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
    });

    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    const authUserId = req.headers['x-user-id'];
    if (roadmap.userId !== authUserId) {
      const adminEmail = process.env.ADMIN_EMAIL;
      const authUser = await prisma.user.findUnique({ where: { id: authUserId } });
      if (!adminEmail || authUser?.email !== adminEmail) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    return res.status(200).json({ success: true, roadmap });
  } catch (error) {
    logger.error({ err: error, id }, 'getRoadmap failed');
    return res.status(500).json({ success: false, message: 'Failed to fetch roadmap' });
  }
};

/**
 * Get all roadmaps for a specific user.
 * Params: userId
 */
const getAllRoadmaps = async (req, res) => {
  const { userId } = req.params;

  try {
    const roadmaps = await prisma.roadmap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, roadmaps });
  } catch (error) {
    logger.error({ err: error, userId }, 'getAllRoadmaps failed');
    return res.status(500).json({ success: false, message: 'Failed to fetch roadmaps' });
  }
};

module.exports = {
  generateRoadmap,
  getRoadmap,
  getAllRoadmaps,
};
