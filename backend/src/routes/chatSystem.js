import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new chat (group or 1-1)
router.post('/chats', authenticateToken, async (req, res) => {
  try {
    const { type, name, members, isAIGroup } = req.body;
    if (!type || !Array.isArray(members) || members.length < 1) {
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
      createdBy: req.user._id,
      isAIGroup: !!isAIGroup
    });
    await chat.save();
    res.status(201).json({ chat });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create chat' });
  }
});

// Get all chats for user
router.get('/chats', authenticateToken, async (req, res) => {
  const chats = await Chat.find({ members: req.user._id })
    .populate('members', 'name email')
    .populate('lastMessage')
    .sort('-updatedAt');
  res.json({ chats });
});

// Send a message (text/media/AI)
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId, content, type, mediaUrl, mediaType, replyTo } = req.body;
    if (!chatId || (!content && !mediaUrl)) {
      return res.status(400).json({ message: 'Missing content or media' });
    }
    const msg = new Message({
      chatId,
      sender: req.user._id,
      content,
      type: type || (mediaUrl ? 'image' : 'text'),
      mediaUrl,
      mediaType,
      replyTo
    });
    await msg.save();
    await Chat.findByIdAndUpdate(chatId, { lastMessage: msg._id, updatedAt: new Date() });
    res.status(201).json({ message: msg });
  } catch (e) {
    res.status(500).json({ message: 'Failed to send message' });
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

// Group management: add/remove users, rename
router.post('/chats/:chatId/add', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;
  await Chat.findByIdAndUpdate(chatId, { $addToSet: { members: userId } });
  res.json({ success: true });
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
  await Chat.findByIdAndUpdate(chatId, { name });
  res.json({ success: true });
});

export default router;
