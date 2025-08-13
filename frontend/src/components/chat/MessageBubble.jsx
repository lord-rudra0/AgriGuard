import React from 'react';

const MessageBubble = ({ me = false, text, time, name }) => {
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`${me ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'} shadow rounded-2xl px-4 py-2 max-w-[75%] transition-all`}
        role="group" aria-label={`message from ${name || (me ? 'you' : 'user')}`}
      >
        {name && !me && <div className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">{name}</div>}
        <div className="whitespace-pre-wrap break-words">{text}</div>
        {time && <div className="text-[10px] opacity-70 mt-1 text-right">{time}</div>}
      </div>
    </div>
  );
};

export default MessageBubble;
