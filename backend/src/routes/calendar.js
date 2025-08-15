import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import CalendarEvent from '../models/CalendarEvent.js';

const router = express.Router();

// List events in a time range (default: next 30 days)
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const { start, end, limit = 500 } = req.query;
    const startAt = start ? new Date(start) : new Date();
    const endAt = end ? new Date(end) : new Date(Date.now() + 30 * 24 * 3600 * 1000);

    const events = await CalendarEvent.find({
      userId: req.user._id,
      startAt: { $gte: startAt, $lte: endAt },
    })
      .sort({ startAt: 1 })
      .limit(Math.min(Number(limit) || 500, 1000))
      .lean();

    res.json({ events });
  } catch (e) {
    console.error('List events error', e);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Create event
router.post('/events', authenticateToken, async (req, res) => {
  try {
    const { title, description, roomId, startAt, endAt, reminders } = req.body || {};
    if (!title || !startAt) return res.status(400).json({ message: 'title and startAt are required' });

    const doc = await CalendarEvent.create({
      userId: req.user._id,
      title,
      description: description || '',
      roomId: roomId || null,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : undefined,
      reminders: Array.isArray(reminders) ? reminders.filter(r => r && typeof r.minutesBefore === 'number') : [],
    });

    res.status(201).json({ event: doc });
  } catch (e) {
    console.error('Create event error', e);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// Update event
router.put('/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, roomId, startAt, endAt, reminders } = req.body || {};

    const doc = await CalendarEvent.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        ...(title != null ? { title } : {}),
        ...(description != null ? { description } : {}),
        ...(roomId !== undefined ? { roomId } : {}),
        ...(startAt ? { startAt: new Date(startAt) } : {}),
        ...(endAt ? { endAt: new Date(endAt) } : { endAt: undefined }),
        ...(Array.isArray(reminders)
          ? { reminders: reminders.filter(r => r && typeof r.minutesBefore === 'number') }
          : {}),
      },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: 'Event not found' });
    res.json({ event: doc });
  } catch (e) {
    console.error('Update event error', e);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// Delete event
router.delete('/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CalendarEvent.deleteOne({ _id: id, userId: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Event not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete event error', e);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

export default router;
