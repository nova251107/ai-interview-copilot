const { z } = require('zod');

const syncLeetCodeSchema = z.object({
  leetcodeUsername: z.string().min(1, 'LeetCode username required'),
});

const updateDSAStatsSchema = z.object({
  easy: z.number().int().min(0).optional(),
  medium: z.number().int().min(0).optional(),
  hard: z.number().int().min(0).optional(),
});

module.exports = { syncLeetCodeSchema, updateDSAStatsSchema };
