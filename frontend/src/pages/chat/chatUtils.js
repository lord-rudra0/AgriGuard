export const upsertChatToTop = (prev, chatId, message, { incrementUnread = false } = {}) => {
  const list = [...prev];
  const idx = list.findIndex((c) => c._id === chatId);
  if (idx === -1) return list;
  const current = list[idx];
  const unreadCount = incrementUnread ? (current.unreadCount || 0) + 1 : (current.unreadCount || 0);
  const updated = {
    ...current,
    lastMessage: message,
    updatedAt: new Date().toISOString(),
    unreadCount
  };
  list.splice(idx, 1);
  list.unshift(updated);
  return list;
};

export const normalizeAiText = (res) => (
  res?.data?.message || res?.data?.reply || res?.data?.text || 'I could not generate a response right now.'
);

export const removeByMessageId = (prev, messageId) => (
  prev.filter((m) => (m._id || m.id) !== messageId)
);

export const getChatTitle = (selectedChat, user) => (
  selectedChat?.name
  || selectedChat?.members
    ?.map((m) => (typeof m === 'object' ? (m.name || m.username) : null))
    .filter((n) => !!n && n !== user?.name && n !== user?.username)
    .join(', ')
  || 'Chat'
);
