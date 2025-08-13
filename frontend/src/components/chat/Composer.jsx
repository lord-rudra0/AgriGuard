import React from 'react';

const Composer = ({ value, onChange, onSend, disabled }) => {
  return (
    <form onSubmit={onSend} className="relative flex items-center gap-2">
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
