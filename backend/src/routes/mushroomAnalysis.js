import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize lazily
let genAI = null;

router.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

        if (!apiKey) {
            console.warn('[MushroomAnalysis] API configuration missing.');
            return res.status(503).json({ error: 'Analysis service not configured' });
        }

        if (!genAI) {
            try {
                genAI = new GoogleGenerativeAI(apiKey);
            } catch (e) {
                console.error('[MushroomAnalysis] Failed to initialize AI model:', e.message);
                return res.status(503).json({ error: 'Analysis service initialization failed' });
            }
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `Analyze this mushroom image and provide the following details in strict JSON format:
    1. "type": The common name of the mushroom.
    2. "disease": Boolean (true/false) indicating if it appears diseased.
    3. "edible": Boolean (true/false) indicating if it is generally considered edible.
    4. "diseaseType": The name of the disease if diseased, otherwise null.
    5. "confidence": A number between 0 and 100 indicating your confidence in this identification.
    
    Return ONLY the JSON object. Do not wrap it in markdown code blocks.`;

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini raw response:', text);

        let analysis;
        try {
            // Clean up markdown code blocks if present (just in case)
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            analysis = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError);
            return res.status(500).json({ error: 'Failed to parse AI response', raw: text });
        }

        res.json({ success: true, analysis });

    } catch (error) {
        console.error('Gemini analysis error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

export default router;
