import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { authenticateSocket } from './middleware/auth.js';
import { authRoutes as authRoutesStatic } from './routes/index.js';
import multer from 'multer';
import { predictImage } from './onnx/mushroomModel.js';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
// Build an allowlist and normalize to avoid trailing-slash mismatch
const rawAllowed = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL, // Vercel-provided URL
  'http://localhost:3000',
]
  .filter(Boolean)
  .flatMap(v => String(v).split(',')) // support comma-separated values
  .map(v => v.trim().replace(/\/$/, ''));

const ALLOWED_ORIGINS = Array.from(new Set(rawAllowed));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests with no Origin
    if (!origin) return callback(null, true);
    const clean = origin.replace(/\/$/, '');
    const ok = ALLOWED_ORIGINS.includes(clean);
    return callback(ok ? null : new Error(`CORS: Origin not allowed: ${origin}`), ok);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Create HTTP server and Socket.IO
const server = createServer(app);

// Socket.IO setup (apply same CORS policy)
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io'
});

// Expose io to routes via app
app.set('io', io);

// Socket.IO authentication middleware
io.use(authenticateSocket);

// In-memory presence map: userId -> Set of socket ids
const onlineUsers = new Map();

// Track last MongoDB connection error for diagnostics
let lastMongoError = null;

// Socket.IO connection handling
io.on('connection', (socket) => {
  const userId = String(socket.user.id);
  console.log(`User ${userId} connected`);

  // Track presence
  const setForUser = onlineUsers.get(userId) || new Set();
  setForUser.add(socket.id);
  onlineUsers.set(userId, setForUser);
  io.emit('presence:update', { userId, online: true });
  
  // Join user to their personal room
  socket.join(`user_${userId}`);
  
  // Handle sensor data simulation (in production, this would come from actual sensors)
  const sensorInterval = setInterval(() => {
    const sensorData = {
      temperature: Math.round((Math.random() * 10 + 20) * 10) / 10, // 20-30°C
      humidity: Math.round((Math.random() * 40 + 40) * 10) / 10, // 40-80%
      co2: Math.round(Math.random() * 300 + 300), // 300-600 ppm
      light: Math.round(Math.random() * 600 + 200), // 200-800 lux
      soilMoisture: Math.round((Math.random() * 40 + 30) * 10) / 10, // 30-70%
      timestamp: new Date()
    };
    
    socket.emit('sensorData', sensorData);
    
    // Check for alerts
    const alerts = checkForAlerts(sensorData);
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        socket.emit('newAlert', alert);
      });
    }
  }, 5000); // Send data every 5 seconds

  // Lightweight weather alert simulation (replace with real API integration later)
  const weatherAlertInterval = setInterval(() => {
    // Randomly emit a weather alert ~1/6 times
    if (Math.random() < 0.166) {
      const kinds = [
        { type: 'weather', title: 'High Heat Warning', message: 'Ambient temperature rising; adjust HVAC for grow rooms.', severity: 'medium' },
        { type: 'weather', title: 'Storm Incoming', message: 'Possible power fluctuations. Verify backup systems.', severity: 'high' },
        { type: 'weather', title: 'High Humidity Outside', message: 'Dehumidification load will increase.', severity: 'medium' },
      ];
      const alert = { ...kinds[Math.floor(Math.random() * kinds.length)], timestamp: new Date() };
      socket.emit('weatherAlert', alert);
    }
  }, 60000); // Check roughly every minute

  // Chat room management
  socket.on('chat:join', ({ chatId }) => {
    if (chatId) socket.join(`chat_${chatId}`);
  });
  socket.on('chat:leave', ({ chatId }) => {
    if (chatId) socket.leave(`chat_${chatId}`);
  });

  // Typing indicators
  socket.on('chat:typing', ({ chatId, typing }) => {
    if (!chatId) return;
    socket.to(`chat_${chatId}`).emit('chat:typing', { chatId, userId, typing, name: socket.user.name });
  });

  // Forward chat messages (after REST save on client)
  socket.on('chat:message', ({ chatId, message }) => {
    if (!chatId || !message) return;
    socket.to(`chat_${chatId}`).emit('chat:message', message);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const set = onlineUsers.get(userId);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) {
        onlineUsers.delete(userId);
        io.emit('presence:update', { userId, online: false });
      } else {
        onlineUsers.set(userId, set);
      }
    }
    console.log(`User ${userId} disconnected`);
    clearInterval(sensorInterval);
    clearInterval(weatherAlertInterval);
  });
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));

