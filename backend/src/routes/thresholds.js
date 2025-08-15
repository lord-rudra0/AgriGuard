import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Threshold from '../models/Threshold.js';

const router = express.Router();

// List thresholds (optionally filter by room or metric)
router.get('/', authenticateToken, async (req, res) => {
  const { roomId, metric } = req.query;
  const q = { userId: req.user._id };
  if (roomId) q.roomId = roomId;
  if (metric) q.metric = metric;
  const items = await Threshold.find(q).sort({ updatedAt: -1 }).lean();
  res.json({ thresholds: items });
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  const { name, metric, roomId = null, min = null, max = null, severity = 'warning', enabled = true, notes } = req.body || {};
  if (!name || !metric) return res.status(400).json({ message: 'name and metric required' });
  const created = await Threshold.create({ userId: req.user._id, name, metric, roomId, min, max, severity, enabled, notes });
  res.status(201).json({ threshold: created });
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const allowed = ['name','metric','roomId','min','max','severity','enabled','notes'];
  const update = {};
  for (const k of allowed) if (k in req.body) update[k] = req.body[k];
  const updated = await Threshold.findOneAndUpdate({ _id: id, userId: req.user._id }, { $set: update }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json({ threshold: updated });
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await Threshold.deleteOne({ _id: id, userId: req.user._id });
  res.json({ ok: true });
});

export default router;
