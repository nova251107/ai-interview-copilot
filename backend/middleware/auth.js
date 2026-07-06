const { createClerkClient } = require('@clerk/express');
const prisma = require('../services/prisma');

// Initialize Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Authentication middleware that verifies Clerk session tokens.
 */
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const { sub: userId } = await clerk.verifyToken(token);
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Invalid token: no user ID' });
      }
      req.auth = {
        userId,
        verified: true,
      };
      req.headers['x-user-id'] = userId;
      return next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    }
  }

  const userId = req.headers['x-user-id'];
  if (userId) {
    console.warn(`[AUTH WARNING] Request using unverified x-user-id header: ${userId}. Migrate to Bearer token auth.`);
    req.auth = {
      userId,
      verified: false,
    };
    return next();
  }

  return res.status(401).json({ success: false, message: 'Authentication required. Provide Authorization header.' });
};

/**
 * Authorization middleware that verifies the user owns the resource they are trying to access.
 * Compares the userId/id in the route params with the authenticated user ID.
 * Admins (vatsalyagadoya@gmail.com) are allowed to bypass this check.
 */
const verifyOwnership = async (req, res, next) => {
  const authUserId = req.auth?.userId;
  // Only check 'userId' param, or 'id' param specifically for users routes
  const requestedUserId = req.params.userId || (req.baseUrl.includes('/users') ? req.params.id : null);

  if (!authUserId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // If there's no resource user ID to match, skip verification
  if (!requestedUserId) {
    return next();
  }

  // If they match, allow access
  if (requestedUserId === authUserId) {
    return next();
  }

  // DB lookup to check if the authenticated user is the admin
  try {
    const user = await prisma.user.findUnique({ where: { id: authUserId } });
    if (user && user.email === 'vatsalyagadoya@gmail.com') {
      return next();
    }
  } catch (error) {
    console.error('Database authorization check failed:', error);
  }

  return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to access this resource.' });
};

module.exports = { verifyAuth, verifyOwnership };
