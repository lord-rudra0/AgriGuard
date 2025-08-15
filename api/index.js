// Main API route for Vercel
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.VERCEL_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import and use backend routes
import authRoutes from '../backend/src/routes/auth.js';
import sensorRoutes from '../backend/src/routes/sensors.js';
import chatRoutes from '../backend/src/routes/chat.js';
import chatSystemRoutes from '../backend/src/routes/chatSystem.js';
import settingsRoutes from '../backend/src/routes/settings.js';
import alertsRoutes from '../backend/src/routes/alerts.js';
import geminiRoutes from '../backend/src/routes/gemini.js';
import analyticsViewsRoutes from '../backend/src/routes/analyticsViews.js';
import reportsRoutes from '../backend/src/routes/reports.js';
import recipesRoutes from '../backend/src/routes/recipes.js';
import phasesRoutes from '../backend/src/routes/phases.js';
import thresholdsRoutes from '../backend/src/routes/thresholds.js';
import calendarRoutes from '../backend/src/routes/calendar.js';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-system', chatSystemRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/analytics-views', analyticsViewsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/phases', phasesRoutes);
app.use('/api/thresholds', thresholdsRoutes);
app.use('/api/calendar', calendarRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

export default app;
