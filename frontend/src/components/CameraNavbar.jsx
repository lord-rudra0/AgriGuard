import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScan } from '../context/ScanContext';

const CameraNavbar = ({ onCapture }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [placeholderShown, setPlaceholderShown] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // shared scan context
  const { setScannedFile } = useScan();

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  const openBackCamera = async () => {
    setError(null);
    setPlaceholderShown(false);
    try {
      // Prefer environment supporting facingMode constraint -- back camera
      const constraints = { video: { facingMode: { exact: 'environment' } }, audio: false };
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // fallback to any video device if exact facing mode fails
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setOpen(true);
    } catch (e) {
      console.error('Camera error', e);
      setError('Could not access camera. Please allow camera permissions or try another device.');
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
      const url = URL.createObjectURL(file);
      setCapturedUrl(url);
      // Pass File object to parent for upload handling
      if (typeof onCapture === 'function') onCapture(file);
      try {
        // Save captured file into shared ScanContext so other pages (like /scan) can auto-pick it
        setScannedFile(file);
        // Navigate user to scan page for review and ML placeholders
        navigate('/scan');
      } catch (e) { }
      // show placeholder ML info
      setPlaceholderShown(true);
      // stop camera immediately after capture
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setOpen(false);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="w-full bg-transparent px-3 py-2 border-b border-white/50 dark:border-gray-800/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-sm shadow-sm"
            onClick={openBackCamera}
            title="Scan mushroom (disease, species, edibility)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c-2.21 0-4 1.79-4 4 0 .55.45 1 1 1h6c.55 0 1-.45 1-1 0-2.21-1.79-4-4-4z" />
              <path d="M6 12c0-3.31 2.69-6 6-6s6 2.69 6 6c0 2.76-2.24 5-5 5H11c-2.76 0-5-2.24-5-5z" />
              <path d="M3 20v1h18v-1c0-1.66-3.58-3-9-3s-9 1.34-9 3z" opacity=".9" />
            </svg>
            <span>Scan</span>
          </button>
          {open && (
            <button
              className="px-3 py-1 rounded-md bg-gray-200 text-sm text-gray-800"
              onClick={closeCamera}
            >Close</button>
          )}
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-300">Mushroom Scanner</div>
      </div>

      {error && <div className="mt-2 text-xs text-rose-600">{error}</div>}

      {open && (
        <div className="mt-2 rounded-md overflow-hidden border border-white/40 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-48 object-cover"
          />
          <div className="p-2 flex items-center justify-center gap-3 bg-black/40">
            <button
              onClick={capturePhoto}
              className="px-3 py-1 rounded-full bg-white text-black"
            >Capture</button>
            <button
              onClick={closeCamera}
              className="px-3 py-1 rounded-full bg-gray-700 text-white"
            >Cancel</button>
          </div>
        </div>
      )}

      {capturedUrl && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="text-sm font-semibold">Preview</div>
          <img src={capturedUrl} alt="captured" className="w-40 h-28 object-cover rounded-md border" />
        </div>
      )}

      {placeholderShown && (
        <div className="mt-3 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/40 text-sm text-yellow-800 dark:text-yellow-200">
          ML: disease detection, species identification, edibility check (placeholder)
        </div>
      )}
    </div>
  );
};

export default CameraNavbar;