// Trust proxy for Vercel serverless environment
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - fixed for Vercel serverless
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later'
  },
  // Fix for Vercel serverless environment
  standardHeaders: true,
  legacyHeaders: false,
  // Use a custom key generator that works with Vercel
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if available, fallback to IP
    return req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection.remoteAddress;
  }
});
app.use('/api', limiter);

// Synchronously mount critical routes to avoid cold-start 404s
app.use('/api/auth', authRoutesStatic);

// Note: Static file serving removed for Vercel serverless compatibility
// Vercel serverless functions cannot create directories or serve static files
// For file uploads, use Vercel Blob or external storage services

// MongoDB connection with retry/backoff for serverless reliability
if (process.env.MONGO_URI) {
  async function connectWithRetry(attempt = 1) {
    const maxAttempts = 5;
    const baseDelayMs = 2000;
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 20000,
        family: 4, // prefer IPv4 to avoid some DNS/IPv6 issues in serverless
      });
      lastMongoError = null;
      console.log('✅ Connected to MongoDB');
    } catch (err) {
      lastMongoError = err?.message || String(err);
      console.error(`❌ MongoDB connection error (attempt ${attempt}):`, err?.message || err);
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying MongoDB connection in ${delay}ms...`);
        setTimeout(() => connectWithRetry(attempt + 1), delay);
      } else {
        console.error('🛑 Max MongoDB connection attempts reached. Will stay degraded.');
      }
    }
  }
  connectWithRetry();
} else {
  console.warn('⚠️ MONGO_URI not provided, running without database');
}

// Add a basic health check route at the top
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoConnected: mongoose.connection.readyState === 1,
    vercel: !!process.env.VERCEL
  });
});

// Add root route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Agricultural Monitoring Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Add environment info route for debugging
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

// Image upload handler for predictions
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/predict/mushroom', upload.single('image'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No image uploaded' });
    const result = await predictImage(req.file.buffer);
    res.json({ success: true, result });
  } catch (e) {
    console.error('Prediction error', e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Serve ONNX model for frontend convenience in development
app.get('/api/model/mushroom', (req, res) => {
  try {
    // Try a few likely locations depending on where server was started from
    const candidates = [
      path.resolve(process.cwd(), 'mushroom_classification_model_ResNet50', 'mushroom_classifier.onnx'),
      path.resolve(process.cwd(), '..', 'mushroom_classification_model_ResNet50', 'mushroom_classifier.onnx'),
      path.resolve(process.cwd(), '..', '..', 'mushroom_classification_model_ResNet50', 'mushroom_classifier.onnx'),
      path.resolve(process.cwd(), 'public', 'models', 'mushroom_classifier.onnx')
    ];

    let modelPath = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        modelPath = p;
        break;
      }
    }

    if (!modelPath) {
      console.warn('ONNX model not found in any candidate path:', candidates);
      return res.status(404).json({ error: 'Model not found on server' });
    }

    const stat = fs.statSync(modelPath);
    console.log('Serving ONNX model from', modelPath, 'size', stat.size);
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'public, max-age=3600'
    });
    const stream = fs.createReadStream(modelPath);
    stream.pipe(res);
    stream.on('error', (err) => {
      console.error('Model stream error', err);
      res.end();
    });
  } catch (e) {
    console.error('Error serving model', e);
    res.status(500).json({ error: 'Failed to serve model' });
  }
});

// DB ping endpoint for diagnostics
app.get('/db/ping', async (req, res) => {
  try {
    const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
    res.json({
      readyState: state,
      connected: state === 1,
      lastError: lastMongoError || null,
    });
  } catch (e) {
    res.status(500).json({ message: 'Ping failed', error: e?.message || String(e) });
  }
});

// Add error handling for route imports
const importRoute = async (routePath, routeName) => {
  try {
    // Try multiple path variations for Vercel compatibility
    let routeModule;
    const paths = [
      routePath,
      `./src${routePath.substring(1)}`,
      routePath.replace('./routes/', './src/routes/'),
      routePath.replace('./routes/', '/var/task/backend/src/routes/')
    ];
    
    for (const path of paths) {
      try {
        routeModule = await import(path);
        console.log(`✅ ${routeName} routes imported successfully from: ${path}`);
        break;
      } catch (pathError) {
        console.log(`   Trying path: ${path} - ${pathError.code || 'failed'}`);
      }
    }
    
    if (!routeModule) {
      throw new Error(`All import paths failed for ${routeName}`);
    }
    
    return routeModule.default;
  } catch (error) {
    console.error(`❌ Failed to import ${routeName} routes:`, error.message);
    console.error(`   Path: ${routePath}`);
    console.error(`   Error type: ${error.code || 'unknown'}`);
    return null;
  }
};

// Import routes with error handling - using routes index for reliability
let authRoutes, sensorRoutes, chatRoutes, chatSystemRoutes, settingsRoutes, alertsRoutes, geminiRoutes, analyticsViewsRoutes, reportsRoutes, recipesRoutes, phasesRoutes, thresholdsRoutes, calendarRoutes;
let notificationsRoutes;

// Import routes one by one with error handling - more robust approach
const loadRoutes = async () => {
  try {
    console.log('🚀 Starting route loading...');
    
    // Try to import from routes index first (most reliable)
    try {
      const routesIndex = await import('./routes/index.js');
      console.log('✅ Routes index imported successfully');
      
      // Extract routes from index
      authRoutes = routesIndex.authRoutes;
      sensorRoutes = routesIndex.sensorRoutes;
      chatRoutes = routesIndex.chatRoutes;
      chatSystemRoutes = routesIndex.chatSystemRoutes;
      settingsRoutes = routesIndex.settingsRoutes;
      alertsRoutes = routesIndex.alertsRoutes;
      geminiRoutes = routesIndex.geminiRoutes;
      analyticsViewsRoutes = routesIndex.analyticsViewsRoutes;
      reportsRoutes = routesIndex.reportsRoutes;
      recipesRoutes = routesIndex.recipesRoutes;
      phasesRoutes = routesIndex.phasesRoutes;
      thresholdsRoutes = routesIndex.thresholdsRoutes;
      calendarRoutes = routesIndex.calendarRoutes;
  notificationsRoutes = routesIndex.notificationsRoutes;
      
      console.log('✅ All routes loaded from index');
    } catch (indexError) {
      console.log('⚠️ Routes index failed, trying individual imports...');
      console.log('   Index error:', indexError.message);
      
      // Fallback to individual imports
      authRoutes = await importRoute('./routes/auth.js', 'Auth');
      sensorRoutes = await importRoute('./routes/sensors.js', 'Sensors');
      chatRoutes = await importRoute('./routes/chat.js', 'Chat');
      chatSystemRoutes = await importRoute('./routes/chatSystem.js', 'ChatSystem');
      settingsRoutes = await importRoute('./routes/settings.js', 'Settings');
      alertsRoutes = await importRoute('./routes/alerts.js', 'Alerts');
      geminiRoutes = await importRoute('./routes/gemini.js', 'Gemini');
      analyticsViewsRoutes = await importRoute('./routes/analyticsViews.js', 'AnalyticsViews');
      reportsRoutes = await importRoute('./routes/reports.js', 'Reports');
      recipesRoutes = await importRoute('./routes/recipes.js', 'Recipes');
      phasesRoutes = await importRoute('./routes/phases.js', 'Phases');
      thresholdsRoutes = await importRoute('./routes/thresholds.js', 'Thresholds');
      calendarRoutes = await importRoute('./routes/calendar.js', 'Calendar');
    }

    // Use routes only if they imported successfully
    // Auth is already mounted synchronously above to avoid cold-start 404s
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
    if (notificationsRoutes) app.use('/api/notifications', notificationsRoutes);

    // Note: /api/config/push is mounted synchronously in the top-level server to
    // avoid cold-start 404s; do not define it here to prevent duplicate handlers.

    console.log('✅ All routes configured');
  } catch (error) {
    console.error('❌ Error during route loading:', error);
  }
};

// Load routes immediately
loadRoutes();

// Socket.IO authentication middleware
// io.use(authenticateSocket); // This line is now handled above

// In-memory presence map: userId -> Set of socket ids
// const onlineUsers = new Map(); // This line is now handled above

// Socket.IO connection handling
// io.on('connection', (socket) => { // This block is now handled above
//   const userId = String(socket.user.id);
//   console.log(`User ${userId} connected`);

//   // Track presence
//   const setForUser = onlineUsers.get(userId) || new Set();
//   setForUser.add(socket.id);
//   onlineUsers.set(userId, setForUser);
//   io.emit('presence:update', { userId, online: true });
  
//   // Join user to their personal room
//   socket.join(`user_${userId}`);
  
//   // Handle sensor data simulation (in production, this would come from actual sensors)
//   const sensorInterval = setInterval(() => {
//     const sensorData = {
//       temperature: Math.round((Math.random() * 10 + 20) * 10) / 10, // 20-30°C
//       humidity: Math.round((Math.random() * 40 + 40) * 10) / 10, // 40-80%
//       co2: Math.round(Math.random() * 300 + 300), // 300-600 ppm
//       light: Math.round(Math.random() * 600 + 200), // 200-800 lux
//       soilMoisture: Math.round((Math.random() * 40 + 30) * 10) / 10, // 30-70%
//       timestamp: new Date()
//     };
    
//     socket.emit('sensorData', sensorData);
    
//     // Check for alerts
//     const alerts = checkForAlerts(sensorData);
//     if (alerts.length > 0) {
//       alerts.forEach(alert => {
//         socket.emit('newAlert', alert);
//       });
//     }
//   }, 5000); // Send data every 5 seconds

//   // Lightweight weather alert simulation (replace with real API integration later)
//   const weatherAlertInterval = setInterval(() => {
//     // Randomly emit a weather alert ~1/6 times
//     if (Math.random() < 0.166) {
//       const kinds = [
//         { type: 'weather', title: 'High Heat Warning', message: 'Ambient temperature rising; adjust HVAC for grow rooms.', severity: 'medium' },
//         { type: 'weather', title: 'Storm Incoming', message: 'Possible power fluctuations. Verify backup systems.', severity: 'high' },
//         { type: 'weather', title: 'High Humidity Outside', message: 'Dehumidification load will increase.', severity: 'medium' },
//       ];
//       const alert = { ...kinds[Math.floor(Math.random() * kinds.length)], timestamp: new Date() };
//       socket.emit('weatherAlert', alert);
//     }
//   }, 60000); // Check roughly every minute

//   // Chat room management
//   socket.on('chat:join', ({ chatId }) => {
//     if (chatId) socket.join(`chat_${chatId}`);
//   });
//   socket.on('chat:leave', ({ chatId }) => {
//     if (chatId) socket.leave(`chat_${chatId}`);
//   });

//   // Typing indicators
//   socket.on('chat:typing', ({ chatId, typing }) => {
//     if (!chatId) return;
//     socket.to(`chat_${chatId}`).emit('chat:typing', { chatId, userId, typing, name: socket.user.name });
//   });

//   // Forward chat messages (after REST save on client)
//   socket.on('chat:message', ({ chatId, message }) => {
//     if (!chatId || !message) return;
//     socket.to(`chat_${chatId}`).emit('chat:message', message);
//   });

//   // Handle disconnect
//   socket.on('disconnect', () => {
//     const set = onlineUsers.get(userId);
//     if (set) {
//       set.delete(socket.id);
//       if (set.size === 0) {
//         onlineUsers.delete(userId);
//         io.emit('presence:update', { userId, online: false });
//       } else {
//         onlineUsers.set(userId, set);
//       }
//     }
//     console.log(`User ${userId} disconnected`);
//     clearInterval(sensorInterval);
//     clearInterval(weatherAlertInterval);
//   });
// });

// Function to check for alerts based on sensor data
const checkForAlerts = (data) => {
  const alerts = [];
  const thresholds = {
    temperature: { min: 18, max: 28 },
    humidity: { min: 40, max: 80 },
    co2: { min: 300, max: 600 },
    light: { min: 200, max: 800 },
    soilMoisture: { min: 30, max: 70 }
  };

  Object.keys(thresholds).forEach(sensor => {
    const value = data[sensor];
    const { min, max } = thresholds[sensor];
    
    if (value < min || value > max) {
      alerts.push({
        type: sensor,
        severity: value < min * 0.8 || value > max * 1.2 ? 'high' : 'medium',
        message: `${sensor} is ${value < min ? 'too low' : 'too high'}: ${value}`,
        timestamp: new Date()
      });
    }
  });

  return alerts;
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Socket.IO server ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
}

// Export for Vercel serverless functions
export default app;

// Simple scheduler: checks every 5 minutes and sends emails when hour matches
const SCHEDULER_INTERVAL_MS = 5 * 60 * 1000;
let schedulerTimer = null;
async function startScheduler() {
  if (schedulerTimer) return;
  
  try {
    // Dynamically import required modules
    const { default: ReportSchedule } = await import('./models/ReportSchedule.js');
    const { runScheduleAndEmail } = await import('./routes/reports.js');
    
    schedulerTimer = setInterval(async () => {
      try {
        const now = new Date();
        const currentHour = now.getHours();
        const items = await ReportSchedule.find({ enabled: true }).lean();
        for (const s of items) {
          const last = s.lastRunAt ? new Date(s.lastRunAt) : null;
          const shouldRunHour = s.hourLocal ?? 8;
          const isCorrectHour = currentHour === shouldRunHour;
          const notRunThisHour = !last || last.getHours() !== currentHour || (now - last) > 60 * 60 * 1000;
          // Basic frequency gate: daily always, weekly only on Monday
          const freqOk = s.frequency === 'daily' || (s.frequency === 'weekly' && now.getDay() === 1);
          if (isCorrectHour && notRunThisHour && freqOk) {
            await runScheduleAndEmail(s);
            await ReportSchedule.updateOne({ _id: s._id }, { $set: { lastRunAt: new Date() } });
          }
        }
      } catch (e) {
        console.error('Scheduler error', e);
      }
    }, SCHEDULER_INTERVAL_MS);
    
    console.log('✅ Scheduler started successfully');
  } catch (error) {
    console.error('❌ Failed to start scheduler:', error.message);
  }
}

// Calendar reminders: check every minute for due reminders and emit in-app alerts
const CAL_REMINDER_INTERVAL_MS = 60 * 1000;
let calTimer = null;
async function startCalendarReminderScheduler() {
  if (calTimer) return;
  
  try {
    // Dynamically import required modules
    const { default: CalendarEvent } = await import('./models/CalendarEvent.js');
    const { default: Alert } = await import('./models/Alert.js');
    
    calTimer = setInterval(async () => {
      try {
        const now = new Date();
        const windowStart = new Date(now.getTime() - 60 * 60 * 1000); // look back 1h for safety
        const windowEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000); // next 30 days
        const candidates = await CalendarEvent.find({
          startAt: { $gte: windowStart, $lte: windowEnd },
          reminders: { $exists: true, $ne: [] },
        }).limit(1000);

        for (const ev of candidates) {
          const startMs = new Date(ev.startAt).getTime();
          for (const r of ev.reminders || []) {
            const minutes = Number(r.minutesBefore);
            if (!Number.isFinite(minutes)) continue;
            if (ev.deliveredReminders?.includes(minutes)) continue;
            const reminderTime = startMs - minutes * 60 * 1000;
            if (Date.now() >= reminderTime) {
              // Create Alert and emit
              const alertDoc = await Alert.create({
                userId: ev.userId,
                type: 'system',
                severity: 'medium',
                title: 'Event Reminder',
                message: `${ev.title}${ev.roomId ? ' @ ' + ev.roomId : ''} starts at ${new Date(startMs).toLocaleString()}`,
              });
              io.to(`user_${String(ev.userId)}`).emit('newAlert', {
                type: 'system',
                severity: 'medium',
                title: 'Event Reminder',
                message: alertDoc.message,
                timestamp: new Date(),
              });
              // Mark reminder delivered
              await CalendarEvent.updateOne(
                { _id: ev._id },
                { $addToSet: { deliveredReminders: minutes } }
              );
            }
          }
        }
      } catch (e) {
        console.error('Calendar reminder scheduler error', e);
      }
    }, CAL_REMINDER_INTERVAL_MS);
    
    console.log('✅ Calendar reminder scheduler started successfully');
  } catch (error) {
    console.error('❌ Failed to start calendar reminder scheduler:', error.message);
  }
}

// Start schedulers after a delay to ensure routes are loaded
setTimeout(() => {
  startScheduler();
  startCalendarReminderScheduler();
}, 5000);

// Start prune job to remove stale push subscriptions periodically
import { pruneStaleSubscriptions } from './jobs/pruneSubscriptions.js';
const PRUNE_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
let pruneTimer = null;
async function startPruneJob() {
  if (pruneTimer) return;
  if (!process.env.MONGO_URI) {
    console.log('Prune job not started: MONGO_URI not configured');
    return;
  }
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('Prune job not started: VAPID keys not configured');
    return;
  }

  pruneTimer = setInterval(async () => {
    try {
      await pruneStaleSubscriptions({ limit: 300 });
    } catch (e) {
      console.error('Prune job error', e);
    }
  }, PRUNE_INTERVAL_MS);

  console.log('✅ Prune job scheduled (every 6 hours)');
}

setTimeout(() => {
  startPruneJob();
}, 10000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});