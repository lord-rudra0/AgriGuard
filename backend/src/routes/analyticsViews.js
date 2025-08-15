import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import AnalyticsView from '../models/AnalyticsView.js';

const router = express.Router();

// GET saved views
router.get('/', authenticateToken, async (req, res) => {
  const views = await AnalyticsView.find({ userId: req.user._id }).sort({ updatedAt: -1 }).lean();
  res.json({ views });
});

// POST create view
router.post('/', authenticateToken, async (req, res) => {
  const { name, timeframe = '24h', types = [] } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const view = await AnalyticsView.create({ userId: req.user._id, name, timeframe, types });
  res.status(201).json({ view });
});

// DELETE view
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await AnalyticsView.deleteOne({ _id: id, userId: req.user._id });
  res.json({ ok: true });
});

export default router;
