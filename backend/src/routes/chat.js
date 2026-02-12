import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken } from '../middleware/auth.js';
import { buildWindowComparison } from '../services/analytics/windowComparison.js';
import { buildSeasonalStrategy } from '../services/analytics/seasonalStrategy.js';

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

// Helper to lazily get the model, reading env at request time.
// IMPORTANT: we do NOT try an unsupported hardcoded default model name because
// that can result in 404s from the provider. Require `GEMINI_TEXT_MODEL` to be set.
function getModel() {
  try {
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        genAI = new GoogleGenerativeAI(apiKey);
      }
    }

    const modelName = process.env.GEMINI_TEXT_MODEL;
    if (!modelName) {
      console.warn('[chat] GEMINI_TEXT_MODEL not set; AI model not selected. Set GEMINI_TEXT_MODEL to a supported model name.');
      return null;
    }

    return genAI ? genAI.getGenerativeModel({ model: modelName }) : null;
  } catch (e) {
    console.error('[chat] getModel error:', e?.message || e);
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
        message: 'AI service not fully configured. Please set GEMINI_API_KEY and GEMINI_TEXT_MODEL environment variables and restart the backend.',
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasModel: !!process.env.GEMINI_TEXT_MODEL,
        required: ['GEMINI_API_KEY', 'GEMINI_TEXT_MODEL']
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

// @route   POST /api/chat/what-changed
// @desc    Compare two time windows and summarize key changes
// @access  Private
router.post('/what-changed', authenticateToken, async (req, res) => {
  try {
    const {
      baselineStart,
      baselineEnd,
      compareStart,
      compareEnd,
      sensorTypes = ['temperature', 'humidity', 'co2', 'light', 'soilMoisture'],
      includeAiSummary = true
    } = req.body || {};

    const comparison = await buildWindowComparison({
      userId: req.user._id,
      baselineStart,
      baselineEnd,
      compareStart,
      compareEnd,
      sensorTypes
    });
    if (comparison?.error) {
      return res.status(400).json({ message: comparison.error });
    }

    let summary = comparison.summaryText;
    let aiSummaryUsed = false;

    if (includeAiSummary) {
      const model = getModel();
      if (model) {
        const prompt = `
You are AgriGuard AI. Summarize what changed between two time windows using this data:
${JSON.stringify({
  windows: comparison.windows,
  topChanges: comparison.topChanges,
  metrics: comparison.metrics.map((m) => ({
    sensorType: m.sensorType,
    baselineAvg: m.baseline?.avg ?? null,
    compareAvg: m.compare?.avg ?? null,
    delta: m.change?.abs ?? null,
    deltaPct: m.change?.pct ?? null,
    direction: m.change?.direction ?? 'no_data'
  }))
}, null, 2)}

Return:
1) Brief summary (2-4 lines)
2) Biggest 3 shifts
3) Practical actions to investigate next
Keep it concise and actionable.
`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        summary = response.text() || summary;
        aiSummaryUsed = true;
      }
    }

    return res.json({
      success: true,
      summary,
      aiSummaryUsed,
      comparison
    });
  } catch (error) {
    logError(error, 'what-changed');
    return res.status(500).json({ message: 'Failed to compute what-changed summary. Please try again.' });
  }
});

// @route   POST /api/chat/seasonal-strategy
// @desc    Build a multi-week seasonal strategy plan
// @access  Private
router.post('/seasonal-strategy', authenticateToken, async (req, res) => {
  try {
    const {
      weeksAhead = 4,
      roomId = null,
      cropType = null,
      phaseName = null,
      includeAiSummary = true
    } = req.body || {};

    const strategy = await buildSeasonalStrategy({
      userId: req.user._id,
      weeksAhead,
      roomId,
      cropType,
      phaseName
    });

    let summary = strategy.summaryText;
    let aiSummaryUsed = false;
    if (includeAiSummary) {
      const model = getModel();
      if (model) {
        const prompt = `
You are AgriGuard AI. Convert this seasonal strategy data into an actionable plan:
${JSON.stringify(strategy, null, 2)}

Respond with:
1) Weekly headline strategy
2) Top risks and why they matter
3) Priority actions for next 7 days
Keep concise and practical.
`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        summary = response.text() || summary;
        aiSummaryUsed = true;
      }
    }

    return res.json({
      success: true,
      summary,
      aiSummaryUsed,
      strategy
    });
  } catch (error) {
    logError(error, 'seasonal-strategy');
    return res.status(500).json({ message: 'Failed to generate seasonal strategy. Please try again.' });
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

// Diagnostic configuration endpoint - safe (no external calls)
router.get('/config', (req, res) => {
  res.json({
    ok: true,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || null,
    hasModel: !!process.env.GEMINI_MODEL
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
