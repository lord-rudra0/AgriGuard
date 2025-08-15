import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Recipe from '../models/Recipe.js';
import RoomPhase from '../models/RoomPhase.js';

const router = express.Router();

// GET current phase for a room
router.get('/:roomId', authenticateToken, async (req, res) => {
  const item = await RoomPhase.findOne({ userId: req.user._id, roomId: req.params.roomId }).lean();
  res.json({ phase: item });
});

// POST apply a recipe to a room (start at phase 0)
router.post('/apply', authenticateToken, async (req, res) => {
  const { roomId, recipeId } = req.body || {};
  if (!roomId || !recipeId) return res.status(400).json({ message: 'roomId and recipeId required' });
  const recipe = await Recipe.findOne({ _id: recipeId, userId: req.user._id }).lean();
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  if (!recipe.phases?.length) return res.status(400).json({ message: 'Recipe has no phases' });
  const p0 = recipe.phases[0];

  const doc = await RoomPhase.findOneAndUpdate(
    { userId: req.user._id, roomId },
    {
      $set: {
        recipeId: recipe._id,
        recipeName: recipe.name,
        strain: recipe.strain,
        active: {
          name: p0.name,
          index: 0,
          startedAt: new Date(),
          durationHours: p0.durationHours,
          setpoints: p0.setpoints,
        },
      },
    },
    { new: true, upsert: true }
  );

  // Emit over socket
  const io = req.app.get('io');
  io.to(`user_${req.user._id}`).emit('phaseChanged', { roomId, action: 'applied', phase: doc });

  res.status(201).json({ phase: doc });
});

// POST advance phase (index +1) for a room
router.post('/advance', authenticateToken, async (req, res) => {
  const { roomId } = req.body || {};
  if (!roomId) return res.status(400).json({ message: 'roomId required' });
  const rp = await RoomPhase.findOne({ userId: req.user._id, roomId });
  if (!rp) return res.status(404).json({ message: 'No active phase for room' });
  const recipe = await Recipe.findOne({ _id: rp.recipeId, userId: req.user._id }).lean();
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

  const nextIdx = (rp.active?.index ?? -1) + 1;
  if (nextIdx >= recipe.phases.length) {
    // Completed all phases
    await RoomPhase.deleteOne({ _id: rp._id });
    const io = req.app.get('io');
    io.to(`user_${req.user._id}`).emit('phaseChanged', { roomId, action: 'completed' });
    return res.json({ completed: true });
  }

  const np = recipe.phases[nextIdx];
  rp.active = {
    name: np.name,
    index: nextIdx,
    startedAt: new Date(),
    durationHours: np.durationHours,
    setpoints: np.setpoints,
  };
  await rp.save();

  const io = req.app.get('io');
  io.to(`user_${req.user._id}`).emit('phaseChanged', { roomId, action: 'advanced', phase: rp });

  res.json({ phase: rp });
});

export default router;
