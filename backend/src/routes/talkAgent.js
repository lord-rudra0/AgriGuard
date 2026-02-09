import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
// Allow audio uploads (webm, wav, mp3, m4a)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Gemini
let genAI = null;
const initAI = () => {
    if (!genAI && process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
};

router.post('/interact', upload.single('audio'), async (req, res) => {
    try {
        const ai = initAI();
        if (!ai) {
            return res.status(503).json({ error: 'AI service not configured' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No audio provided' });
        }

        // Use 'gemini-1.5-flash' as it supports native audio input and is fast.
        // If user specifically has access to a 'gemini-2.0-flash' or 'gemini-2.5' preview, 
        // they can set GEMINI_MODEL env var.
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const model = ai.getGenerativeModel({ model: modelName });

        // Convert buffer to base64
        const audioBase64 = req.file.buffer.toString('base64');

        // Create the multimodal prompt
        const parts = [
            {
                inlineData: {
                    mimeType: req.file.mimetype,
                    data: audioBase64
                }
            },
            {
                text: "You are AgriGuard, an intelligent agricultural assistant. Listen to the user's query and provide a helpful, concise, and friendly response. Do not use markdown formatting like asterisks or hash signs, just plain text suitable for speech synthesis. Keep the response short (under 3 sentences) unless asked for details."
            }
        ];

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        console.log(`[TalkAgent] User sent ${req.file.mimetype} (${req.file.size} bytes). Response: "${text.substring(0, 50)}..."`);

        res.json({
            success: true,
            reply: text,
            // Native audio output is not yet available via REST API for this model.
            // Frontend should use TTS.
        });

    } catch (error) {
        console.error('[TalkAgent] Error:', error);
        res.status(500).json({ error: error.message || 'Failed to process audio' });
    }
});

export default router;
