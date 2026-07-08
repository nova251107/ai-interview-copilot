const { z } = require('zod');

const generateRoadmapSchema = z.object({
  jobRole: z.string().trim().min(1, 'Job role is required').max(100, 'Job role must be 100 characters or fewer'),
  duration: z.union([z.literal(3), z.literal(6), z.literal(9), z.literal(12)]).optional().default(3),
});

module.exports = { generateRoadmapSchema };
