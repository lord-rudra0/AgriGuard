import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Recipe from '../models/Recipe.js';

const router = express.Router();

// List recipes
router.get('/', authenticateToken, async (req, res) => {
  const items = await Recipe.find({ userId: req.user._id }).sort({ updatedAt: -1 }).lean();
  res.json({ recipes: items });
});

// Create recipe
router.post('/', authenticateToken, async (req, res) => {
  const { name, strain, phases = [], notes } = req.body || {};
  if (!name || !strain || !Array.isArray(phases) || phases.length === 0) {
    return res.status(400).json({ message: 'name, strain, and phases are required' });
  }
  const created = await Recipe.create({ userId: req.user._id, name, strain, phases, notes });
  res.status(201).json({ recipe: created });
});

// Update recipe
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, strain, phases, notes } = req.body || {};
  const update = {};
  if (name) update.name = name;
  if (strain) update.strain = strain;
  if (Array.isArray(phases)) update.phases = phases;
  if (notes !== undefined) update.notes = notes;
  const updated = await Recipe.findOneAndUpdate({ _id: id, userId: req.user._id }, { $set: update }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json({ recipe: updated });
});

// Delete recipe
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await Recipe.deleteOne({ _id: id, userId: req.user._id });
  res.json({ ok: true });
});

export default router;
