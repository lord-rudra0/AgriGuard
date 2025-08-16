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

// Import and register routes one by one with error handling
const loadRoutes = async () => {
  const loadedRoutes = {};
  
  try {
    // Import routes one by one
    const authRoutes = await importRoute('./src/routes/auth.js', 'Auth');
    if (authRoutes) {
      app.use('/api/auth', authRoutes);
      loadedRoutes.auth = true;
      console.log('✅ Auth routes registered');
    }

    const sensorRoutes = await importRoute('./src/routes/sensors.js', 'Sensors');
    if (sensorRoutes) {
      app.use('/api/sensors', sensorRoutes);
      loadedRoutes.sensors = true;
      console.log('✅ Sensors routes registered');
    }

    const chatRoutes = await importRoute('./src/routes/chat.js', 'Chat');
    if (chatRoutes) {
      app.use('/api/chat', chatRoutes);
      loadedRoutes.chat = true;
      console.log('✅ Chat routes registered');
    }

    const chatSystemRoutes = await importRoute('./src/routes/chatSystem.js', 'ChatSystem');
    if (chatSystemRoutes) {
      app.use('/api/chat-system', chatSystemRoutes);
      loadedRoutes.chatSystem = true;
      console.log('✅ ChatSystem routes registered');
    }

    const settingsRoutes = await importRoute('./src/routes/settings.js', 'Settings');
    if (settingsRoutes) {
      app.use('/api/settings', settingsRoutes);
      loadedRoutes.settings = true;
      console.log('✅ Settings routes registered');
    }

    const alertsRoutes = await importRoute('./src/routes/alerts.js', 'Alerts');
    if (alertsRoutes) {
      app.use('/api/alerts', alertsRoutes);
      loadedRoutes.alerts = true;
      console.log('✅ Alerts routes registered');
    }

    const geminiRoutes = await importRoute('./src/routes/gemini.js', 'Gemini');
    if (geminiRoutes) {
      app.use('/api/gemini', geminiRoutes);
      loadedRoutes.gemini = true;
      console.log('✅ Gemini routes registered');
    }

    const analyticsViewsRoutes = await importRoute('./src/routes/analyticsViews.js', 'AnalyticsViews');
    if (analyticsViewsRoutes) {
      app.use('/api/analytics-views', analyticsViewsRoutes);
      loadedRoutes.analyticsViews = true;
      console.log('✅ AnalyticsViews routes registered');
    }

    const reportsRoutes = await importRoute('./src/routes/reports.js', 'Reports');
    if (reportsRoutes) {
      app.use('/api/reports', reportsRoutes);
      loadedRoutes.reports = true;
      console.log('✅ Reports routes registered');
    }

    const recipesRoutes = await importRoute('./src/routes/recipes.js', 'Recipes');
    if (recipesRoutes) {
      app.use('/api/recipes', recipesRoutes);
      loadedRoutes.recipes = true;
      console.log('✅ Recipes routes registered');
    }

    const phasesRoutes = await importRoute('./src/routes/phases.js', 'Phases');
    if (phasesRoutes) {
      app.use('/api/phases', phasesRoutes);
      loadedRoutes.phases = true;
      console.log('✅ Phases routes registered');
    }

    const thresholdsRoutes = await importRoute('./src/routes/thresholds.js', 'Thresholds');
    if (thresholdsRoutes) {
      app.use('/api/thresholds', thresholdsRoutes);
      loadedRoutes.thresholds = true;
      console.log('✅ Thresholds routes registered');
    }

    const calendarRoutes = await importRoute('./src/routes/calendar.js', 'Calendar');
    if (calendarRoutes) {
      app.use('/api/calendar', calendarRoutes);
      loadedRoutes.calendar = true;
      console.log('✅ Calendar routes registered');
    }

    console.log('✅ All routes loaded and registered');
    
    // Store loaded routes for status endpoint
    app.locals.loadedRoutes = loadedRoutes;
    
  } catch (error) {
    console.error('❌ Error during route loading:', error);
  }
};

// Load routes after a short delay to ensure middleware is ready
setTimeout(() => {
  loadRoutes();
}, 1000);

// Add route status endpoint
app.get('/api/route-status', (req, res) => {
  const loadedRoutes = app.locals.loadedRoutes || {};
  res.json({ 
    message: 'Route loading status',
    timestamp: new Date().toISOString(),
    routes: loadedRoutes
  });
});

// Add a simple test endpoint to verify routes are working
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API test endpoint working!',
    timestamp: new Date().toISOString(),
    routesLoaded: !!app.locals.loadedRoutes
  });
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

// Add a simple test route that's always available
app.get('/api/simple-test', (req, res) => {
  res.json({
    message: 'Simple test route is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
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
