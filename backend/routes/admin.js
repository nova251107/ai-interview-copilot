const express = require('express');
const prisma = require('../services/prisma');

const router = express.Router();

// Middleware to secure the route by email
const adminAuth = (req, res, next) => {
  const userEmail = req.headers['x-user-email'];

  if (!userEmail) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No email provided' });
  }

  // Check if it's the admin email
  if (userEmail !== 'vatsalyagadoya@gmail.com') {
    return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to view this page.' });
  }

  next();
};

// GET /api/admin/users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            interviews: true,
            resumes: true,
            roadmaps: true,
          },
        },
      },
    });

    res.json({ success: true, users });
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
