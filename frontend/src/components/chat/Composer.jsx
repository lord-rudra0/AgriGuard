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
        className="px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        disabled={disabled || uploading}
        title="Attach image"
      >
        📎
      </button>
      <button
        type="button"
        onClick={() => onInsertAskAI && onInsertAskAI()}
        className="px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        disabled={disabled}
        title="Ask AI (@ASKAI)"
      >
        ✨
      </button>
      {attachedMedia && (
        <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-300 dark:border-blue-700 select-none">
          {attachedMedia.previewUrl ? (
            <img src={attachedMedia.previewUrl} alt="preview" className="w-6 h-6 rounded object-cover" />
          ) : (
            <span className="w-6 h-6 rounded bg-blue-300 inline-flex items-center justify-center">🖼️</span>
          )}
          <span>Image attached</span>
          <button
            type="button"
            className="ml-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/60 px-1"
            onClick={() => onRemoveAttachment && onRemoveAttachment()}
            title="Remove attachment"
          >
            ×
          </button>
        </span>
      )}
      {askAIActive && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 border border-purple-300 dark:border-purple-700 select-none">
          ASKAI
          <button
            type="button"
            className="ml-1 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800/60 px-1"
            onClick={() => onRemoveAskAI && onRemoveAskAI()}
            title="Remove ASKAI"
          >
            ×
          </button>
        </span>
      )}
      <input
        type="text"
        className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
        placeholder="Type a message..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || uploading}
      />
      <button
        type="submit"
        aria-label="Send message"
        className="rounded-2xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-all duration-200 active:scale-95 shadow inline-flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2"
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
