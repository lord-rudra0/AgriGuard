import React from 'react';
import Avatar from './Avatar';

const ChatListItem = ({ chat, active, onClick, currentUser, online = false, className = '' }) => {
  const names = (chat.members || [])
    .map(m => (typeof m === 'object' ? (m.name || m.username) : null))
    .filter(n => !!n && n !== currentUser?.name && n !== currentUser?.username);
  const title = chat.name || names.join(', ') || 'Chat';
  const last = chat.lastMessage || {};
  const preview = last.content || (chat.type === 'group' ? 'Group created' : 'Say hello');
  const time = last.createdAt ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <li
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2 cursor-pointer rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20 ${active ? 'bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/10 shadow-lg shadow-gray-200/50 dark:shadow-black/10' : 'border border-transparent'} ${className}`}
    >
      <Avatar name={title} size={40} online={online} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-900 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors truncate">{title}</p>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">{time}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400 truncate transition-colors">{preview}</p>
      </div>
      {chat.unreadCount ? (
        <span className="ml-2 text-[10px] bg-emerald-600 text-white rounded-full px-2 py-0.5">{chat.unreadCount}</span>
      ) : null}
    </li>
  );
};

export default ChatListItem;
