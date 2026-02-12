import { useState, useEffect, useRef } from 'react';
import CameraNavbar from '../components/CameraNavbar';
import { useScan } from '../context/ScanContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';

export default function Scan() {
  const navigate = useNavigate();
  const { scannedFile, clearScan } = useScan();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');

  const [predicting, setPredicting] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const [detailedAnalysis, setDetailedAnalysis] = useState(null);
  const [detailedLoading, setDetailedLoading] = useState(false);

  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Auto-scroll to results on mobile
  useEffect(() => {
    if ((analysis || detailedAnalysis) && window.innerWidth < 1024) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [analysis, detailedAnalysis]);

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
    setUrlError('');
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

  const handleImageUrlSubmit = async () => {
    const trimmed = imageUrl.trim();
    if (!trimmed) return;
    setUrlError('');

    // Support pasted data URLs from clipboard (data:image/...;base64,...)
    if (trimmed.startsWith('data:image/')) {
      const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        setUrlError('Invalid data image URL format.');
        return;
      }
      try {
        setUrlLoading(true);
        const mimeType = match[1];
        const base64 = match[2];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : mimeType.includes('gif') ? 'gif' : 'jpg';
        const fileFromDataUrl = new File([bytes], `scan-pasted.${ext}`, { type: mimeType });
        handleFile(fileFromDataUrl);
      } catch (err) {
        setUrlError(err?.message || 'Could not decode pasted data image.');
      } finally {
        setUrlLoading(false);
      }
      return;
    }

    try {
      setUrlLoading(true);
      const resp = await axios.post(
        '/api/analyze/mushroom/fetch-image',
        { url: trimmed },
        { responseType: 'blob' }
      );
      const contentType = resp.headers?.['content-type'] || resp.data?.type || 'image/jpeg';
      const rawFilename = resp.headers?.['x-image-filename'];
      const filename = rawFilename ? decodeURIComponent(rawFilename) : 'scan-from-link.jpg';
      const fileFromUrl = new File([resp.data], filename, { type: contentType });
      handleFile(fileFromUrl);
    } catch (err) {
      let msg = err?.message || 'Unable to read image from URL.';
      const errBlob = err?.response?.data;
      if (errBlob instanceof Blob) {
        try {
          const text = await errBlob.text();
          const parsed = JSON.parse(text);
          if (parsed?.error) msg = parsed.error;
        } catch {
          // Keep fallback message.
        }
      } else if (err?.response?.data?.error) {
        msg = err.response.data.error;
      }
      setUrlError(msg);
    } finally {
      setUrlLoading(false);
    }
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
    setImageUrl('');
    setUrlError('');
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

    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 p-6 pb-24 md:pb-6 overflow-hidden transition-colors duration-300">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] bg-purple-500/20 blur-[100px] rounded-full animate-float" />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-emerald-500/20 blur-[80px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[10%] w-[20%] h-[20%] bg-cyan-500/10 blur-[60px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent filter drop-shadow-sm mb-1">Scan</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-light">Capture or upload a photo and get a quick classification.</p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-md transition-all shadow-sm hover:scale-105 active:scale-95"
          >
            <History className="w-4 h-4" />
            <span className="font-medium">History</span>
          </button>
        </div>

        <div className={`grid grid-cols-1 ${preview ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-2xl mx-auto'} gap-6 lg:gap-8 transition-all duration-500 ease-in-out`}>
          {/* LEFT COLUMN: Media & Input */}
          <div className={`bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[24px] md:rounded-[32px] shadow-xl md:shadow-2xl shadow-gray-200/50 dark:shadow-black/20 p-5 md:p-6 transition-all duration-300 ${preview ? 'lg:col-span-1' : ''}`}>
            {/* Preview Image (Moved to Left Column) */}
            {preview && (
              <div className="relative mb-6 group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                  <span className="text-white text-xs font-semibold tracking-wider">PREVIEW</span>
                </div>
                <img src={preview} alt="preview" className="w-full aspect-[4/3] object-cover rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm" />
                <button
                  onClick={clear}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-md"
                  title="Clear Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}

            <div className={`mb-4 ${preview ? 'opacity-80 hover:opacity-100 transition-opacity' : ''}`}>
              <h3 className={`text-lg font-bold text-gray-900 dark:text-white mb-3 ${preview ? 'hidden' : 'text-center'}`}>
                {preview ? 'Change Image' : 'Start Diagnosis'}
              </h3>
              <CameraNavbar onCapture={(f) => handleFile(f)} />
            </div>

            <div className="border-dashed border-2 border-gray-300 dark:border-white/10 rounded-2xl p-6 text-center bg-gray-50/50 dark:bg-black/20 hover:bg-gray-100/50 dark:hover:bg-black/30 transition-colors">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                onClick={() => inputRef.current && inputRef.current.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold tracking-wide hover:brightness-110 hover:shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all duration-200 active:scale-95"
              >
                Upload image
              </button>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleImageUrlSubmit();
                    }
                  }}
                  placeholder="Paste image URL or data:image base64..."
                  className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-gray-900/60 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <button
                  onClick={handleImageUrlSubmit}
                  disabled={urlLoading}
                  className="shrink-0 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-60 sm:min-w-[92px]"
                >
                  {urlLoading ? 'Loading...' : 'Use Link'}
                </button>
              </div>
              {urlError && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 text-left">{urlError}</div>
              )}

              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">PNG/JPG — keep images small for faster results</div>
              <div className="mt-4 flex gap-2 justify-center">
                <button onClick={clear} className="px-4 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Clear</button>
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

          {/* RIGHT COLUMN: Analysis Results (Only visible if preview exists) */}
          {preview && (
            <div ref={resultsRef} className="lg:col-span-2 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[24px] md:rounded-[32px] shadow-xl md:shadow-2xl shadow-gray-200/50 dark:shadow-black/20 p-5 md:p-6 min-h-[400px] md:min-h-[500px] animate-fade-in-up">
              <div className="flex flex-col h-full">
                <div className="flex-1 flex flex-col min-h-[400px]">
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
                    <div className="h-full p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 shadow-sm relative overflow-hidden flex flex-col">
                      {/* Decorative */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase mb-1">Detected Object</div>
                          <h3 className="mb-2 break-words text-2xl font-extrabold leading-tight text-gray-900 dark:text-white sm:text-3xl">
                            {detailedAnalysis.type || 'Unknown Object'}
                          </h3>
                          {/* Overall Confidence Bar */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${detailedAnalysis.typeConfidence || detailedAnalysis.confidence}%` }}></div>
                            </div>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{detailedAnalysis.typeConfidence || detailedAnalysis.confidence}% Confidence</span>
                          </div>
                        </div>
                        <div className="w-fit self-start px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                          ADVANCED MODEL
                        </div>
                      </div>

                      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className={`p-4 rounded-xl border ${detailedAnalysis.edible ? 'bg-white dark:bg-gray-800 border-emerald-100 dark:border-gray-700' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Edibility</div>
                            {detailedAnalysis.edibleConfidence && (
                              <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{detailedAnalysis.edibleConfidence}%</span>
                            )}
                          </div>
                          <div className={`text-base sm:text-lg font-bold flex items-center gap-2 ${detailedAnalysis.edible ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
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
                          <div className="text-base sm:text-lg font-bold flex items-start gap-2 text-gray-800 dark:text-gray-200">
                            {detailedAnalysis.disease ? (
                              <span className="break-words text-amber-500 leading-snug">⚠️ {detailedAnalysis.diseaseType || 'Diseased'}</span>
                            ) : (
                              <span className="text-blue-500">Healthy</span>
                            )}
                          </div>
                          {detailedAnalysis.disease && detailedAnalysis.diseaseTypeConfidence && (
                            <div className="mt-1 text-xs text-gray-400 text-left sm:text-right">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
