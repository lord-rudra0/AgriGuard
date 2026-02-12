import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { normalizeAiText, removeByMessageId, upsertChatToTop } from './chatUtils';

export const useChatState = ({ socket, joinChat, leaveChat, setTyping, user }) => {
  const location = useLocation();
  const phoneRegex = /^\+?[0-9]{7,15}$/;

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
  const [showAddMember, setShowAddMember] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isTyping, setIsTyping] = useState('');
  const [askAIActive, setAskAIActive] = useState(false);
  const [aiLoaderId, setAiLoaderId] = useState(null);
  const [attachedMedia, setAttachedMedia] = useState(null);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  const messagesEndRef = useRef(null);
  const headerMenuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!headerMenuRef.current?.contains(e.target)) setHeaderMenuOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setLoadingChats(true);
    axios.get('/api/chatSystem/chats').then((res) => {
      setChats(res.data.chats || []);
      setLoadingChats(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedChat) return;
    joinChat(selectedChat._id);
    setLoadingMessages(true);
    axios.get(`/api/chatSystem/messages/${selectedChat._id}`).then((res) => {
      setMessages(res.data.messages || []);
      setLoadingMessages(false);
    });
    axios.post(`/api/chatSystem/messages/${selectedChat._id}/seen`).catch(() => {});
    setChats((prev) => prev.map((c) => (c._id === selectedChat._id ? { ...c, unreadCount: 0 } : c)));
    return () => leaveChat(selectedChat._id);
  }, [selectedChat, joinChat, leaveChat]);

  useEffect(() => {
    if (!socket) return;
    const onTyping = ({ chatId, userId, typing, name }) => {
      if (chatId === selectedChat?._id && userId !== user?._id) setIsTyping(typing ? name || 'Someone' : '');
    };
    const onMessage = (message) => {
      setChats((prev) => upsertChatToTop(prev, message.chatId, message, { incrementUnread: message.chatId !== selectedChat?._id }));
      if (message.chatId === selectedChat?._id) {
        setMessages((prev) => [...prev, message]);
        axios.post(`/api/chatSystem/messages/${selectedChat._id}/seen`).catch(() => {});
      }
    };
    const onSeen = ({ chatId, userId: seenUserId }) => {
      if (chatId !== selectedChat?._id) return;
      setMessages((prev) => prev.map((m) => {
        const seenBy = Array.isArray(m.seenBy) ? m.seenBy : [];
        const has = seenBy.some((s) => String((s && s._id) ? s._id : s) === String(seenUserId));
        return has ? m : { ...m, seenBy: [...seenBy, String(seenUserId)] };
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
  }, [socket, selectedChat, user]);

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container || !messagesEndRef.current) return;
    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    if (isNearBottom || messages[messages.length - 1]?.sender?._id === user?._id) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, user]);

  useEffect(() => {
    if (location.state?.askAi && chats.length > 0 && !selectedChat) setSelectedChat(chats[0]);
  }, [location.state, chats, selectedChat]);

  useEffect(() => {
    if (location.state?.askAi && location.state?.autoPrompt && selectedChat) {
      setAskAIActive(true);
      setInput(location.state.autoPrompt);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, selectedChat]);

  useEffect(() => {
    if (!socket || !selectedChat) return;
    if (!input) return setTyping(selectedChat._id, false);
    setTyping(selectedChat._id, true);
    const t = setTimeout(() => setTyping(selectedChat._id, false), 1200);
    return () => clearTimeout(t);
  }, [input, socket, selectedChat, setTyping]);

  useEffect(() => {
    const onMove = () => {};
    const onUp = () => setIsResizing(false);
    if (!isResizing) return;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isResizing]);

  const handleInputChange = (val) => {
    if (/@ASKAI/i.test(val)) {
      setAskAIActive(true);
      val = val.replace(/@ASKAI/gi, '').replace(/\s{2,}/g, ' ').trimStart();
    }
    setInput(val);
  };

  const handleUpload = (file) => {
    if (!file || !file.type?.startsWith('image/')) return alert('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return alert('Image too large (max 5MB)');
    setAttachedMedia({ file, previewUrl: URL.createObjectURL(file) });
  };

  const removeAttachment = () => {
    if (attachedMedia?.previewUrl) URL.revokeObjectURL(attachedMedia.previewUrl);
    setAttachedMedia(null);
  };

  const fileToData = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const [prefix, base64] = String(reader.result).split(',');
      const match = String(prefix).match(/data:(.*);base64/);
      resolve({ dataUrl: reader.result, base64, mimeType: match ? match[1] : (file.type || 'application/octet-stream') });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const addLocalAndBroadcast = (msg, chatId = selectedChat?._id) => {
    setMessages((prev) => [...prev, msg]);
    socket.emit('chat:message', { chatId, message: msg });
    setChats((prev) => upsertChatToTop(prev, chatId, msg));
  };

  const callAiAndPersist = async ({ prompt, image }) => {
    const aiRes = await axios.post('/api/chat/ai', image ? { message: prompt, image } : { message: prompt });
    const aiText = normalizeAiText(aiRes);
    const save = await axios.post('/api/chatSystem/messages', { chatId: selectedChat._id, content: aiText, type: 'ai' });
    return { ...save.data.message };
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedMedia) || !socket || sending || !selectedChat) return;
    setSending(true);
    try {
      let sentMsg = null;
      if (attachedMedia) {
        const { dataUrl, base64, mimeType } = await fileToData(attachedMedia.file);
        const res = await axios.post('/api/chatSystem/messages', { chatId: selectedChat._id, content: input.trim(), type: 'image', mediaUrl: dataUrl, mediaType: mimeType });
        sentMsg = { ...res.data.message, sender: user };
        if (attachedMedia.previewUrl) URL.revokeObjectURL(attachedMedia.previewUrl);
        setAttachedMedia(null);
        setInput('');
        addLocalAndBroadcast(sentMsg);
        if (askAIActive) {
          setSending(false);
          const loader = { _id: `ai_loader_${Date.now()}`, chatId: selectedChat._id, type: 'ai_loader', content: 'ASKAI is analyzing your image...' };
          setAiLoaderId(loader._id);
          setMessages((prev) => [...prev, loader]);
          try { addLocalAndBroadcast(await callAiAndPersist({ prompt: sentMsg.content || 'Analyze this image for crop issues and recommendations.', image: { data: base64, mimeType } })); }
          catch (err) { console.error('AI error', err); }
          finally { setMessages((prev) => removeByMessageId(prev, loader._id)); setAiLoaderId(null); }
        }
      } else {
        const res = await axios.post('/api/chatSystem/messages', { chatId: selectedChat._id, content: input });
        setInput('');
        sentMsg = { ...res.data.message, sender: user };
        addLocalAndBroadcast(sentMsg);
      }

      if (askAIActive && !attachedMedia) {
        setSending(false);
        const loader = { _id: `ai_loader_${Date.now()}`, chatId: selectedChat._id, type: 'ai_loader', content: 'ASKAI is responding...' };
        setAiLoaderId(loader._id);
        setMessages((prev) => [...prev, loader]);
        try { addLocalAndBroadcast(await callAiAndPersist({ prompt: sentMsg.content || '' })); }
        catch (err) { console.error('AI error', err); }
        finally { setMessages((prev) => removeByMessageId(prev, loader._id)); setAiLoaderId(null); }
      }
    } finally {
      setSending(false);
      setAskAIActive(false);
    }
  };

  const deleteChat = async () => {
    if (!selectedChat || !confirm('Delete this chat and all its messages?')) return;
    await axios.delete(`/api/chatSystem/chats/${selectedChat._id}`);
    setChats((prev) => prev.filter((c) => c._id !== selectedChat._id));
    setSelectedChat(null);
  };

  const deleteMessage = async (messageId) => {
    try { await axios.delete(`/api/chatSystem/messages/${messageId}`); setMessages((prev) => removeByMessageId(prev, messageId)); if (activeMessageId === messageId) setActiveMessageId(null); }
    catch (e) { alert(e.response?.data?.message || 'Failed to delete message'); }
  };

  const handleMouseDown = (e) => { setIsResizing(true); e.preventDefault(); };

  const createChat = async () => {
    setCreating(true);
    try {
      let members = [];
      if (newChatType !== 'group') {
        const res = await axios.get('/api/auth/users', { params: newChatUserInput.includes('@') ? { email: newChatUserInput } : { username: newChatUserInput } });
        if (!res.data.user) throw new Error('User not found');
        members = [res.data.user._id];
      }
      const chatRes = await axios.post('/api/chatSystem/chats', { type: newChatType, name: newChatType === 'group' ? newChatName : undefined, members });
      setChats((prev) => [chatRes.data.chat, ...prev]);
      setSelectedChat(chatRes.data.chat);
      setShowNewChat(false);
      setNewChatName('');
      setNewChatUserInput('');
    } catch (e) { alert(e.response?.data?.message || e.message || 'Failed to create chat'); }
    finally { setCreating(false); }
  };

  const addMember = async () => {
    if (!selectedChat) return;
    const identifier = addInput.trim();
    if (!identifier) return;
    if (identifier === user?.email || identifier === user?.username || identifier === user?.phone) return alert('You cannot add yourself');
    const memberIds = (selectedChat.members || []).map((m) => (typeof m === 'object' ? m._id : m));
    setAdding(true);
    try {
      const params = identifier.includes('@') ? { email: identifier } : phoneRegex.test(identifier) ? { phone: identifier } : { username: identifier };
      const res = await axios.get('/api/auth/users', { params });
      const target = res.data?.user;
      if (!target?._id) throw new Error('User not found');
      if (memberIds.includes(target._id)) return alert('User is already a member');
      const addRes = await axios.post(`/api/chatSystem/chats/${selectedChat._id}/add`, { userId: target._id });
      const updated = addRes.data?.chat || { ...selectedChat, members: [...(selectedChat.members || []), { _id: target._id, name: target.name, username: target.username, email: target.email }] };
      setSelectedChat(updated);
      setChats((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      setShowAddMember(false);
      setAddInput('');
    } catch (e) { alert(e.response?.data?.message || e.message || 'Failed to add member'); }
    finally { setAdding(false); }
  };

  return {
    chats, setChats, showNewChat, setShowNewChat, newChatName, setNewChatName, newChatType, setNewChatType, newChatUserInput, setNewChatUserInput,
    creating, selectedChat, setSelectedChat, messages, input, sending, loadingChats, loadingMessages, showAddMember, setShowAddMember, addInput,
    setAddInput, adding, showMembers, setShowMembers, headerMenuOpen, setHeaderMenuOpen, mounted, isTyping, askAIActive, setAskAIActive, aiLoaderId,
    attachedMedia, activeMessageId, setActiveMessageId, isResizing, messagesEndRef, headerMenuRef, handleInputChange, handleUpload, removeAttachment,
    sendMessage, deleteChat, deleteMessage, handleMouseDown, createChat, addMember
  };
};
