import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();

// Basic guard to ensure API key exists
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GENERATIVE_AI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn('[gemini] Missing GEMINI_API_KEY/GOOGLE_API_KEY in environment. /api/gemini endpoints will return 503.');
}

let genAI;
try {
  if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
} catch (e) {
  console.error('[gemini] Failed to initialize GoogleGenerativeAI:', e.message);
}

// POST /api/gemini/chat
// Body: { messages: [{ role: 'user'|'model'|'system', content: string }] }
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    if (!genAI) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI service not configured. Please set GEMINI_API_KEY environment variable.' 
      });
    }

    const { messages } = req.body || {};
    const userContent = Array.isArray(messages)
      ? messages.map(m => `${m.role || 'user'}: ${typeof m.content === 'string' ? m.content : ''}`).join('\n')
      : (req.body?.content || '');

    if (!userContent || userContent.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'content/messages required' });
    }

    // Keep prompt concise
    const prompt = userContent.slice(0, 4000);

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);

    const text = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';

    return res.json({ success: true, text });
  } catch (error) {
    console.error('[gemini/chat] error:', error?.response?.data || error.message);
    return res.status(500).json({ success: false, message: 'Failed to get response from Gemini' });
  }
});

export default router;
