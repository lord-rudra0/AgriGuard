
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import ChatListItem from '../components/chat/ChatListItem';
import MessageBubble from '../components/chat/MessageBubble';
import Composer from '../components/chat/Composer';

const Chat = () => {
  const { socket, presence, joinChat, leaveChat, setTyping } = useSocket();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState('one-to-one');
  const [newChatUserInput, setNewChatUserInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Add member modal state
  const [showAddMember, setShowAddMember] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [adding, setAdding] = useState(false);
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  // Members modal state
  const [showMembers, setShowMembers] = useState(false);

  // Mounted state to trigger entrance animations
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Fetch chat list
  useEffect(() => {
    setLoadingChats(true);
    axios.get('/api/chatSystem/chats').then(res => {
      setChats(res.data.chats || []);
      setLoadingChats(false);
    });
  }, []);

  // Join/leave chat room and fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    joinChat(selectedChat._id);
    setLoadingMessages(true);
    axios.get(`/api/chatSystem/messages/${selectedChat._id}`).then(res => {
      setMessages(res.data.messages || []);
      setLoadingMessages(false);
    });
    // mark seen
    axios.post(`/api/chatSystem/messages/${selectedChat._id}/seen`).catch(() => {});
    // reset unread count locally for this chat
    setChats(prev => prev.map(c => c._id === selectedChat._id ? { ...c, unreadCount: 0 } : c));
    return () => {
      leaveChat(selectedChat._id);
    };
  }, [selectedChat]);

  // Real-time: listen for new messages
  useEffect(() => {
    if (!socket) return;
    const onTyping = ({ chatId, userId, typing, name }) => {
      if (chatId === selectedChat?._id && userId !== user?._id) {
        setIsTyping(typing ? name || 'Someone' : '');
      }
    };
    const onMessage = (message) => {
      // Update chat list preview/unread and ordering
      setChats(prev => {
        const list = [...prev];
        const idx = list.findIndex(c => c._id === message.chatId);
        if (idx !== -1) {
          const isActive = message.chatId === selectedChat?._id;
          const unreadCount = isActive ? (list[idx].unreadCount || 0) : (list[idx].unreadCount || 0) + 1;
          const updated = { ...list[idx], lastMessage: message, updatedAt: new Date().toISOString(), unreadCount };
          list.splice(idx, 1);
          list.unshift(updated);
        }
        return list;
      });

      if (message.chatId === selectedChat?._id) {
        setMessages(prev => [...prev, message]);
        // mark seen on new message
        axios.post(`/api/chatSystem/messages/${selectedChat._id}/seen`).catch(() => {});
      }
    };
    const onSeen = ({ chatId, userId: seenUserId }) => {
      if (chatId !== selectedChat?._id) return;
      // Do not redundantly add current user's id; server already added
      setMessages(prev => prev.map(m => {
        const seenBy = Array.isArray(m.seenBy) ? m.seenBy : [];
        const has = seenBy.some(s => String((s && s._id) ? s._id : s) === String(seenUserId));
        if (has) return m;
        return { ...m, seenBy: [...seenBy, String(seenUserId)] };
      }));
    };
    socket.on('chat:typing', onTyping);
    socket.on('chat:message', onMessage);
    socket.on('chat:seen', onSeen);
    return () => {
      socket.off('chat:typing', onTyping);
      socket.off('chat:message', onMessage);
      socket.off('chat:seen', onSeen);
    };
  }, [socket, selectedChat]);

  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      
      // Only auto-scroll if user is near the bottom or if it's a new message they sent
      if (isNearBottom || (messages.length > 0 && messages[messages.length - 1]?.sender?._id === user?._id)) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [messages]);

  const [isTyping, setIsTyping] = useState('');

  // Keep non-editable ASKAI chip state
  const [askAIActive, setAskAIActive] = useState(false);
  // Attachment state (pick first, send later)
  const [attachedMedia, setAttachedMedia] = useState(null); // { file, previewUrl }

  // Sanitize input: if user types @ASKAI, activate chip and strip text
  const handleInputChange = (val) => {
    if (/@ASKAI/i.test(val)) {
      setAskAIActive(true);
      val = val.replace(/@ASKAI/gi, '').replace(/\s{2,}/g, ' ').trimStart();
    }
    setInput(val);
  };

  const handleUpload = (file) => {
    if (!file || !file.type?.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Image too large (max 5MB)');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setAttachedMedia({ file, previewUrl });
  };

  const removeAttachment = () => {
    if (attachedMedia?.previewUrl) URL.revokeObjectURL(attachedMedia.previewUrl);
    setAttachedMedia(null);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedMedia) || !socket || sending || !selectedChat) return;
    setSending(true);
    try {
      let sentMsg = null;
      if (attachedMedia) {
        // Upload the image now, then send message with caption
        const form = new FormData();
        form.append('file', attachedMedia.file);
        const up = await axios.post('/api/chatSystem/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        const url = up.data?.url;
        if (!url) throw new Error('Upload failed');
        const res = await axios.post('/api/chatSystem/messages', {
          chatId: selectedChat._id,
          content: input.trim(),
          type: 'image',
          mediaUrl: url,
          mediaType: attachedMedia.file.type,
        });
        sentMsg = { ...res.data.message, sender: user };
        // Clear attachment preview
        if (attachedMedia.previewUrl) URL.revokeObjectURL(attachedMedia.previewUrl);
        setAttachedMedia(null);
        setInput('');
      } else {
        // Text-only message
        const res = await axios.post('/api/chatSystem/messages', {
          chatId: selectedChat._id,
          content: input,
        });
        setInput('');
        sentMsg = { ...res.data.message, sender: user };
      }
      // Optimistic UI updates (common)
      setMessages((prev) => [...prev, sentMsg]);
      socket.emit('chat:message', { chatId: selectedChat._id, message: sentMsg });
      setChats(prev => {
        const list = [...prev];
        const idx = list.findIndex(c => c._id === selectedChat._id);
        if (idx !== -1) {
          const updated = { ...list[idx], lastMessage: sentMsg, updatedAt: new Date().toISOString() };
          list.splice(idx, 1);
          list.unshift(updated);
        }
        return list;
      });

      // If ASKAI chip active, call AI endpoint and append AI reply
      if (askAIActive) {
        try {
          let aiPayload = { chatId: selectedChat._id, content: sentMsg.content };
          if (sentMsg.type === 'image' && sentMsg.mediaUrl) {
            aiPayload = { ...aiPayload, mediaUrl: sentMsg.mediaUrl, mediaType: sentMsg.mediaType };
          }
          const aiRes = await axios.post('/api/chatSystem/askai', aiPayload);
          const aiMsg = aiRes.data.message;
          setMessages(prev => [...prev, aiMsg]);
          socket.emit('chat:message', { chatId: selectedChat._id, message: aiMsg });
          setChats(prev => {
            const list = [...prev];
            const idx = list.findIndex(c => c._id === selectedChat._id);
            if (idx !== -1) {
              const updated = { ...list[idx], lastMessage: aiMsg, updatedAt: new Date().toISOString() };
              list.splice(idx, 1);
              list.unshift(updated);
            }
            return list;
          });
        } catch (err) {
          console.error('AI error', err);
        }
      }
    } finally {
      setSending(false);
      // After sending, reset ASKAI unless user re-activates
      setAskAIActive(false);
    }
  };

  const onInsertAskAI = async (content) => {
    if (!selectedChat || !socket || sending) return;
    try {
      const res = await axios.post('/api/chatSystem/askai', {
        chatId: selectedChat._id,
        content,
      });
      const aiMsg = res.data.message;
      setMessages(prev => [...prev, aiMsg]);
      socket.emit('chat:message', { chatId: selectedChat._id, message: aiMsg });
      setChats(prev => {
        const list = [...prev];
        const idx = list.findIndex(c => c._id === selectedChat._id);
        if (idx !== -1) {
          const updated = { ...list[idx], lastMessage: aiMsg, updatedAt: new Date().toISOString() };
          list.splice(idx, 1);
          list.unshift(updated);
        }
        return list;
      });
    } catch (err) {
      console.error('AI error', err);
    }
  };

  // (handled above) Upload picker sets attachment preview; actual upload occurs on send.

  const deleteChat = async () => {
    if (!selectedChat) return;
    if (!confirm('Delete this chat and all its messages?')) return;
    await axios.delete(`/api/chatSystem/chats/${selectedChat._id}`);
    setChats(prev => prev.filter(c => c._id !== selectedChat._id));
    setSelectedChat(null);
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`/api/chatSystem/messages/${messageId}`);
      setMessages(prev => prev.filter(m => (m._id || m.id) !== messageId));
  if (activeMessageId === messageId) setActiveMessageId(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete message');
    }
  };

  // typing events
  useEffect(() => {
    if (!socket || !selectedChat) return;
    if (!input) {
      setTyping(selectedChat._id, false);
      return;
    }
    setTyping(selectedChat._id, true);
    const t = setTimeout(() => setTyping(selectedChat._id, false), 1200);
    return () => clearTimeout(t);
  }, [input, socket, selectedChat]);

  // Click-to-toggle actions for a message
  const [activeMessageId, setActiveMessageId] = useState(null);
  
  // Resizable chat window
  const [chatHeight, setChatHeight] = useState(700); // Default height = 700px
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        const rect = chatContainer.getBoundingClientRect();
        const newHeight = Math.max(200, Math.min(600, e.clientY - rect.top + 20));
        setChatHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Sidebar: Chat list */}
      <aside className="w-80 backdrop-blur bg-white/70 dark:bg-gray-900/40 border-r border-white/50 dark:border-gray-800/60 flex flex-col shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <span className="font-bold text-lg text-gray-900 dark:text-white">Chats</span>
          <button
            className="ml-2 px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs hover:bg-primary-700 shadow"
            onClick={() => setShowNewChat(true)}
            title="New chat"
          >
            New
          </button>
        </div>
      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Start a New Chat</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Chat Type</label>
              <select
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={newChatType}
                onChange={e => setNewChatType(e.target.value)}
              >
                <option value="one-to-one">One-to-One</option>
                <option value="group">Group</option>
              </select>
            </div>
            {newChatType === 'group' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Group Name</label>
                <input
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={newChatName}
                  onChange={e => setNewChatName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">User Email or Username</label>
                <input
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={newChatUserInput}
                  onChange={e => setNewChatUserInput(e.target.value)}
                  placeholder="Enter user email or username"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => setShowNewChat(false)}
                disabled={creating}
              >Cancel</button>
              <button
                className="px-3 py-1 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                disabled={creating || (newChatType === 'group' ? !newChatName : !newChatUserInput)}
                onClick={async () => {
                  setCreating(true);
                  try {
                    let members = [];
                    if (newChatType === 'group') {
                      // Only the creator for now; can add more later
                      members = [];
                    } else {
                      // Find user by email or username
                      let res;
                      if (newChatUserInput.includes('@')) {
                        res = await axios.get('/api/auth/users', { params: { email: newChatUserInput } });
                      } else {
                        res = await axios.get('/api/auth/users', { params: { username: newChatUserInput } });
                      }
                      if (!res.data.user) throw new Error('User not found');
                      members = [res.data.user._id];
                    }
                    const chatRes = await axios.post('/api/chatSystem/chats', {
                      type: newChatType,
                      name: newChatType === 'group' ? newChatName : undefined,
                      members,
                    });
                    setChats((prev) => [chatRes.data.chat, ...prev]);
                    setSelectedChat(chatRes.data.chat);
                    setShowNewChat(false);
                    setNewChatName('');
                    setNewChatUserInput('');
                  } catch (e) {
                    alert(e.response?.data?.message || e.message || 'Failed to create chat');
                  } finally {
                    setCreating(false);
                  }
                }}
              >Create</button>
            </div>
          </div>
        </div>
      )}
        {loadingChats ? (
          <div className="p-4 text-gray-500">Loading…</div>
        ) : (
          <ul className="flex-1 overflow-y-auto p-2 space-y-1">
            {chats.map((chat, idx) => {
              const otherIds = (chat.members || []).map(m => m._id).filter(id => id !== user?._id);
              const otherId = chat.type === 'one-to-one' ? otherIds[0] : null;
              const online = otherId ? !!presence.get(String(otherId)) : false;
              return (
                <li
                  key={chat._id}
                  className={`transition-all duration-500 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                  style={{ transitionDelay: `${Math.min(idx, 12) * 40}ms` }}
                >
                  <ChatListItem
                    chat={chat}
                    active={selectedChat?._id === chat._id}
                    currentUser={user}
                    online={online}
                    onClick={() => setSelectedChat(chat)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </aside>
      {/* Main chat window */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col p-6 max-h-screen">
          {selectedChat ? (
            <>
              <div className={`flex items-center justify-between transition-all duration-500 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                <div className="font-bold text-xl mb-0.5 text-gray-900 dark:text-white flex items-center gap-2">
                  {(() => {
                    const title = selectedChat.name || selectedChat.members?.map(m => (typeof m === 'object' ? (m.name || m.username) : null)).filter(n => !!n && n !== user?.name && n !== user?.username).join(', ') || 'Chat';
                    // Online badge for one-to-one chats
                    if (selectedChat.type === 'one-to-one') {
                      const otherId = (selectedChat.members || [])
                        .map(m => (typeof m === 'object' ? m._id : m))
                        .find(id => String(id) !== String(user?._id));
                      const isOnline = otherId ? !!presence.get(String(otherId)) : false;
                      return (
                        <>
                          <span>{title}</span>
                          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${isOnline ? 'text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-700/40' : 'text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700/40'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </>
                      );
                    }
                    return <span>{title}</span>;
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  {selectedChat.type === 'group' && (
                    <>
                      <button
                        onClick={() => setShowMembers(true)}
                        className="px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 dark:text-gray-200 dark:border-gray-700/40 dark:hover:bg-gray-800/40"
                      >
                        Members
                      </button>
                      <button
                        onClick={() => setShowAddMember(true)}
                        className="px-3 py-1.5 text-sm text-primary-700 border border-primary-200 rounded-md hover:bg-primary-50 dark:text-primary-400 dark:border-primary-700/40 dark:hover:bg-primary-900/20"
                      >
                        Add member
                      </button>
                    </>
                  )}
                  <button
                    onClick={deleteChat}
                    className="px-3 py-1.5 text-sm text-red-700 border border-red-200 rounded-md hover:bg-red-50 dark:text-red-400 dark:border-red-700/40 dark:hover:bg-red-900/20"
                  >
                    Delete chat
                  </button>
                </div>
              </div>
              {isTyping ? (
                <div className="text-xs text-primary-600 dark:text-primary-400 mb-2">{isTyping} is typing…</div>
              ) : (
                <div className="h-2" />
              )}
              <div 
                className={`chat-messages-container overflow-y-auto rounded-2xl shadow-sm p-4 mb-4 backdrop-blur bg-white/70 dark:bg-gray-900/40 border border-white/50 dark:border-gray-800/60 transition-all duration-500 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                style={{ height: `${chatHeight}px` }}
                ref={messagesContainerRef}
              >
                {loadingMessages ? (
                  <div className="text-gray-500 dark:text-gray-400 text-center mt-8">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400 text-center mt-8">No messages yet.</div>
                ) : (
                  <ul className="space-y-3">
                    {messages.map((msg, idx) => {
                      const msgId = msg._id || idx;
                      const showActions = activeMessageId === msgId;
                      const me = msg.type === 'ai' ? false : (msg.sender?._id === user?._id);
                      // Compute seen indicators for my messages
                      let seenCount = 0;
                      let totalOthers = 0;
                      try {
                        const memberIds = (selectedChat?.members || []).map(m => (typeof m === 'object' ? m._id : m)).filter(Boolean);
                        const others = memberIds.filter(id => String(id) !== String(user?._id));
                        totalOthers = others.length;
                        const seenBy = Array.isArray(msg.seenBy) ? msg.seenBy : [];
                        const seenByIds = seenBy.map(s => (typeof s === 'object' && s?._id) ? s._id : s).filter(Boolean);
                        seenCount = seenByIds.filter(id => String(id) !== String(user?._id)).length;
                      } catch (e) {}
                      return (
                        <li
                          key={msgId}
                          className={`group cursor-pointer transition-all duration-500 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                          style={{ transitionDelay: `${Math.min(idx, 12) * 35}ms` }}
                          onClick={() => setActiveMessageId(prev => prev === msgId ? null : msgId)}
                        >
                          <MessageBubble
                            me={me}
                            author={msg.type === 'ai' ? 'ASKAI' : (msg.sender?.name || 'User')}
                            content={msg.content}
                            type={msg.type}
                            mediaUrl={msg.mediaUrl}
                            mediaType={msg.mediaType}
                            time={msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            seenCount={me ? seenCount : 0}
                            totalOthers={me ? totalOthers : 0}
                          />
                          <div className={`transition-opacity duration-150 mt-1 ${showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {(msg.sender?._id === user?._id) && (
                              <button
                                className="inline-flex items-center px-2.5 py-1.5 text-sm text-red-700 border border-red-200 rounded-md hover:bg-red-50 dark:text-red-400 dark:border-red-700/40 dark:hover:bg-red-900/20"
                                onClick={(e) => { e.stopPropagation(); deleteMessage(msg._id); }}
                              >
                                Delete message
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </ul>
                )}
              </div>
              
              {/* Resize Handle */}
              <div 
                className={`w-full h-2 bg-transparent hover:bg-blue-500/20 cursor-ns-resize transition-all duration-500 ease-out transform relative group mb-2 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
                onMouseDown={handleMouseDown}
              >
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div className="w-12 h-1 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors duration-200"></div>
                </div>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-xs text-gray-400 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {isResizing ? 'Resizing...' : 'Drag to resize'}
                </div>
              </div>
              
              <div className={`transition-all duration-500 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`} style={{ transitionDelay: '120ms' }}>
                <Composer
                  value={input}
                  onChange={handleInputChange}
                  onSend={sendMessage}
                  onUpload={handleUpload}
                  onInsertAskAI={() => setAskAIActive(true)}
                  askAIActive={askAIActive}
                  attachedMedia={attachedMedia}
                  onRemoveAttachment={removeAttachment}
                  uploading={sending}
                  onRemoveAskAI={() => setAskAIActive(false)}
                  disabled={!socket || sending}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">Select a chat to start messaging</div>
          )}
        </div>
      </main>
      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Add member</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Enter Email, Username, or Phone</p>
            <input
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={addInput}
              onChange={e => setAddInput(e.target.value)}
              placeholder="Email / Username / Phone"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                onClick={() => { if (!adding) { setShowAddMember(false); setAddInput(''); } }}
                disabled={adding}
              >Cancel</button>
              <button
                className={`px-3 py-1.5 rounded text-white ${adding ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
                disabled={adding || !addInput.trim()}
                onClick={async () => {
                  if (!selectedChat) return;
                  const identifier = addInput.trim();
                  if (!identifier) return;
                  // prevent adding self
                  if (identifier === user?.email || identifier === user?.username || identifier === user?.phone) {
                    alert('You cannot add yourself');
                    return;
                  }
                  // prevent adding existing member (by id if known)
                  const memberIds = (selectedChat.members || []).map(m => (typeof m === 'object' ? m._id : m));
                  setAdding(true);
                  try {
                    let res;
                    if (identifier.includes('@')) {
                      res = await axios.get('/api/auth/users', { params: { email: identifier } });
                    } else if (phoneRegex.test(identifier)) {
                      res = await axios.get('/api/auth/users', { params: { phone: identifier } });
                    } else {
                      res = await axios.get('/api/auth/users', { params: { username: identifier } });
                    }
                    const target = res.data?.user;
                    if (!target?._id) throw new Error('User not found');
                    if (memberIds.includes(target._id)) {
                      alert('User is already a member');
                      return;
                    }
                    const addRes = await axios.post(`/api/chatSystem/chats/${selectedChat._id}/add`, { userId: target._id });
                    const updated = addRes.data?.chat;
                    if (updated?._id) {
                      setSelectedChat(updated);
                      setChats(prev => prev.map(c => c._id === updated._id ? updated : c));
                      setShowAddMember(false);
                      setAddInput('');
                    } else {
                      // fallback: update members locally
                      const merged = {
                        ...selectedChat,
                        members: [...(selectedChat.members || []), { _id: target._id, name: target.name, username: target.username, email: target.email }]
                      };
                      setSelectedChat(merged);
                      setChats(prev => prev.map(c => c._id === merged._id ? merged : c));
                      setShowAddMember(false);
                      setAddInput('');
                    }
                  } catch (e) {
                    alert(e.response?.data?.message || e.message || 'Failed to add member');
                  } finally {
                    setAdding(false);
                  }
                }}
              >{adding ? 'Adding…' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Members Modal (read-only) */}
      {showMembers && selectedChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Group Members</h3>
              <button
                className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                onClick={() => setShowMembers(false)}
              >Close</button>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {(selectedChat.members || []).map((m) => {
                const id = typeof m === 'object' ? m._id : m;
                const name = typeof m === 'object' ? (m.name || m.username || m.email || id) : id;
                const meta = typeof m === 'object' ? (m.username || m.email || '') : '';
                const isMe = id === user?._id;
                return (
                  <li key={id} className="py-2">
                    <div className="text-sm text-gray-900 dark:text-white">{name}{isMe ? ' (You)' : ''}</div>
                    {meta ? <div className="text-xs text-gray-500 dark:text-gray-400">{meta}</div> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
