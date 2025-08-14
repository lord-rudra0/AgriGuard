import React, { useRef } from 'react';
const Composer = ({ value, onChange, onSend, onUpload, onInsertAskAI, askAIActive = false, onRemoveAskAI, disabled }) => {
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
        disabled={disabled}
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
        disabled={disabled}
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-2xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-all duration-200 active:scale-95 shadow"
        disabled={!value.trim() || disabled}
      >
        Send
      </button>
    </form>
  );
};

export default Composer;
