import fs from 'fs';
import path from 'path';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export const registerModelEndpoints = ({
  app,
  predictImage,
  mongoose,
  getLastMongoError
}) => {
  app.post('/api/predict/mushroom', upload.single('image'), async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      const result = await predictImage(req.file.buffer);

      try {
        const { default: ScanHistory } = await import('../models/ScanHistory.js');
        const analysis = {
          type: result.classLabel === 'edible' ? 'Edible Mushroom' : 'Potentially Poisonous',
          typeConfidence: Math.round(result.confidence * 100),
          disease: false,
          diseaseConfidence: 0,
          edible: result.isEdible,
          edibleConfidence: Math.round(result.confidence * 100),
          diseaseType: null,
          diseaseTypeConfidence: 0,
          confidence: Math.round(result.confidence * 100),
          method: 'basic'
        };

        const historyDoc = new ScanHistory({
          userId: req.user ? req.user.id : null,
          imageBase64: req.file.buffer.toString('base64'),
          imageMimeType: req.file.mimetype,
          analysis
        });

        await historyDoc.save();
        result.historyId = historyDoc._id;
      } catch (histErr) {
        console.error('Failed to save basic scan history', histErr);
      }

      res.json({ success: true, result });
    } catch (e) {
      console.error('Prediction error', e);
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.get('/api/model/mushroom', (req, res) => {
    try {
      const candidates = [
        path.resolve(process.cwd(), 'mushroom_classification_model_ResNet50', 'mushroom_classifier.onnx'),
        path.resolve(process.cwd(), '..', 'mushroom_classification_model_ResNet50', 'mushroom_classifier.onnx'),
        path.resolve(process.cwd(), '..', '..', 'mushroom_classification_model_ResNet50', 'mushroom_classifier.onnx'),
        path.resolve(process.cwd(), 'public', 'models', 'mushroom_classifier.onnx')
      ];

      const modelPath = candidates.find((p) => fs.existsSync(p));
      if (!modelPath) {
        console.warn('ONNX model not found in any candidate path:', candidates);
        return res.status(404).json({ error: 'Model not found on server' });
      }

      const stat = fs.statSync(modelPath);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size,
        'Cache-Control': 'public, max-age=3600'
      });

      const stream = fs.createReadStream(modelPath);
      stream.pipe(res);
      stream.on('error', (err) => {
        console.error('Model stream error', err);
        res.end();
      });
    } catch (e) {
      console.error('Error serving model', e);
      res.status(500).json({ error: 'Failed to serve model' });
    }
  });

  app.get('/db/ping', async (req, res) => {
    try {
      const state = mongoose.connection.readyState;
      res.json({
        readyState: state,
        connected: state === 1,
        lastError: getLastMongoError() || null
      });
    } catch (e) {
      res.status(500).json({ message: 'Ping failed', error: e?.message || String(e) });
    }
  });
};
