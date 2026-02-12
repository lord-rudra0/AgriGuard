import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { authenticateSocket } from './middleware/auth.js';
import { authRoutes as authRoutesStatic } from './routes/index.js';
import { predictImage } from './onnx/mushroomModel.js';
import { loadRoutes } from './server/routeLoader.js';
import { registerModelEndpoints } from './server/modelEndpoints.js';
import { setupGracefulShutdown, startBackgroundJobs } from './server/schedulers.js';
import { registerTalkSocket } from './routes/talkAgent.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_MAX_ATTEMPTS = 5;
const MONGO_BASE_DELAY_MS = 2000;

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
const normalizeOrigin = (origin) => String(origin).replace(/\/$/, '');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests with no Origin
    if (!origin) return callback(null, true);
    const ok = ALLOWED_ORIGINS.includes(normalizeOrigin(origin));
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
  });
});

registerTalkSocket(io);

const connectWithRetry = async (attempt = 1) => {
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
    if (attempt < MONGO_MAX_ATTEMPTS) {
      const delay = MONGO_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying MongoDB connection in ${delay}ms...`);
      setTimeout(() => connectWithRetry(attempt + 1), delay);
    } else {
      console.error('🛑 Max MongoDB connection attempts reached. Will stay degraded.');
    }
  }
};

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

registerModelEndpoints({
  app,
  predictImage,
  mongoose,
  getLastMongoError: () => lastMongoError
});

// Load routes immediately
loadRoutes(app);

// Error handling middleware
app.use((err, req, res, _next) => {
  void _next;
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
startBackgroundJobs({ io });
setupGracefulShutdown({ server });
