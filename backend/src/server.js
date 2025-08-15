import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import sensorRoutes from './routes/sensors.js';
import chatRoutes from './routes/chat.js';
import chatSystemRoutes from './routes/chatSystem.js';
import settingsRoutes from './routes/settings.js';
import alertsRoutes from './routes/alerts.js';
import geminiRoutes from './routes/gemini.js';
import analyticsViewsRoutes from './routes/analyticsViews.js';
import reportsRoutes, { runScheduleAndEmail } from './routes/reports.js';
import ReportSchedule from './models/ReportSchedule.js';
import recipesRoutes from './routes/recipes.js';
import phasesRoutes from './routes/phases.js';
import thresholdsRoutes from './routes/thresholds.js';
import calendarRoutes from './routes/calendar.js';
import CalendarEvent from './models/CalendarEvent.js';
import Alert from './models/Alert.js';
import { authenticateSocket } from './middleware/auth.js';

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

// Create HTTP server and Socket.IO
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  path: '/socket.io'
});

// Expose io to routes via app
app.set('io', io);

// Socket.IO authentication middleware
io.use(authenticateSocket);

// In-memory presence map: userId -> Set of socket ids
const onlineUsers = new Map();

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later'
  }
});
app.use('/api', limiter);

// Static: serve uploads
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', exprmainess.static(uploadsDir));

// MongoDB connection with better error handling
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    // Don't exit in serverless environment
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      process.exit(1);
    }
  });
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
  importRoute('./routes/auth.js', 'Auth'),
  importRoute('./routes/sensors.js', 'Sensors'),
  importRoute('./routes/chat.js', 'Chat'),
  importRoute('./routes/chatSystem.js', 'ChatSystem'),
  importRoute('./routes/settings.js', 'Settings'),
  importRoute('./routes/alerts.js', 'Alerts'),
  importRoute('./routes/gemini.js', 'Gemini'),
  importRoute('./routes/analyticsViews.js', 'AnalyticsViews'),
  importRoute('./routes/reports.js', 'Reports'),
  importRoute('./routes/recipes.js', 'Recipes'),
  importRoute('./routes/phases.js', 'Phases'),
  importRoute('./routes/thresholds.js', 'Thresholds'),
  importRoute('./routes/calendar.js', 'Calendar')
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
function startScheduler() {
  if (schedulerTimer) return;
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
}
startScheduler();

// Calendar reminders: check every minute for due reminders and emit in-app alerts
const CAL_REMINDER_INTERVAL_MS = 60 * 1000;
let calTimer = null;
function startCalendarReminderScheduler() {
  if (calTimer) return;
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
}
startCalendarReminderScheduler();

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