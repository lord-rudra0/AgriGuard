import React, { useState } from 'react';
import { Paperclip, Smile, Send } from 'lucide-react';

const Composer = ({ onSend, disabled }) => {
  const [value, setValue] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value);
    setValue('');
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <button type="button" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Attach" aria-label="Attach">
        <Paperclip className="w-5 h-5 text-gray-500" />
      </button>
      <button type="button" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Emoji" aria-label="Emoji">
        <Smile className="w-5 h-5 text-gray-500" />
      </button>
      <input
        className="flex-1 px-3 py-2 bg-transparent outline-none text-gray-900 dark:text-white"
        placeholder="Type a message..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        aria-label="Message input"
      />
      <button disabled={!value.trim() || disabled} type="submit" className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60" aria-label="Send">
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};

export default Composer;
