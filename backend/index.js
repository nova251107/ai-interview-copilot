const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const webhookRoutes = require('./routes/webhooks');
const interviewRoutes = require('./routes/interviews');
const userRoutes = require('./routes/users');
const resumeRoutes = require('./routes/resumes');
const roadmapsRoutes = require('./routes/roadmaps');
const dsaRoutes = require('./routes/dsa');
const coverLetterRoutes = require('./routes/coverLetter');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS — must be FIRST before all routes ──────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-id',
    'x-user-name',
    'x-user-email',
  ],
  credentials: true,
}));

// ─── Security Headers (Helmet) ────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://img.clerk.com'],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
    },
  },
}));

// ─── Rate Limiters ───────────────────────────────────────────────
// General: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again after 15 minutes.' },
});

// AI endpoints: 10 requests per 15 minutes per IP (expensive Groq calls)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI request limit reached. Please wait 15 minutes before trying again.' },
});

// Apply general limiter to all routes
app.use(generalLimiter);

// ─── Webhook (raw body — must be BEFORE express.json()) ──────────
app.use('/api/webhooks/clerk', webhookRoutes);

app.use(express.json({ limit: '1mb' }));



// ─── AI Rate Limiter — must be BEFORE route handlers ────────────
// Applied to specific expensive AI-powered endpoints
app.use('/api/interviews/start', aiLimiter);
app.use('/api/roadmaps/generate', aiLimiter);
app.use('/api/cover-letter', aiLimiter);
app.use('/api/resume/analyze', aiLimiter);
app.use('/api/interviews/answer', aiLimiter);

// ─── Authentication Middleware ──────────────────────────────────
const { verifyAuth } = require('./middleware/auth');

// ─── Routes ─────────────────────────────────────────────────────
// Protected routes (require authentication)
app.use('/api/users', verifyAuth, userRoutes);
app.use('/api/resume', verifyAuth, resumeRoutes);
app.use('/api/interviews', verifyAuth, interviewRoutes);
app.use('/api/roadmaps', verifyAuth, roadmapsRoutes);
app.use('/api/dsa', verifyAuth, dsaRoutes);
app.use('/api/cover-letter', verifyAuth, coverLetterRoutes);
const adminRoutes = require('./routes/admin');
app.use('/api/admin', verifyAuth, adminRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 AI Interview Copilot API is running!',
    version: '1.2.0',
  });
});

// ─── Health Check ────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await require('./services/prisma').$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
