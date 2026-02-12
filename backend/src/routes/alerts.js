import express from 'express';
import jwt from 'jsonwebtoken';
import Alert from '../models/Alert.js';
import { listIncidentPlaybooks, getIncidentPlaybook, buildIncidentPlaybookRun } from '../services/incidentPlaybooks.js';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// GET /api/alerts - list alerts (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { severity, type, isRead, isResolved, limit = 50, page = 1 } = req.query;

    const query = { userId };
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (isResolved !== undefined) query.isResolved = isResolved === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Alert.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Alert.countDocuments(query)
    ]);

    res.json({ success: true, items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Error fetching alerts', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/alerts/playbooks - list incident playbooks
router.get('/playbooks', authenticateToken, async (_req, res) => {
  return res.json({ success: true, playbooks: listIncidentPlaybooks() });
});

// GET /api/alerts/playbooks/:id - get one incident playbook
router.get('/playbooks/:id', authenticateToken, async (req, res) => {
  const playbook = getIncidentPlaybook(req.params.id);
  if (!playbook) return res.status(404).json({ success: false, message: 'Playbook not found' });
  return res.json({ success: true, playbook });
});

// GET /api/alerts/:id/playbook - build recommended playbook run for alert
router.get('/:id/playbook', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const alert = await Alert.findOne({ _id: req.params.id, userId }).lean();
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    const run = buildIncidentPlaybookRun(alert, req.query.playbookId ? String(req.query.playbookId) : null);
    return res.json({ success: true, alertId: String(alert._id), ...run });
  } catch (err) {
    console.error('Error fetching alert playbook', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/alerts/:id/read - mark alert read/unread
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { isRead = true } = req.body;

    const alert = await Alert.findOneAndUpdate({ _id: id, userId }, { isRead }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    res.json({ success: true, alert });
  } catch (err) {
    console.error('Error updating alert read state', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/alerts/:id/resolve - resolve/unresolve
router.put('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { isResolved = true, actionTaken } = req.body;

    const update = { isResolved };
    if (isResolved) {
      update.resolvedAt = new Date();
      update.resolvedBy = userId;
      if (actionTaken) update.actionTaken = actionTaken;
    } else {
      update.resolvedAt = null;
      update.resolvedBy = null;
      if (actionTaken !== undefined) update.actionTaken = actionTaken;
    }

    const alert = await Alert.findOneAndUpdate({ _id: id, userId }, update, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    res.json({ success: true, alert });
  } catch (err) {
    console.error('Error resolving alert', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/alerts/:id - delete an alert
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await Alert.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'Alert not found' });

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting alert', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/alerts/read-all - mark all alerts as read
router.put('/actions/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    await Alert.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking all read', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/alerts/resolved - delete all resolved alerts
router.delete('/actions/clear-resolved', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    await Alert.deleteMany({ userId, isResolved: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing resolved', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
