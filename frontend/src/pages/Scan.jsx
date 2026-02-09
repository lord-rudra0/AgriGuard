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

    // Reset file input so onChange triggers even if same file is selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

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
              <div className="flex flex-col md:flex-row gap-4 h-full">
                <div className="md:w-1/2">
                  <img src={preview} alt="preview" className="w-full h-80 object-cover rounded-md border" />
                </div>

                <div className="md:w-1/2 flex flex-col min-h-[400px]">
                  {/* Loading State */}
                  {(predicting || detailedLoading) && (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <div className="relative w-16 h-16 mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-700"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {detailedLoading ? 'Processing Deep Analysis...' : 'Analyzing Image...'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">Running neural network models...</p>
                    </div>
                  )}

                  {/* DETAILED Analysis Result (Priority View) */}
                  {!predicting && !detailedLoading && detailedAnalysis && (
                    <div className="h-full p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 shadow-sm relative overflow-hidden flex flex-col">
                      {/* Decorative */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase mb-1">Detected Object</div>
                          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">
                            {detailedAnalysis.type || 'Unknown Object'}
                          </h3>
                          {/* Overall Confidence Bar */}
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${detailedAnalysis.typeConfidence || detailedAnalysis.confidence}%` }}></div>
                            </div>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{detailedAnalysis.typeConfidence || detailedAnalysis.confidence}% Confidence</span>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                          ADVANCED MODEL
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className={`p-4 rounded-xl border ${detailedAnalysis.edible ? 'bg-white dark:bg-gray-800 border-emerald-100 dark:border-gray-700' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Edibility</div>
                            {detailedAnalysis.edibleConfidence && (
                              <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{detailedAnalysis.edibleConfidence}%</span>
                            )}
                          </div>
                          <div className={`text-lg font-bold flex items-center gap-2 ${detailedAnalysis.edible ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {detailedAnalysis.edible ? (
                              <><span>✅</span> <span>Edible</span></>
                            ) : (
                              <><span>⛔</span> <span>Inedible</span></>
                            )}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Condition</div>
                            {detailedAnalysis.diseaseConfidence && (
                              <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{detailedAnalysis.diseaseConfidence}%</span>
                            )}
                          </div>
                          <div className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                            {detailedAnalysis.disease ? (
                              <span className="text-amber-500">⚠️ {detailedAnalysis.diseaseType || 'Diseased'}</span>
                            ) : (
                              <span className="text-blue-500">💙 Healthy</span>
                            )}
                          </div>
                          {detailedAnalysis.disease && detailedAnalysis.diseaseTypeConfidence && (
                            <div className="mt-1 text-xs text-gray-400 text-right">
                              Diagnosis Confidence: {detailedAnalysis.diseaseTypeConfidence}%
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                        <button onClick={clear} className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          Scan Another
                        </button>
                      </div>
                    </div>
                  )}

                  {/* BASIC Analysis Result (Fallback View) */}
                  {!predicting && !detailedLoading && !detailedAnalysis && analysis && (
                    <div className="h-full p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col">

                      {analysis.error ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-red-500">
                          <div className="text-4xl mb-2">⚠️</div>
                          <p className="font-medium">{analysis.error}</p>
                          <button onClick={clear} className="mt-4 px-4 py-2 bg-gray-100 rounded text-gray-900 text-sm">Try Again</button>
                        </div>
                      ) : (
                        <>
                          <div className="mb-6">
                            <div className="text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase mb-1">Quick Scan Result</div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                              {analysis.classLabel || 'Unidentified'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {((analysis.confidence || 0) * 100).toFixed(1)}% Confidence
                            </p>
                          </div>

                          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 mb-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${analysis.isEdible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {analysis.isEdible ? '✓' : '!'}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                  {analysis.isEdible ? 'Likely Edible' : 'Example Caution'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Based on basic visual features.
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto">
                            <button
                              onClick={handleDetailedAnalysis}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                              <span>✨ Run Deep Analysis</span>
                              <span className="bg-white/20 px-2 py-0.5 rounded text-xs">Recommended</span>
                            </button>

                            <button onClick={clear} className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                              Discard & Rescan
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {!predicting && !detailedLoading && !analysis && !detailedAnalysis && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-3xl opacity-50">
                        🍄
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        Ready to Scan
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        Upload an image to identify species using our dual-layer AI system.
                      </p>
                    </div>
                  )}
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
