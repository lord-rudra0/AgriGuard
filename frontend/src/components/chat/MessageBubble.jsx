import React from 'react';

const MessageBubble = ({ me, author, content, time, type, mediaUrl, mediaType, seenCount = 0, totalOthers = 0 }) => {
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'} animate-fade-up`}>
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm transition-transform duration-150 ${
          me
            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-sm'
            : 'bg-white dark:bg-gray-700 dark:text-white text-gray-900 border border-gray-100 dark:border-gray-600 rounded-tl-sm'
        }`}
      >
        {!me && (
          <p className="text-[10px] font-semibold mb-0.5 opacity-80">{author}</p>
        )}
        {type === 'image' && mediaUrl ? (() => {
    const src = mediaUrl.startsWith('http') || mediaUrl.startsWith('/uploads') ? mediaUrl : `/uploads/${mediaUrl}`;
    return (
      <a href={src} target="_blank" rel="noreferrer">
        <img src={src} alt="attachment" className="max-h-64 rounded-md border border-black/10" />
      </a>
    );
  })() : (
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        )}
        <div className={`text-[10px] mt-1 ${me ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
          {time}
          {me && totalOthers > 0 && (
            <span className="ml-1 opacity-80">
              {seenCount >= totalOthers
                ? ' • Seen'
                : seenCount > 0
                  ? ` • Seen by ${seenCount}/${totalOthers}`
                  : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
