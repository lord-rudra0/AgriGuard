import express from 'express';
import crypto from 'crypto';
import Device from '../models/Device.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const generateToken = () => crypto.randomBytes(32).toString('hex');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateDeviceId = () => {
  const rand = crypto.randomBytes(4).toString('hex');
  return `dev_${Date.now().toString(36)}_${rand}`;
};

// @route   GET /api/devices
// @desc    List devices for current user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user._id })
      .select('name deviceId active lastSeenAt createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ devices });
  } catch (error) {
    console.error('List devices error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/devices
// @desc    Create a device and return a device token (shown once)
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, deviceId } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ message: 'Device name is required' });
    }

    const finalDeviceId = deviceId && String(deviceId).trim()
      ? String(deviceId).trim()
      : generateDeviceId();

    const token = generateToken();
    const tokenHash = hashToken(token);
    const tokenLast4 = token.slice(-4);

    const created = await Device.create({
      userId: req.user._id,
      name: String(name).trim(),
      deviceId: finalDeviceId,
      tokenHash,
      tokenLast4
    });

    res.status(201).json({
      device: {
        id: created._id,
        name: created.name,
        deviceId: created.deviceId,
        active: created.active,
        createdAt: created.createdAt
      },
      deviceToken: token
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Device ID already exists' });
    }
    console.error('Create device error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/devices/:deviceId/rotate
// @desc    Rotate device token and return new token (shown once)
// @access  Private
router.post('/:deviceId/rotate', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await Device.findOne({ userId: req.user._id, deviceId });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    const token = generateToken();
    device.tokenHash = hashToken(token);
    device.tokenLast4 = token.slice(-4);
    await device.save();

    res.json({
      deviceId: device.deviceId,
      deviceToken: token
    });
  } catch (error) {
    console.error('Rotate device token error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
