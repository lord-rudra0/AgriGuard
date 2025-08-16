// Minimal server - just the basics
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware only
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection (optional)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB connected');
    })
    .catch((error) => {
      console.log('⚠️ MongoDB connection failed:', error.message);
    });
}

// File uploads directory setup
import fs from 'fs';
import path from 'path';
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Minimal server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test route working!',
    timestamp: new Date().toISOString()
  });
});

// Test individual routes
app.get('/api/test-auth', (req, res) => {
  res.json({
    message: 'Auth test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-sensors', (req, res) => {
  res.json({
    message: 'Sensors test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-chat', (req, res) => {
  res.json({
    message: 'Chat test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-gemini', (req, res) => {
  res.json({
    message: 'Gemini test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

// Route status
app.get('/api/route-status', (req, res) => {
  res.json({
    message: 'Route status',
    timestamp: new Date().toISOString(),
    routes: {
      auth: 'available',
      sensors: 'available',
      chat: 'available',
      gemini: 'available'
    },
    totalRoutes: 4,
    status: 'loaded'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

export default app;
