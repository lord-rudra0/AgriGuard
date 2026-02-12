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
import multer from 'multer';
import { authenticateSocket } from './src/middleware/auth.js';
import {
  authRoutes as authRoutesStatic,
  chatRoutes as chatRoutesStatic,
  chatSystemRoutes as chatSystemRoutesStatic,
  settingsRoutes as settingsRoutesStatic,
  notificationsRoutes as notificationsRoutesStatic,
  iotRoutes as iotRoutesStatic,
  devicesRoutes as devicesRoutesStatic,
  sensorRoutes,
  alertsRoutes,
  geminiRoutes,
  mushroomAnalysisRoutes,
  analyticsViewsRoutes,
  reportsRoutes,
  recipesRoutes,
  phasesRoutes,
  thresholdsRoutes,
  calendarRoutes,
  talkAgentRoutes
} from './src/routes/index.js';
import { predictImage } from './src/onnx/mushroomModel.js';
import { registerTalkSocket } from './src/routes/talkAgent.js';
import { setupRootGracefulShutdown, startRootBackgroundJobs } from './src/server/rootSchedulers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_MAX_ATTEMPTS = 5;
const MONGO_BASE_DELAY_MS = 2000;
let lastMongoError = null;

const rawAllowed = [
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL,
  'http://localhost:3000',
].filter(Boolean).flatMap((v) => String(v).split(',')).map((v) => v.trim().replace(/\/$/, ''));
const ALLOWED_ORIGINS = Array.from(new Set(rawAllowed));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const clean = String(origin).replace(/\/$/, '');
    if (ALLOWED_ORIGINS.includes(clean)) return callback(null, true);
    try {
      const urlObj = new URL(clean);
      if (urlObj.hostname?.endsWith('.vercel.app')) return callback(null, true);
    } catch (_e) {
      void _e;
    }
    return callback(new Error(`CORS: Origin not allowed: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true, methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  path: '/socket.io'
});

app.set('io', io);
io.use(authenticateSocket);

const onlineUsers = new Map();
io.on('connection', (socket) => {
  const userId = String(socket.user.id);
  const setForUser = onlineUsers.get(userId) || new Set();
  setForUser.add(socket.id);
  onlineUsers.set(userId, setForUser);
  io.emit('presence:update', { userId, online: true });
  socket.join(`user_${userId}`);
  socket.on('joinChat', (chatId) => socket.join(chatId));
  socket.on('leaveChat', (chatId) => socket.leave(chatId));
  socket.on('disconnect', () => {
    const set = onlineUsers.get(userId);
    if (!set) return;
    set.delete(socket.id);
    if (set.size === 0) {
      onlineUsers.delete(userId);
      io.emit('presence:update', { userId, online: false });
    } else {
      onlineUsers.set(userId, set);
    }
  });
});

app.use(helmet());
app.use(cors(corsOptions));
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection.remoteAddress
});
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/iot')) return next();
  if (process.env.NODE_ENV === 'development' && req.path.startsWith('/auth')) return next();
  return limiter(req, res, next);
});

const mountIfExists = (basePath, routeModule) => routeModule && app.use(basePath, routeModule);

app.use('/api/auth', authRoutesStatic);
mountIfExists('/api/chat-system', chatSystemRoutesStatic);
mountIfExists('/api/chatSystem', chatSystemRoutesStatic);
mountIfExists('/api/chat', chatRoutesStatic);
mountIfExists('/api/settings', settingsRoutesStatic);
mountIfExists('/api/notifications', notificationsRoutesStatic);
mountIfExists('/api/iot', iotRoutesStatic);
mountIfExists('/api/devices', devicesRoutesStatic);

mountIfExists('/api/sensors', sensorRoutes);
mountIfExists('/api/alerts', alertsRoutes);
mountIfExists('/api/gemini', geminiRoutes);
mountIfExists('/api/analyze/mushroom', mushroomAnalysisRoutes);
mountIfExists('/api/analytics-views', analyticsViewsRoutes);
mountIfExists('/api/reports', reportsRoutes);
mountIfExists('/api/recipes', recipesRoutes);
mountIfExists('/api/phases', phasesRoutes);
mountIfExists('/api/thresholds', thresholdsRoutes);
mountIfExists('/api/calendar', calendarRoutes);
mountIfExists('/api/talk', talkAgentRoutes);

app.get('/api/config/push', (req, res) => res.json({ vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null }));

const connectWithRetry = async (attempt = 1) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000, socketTimeoutMS: 20000, family: 4 });
    lastMongoError = null;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    lastMongoError = err?.message || String(err);
    if (attempt < MONGO_MAX_ATTEMPTS) {
      const delay = MONGO_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      setTimeout(() => connectWithRetry(attempt + 1), delay);
    } else {
      console.error('🛑 Max MongoDB connection attempts reached. Will stay degraded.');
    }
  }
};
if (process.env.MONGO_URI) connectWithRetry();

app.get('/health', (req, res) => res.json({
  status: 'OK',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  mongoConnected: mongoose.connection.readyState === 1,
  vercel: !!process.env.VERCEL
}));
app.get('/', (req, res) => res.json({
  message: 'Agricultural Monitoring Server is running!',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  vercel: !!process.env.VERCEL
}));
app.get('/env-info', (req, res) => res.json({
  nodeEnv: process.env.NODE_ENV,
  vercel: !!process.env.VERCEL,
  hasMongoUri: !!process.env.MONGO_URI,
  hasJwtSecret: !!process.env.JWT_SECRET,
  hasGeminiKey: !!process.env.GEMINI_API_KEY,
  frontendUrl: process.env.FRONTEND_URL || 'not set'
}));
app.get('/db/ping', async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    res.json({ readyState: state, connected: state === 1, lastError: lastMongoError || null });
  } catch (e) {
    res.status(500).json({ message: 'Ping failed', error: e?.message || String(e) });
  }
});

app.get('/api/model/mushroom', (req, res) => {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'mushroom_classification_model_ResNet50', 'mushroom_classifier.onnx'),
      path.resolve(process.cwd(), '..', 'mushroom_classification_model_ResNet50', 'mushroom_classifier.onnx'),
      path.resolve(process.cwd(), '..', '..', 'mushroom_classification_model_ResNet50', 'mushroom_classifier.onnx'),
      path.resolve(process.cwd(), 'public', 'models', 'mushroom_classifier.onnx')
    ];
    const modelPath = candidates.find((p) => fs.existsSync(p));
    if (!modelPath) return res.status(404).json({ error: 'Model not found on server' });
    const stat = fs.statSync(modelPath);
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'public, max-age=3600' });
    const stream = fs.createReadStream(modelPath);
    stream.pipe(res);
    stream.on('error', () => res.end());
  } catch (_e) {
    res.status(500).json({ error: 'Failed to serve model' });
  }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
app.post('/api/predict/mushroom', upload.single('image'), async (req, res) => {
  try {
    if (!req.file?.buffer) return res.status(400).json({ error: 'No image uploaded' });
    const result = await predictImage(req.file.buffer);
    return res.json({ success: true, result });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
});

registerTalkSocket(io);

app.use((err, req, res, _next) => {
  void _next;
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});
app.use('*', (req, res) => res.status(404).json({ message: 'Route not found', path: req.originalUrl }));

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('📊 Socket.IO server ready');
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
}

startRootBackgroundJobs({ io });
setupRootGracefulShutdown({ server });

export default app;
