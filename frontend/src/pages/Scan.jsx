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

  const [detailedAnalysis, setDetailedAnalysis] = useState(null);
  const [detailedLoading, setDetailedLoading] = useState(false);

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

  const handleDetailedAnalysis = async () => {
    if (!file) return;
    try {
      setDetailedLoading(true);
      setDetailedAnalysis(null);
      const form = new FormData();
      form.append('image', file, file.name || 'upload.jpg');

      const resp = await axios.post('/api/analyze/mushroom/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (resp.data && resp.data.success) {
        setDetailedAnalysis(resp.data.analysis || resp.data.result); // Handle both structure just in case
      } else {
        setDetailedAnalysis({ error: resp.data.error || 'Failed to analyze' });
      }
    } catch (e) {
      console.error('Detailed analysis failed', e);
      setDetailedAnalysis({ error: e?.response?.data?.error || e.message });
    } finally {
      setDetailedLoading(false);
    }
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setAnalysis(null);
    setDetailedAnalysis(null);
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
                    <button onClick={clear} className="px-4 py-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Remove</button>
                  </div>

                  {/* Detailed Analysis Section */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleDetailedAnalysis}
                      disabled={detailedLoading || !file}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {detailedLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                          </svg>
                          <span>Processing Analysis...</span>
                        </>
                      ) : (
                        <span>🧬 Run Deep Analysis</span>
                      )}
                    </button>

                    {detailedAnalysis && (
                      <div className="mt-6 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-sm relative overflow-hidden">

                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                        {detailedAnalysis.error ? (
                          <div className="text-red-600 text-sm font-medium flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Error: {detailedAnalysis.error}
                          </div>
                        ) : (
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase mb-1">Detected Object</div>
                                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                  {detailedAnalysis.type || 'Unknown'}
                                </h3>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">CONFIDENCE</div>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${detailedAnalysis.confidence}%` }}></div>
                                  </div>
                                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{detailedAnalysis.confidence}%</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                              {/* Edibility Card */}
                              <div className={`p-3 rounded-lg border ${detailedAnalysis.edible ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">EDIBILITY</div>
                                <div className={`flex items-center gap-2 font-bold ${detailedAnalysis.edible ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                  {detailedAnalysis.edible ? (
                                    <>
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      <span>Edible</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      <span>Toxic / Inedible</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Health Card */}
                              <div className={`p-3 rounded-lg border ${!detailedAnalysis.disease ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'}`}>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">CONDITION</div>
                                <div className={`flex items-center gap-2 font-bold ${!detailedAnalysis.disease ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                                  {!detailedAnalysis.disease ? (
                                    <>
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                      <span>Healthy</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                      <span>Diseased</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {detailedAnalysis.disease && detailedAnalysis.diseaseType && (
                              <div className="mt-3 text-sm text-center bg-gray-100 dark:bg-gray-800 py-1 px-3 rounded text-gray-600 dark:text-gray-300">
                                <strong>Diagnosis:</strong> {detailedAnalysis.diseaseType}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
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
