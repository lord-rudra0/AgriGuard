import { useState, useEffect, useRef } from 'react';
import CameraNavbar from '../components/CameraNavbar';
import { useScan } from '../context/ScanContext';

// ONNX runtime will be loaded dynamically from CDN when the page mounts
const ORT_CDN = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.3/dist/ort.min.js';
const MODEL_URL = '/models/mushroom_classifier.onnx'; // put the ONNX file into frontend/public/models/

// Model preprocessing parameters (copied/adapted from the example)
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const INPUT_SIZE = 224;

export default function Scan() {
  const { scannedFile, clearScan } = useScan();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [ortReady, setOrtReady] = useState(false);
  const [session, setSession] = useState(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // If a file was set via shared context, use it
    if (scannedFile) {
      if (preview) URL.revokeObjectURL(preview);
      setFile(scannedFile);
      setPreview(URL.createObjectURL(scannedFile));
    }
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedFile]);

  const handleFile = (f) => {
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setAnalysis(null);
    // clear shared context as well
    clearScan();
  };

  // Load ONNX runtime and model once on mount
  useEffect(() => {
    let isMounted = true;
    const loadOrtAndModel = async () => {
      try {
        setLoadingModel(true);
        // Dynamically load CDN script if ort is not present
        if (typeof window.ort === 'undefined') {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = ORT_CDN;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }

        // Create session
        const sess = await window.ort.InferenceSession.create(MODEL_URL);
        if (!isMounted) return;
        setSession(sess);
        setOrtReady(true);
      } catch (e) {
        console.error('Failed to load ORT or model', e);
        setOrtReady(false);
      } finally {
        setLoadingModel(false);
      }
    };

    loadOrtAndModel();
    return () => { isMounted = false; };
  }, []);

  // When file changes, run prediction automatically
  useEffect(() => {
    if (!file) return;
    if (!session) return; // wait until model loaded
    let cancelled = false;
    (async () => {
      setPredicting(true);
      try {
        const res = await predictImage(file, session);
        if (!cancelled) setAnalysis(res);
      } catch (e) {
        console.error('Prediction failed', e);
        if (!cancelled) setAnalysis({ error: e.message || String(e) });
      } finally {
        if (!cancelled) setPredicting(false);
      }
    })();

    return () => { cancelled = true; };
  }, [file, session]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scan</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Upload or capture an image to analyze. (ML placeholders)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-3">
              <CameraNavbar onCapture={(f) => handleFile(f)} />
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                onClick={() => inputRef.current && inputRef.current.click()}
                className="px-3 py-2 rounded bg-primary-600 text-white"
              >
                Upload image
              </button>
              <button onClick={clear} className="px-3 py-2 rounded border">Clear</button>
            </div>
          </div>

          <div>
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="preview" className="w-full h-64 object-cover rounded-md border" />
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <h3 className="font-semibold">Analysis</h3>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    {loadingModel && <div>Loading ML model...</div>}
                    {!loadingModel && !ortReady && <div>ML model not available</div>}
                    {predicting && <div>Running prediction...</div>}
                    {!predicting && analysis && analysis.error && (
                      <div className="text-red-600">Error: {analysis.error}</div>
                    )}

                    {!predicting && analysis && !analysis.error && (
                      <>
                        <div><strong>Edible?</strong>: <span className="text-indigo-600">{analysis.isEdible ? 'Yes' : 'No'}</span></div>
                        <div><strong>Confidence</strong>: <span className="text-indigo-600">{(analysis.confidence * 100).toFixed(1)}%</span></div>
                        <div><strong>Class</strong>: <span className="text-indigo-600">{analysis.classLabel}</span></div>
                      </>
                    )}

                    {!analysis && !predicting && (
                      <div className="text-gray-500">No analysis yet. Upload an image to run the model.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border rounded-md bg-white dark:bg-gray-800 text-gray-500">
                No image yet. Capture or upload to analyze.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Preprocess image for model input
async function preprocessImage(imageFile) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = INPUT_SIZE;
      canvas.height = INPUT_SIZE;
      ctx.drawImage(img, 0, 0, INPUT_SIZE, INPUT_SIZE);
      const imageData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
      const data = imageData.data;

      const tensorData = new Float32Array(1 * 3 * INPUT_SIZE * INPUT_SIZE);
      for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
        const pixelIndex = i * 4;
        tensorData[i] = (data[pixelIndex] / 255.0 - MEAN[0]) / STD[0];
        tensorData[INPUT_SIZE * INPUT_SIZE + i] = (data[pixelIndex + 1] / 255.0 - MEAN[1]) / STD[1];
        tensorData[2 * INPUT_SIZE * INPUT_SIZE + i] = (data[pixelIndex + 2] / 255.0 - MEAN[2]) / STD[2];
      }

      resolve(tensorData);
    };

    img.onerror = () => reject(new Error('Failed to load image for preprocessing'));

    const blob = new Blob([imageFile], { type: imageFile.type });
    img.src = URL.createObjectURL(blob);
  });
}

// Run prediction using an ONNX session
async function predictImage(imageFile, session) {
  // Preprocess
  const tensorData = await preprocessImage(imageFile);
  const inputTensor = new window.ort.Tensor('float32', tensorData, [1, 3, INPUT_SIZE, INPUT_SIZE]);

  // Attempt common input name variants
  const possibleNames = ['input.1', 'input', 'images', 'input0'];
  let feeds = {};
  const modelInputs = session.inputNames || (session._metadata && session._metadata.inputNames) || [];

  // prefer matching name from model if available
  let chosenName = possibleNames.find(n => session.inputNames?.includes(n)) || possibleNames[0];
  // fallback to first model input
  if (!chosenName && session.inputNames && session.inputNames.length) chosenName = session.inputNames[0];

  feeds[chosenName] = inputTensor;
  const results = await session.run(feeds);

  const out = results[Object.keys(results)[0]];
  if (!out) throw new Error('Model returned no output');

  const predictions = Array.from(out.data);
  // softmax
  const max = Math.max(...predictions);
  const exps = predictions.map(p => Math.exp(p - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map(e => e / sum);

  // assume binary: [edible, poisonous] as in example
  const edibleProb = probs[0] ?? 0;
  const poisonousProb = probs[1] ?? 0;
  const isEdible = edibleProb > poisonousProb;
  const confidence = Math.max(edibleProb, poisonousProb);
  const classLabel = isEdible ? 'edible' : 'poisonous';

  return { isEdible, confidence, classLabel, raw: probs };
}
