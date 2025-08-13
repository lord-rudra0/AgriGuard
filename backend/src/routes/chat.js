import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST /api/chat/ai
// @desc    Chat with AI assistant
// @access  Private
router.post('/ai', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create context-aware prompt
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

    const fullPrompt = `${systemPrompt}\n\nUser Question: ${message}`;

    // Generate response
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiMessage = response.text();

    res.json({
      message: aiMessage,
      timestamp: new Date(),
      context: context || null
    });
  } catch (error) {
    console.error('AI chat error:', error);
    
    if (error.message && error.message.includes('API key')) {
      return res.status(500).json({ 
        message: 'AI service configuration error. Please contact support.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Sorry, I\'m having trouble processing your request right now. Please try again later.' 
    });
  }
});

// @route   POST /api/chat/analyze-data
// @desc    Analyze sensor data with AI
// @access  Private
router.post('/analyze-data', authenticateToken, async (req, res) => {
  try {
    const { sensorData, timeframe = '24h' } = req.body;
    
    if (!sensorData) {
      return res.status(400).json({ message: 'Sensor data is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
    console.error('Data analysis error:', error);
    res.status(500).json({ 
      message: 'Unable to analyze data at this time. Please try again later.' 
    });
  }
});

// @route   POST /api/chat/farming-tips
// @desc    Get farming tips based on crop type and conditions
// @access  Private
router.post('/farming-tips', authenticateToken, async (req, res) => {
  try {
    const { cropType, growthStage, currentConditions, specificQuestion } = req.body;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
    console.error('Farming tips error:', error);
    res.status(500).json({ 
      message: 'Unable to generate farming tips at this time. Please try again later.' 
    });
  }
});

export default router;