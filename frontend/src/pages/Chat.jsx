
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import Avatar from '../components/chat/Avatar';
import MessageBubble from '../components/chat/MessageBubble';
import Composer from '../components/chat/Composer';
import { Plus, Search, Settings, Star } from 'lucide-react';

const Chat = () => {
  const { socket } = useSocket();
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
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch chat list
  useEffect(() => {
    setLoadingChats(true);
    axios.get('/api/chatSystem/chats').then(res => {
      setChats(res.data.chats || []);
      setLoadingChats(false);
    });
  }, []);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    setLoadingMessages(true);
    axios.get(`/api/chatSystem/messages/${selectedChat._id}`).then(res => {
      setMessages(res.data.messages || []);
      setLoadingMessages(false);
    });
  }, [selectedChat]);

  // Real-time: listen for new messages
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      if (msg.chatId === selectedChat?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on('newMessage', handler);
    return () => socket.off('newMessage', handler);
  }, [socket, selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || !socket || sending || !selectedChat) return;
    setSending(true);
    try {
      const res = await axios.post('/api/chatSystem/messages', {
        chatId: selectedChat._id,
        content: text,
      });
      // Optimistically add message
      setMessages((prev) => [...prev, res.data.message]);
      socket.emit('sendMessage', { ...res.data.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex transition-colors duration-300">
      {/* Sidebar: Chat list */}
      <aside className="w-80 backdrop-blur-xl bg-white/60 dark:bg-gray-800/50 border-r border-white/40 dark:border-gray-700/40 flex flex-col">        
        <div className="p-4 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/70 dark:bg-gray-700/60 border border-gray-200/60 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" placeholder="Search chats" />
          </div>
          <button
            className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700"
            onClick={() => setShowNewChat(true)}
            title="New chat"
            aria-label="New chat"
          >
            <Plus className="w-5 h-5" />
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
          <ul className="flex-1 overflow-y-auto px-2 pb-4 space-y-2">
            {chats.map((chat) => (
              <li key={chat._id}>
                <button
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors ${selectedChat?._id === chat._id ? 'bg-primary-100/80 dark:bg-primary-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700/40'}`}
                  onClick={() => setSelectedChat(chat)}
                  aria-label={`Open chat ${chat.name || 'Direct chat'}`}
                >
                  <Avatar name={chat.name || chat.members?.map(m => m.name).filter(n => n !== user?.name).join(', ') || 'Chat'} size={40} online={true} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">{chat.name || chat.members?.map(m => m.name).filter(n => n !== user?.name).join(', ') || 'Chat'}</div>
                      <Star className="w-4 h-4 text-yellow-400 opacity-70" title="Pin" />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{chat.type === 'group' ? 'Group' : 'Direct'}</div>
                  </div>
                  <span className="inline-flex items-center justify-center text-xs rounded-full px-2 py-0.5 bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200" aria-label="unread count">0</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
      {/* Main chat window */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col p-6">
          {selectedChat ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={selectedChat.name || selectedChat.members?.map(m => m.name).filter(n => n !== user?.name).join(', ') || 'Chat'} size={44} online={true} />
                <div className="flex-1">
                  <div className="font-bold text-xl text-gray-900 dark:text-white">{selectedChat.name || selectedChat.members?.map(m => m.name).filter(n => n !== user?.name).join(', ') || 'Chat'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Online • Typing…</div>
                </div>
                <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50" aria-label="Settings"><Settings className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto rounded-2xl p-4 mb-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/40 shadow-sm">
                {loadingMessages ? (
                  <div className="text-gray-500 dark:text-gray-400 text-center mt-8">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400 text-center mt-8">No messages yet.</div>
                ) : (
                  <ul className="space-y-3">
                    {messages.map((msg, idx) => (
                      <li key={msg._id || idx}>
                        <MessageBubble
                          me={msg.sender?._id === user?._id}
                          name={msg.sender?.name}
                          text={msg.content}
                          time={msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                        />
                      </li>
                    ))}
                    <div ref={messagesEndRef} />
                  </ul>
                )}
              </div>
              <Composer onSend={sendMessage} disabled={!socket || sending || !selectedChat} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">Select a chat to start messaging</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Chat;
