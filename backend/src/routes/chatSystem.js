import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Multer setup for image uploads
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image uploads are allowed'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Initialize Gemini AI with error handling
let genAI;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  } else {
    console.warn('[chatSystem] Missing GEMINI_API_KEY in environment. AI features will be disabled.');
  }
} catch (error) {
  console.error('[chatSystem] Failed to initialize GoogleGenerativeAI:', error.message);
}

// Create a new chat (group or 1-1)
router.post('/chats', authenticateToken, async (req, res) => {
  try {
    const { type, name, members = [], isAIGroup } = req.body;
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
    .populate('members', 'name username email')
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name email' } })
    .sort('-updatedAt')
    .lean();
  // Compute unread per chat (messages not in seenBy)
  const chatIds = chats.map(c => c._id);
  const Message = (await import('../models/Message.js')).default;
  const unreadByChat = await Message.aggregate([
    { $match: { chatId: { $in: chatIds }, seenBy: { $ne: req.user._id } } },
    { $group: { _id: '$chatId', count: { $sum: 1 } } }
  ]);
  const unreadMap = new Map(unreadByChat.map(u => [String(u._id), u.count]));
  const enrich = chats.map(c => ({ ...c, unreadCount: unreadMap.get(String(c._id)) || 0 }));
  res.json({ chats: enrich });
});

// Upload image for chat message
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ url, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size });
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

// Ask AI (Gemini) when @ASKAI is mentioned
router.post('/askai', authenticateToken, async (req, res) => {
  try {
    const { chatId, content, mediaUrl, mediaType } = req.body;
    if (!chatId || !content) return res.status(400).json({ message: 'chatId and content are required' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'GEMINI_API_KEY not configured' });

    const system = `You are ASKAI, an agronomy assistant specialized in mushrooms. Be concise, factual, and actionable. If safety or contamination risk exists, call it out.`;
    const userPrompt = content.replace(/@ASKAI/gi, '').trim();

    // Build parts with optional inline image
    const parts = [{ text: userPrompt || content }];
    try {
      if (mediaUrl) {
        // Accept '/uploads/filename' or 'uploads/filename'
        const localPrefix = mediaUrl.startsWith('/uploads') ? '/uploads' : (mediaUrl.startsWith('uploads') ? 'uploads' : null);
        if (localPrefix) {
          const filename = mediaUrl.replace(/^\/?uploads\/?/, '');
          const filePath = path.resolve(process.cwd(), 'uploads', filename);
          if (fs.existsSync(filePath)) {
            const buf = fs.readFileSync(filePath);
            const b64 = buf.toString('base64');
            const mt = mediaType || ({
              '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif'
            })[path.extname(filename).toLowerCase()] || 'image/jpeg';
            parts.push({ inlineData: { mimeType: mt, data: b64 } });
          }
        }
      }
    } catch (_) {
      // ignore inline image failure; proceed with text-only
    }

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: system }] },
          { role: 'user', parts }
        ]
      })
    });
    if (!resp.ok) {
      const t = await resp.text();
      return res.status(502).json({ message: 'Gemini API error', details: t });
    }
    const data = await resp.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response right now.';

    const msg = new Message({
      chatId,
      sender: req.user._id, // stored as sender for schema; frontend treats type==='ai' specially
      content: aiText,
      type: 'ai'
    });
    await msg.save();
    await Chat.findByIdAndUpdate(chatId, { lastMessage: msg._id, updatedAt: new Date() });
    res.status(201).json({ message: msg });
  } catch (e) {
    res.status(500).json({ message: 'Failed to ask AI' });
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

// Mark messages as seen in a chat
router.post('/messages/:chatId/seen', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  const Message = (await import('../models/Message.js')).default;
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
  const Message = (await import('../models/Message.js')).default;
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
