// Working main server using proven component approach
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add helmet middleware
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

// Add rate limiting
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

// Add file system operations
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

// Create uploads directory if it doesn't exist
if (fs && path) {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));
  console.log('✅ Uploads directory configured');
}

// Add MongoDB connection
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

// Add error handling for route imports
const importRoute = async (routePath, routeName) => {
  try {
    const routeModule = await import(routePath);
    console.log(`✅ ${routeName} routes imported successfully`);
    return routeModule.default;
  } catch (error) {
    console.error(`❌ Failed to import ${routeName} routes:`, error.message);
    return null;
  }
};

// Import routes with error handling
let authRoutes, sensorRoutes, chatRoutes, chatSystemRoutes, settingsRoutes, alertsRoutes, geminiRoutes, analyticsViewsRoutes, reportsRoutes, recipesRoutes, phasesRoutes, thresholdsRoutes, calendarRoutes;

// Import routes one by one with error handling
Promise.all([
  importRoute('./src/routes/auth.js', 'Auth'),
  importRoute('./src/routes/sensors.js', 'Sensors'),
  importRoute('./src/routes/chat.js', 'Chat'),
  importRoute('./src/routes/chatSystem.js', 'ChatSystem'),
  importRoute('./src/routes/settings.js', 'Settings'),
  importRoute('./src/routes/alerts.js', 'Alerts'),
  importRoute('./src/routes/gemini.js', 'Gemini'),
  importRoute('./src/routes/analyticsViews.js', 'AnalyticsViews'),
  importRoute('./src/routes/reports.js', 'Reports'),
  importRoute('./src/routes/recipes.js', 'Recipes'),
  importRoute('./src/routes/phases.js', 'Phases'),
  importRoute('./src/routes/thresholds.js', 'Thresholds'),
  importRoute('./src/routes/calendar.js', 'Calendar')
]).then(([auth, sensors, chat, chatSystem, settings, alerts, gemini, analyticsViews, reports, recipes, phases, thresholds, calendar]) => {
  // Assign imported routes
  authRoutes = auth;
  sensorRoutes = sensors;
  chatRoutes = chat;
  chatSystemRoutes = chatSystem;
  settingsRoutes = settings;
  alertsRoutes = alerts;
  geminiRoutes = gemini;
  analyticsViewsRoutes = analyticsViews;
  reportsRoutes = reports;
  recipesRoutes = recipes;
  phasesRoutes = phases;
  thresholdsRoutes = thresholds;
  calendarRoutes = calendar;

  // Use routes only if they imported successfully
  if (authRoutes) app.use('/api/auth', authRoutes);
  if (sensorRoutes) app.use('/api/sensors', sensorRoutes);
  if (chatRoutes) app.use('/api/chat', chatRoutes);
  if (chatSystemRoutes) app.use('/api/chat-system', chatSystemRoutes);
  if (settingsRoutes) app.use('/api/settings', settingsRoutes);
  if (alertsRoutes) app.use('/api/alerts', alertsRoutes);
  if (geminiRoutes) app.use('/api/gemini', geminiRoutes);
  if (analyticsViewsRoutes) app.use('/api/analytics-views', analyticsViewsRoutes);
  if (reportsRoutes) app.use('/api/reports', reportsRoutes);
  if (recipesRoutes) app.use('/api/recipes', recipesRoutes);
  if (phasesRoutes) app.use('/api/phases', phasesRoutes);
  if (thresholdsRoutes) app.use('/api/thresholds', thresholdsRoutes);
  if (calendarRoutes) app.use('/api/calendar', calendarRoutes);

  console.log('✅ All routes configured');
}).catch(error => {
  console.error('❌ Error during route import:', error);
});

// Add basic health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL,
    mongoConnected: mongoose ? mongoose.connection.readyState === 1 : false
  });
});

// Add root route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Working main server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
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
