// Debug server to identify crash point
import express from 'express';
import cors from 'cors';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Test 1: Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Debug server - basic route working',
    timestamp: new Date().toISOString(),
    step: '1 - basic route'
  });
});

// Test 2: Add basic middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/test-middleware', (req, res) => {
  res.json({ 
    message: 'Middleware working',
    timestamp: new Date().toISOString(),
    step: '2 - middleware'
  });
});

// Test 3: Add helmet
try {
  import('helmet').then(helmet => {
    app.use(helmet.default());
    console.log('✅ Helmet middleware added');
  }).catch(err => {
    console.log('❌ Helmet import failed:', err.message);
  });
} catch (err) {
  console.log('❌ Helmet import error:', err.message);
}

app.get('/test-helmet', (req, res) => {
  res.json({ 
    message: 'Helmet middleware working',
    timestamp: new Date().toISOString(),
    step: '3 - helmet'
  });
});

// Test 4: Add rate limiting
try {
  import('express-rate-limit').then(rateLimit => {
    const limiter = rateLimit.default({
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

app.get('/test-rate-limit', (req, res) => {
  res.json({ 
    message: 'Rate limiting working',
    timestamp: new Date().toISOString(),
    step: '4 - rate limiting'
  });
});

// Test 5: Add MongoDB connection
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
      console.log('⚠️ No MONGO_URI provided');
    }
  }).catch(err => {
    console.log('❌ Mongoose import failed:', err.message);
  });
} catch (err) {
  console.log('❌ Mongoose import error:', err.message);
}

app.get('/test-mongo', (req, res) => {
  const mongoStatus = mongoose ? 
    (mongoose.connection.readyState === 1 ? 'connected' : 'disconnected') : 
    'not imported';
  
  res.json({ 
    message: 'MongoDB test',
    timestamp: new Date().toISOString(),
    step: '5 - mongodb',
    mongoStatus,
    hasMongoUri: !!process.env.MONGO_URI
  });
});

// Test 6: Add basic routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API route working',
    timestamp: new Date().toISOString(),
    step: '6 - api route'
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
    console.log(`🚀 Debug server running on port ${PORT}`);
  });
}

export default app;
