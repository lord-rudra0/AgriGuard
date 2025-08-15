// Progressive server to identify crash point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Progressive server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL,
    step: '1 - basic setup'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    step: '1 - basic setup'
  });
});

// Test basic API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Basic API working',
    timestamp: new Date().toISOString(),
    step: '1 - basic setup'
  });
});

// Step 2: Add rate limiting
let rateLimit;
try {
  import('express-rate-limit').then(module => {
    rateLimit = module.default;
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
    });
    app.use('/api/', limiter);
    console.log('✅ Rate limiting added');
  }).catch(err => {
    console.log('❌ Rate limiting import failed:', err.message);
  });
} catch (err) {
  console.log('❌ Rate limiting import error:', err.message);
}

app.get('/api/rate-limit-test', (req, res) => {
  res.json({ 
    message: 'Rate limiting test',
    timestamp: new Date().toISOString(),
    step: '2 - rate limiting',
    rateLimitLoaded: !!rateLimit
  });
});

// Step 3: Add MongoDB connection
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
        console.log('✅ MongoDB connected');
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
      });
    } else {
      console.warn('⚠️ No MONGO_URI provided');
    }
  }).catch(err => {
    console.error('❌ Mongoose import failed:', err.message);
  });
} catch (err) {
  console.error('❌ Mongoose import error:', err.message);
}

app.get('/api/mongo-test', (req, res) => {
  const mongoStatus = mongoose ? 
    (mongoose.connection.readyState === 1 ? 'connected' : 'disconnected') : 
    'not imported';
  
  res.json({ 
    message: 'MongoDB test',
    timestamp: new Date().toISOString(),
    step: '3 - mongodb',
    mongoStatus,
    hasMongoUri: !!process.env.MONGO_URI
  });
});

// Step 4: Test route imports
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
    timestamp: new Date().toISOString(),
    step: '4 - route imports',
    authRoutesLoaded: !!authRoutes
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
