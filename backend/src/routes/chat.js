import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Gemini AI with error handling
let genAI;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  } else {
    console.warn('[chat] Missing GEMINI_API_KEY in environment. AI chat will be disabled.');
  }
} catch (error) {
  console.error('[chat] Failed to initialize GoogleGenerativeAI:', error.message);
}

// Helper to lazily get the model, allowing env to be read at request time
function getModel(modelName = 'gemini-1.5-flash') {
  try {
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        genAI = new GoogleGenerativeAI(apiKey);
      }
    }
    return genAI ? genAI.getGenerativeModel({ model: modelName }) : null;
  } catch (e) {
    console.error('[chat] getModel error:', e.message);
    return null;
  }
}

// @route   POST /api/chat/ai
// @desc    Chat with AI assistant
// @access  Private
router.post('/ai', authenticateToken, async (req, res) => {
  try {
    const model = getModel();
    if (!model) {
      return res.status(503).json({
        message: 'AI service not configured. Please set GEMINI_API_KEY and restart the backend.',
        hasGeminiKey: !!process.env.GEMINI_API_KEY
      });
    }

    const { message, context, image } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Create context-aware prompt (preserved)
    const systemPrompt = `
      You are AgriGuard AI, an expert agricultural assistant specializing in modern farming techniques, 
      crop monitoring, and sustainable agriculture. You help farmers with:
      
      1. Analyzing sensor data (temperature, humidity, CO2, light, soil moisture)
      2. Providing farming advice and best practices
      3. Diagnosing plant diseases and pest problems
      4. Recommending optimal growing conditions
      5. Suggesting maintenance and care schedules
      
      User Context:
      - Farmer: ${req.user.name}
      - Farm: ${req.user.farmName}
      - Location: ${req.user.location}
      ${context ? `- Current Conditions: ${JSON.stringify(context)}` : ''}
      
      Please provide helpful, practical advice in a friendly and professional manner.
      Keep responses concise but informative.
    `;

    // Build multimodal parts: text + optional inline image
    const parts = [
      { text: systemPrompt },
      { text: `\n\nUser Question: ${message}` },
    ];
    if (image && typeof image === 'object' && image.data && image.mimeType) {
      parts.push({ inlineData: { data: image.data, mimeType: image.mimeType } });
    }

    // Generate response
    const result = await model.generateContent(parts);
    const response = await result.response;
    const aiMessage = response.text();

    res.json({
      message: aiMessage,
      timestamp: new Date(),
      context: context || null
    });
  } catch (error) {
    logError(error, 'AI chat');
    const msg = (error?.response?.data?.error) || error?.message || 'Unknown error';
    if (/api key|unauthorized|permission/i.test(msg)) {
      return res.status(500).json({ 
        message: 'AI service configuration error. Please verify GEMINI_API_KEY permissions.'
      });
    }
    return res.status(500).json({ 
      message: 'AI failed to generate a reply. Please try again.'
    });
  }
});

// @route   POST /api/chat/analyze-data
// @desc    Analyze sensor data with AI
// @access  Private
router.post('/analyze-data', authenticateToken, async (req, res) => {
  try {
    const model = getModel();
    if (!model) {
      return res.status(503).json({
        message: 'AI service not configured. Please set GEMINI_API_KEY and restart the backend.',
        hasGeminiKey: !!process.env.GEMINI_API_KEY
      });
    }
    const { sensorData, timeframe = '24h' } = req.body;
    
    if (!sensorData) {
      return res.status(400).json({ message: 'Sensor data is required' });
    }

    const analysisPrompt = `
      As an agricultural AI expert, analyze the following sensor data for ${req.user.farmName} 
      located in ${req.user.location}:
      
      Data (last ${timeframe}):
      ${JSON.stringify(sensorData, null, 2)}
      
      Please provide:
      1. Overall assessment of growing conditions
      2. Any concerning trends or values
      3. Specific recommendations for improvement
      4. Predicted outcomes if current conditions continue
      5. Immediate actions needed (if any)
      
      Format your response in clear sections with actionable advice.
    `;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const analysis = response.text();

    res.json({
      analysis,
      timestamp: new Date(),
      dataPoints: Array.isArray(sensorData) ? sensorData.length : 1,
      timeframe
    });
  } catch (error) {
    logError(error, 'AI analysis');
    return res.status(500).json({ message: 'AI analysis failed. Please try again.' });
  }
});

// @route   POST /api/chat/farming-tips
// @desc    Get farming tips based on crop type and conditions
// @access  Private
router.post('/farming-tips', authenticateToken, async (req, res) => {
  try {
    const model = getModel();
    if (!model) {
      return res.status(503).json({
        message: 'AI service not configured. Please set GEMINI_API_KEY and restart the backend.',
        hasGeminiKey: !!process.env.GEMINI_API_KEY
      });
    }
    const { cropType, growthStage, currentConditions, specificQuestion } = req.body;

    const tipsPrompt = `
      Provide expert farming advice for:
      - Crop: ${cropType || 'General crops'}
      - Growth Stage: ${growthStage || 'All stages'}
      - Location: ${req.user.location}
      - Farm: ${req.user.farmName}
      
      ${currentConditions ? `Current Conditions: ${JSON.stringify(currentConditions)}` : ''}
      ${specificQuestion ? `Specific Question: ${specificQuestion}` : ''}
      
      Please provide:
      1. Best practices for current conditions
      2. Common problems to watch for
      3. Optimal care schedule
      4. Seasonal recommendations
      5. Sustainable farming techniques
      
      Make recommendations practical and region-appropriate.
    `;

    const result = await model.generateContent(tipsPrompt);
    const response = await result.response;
    const tips = response.text();

    res.json({
      tips,
      timestamp: new Date(),
      cropType: cropType || 'General',
      growthStage: growthStage || 'All stages'
    });
  } catch (error) {
    logError(error, 'AI tips');
    return res.status(500).json({ message: 'AI tips generation failed. Please try again.' });
  }
});

// Diagnostic ping to verify route is mounted and AI config presence
router.get('/ping', (req, res) => {
  res.json({
    ok: true,
    aiConfigured: !!process.env.GEMINI_API_KEY,
    message: 'Chat routes OK'
  });
});

// Improve error logging: print stack traces to help debugging in development
function logError(err, label = 'chat') {
  try {
    console.error(`[${label}]`, err?.response?.data || err?.message || err);
    if (err && err.stack) console.error(err.stack);
  } catch (e) {
    console.error('[chat] error while logging error', e);
  }
}

export default router;