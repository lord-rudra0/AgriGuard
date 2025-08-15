// Component test server to identify crash point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware only
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Component test server is running!',
    timestamp: new Date().toISOString(),
    step: '1 - basic express'
  });
});

// Test 2: Add helmet
let helmet;
try {
  import('helmet').then(module => {
    helmet = module.default;
    app.use(helmet());
    console.log('✅ Helmet added');
  }).catch(err => {
    console.log('❌ Helmet import failed:', err.message);
  });
} catch (err) {
  console.log('❌ Helmet import error:', err.message);
}

app.get('/test-helmet', (req, res) => {
  res.json({ 
    message: 'Helmet test',
    timestamp: new Date().toISOString(),
    step: '2 - helmet',
    helmetLoaded: !!helmet
  });
});

// Test 3: Add rate limiting
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

app.get('/test-rate-limit', (req, res) => {
  res.json({ 
    message: 'Rate limiting test',
    timestamp: new Date().toISOString(),
    step: '3 - rate limiting',
    rateLimitLoaded: !!rateLimit
  });
});

// Test 4: Add file system operations
let fs, path;
try {
  import('fs').then(fsModule => {
    fs = fsModule.default;
    console.log('✅ FS imported');
  }).catch(err => {
    console.log('❌ FS import failed:', err.message);
  });
  
  import('path').then(pathModule => {
    path = pathModule.default;
    console.log('✅ Path imported');
  }).catch(err => {
    console.log('❌ Path import failed:', err.message);
  });
} catch (err) {
  console.log('❌ FS/Path import error:', err.message);
}

app.get('/test-fs', (req, res) => {
  res.json({ 
    message: 'File system test',
    timestamp: new Date().toISOString(),
    step: '4 - file system',
    fsLoaded: !!fs,
    pathLoaded: !!path
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
      console.warn('⚠️ No MONGO_URI provided');
    }
  }).catch(err => {
    console.error('❌ Mongoose import failed:', err.message);
  });
} catch (err) {
  console.error('❌ Mongoose import error:', err.message);
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

// Test 6: Test route imports
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

app.get('/test-routes', (req, res) => {
  res.json({ 
    message: 'Routes test',
    timestamp: new Date().toISOString(),
    step: '6 - routes',
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
