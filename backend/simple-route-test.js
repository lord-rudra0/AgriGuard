// Simple route test server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Simple route test server is running!',
    timestamp: new Date().toISOString()
  });
});

// Test individual route imports
app.get('/test-auth', async (req, res) => {
  try {
    const authModule = await import('./src/routes/auth.js');
    res.json({ 
      message: 'Auth routes imported successfully',
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    res.json({ 
      message: 'Auth routes import failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

app.get('/test-sensors', async (req, res) => {
  try {
    const sensorsModule = await import('./src/routes/sensors.js');
    res.json({ 
      message: 'Sensors routes imported successfully',
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    res.json({ 
      message: 'Sensors routes import failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

app.get('/test-chat', async (req, res) => {
  try {
    const chatModule = await import('./src/routes/chat.js');
    res.json({ 
      message: 'Chat routes imported successfully',
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    res.json({ 
      message: 'Chat routes import failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

app.get('/test-gemini', async (req, res) => {
  try {
    const geminiModule = await import('./src/routes/gemini.js');
    res.json({ 
      message: 'Gemini routes imported successfully',
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    res.json({ 
      message: 'Gemini routes import failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
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
