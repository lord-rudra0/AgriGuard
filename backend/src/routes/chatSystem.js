import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

const router = express.Router();

// Note: File upload functionality removed for Vercel serverless compatibility
// For file uploads, use Vercel Blob or external storage services

// List chats for the authenticated user
router.get('/chats', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate('members', 'name username email')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name email' } })
      .sort('-updatedAt')
      .lean();

    res.json({ chats });
  } catch (e) {
    console.error('List chats error', e);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
});

// Create a new chat (group or 1-1)
router.post('/chats', authenticateToken, async (req, res) => {
  try {
    const { type, name, members = [] } = req.body;
    // Basic validation
    if (!type || !Array.isArray(members)) {
      return res.status(400).json({ message: 'Invalid chat data' });
    }
    // For one-to-one chats, at least one other member is required
    if (type === 'one-to-one' && members.length < 1) {
      return res.status(400).json({ message: 'Invalid chat data' });
    }
    // For 1-1, check if chat already exists
    if (type === 'one-to-one') {
      const existing = await Chat.findOne({
        type: 'one-to-one',
        members: { $all: [...members, req.user._id], $size: 2 }
      });
      if (existing) return res.json({ chat: existing });
    }
    const chat = new Chat({
      type,
      name: type === 'group' ? name : undefined,
      members: [...new Set([...members, req.user._id.toString()])],
      admins: [req.user._id],
      createdBy: req.user._id
    });
    await chat.save();
    res.status(201).json({ chat });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create chat' });
  }
});

// Get messages for a chat (pagination)
router.get('/messages/:chatId', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { limit = 50, before } = req.query;
  const query = { chatId };
  if (before) query._id = { $lt: before };
  const messages = await Message.find(query)
    .sort('-createdAt')
    .limit(Number(limit))
    .populate('sender', 'name email');
  res.json({ messages: messages.reverse() });
});

// Create a new message (text or image)
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId, content, type = 'text', mediaUrl, mediaType } = req.body;
    if (!chatId) return res.status(400).json({ message: 'chatId is required' });
    if (!content && !mediaUrl) return res.status(400).json({ message: 'content or mediaUrl required' });

    // Create message
    const message = await Message.create({
      chatId,
      sender: req.user._id,
      content: content || '',
      type,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
    });

    // Update chat lastMessage and updatedAt
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id, updatedAt: new Date() });

    // Populate sender for response
    const populated = await Message.findById(message._id).populate('sender', 'name email');

    // Emit to chat room via Socket.IO (exclude sender to avoid duplicate on client)
    try {
      const io = req.app.get('io');
      if (io) io.to(`chat_${chatId}`).except(`user_${String(req.user._id)}`).emit('chat:message', populated);
    } catch (_) {}

    res.status(201).json({ message: populated });
  } catch (e) {
    console.error('Create message error', e);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Mark messages as seen in a chat
router.post('/messages/:chatId/seen', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  await Message.updateMany(
    { chatId, seenBy: { $ne: req.user._id } },
    { $addToSet: { seenBy: req.user._id } }
  );
  try {
    // Emit socket event to others in the chat room
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${chatId}`).emit('chat:seen', { chatId, userId: String(req.user._id) });
    }
  } catch (_) {}
  res.json({ success: true });
});

// React to a message
router.post('/messages/:messageId/react', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  await Message.findByIdAndUpdate(messageId, {
    $pull: { reactions: { user: req.user._id } }
  });
  const updated = await Message.findByIdAndUpdate(
    messageId,
    { $push: { reactions: { user: req.user._id, emoji } } },
    { new: true }
  ).populate('sender', 'name');
  res.json({ message: updated });
});

// Group management: add/remove users, rename
router.post('/chats/:chatId/add', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;
  await Chat.findByIdAndUpdate(chatId, { $addToSet: { members: userId } });
  const updated = await Chat.findById(chatId)
    .populate('members', 'name username email')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name email' } });
  res.json({ success: true, chat: updated });
});
router.post('/chats/:chatId/remove', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;
  await Chat.findByIdAndUpdate(chatId, { $pull: { members: userId } });
  res.json({ success: true });
});
router.post('/chats/:chatId/rename', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { name } = req.body;
  if (name && name.trim()) {
    await Chat.findByIdAndUpdate(chatId, { name: name.trim() });
  } else {
    await Chat.findByIdAndUpdate(chatId, { $unset: { name: 1 } });
  }
  res.json({ success: true });
});

// Delete chat (group: admin/creator; direct: any member)
router.delete('/chats/:chatId', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  const isMember = chat.members.map(String).includes(String(req.user._id));
  if (!isMember) return res.status(403).json({ message: 'Not a member of this chat' });
  const isAdmin = chat.type === 'group' && (chat.admins.map(String).includes(String(req.user._id)) || String(chat.createdBy) === String(req.user._id));
  if (chat.type === 'group' && !isAdmin) {
    return res.status(403).json({ message: 'Only group admin can delete the chat' });
  }
  await Message.deleteMany({ chatId });
  await chat.deleteOne();
  res.json({ success: true });
});

// Delete a message (sender or group admin)
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
  const { messageId } = req.params;
  const msg = await Message.findById(messageId);
  if (!msg) return res.status(404).json({ message: 'Message not found' });
  const chat = await Chat.findById(msg.chatId);
  if (!chat) return res.status(404).json({ message: 'Chat not found' });
  const isSender = String(msg.sender) === String(req.user._id);
  const isAdmin = chat.type === 'group' && (chat.admins.map(String).includes(String(req.user._id)) || String(chat.createdBy) === String(req.user._id));
  if (!isSender && !isAdmin) return res.status(403).json({ message: 'Not allowed to delete this message' });

  const wasLast = String(chat.lastMessage) === String(messageId);
  await msg.deleteOne();

  if (wasLast) {
    const latest = await Message.find({ chatId: chat._id }).sort('-createdAt').limit(1);
    await Chat.findByIdAndUpdate(chat._id, { lastMessage: latest[0]?._id || null });
  }

  res.json({ success: true });
});

export default router;
