import React from 'react';

const MessageBubble = ({ me, author, content, time, type, mediaUrl, mediaType, seenCount = 0, totalOthers = 0 }) => {
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'} animate-fade-up transition-all duration-300`}>
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 will-change-transform ${
          me
            ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-tr-sm ring-1 ring-primary-500/20 hover:brightness-110 hover:scale-[1.01]'
            : 'bg-gradient-to-br from-white to-indigo-50 dark:from-gray-700 dark:to-gray-800 dark:text-white text-gray-900 border border-white/60 dark:border-gray-600 rounded-tl-sm ring-1 ring-indigo-100/60 dark:ring-gray-600/40 hover:scale-[1.01]'
        }`}
      >
        {!me && (
          <p className="text-[10px] font-semibold mb-0.5 opacity-90 text-indigo-600 dark:text-indigo-300">{author}</p>
        )}
        {type === 'ai_loader' ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="w-4 h-4 border-2 border-indigo-400/60 border-t-transparent rounded-full animate-spin"></span>
            <span>{content || 'ASKAI is thinking...'}</span>
          </div>
        ) : type === 'image' && mediaUrl ? (() => {
    const src = (
      mediaUrl.startsWith('http') ||
      mediaUrl.startsWith('/uploads') ||
      mediaUrl.startsWith('data:') ||
      mediaUrl.startsWith('blob:')
    ) ? mediaUrl : `/uploads/${mediaUrl}`;
    return (
      <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md">
        <img
          src={src}
          alt="attachment"
          className="max-h-64 rounded-md border border-black/10 transition-transform duration-300 ease-out hover:scale-[1.02]"
        />
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
