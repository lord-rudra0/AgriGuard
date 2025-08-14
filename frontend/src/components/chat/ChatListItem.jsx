import React from 'react';
import Avatar from './Avatar';

const ChatListItem = ({ chat, active, onClick, currentUser, online = false }) => {
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
      className={`group flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all duration-200 hover:bg-primary-50/80 dark:hover:bg-primary-900/10 ${active ? 'bg-primary-100/70 dark:bg-primary-900/20' : ''}`}
    >
  <Avatar name={title} size={40} online={online} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-900 dark:text-white truncate">{title}</p>
          <span className="text-[10px] text-gray-400 group-hover:text-gray-500">{time}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{preview}</p>
      </div>
      {chat.unreadCount ? (
        <span className="ml-2 text-[10px] bg-primary-600 text-white rounded-full px-2 py-0.5">{chat.unreadCount}</span>
      ) : null}
    </li>
  );
};

export default ChatListItem;
