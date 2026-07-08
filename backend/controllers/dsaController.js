const prisma = require('../services/prisma');
const { fetchLeetCodeStats } = require('../services/leetcode');
const logger = require('../services/logger');
const { syncLeetCodeSchema, updateDSAStatsSchema } = require('../validators/dsa');

/**
 * Get DSA stats for a specific user.
 * Params: userId
 */
const getDSAStats = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    const dsa = await prisma.dSA.findUnique({ where: { userId } });

    if (!dsa) {
      return res.status(200).json({
        success: true,
        dsa: { easy: 0, medium: 0, hard: 0, leetcodeUsername: null },
      });
    }

    return res.status(200).json({ success: true, dsa });
  } catch (error) {
    logger.error({ err: error, userId }, 'getDSAStats failed');
    return res.status(500).json({ success: false, message: 'Failed to fetch DSA stats' });
  }
};

/**
 * Sync DSA stats from real LeetCode profile.
 * Body: { leetcodeUsername }
 * Headers: x-user-id, x-user-name, x-user-email
 */
const syncLeetCode = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {return res.status(401).json({ success: false, message: 'User ID required' });}

  const parsed = syncLeetCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
  }
  const { leetcodeUsername } = parsed.data;

  try {
    // 1. Ensure user exists
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          name: req.headers['x-user-name'] || 'User',
          email: req.headers['x-user-email'] || `${userId}@placeholder.com`,
        },
      });
    } catch (userErr) {
      logger.warn({ err: userErr }, 'User upsert warning (continuing)');
    }

    // 2. Fetch REAL stats from LeetCode GraphQL API
    const lcStats = await fetchLeetCodeStats(leetcodeUsername);

    // 3. Save verified stats to DB
    const dsa = await prisma.dSA.upsert({
      where: { userId },
      update: {
        easy: lcStats.easy,
        medium: lcStats.medium,
        hard: lcStats.hard,
        leetcodeUsername: lcStats.username,
      },
      create: {
        userId,
        easy: lcStats.easy,
        medium: lcStats.medium,
        hard: lcStats.hard,
        leetcodeUsername: lcStats.username,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully synced ${lcStats.totalSolved} problems from LeetCode!`,
      dsa,
      lcStats,
    });
  } catch (error) {
    logger.error({ err: error, userId }, 'syncLeetCode failed');
    const msg = error.message.includes('not found')
      ? error.message
      : 'Failed to sync with LeetCode. Check the username and try again.';
    return res.status(400).json({ success: false, message: msg });
  }
};

/**
 * Update DSA stats manually.
 * Body: { easy, medium, hard }
 * Headers: x-user-id, x-user-name, x-user-email
 */
const updateDSAStats = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {return res.status(401).json({ success: false, message: 'User ID required in headers' });}

  const parsed = updateDSAStatsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
  }
  const { easy, medium, hard } = parsed.data;

  try {
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          name: req.headers['x-user-name'] || 'User',
          email: req.headers['x-user-email'] || `${userId}@placeholder.com`,
        },
      });
    } catch (userErr) {
      logger.warn({ err: userErr }, 'User upsert warning (continuing)');
    }

    const updateData = {};
    if (easy !== undefined) {updateData.easy = easy;}
    if (medium !== undefined) {updateData.medium = medium;}
    if (hard !== undefined) {updateData.hard = hard;}

    const dsa = await prisma.dSA.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        easy: parseInt(easy) || 0,
        medium: parseInt(medium) || 0,
        hard: parseInt(hard) || 0,
      },
    });

    return res.status(200).json({ success: true, dsa });
  } catch (error) {
    logger.error({ err: error, userId }, 'updateDSAStats failed');
    return res.status(500).json({ success: false, message: 'Failed to update DSA stats' });
  }
};

module.exports = { getDSAStats, syncLeetCode, updateDSAStats };
