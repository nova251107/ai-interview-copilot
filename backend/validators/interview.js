const { z } = require('zod');

const startInterviewSchema = z.object({
  jobRole: z.string().trim().min(1, 'Job role is required').max(100, 'Job role must be 100 characters or fewer'),
  questionCount: z.union([z.literal(5), z.literal(10), z.literal(15)]).optional().default(5),
});

const submitAnswerSchema = z.object({
  interviewId: z.string().min(1, 'interviewId is required'),
  questionId: z.string().min(1, 'questionId is required'),
  answer: z.string().min(1, 'Answer is required'),
});

module.exports = { startInterviewSchema, submitAnswerSchema };
