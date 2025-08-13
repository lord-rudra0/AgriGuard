import express from 'express';
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

// Socket.IO authentication middleware
io.use(authenticateSocket);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.user.id} connected`);
  
  // Join user to their room
  socket.join(`user_${socket.user.id}`);
  
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

  // Chat message handling
  socket.on('sendMessage', (data) => {
    // Broadcast to all users (in production, implement proper room management)
    io.emit('newMessage', {
      id: Date.now(),
      user: socket.user.name,
      message: data.message,
      timestamp: new Date(),
      userId: socket.user.id
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.id} disconnected`);
    clearInterval(sensorInterval);
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