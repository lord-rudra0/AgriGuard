// Minimal server - just the basics
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { put } from '@vercel/blob';
import multer from 'multer';

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware only
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection (optional)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB connected');
    })
    .catch((error) => {
      console.log('⚠️ MongoDB connection failed:', error.message);
    });
}

// Note: File uploads directory setup removed for Vercel serverless compatibility
// Vercel serverless functions cannot create directories or write to filesystem

// Configure multer for memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Minimal server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test route working!',
    timestamp: new Date().toISOString()
  });
});

// Test individual routes
app.get('/api/test-auth', (req, res) => {
  res.json({
    message: 'Auth test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-sensors', (req, res) => {
  res.json({
    message: 'Sensors test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-chat', (req, res) => {
  res.json({
    message: 'Chat test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-gemini', (req, res) => {
  res.json({
    message: 'Gemini test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

// Route status
app.get('/api/route-status', (req, res) => {
  res.json({
    message: 'Route status',
    timestamp: new Date().toISOString(),
    routes: {
      auth: 'available',
      sensors: 'available',
      chat: 'available',
      gemini: 'available',
      uploads: 'available'
    },
    totalRoutes: 5,
    status: 'loaded'
  });
});

// File upload routes
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please select a file to upload'
      });
    }

    // Upload to Vercel Blob
    const { url } = await put(req.file.originalname, req.file.buffer, {
      access: 'public',
      addRandomSuffix: true, // Prevents filename conflicts
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: url
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Multiple file upload
app.post('/api/upload-multiple', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please select files to upload'
      });
    }

    const uploadResults = [];

    for (const file of req.files) {
      try {
        const { url } = await put(file.originalname, file.buffer, {
          access: 'public',
          addRandomSuffix: true,
        });

        uploadResults.push({
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          url: url,
          status: 'success'
        });
      } catch (error) {
        uploadResults.push({
          originalName: file.originalname,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Files processed',
      results: uploadResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get upload info
app.get('/api/upload-info', (req, res) => {
  res.json({
    message: 'Upload service information',
    maxFileSize: '10MB',
    allowedTypes: [
      'Images: JPEG, PNG, GIF, WebP',
      'Documents: PDF, DOC, DOCX',
      'Text: TXT, CSV'
    ],
    maxFiles: 5,
    timestamp: new Date().toISOString()
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
