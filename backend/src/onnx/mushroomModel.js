import ort from 'onnxruntime-node';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Resolve model path robustly. Depending on where the server is started from
// the model may live at one of several candidate locations. Check them in
// order and pick the first that exists.
const MODEL_FILENAME = 'mushroom_classifier.onnx';

const CANDIDATE_PATHS = [
  // When running from repo root and model is in backend/models
  path.resolve(process.cwd(), 'backend', 'models', MODEL_FILENAME),
  // When running server from backend/ folder
  path.resolve(process.cwd(), 'models', MODEL_FILENAME),
  // Relative to this file (src/onnx), move up to backend/models
  // Use import.meta.url to compute file location in ESM
  (() => {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      return path.resolve(__dirname, '..', '..', 'models', MODEL_FILENAME);
    } catch (e) {
      return path.resolve(process.cwd(), 'models', MODEL_FILENAME);
    }
  })(),
  // older nested layout (backend/backend/models)
  (() => {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      return path.resolve(__dirname, '..', '..', '..', 'backend', 'models', MODEL_FILENAME);
    } catch (e) {
      return path.resolve(process.cwd(), 'backend', 'models', MODEL_FILENAME);
    }
  })(),
  // as a last resort, try a top-level models folder
  path.resolve(process.cwd(), 'models', MODEL_FILENAME),
];

let session = null;

function findModelPath() {
  for (const p of CANDIDATE_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function loadModel() {
  if (session) return session;
  const resolved = findModelPath();
  if (!resolved) {
    const tried = CANDIDATE_PATHS.join('\n  - ');
    throw new Error(`Model file not found. Checked these locations:\n  - ${tried}`);
  }
  console.info(`[mushroomModel] Loading ONNX model from: ${resolved}`);
  session = await ort.InferenceSession.create(resolved);
  console.info('[mushroomModel] Model loaded successfully');
  return session;
}

// Preprocess image buffer to Float32Array [1,3,224,224]
async function preprocess(buffer) {
  const INPUT_SIZE = 224;
  const MEAN = [0.485, 0.456, 0.406];
  const STD = [0.229, 0.224, 0.225];

  const img = await sharp(buffer).resize(INPUT_SIZE, INPUT_SIZE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = img; // data is Uint8Array RGB
  const [w, h, channels] = [info.width, info.height, info.channels];
  const floatData = new Float32Array(1 * 3 * INPUT_SIZE * INPUT_SIZE);
  const size = INPUT_SIZE * INPUT_SIZE;

  for (let i = 0; i < size; i++) {
    const r = data[i * channels] / 255.0;
    const g = data[i * channels + 1] / 255.0;
    const b = data[i * channels + 2] / 255.0;
    floatData[i] = (r - MEAN[0]) / STD[0];
    floatData[size + i] = (g - MEAN[1]) / STD[1];
    floatData[2 * size + i] = (b - MEAN[2]) / STD[2];
  }

  return floatData;
}

export async function predictImage(buffer) {
  const sess = await loadModel();
  const tensorData = await preprocess(buffer);
  const tensor = new ort.Tensor('float32', tensorData, [1, 3, 224, 224]);

  // Try to find a valid input name
  const inputName = sess.inputNames && sess.inputNames.length ? sess.inputNames[0] : 'input.1';
  const feeds = {};
  feeds[inputName] = tensor;

  const results = await sess.run(feeds);
  const out = results[Object.keys(results)[0]];
  if (!out) throw new Error('Model produced no output');
  const preds = Array.from(out.data);

  // Softmax
  const max = Math.max(...preds);
  const exps = preds.map(p => Math.exp(p - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map(e => e / sum);

  const edibleProb = probs[0] ?? 0;
  const poisonousProb = probs[1] ?? 0;
  const isEdible = edibleProb > poisonousProb;
  const confidence = Math.max(edibleProb, poisonousProb);
  const classLabel = isEdible ? 'edible' : 'poisonous';

  return { isEdible, confidence, classLabel, raw: probs };
}

export default { loadModel, predictImage };
