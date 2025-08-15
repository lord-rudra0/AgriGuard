// Minimal test server for Vercel debugging
import express from 'express';
import cors from 'cors';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Test server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Environment info route
app.get('/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    frontendUrl: process.env.FRONTEND_URL || 'not set',
    port: process.env.PORT || 'not set'
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    status: 'success',
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString()
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
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Only start server if not in Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Test server running on port ${PORT}`);
  });
}

export default app;
