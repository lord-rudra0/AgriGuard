// Simplified server to test main functionality
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
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Environment info route
app.get('/env-info', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    frontendUrl: process.env.FRONTEND_URL || 'not set'
  });
});

// Test basic API structure
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Basic API working',
    timestamp: new Date().toISOString()
  });
});

// Test MongoDB connection (without models)
let mongoose;
try {
  import('mongoose').then(mongooseModule => {
    mongoose = mongooseModule.default;
    console.log('✅ Mongoose imported');
    
    if (process.env.MONGO_URI) {
      mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      .then(() => {
        console.log('✅ Connected to MongoDB');
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
      });
    } else {
      console.warn('⚠️ MONGO_URI not provided');
    }
  }).catch(err => {
    console.error('❌ Mongoose import failed:', err.message);
  });
} catch (err) {
  console.error('❌ Mongoose import error:', err.message);
}

app.get('/api/mongo-status', (req, res) => {
  const mongoStatus = mongoose ? 
    (mongoose.connection.readyState === 1 ? 'connected' : 'disconnected') : 
    'not imported';
  
  res.json({ 
    mongoStatus,
    hasMongoUri: !!process.env.MONGO_URI,
    timestamp: new Date().toISOString()
  });
});

// Test route imports one by one
let authRoutes;
try {
  import('./src/routes/auth.js').then(module => {
    authRoutes = module.default;
    console.log('✅ Auth routes imported');
    app.use('/api/auth', authRoutes);
  }).catch(err => {
    console.error('❌ Auth routes import failed:', err.message);
  });
} catch (err) {
  console.error('❌ Auth routes import error:', err.message);
}

app.get('/api/auth-test', (req, res) => {
  res.json({ 
    message: 'Auth routes test',
    authRoutesLoaded: !!authRoutes,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
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

// Only start server if not in Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Simple server running on port ${PORT}`);
  });
}

export default app;
