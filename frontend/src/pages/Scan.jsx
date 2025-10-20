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

  function formatBytes(bytes) {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toFixed(1)} ${units[i]}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Scan</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Capture or upload a photo and get a quick classification.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="mb-3">
              <CameraNavbar onCapture={(f) => handleFile(f)} />
            </div>

            <div className="border-dashed border-2 border-gray-200 dark:border-gray-700 rounded p-4 text-center">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                onClick={() => inputRef.current && inputRef.current.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-primary-600 text-white hover:opacity-95"
              >
                Upload image
              </button>

              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">PNG/JPG — keep images small for faster results</div>
              <div className="mt-3 flex gap-2 justify-center">
                <button onClick={clear} className="px-3 py-1 rounded border text-sm">Clear</button>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              {file ? (
                <div className="space-y-1">
                  <div className="font-medium">Selected</div>
                  <div className="text-xs text-gray-500">{file.name || 'upload.jpg'} • {formatBytes(file.size)}</div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">No file selected</div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            {preview ? (
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/2">
                  <img src={preview} alt="preview" className="w-full h-80 object-cover rounded-md border" />
                </div>
                <div className="md:w-1/2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis</h3>
                    <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                      {predicting && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 animate-spin text-primary-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                          </svg>
                          <span>Running prediction...</span>
                        </div>
                      )}

                      {!predicting && analysis && analysis.error && (
                        <div className="text-red-600">Error: {analysis.error}</div>
                      )}

                      {!predicting && analysis && !analysis.error && (
                        <div className="space-y-3 mt-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">Prediction</div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${analysis.isEdible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {analysis.classLabel?.toUpperCase() || (analysis.isEdible ? 'EDIBLE' : 'POISONOUS')}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">Confidence</div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mt-1 overflow-hidden">
                              <div className="h-3 bg-primary-600" style={{ width: `${Math.round((analysis.confidence || 0) * 100)}%` }} />
                            </div>
                            <div className="text-sm mt-1 text-gray-700 dark:text-gray-300">{((analysis.confidence || 0) * 100).toFixed(1)}%</div>
                          </div>

                          <div className="pt-2 text-sm text-gray-700 dark:text-gray-300">
                            <strong>Edible?</strong> {analysis.isEdible ? <span className="text-green-600">Yes</span> : <span className="text-red-600">No</span>}
                          </div>
                        </div>
                      )}

                      {!analysis && !predicting && (
                        <div className="text-gray-500">No analysis yet. Upload an image to run the model.</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <button onClick={clear} className="px-4 py-2 rounded border">Remove</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center border rounded-md bg-white dark:bg-gray-800 text-gray-500">
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
