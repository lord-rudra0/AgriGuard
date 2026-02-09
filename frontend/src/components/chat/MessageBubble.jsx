import React from 'react';

const MessageBubble = ({ me, author, content, time, type, mediaUrl, mediaType, seenCount = 0, totalOthers = 0 }) => {
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'} animate-fade-up transition-all duration-300`}>
      <div
        className={`max-w-[90%] sm:max-w-[75%] px-4 py-3 rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-md will-change-transform ${me
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm border border-white/20 shadow-indigo-500/20 hover:scale-[1.01]'
            : 'bg-white/10 text-gray-100 border border-white/10 rounded-tl-sm hover:bg-white/15 hover:scale-[1.01] shadow-black/10'
          }`}
      >
        {!me && (
          <p className="text-[10px] font-bold mb-1 opacity-80 text-indigo-300 uppercase tracking-wider">{author}</p>
        )}
        {type === 'ai_loader' ? (
          <div className="flex items-center gap-3 text-sm font-medium text-indigo-200">
            <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
            <span className="animate-pulse">ASKAI is thinking...</span>
          </div>
        ) : type === 'image' && mediaUrl ? (() => {
          const src = (
            mediaUrl.startsWith('http') ||
            mediaUrl.startsWith('/uploads') ||
            mediaUrl.startsWith('data:') ||
            mediaUrl.startsWith('blob:')
          ) ? mediaUrl : `/uploads/${mediaUrl}`;
          return (
            <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md max-w-full">
              <img
                src={src}
                alt="attachment"
                className="max-w-full h-auto max-h-64 rounded-md border border-black/10 transition-transform duration-300 ease-out hover:scale-[1.02]"
              />
            </a>
          );
        })() : (
          <p className="text-base leading-relaxed whitespace-pre-wrap break-words break-all text-shadow-sm">{content}</p>
        )}
        <div className={`text-[10px] mt-1.5 font-medium ${me ? 'text-white/60' : 'text-gray-400'}`}>
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
