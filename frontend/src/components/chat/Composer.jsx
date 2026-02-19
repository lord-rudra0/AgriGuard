import React, { useRef } from 'react';
const Composer = ({ value, onChange, onSend, onUpload, onInsertAskAI, askAIActive = false, onRemoveAskAI, attachedMedia, onRemoveAttachment, uploading = false, disabled }) => {
  const fileRef = useRef(null);
  return (
    <form onSubmit={onSend} className="relative flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onUpload) onUpload(file);
          if (fileRef.current) fileRef.current.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-white/10 text-emerald-700 dark:text-emerald-300 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-emerald-800 dark:hover:text-white transition-all active:scale-95 backdrop-blur-md border border-gray-200 dark:border-white/10"
        disabled={disabled || uploading}
        title="Attach image"
      >
        <span className="text-lg">📎</span>
      </button>
      <button
        type="button"
        onClick={() => onInsertAskAI && onInsertAskAI()}
        className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-100 to-amber-100 dark:from-emerald-500/20 dark:to-amber-500/20 text-emerald-700 dark:text-emerald-300 hover:from-emerald-200 hover:to-amber-200 dark:hover:from-emerald-500/30 dark:hover:to-amber-500/30 hover:text-emerald-800 dark:hover:text-white transition-all active:scale-95 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-lg shadow-emerald-500/10"
        disabled={disabled}
        title="Ask AI (@ASKAI)"
      >
        <span className="text-lg">✨</span>
      </button>
      {attachedMedia && (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 select-none backdrop-blur-md shadow-lg shadow-emerald-500/10 animate-fade-in">
          {attachedMedia.previewUrl ? (
            <img src={attachedMedia.previewUrl} alt="preview" className="w-6 h-6 rounded-md object-cover ring-1 ring-white/20" />
          ) : (
            <span className="w-6 h-6 rounded-md bg-emerald-500/40 inline-flex items-center justify-center text-white">🖼️</span>
          )}
          <span>Image attached</span>
          <button
            type="button"
            className="ml-1 rounded-full hover:bg-white/10 px-1.5 py-0.5 transition-colors"
            onClick={() => onRemoveAttachment && onRemoveAttachment()}
            title="Remove attachment"
          >
            ×
          </button>
        </span>
      )}
      {askAIActive && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-500/30 select-none backdrop-blur-md shadow-lg shadow-amber-500/10 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          ASKAI Active
          <button
            type="button"
            className="ml-1 rounded-full hover:bg-white/10 px-1.5 py-0.5 transition-colors"
            onClick={() => onRemoveAskAI && onRemoveAskAI()}
            title="Remove ASKAI"
          >
            ×
          </button>
        </span>
      )}
      <input
        type="text"
        className="flex-1 px-6 py-4 rounded-3xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/80 dark:focus:bg-white/10 transition-all backdrop-blur-md shadow-inner"
        placeholder="Type a message..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || uploading}
      />
      <button
        type="submit"
        aria-label="Send message"
        className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:brightness-110 hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-105 transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center w-12 h-12 md:w-auto md:h-auto md:px-6 md:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={uploading || disabled || (!value.trim() && !attachedMedia)}
      >
        {uploading ? (
          <span className="inline-flex items-center">
            <span className="w-4 h-4 md:mr-2 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
            <span className="hidden md:inline">Sending...</span>
          </span>
        ) : (
          <>
            {/* Icon on small screens, text on md+ */}
            <svg className="w-5 h-5 md:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span className="hidden md:inline">Send</span>
          </>
        )}
      </button>
    </form>
  );
};

export default Composer;
