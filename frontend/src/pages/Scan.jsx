import { useState, useEffect, useRef } from 'react';
import CameraNavbar from '../components/CameraNavbar';
import { useScan } from '../context/ScanContext';

export default function Scan() {
  const { scannedFile, clearScan } = useScan();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
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
    // clear shared context as well
    clearScan();
  };

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
                  <h3 className="font-semibold">Analysis (placeholders)</h3>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <div><strong>Edible?</strong>: <span className="text-indigo-600">Placeholder - unknown</span></div>
                    <div><strong>Disease?</strong>: <span className="text-indigo-600">Placeholder - none detected</span></div>
                    <div><strong>Mushroom name</strong>: <span className="text-indigo-600">Placeholder - Unknown species</span></div>
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
