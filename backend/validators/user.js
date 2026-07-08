const { z } = require('zod');

const createUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email is required'),
  name: z.string().optional().default(''),
  image: z.string().optional().default(''),
});

module.exports = { createUserSchema };
