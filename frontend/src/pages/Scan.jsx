import { useState, useEffect, useRef } from 'react';
import CameraNavbar from '../components/CameraNavbar';
import { useScan } from '../context/ScanContext';
import axios from 'axios';

export default function Scan() {
  const { scannedFile, clearScan } = useScan();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  
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
    // Send image to backend for prediction
    (async () => {
      try {
        setPredicting(true);
        setAnalysis(null);
        const form = new FormData();
        form.append('image', f, f.name || 'upload.jpg');
        const resp = await axios.post('/api/predict/mushroom', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (resp.data && resp.data.success) {
          setAnalysis(resp.data.result);
        } else if (resp.data && resp.data.error) {
          setAnalysis({ error: resp.data.error });
        } else {
          setAnalysis({ error: 'Unexpected response from server' });
        }
      } catch (e) {
        console.error('Upload/prediction failed', e);
        setAnalysis({ error: e?.response?.data?.error || e.message || String(e) });
      } finally {
        setPredicting(false);
      }
    })();
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
  // Remove client-side model loading: backend will handle inference

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

// Server-side prediction is used; client-side ONNX code removed
