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
import { authenticateSocket } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Socket.IO setup
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  path: '/socket.io'
});

// Expose io to routes via app
app.set('io', io);

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
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chatSystem', chatSystemRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/analytics/views', analyticsViewsRoutes);
app.use('/api/reports', reportsRoutes);

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

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

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

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Socket.IO server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

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