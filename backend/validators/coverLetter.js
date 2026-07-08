const { z } = require('zod');

const generateCoverLetterSchema = z.object({
  jobDescription: z.string().min(30, 'Job description must be at least 30 characters').max(5000, 'Job description must be 5000 characters or fewer'),
  jobTitle: z.string().max(150, 'Job title must be 150 characters or fewer').optional().default(''),
  companyName: z.string().max(150, 'Company name must be 150 characters or fewer').optional().default(''),
});

module.exports = { generateCoverLetterSchema };
