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

const getAdminSecret = () => process.env.DEVICE_FACTORY_SECRET || '';

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
      tokenLast4,
      claimedAt: new Date()
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

// @route   POST /api/devices/factory
// @desc    Create factory device with one-time factory token (admin secret required)
// @access  Protected by admin secret
router.post('/factory', async (req, res) => {
  try {
    const adminSecret = getAdminSecret();
    if (!adminSecret) {
      return res.status(503).json({ message: 'DEVICE_FACTORY_SECRET not set on server' });
    }
    const provided = req.headers['x-admin-secret'];
    if (!provided || String(provided) !== String(adminSecret)) {
      return res.status(401).json({ message: 'Invalid admin secret' });
    }

    const { name, deviceId } = req.body || {};
    const finalDeviceId = deviceId && String(deviceId).trim()
      ? String(deviceId).trim()
      : generateDeviceId();

    const factoryToken = generateToken();
    const factoryTokenHash = hashToken(factoryToken);

    const created = await Device.create({
      name: String(name || 'AgriGuard Device').trim(),
      deviceId: finalDeviceId,
      factoryTokenHash,
      active: true
    });

    res.status(201).json({
      device: {
        id: created._id,
        name: created.name,
        deviceId: created.deviceId,
        active: created.active,
        createdAt: created.createdAt
      },
      factoryToken
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Device ID already exists' });
    }
    console.error('Factory device create error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/devices/claim
// @desc    Claim a factory device and receive a device token
// @access  Private
router.post('/claim', authenticateToken, async (req, res) => {
  try {
    const { factoryToken, name } = req.body || {};
    if (!factoryToken) {
      return res.status(400).json({ message: 'factoryToken is required' });
    }

    const factoryTokenHash = hashToken(factoryToken);
    const device = await Device.findOne({ factoryTokenHash, active: true });
    if (!device) {
      return res.status(404).json({ message: 'Invalid or already claimed factory token' });
    }
    if (device.userId) {
      return res.status(409).json({ message: 'Device already claimed' });
    }

    const token = generateToken();
    device.tokenHash = hashToken(token);
    device.tokenLast4 = token.slice(-4);
    device.userId = req.user._id;
    device.claimedAt = new Date();
    if (name && String(name).trim()) {
      device.name = String(name).trim();
    }
    device.factoryTokenHash = undefined;
    await device.save();

    res.json({
      device: {
        id: device._id,
        name: device.name,
        deviceId: device.deviceId,
        active: device.active,
        createdAt: device.createdAt
      },
      deviceToken: token
    });
  } catch (error) {
    console.error('Claim device error:', error);
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

// @route   DELETE /api/devices/:deviceId
// @desc    Delete a device owned by the user
// @access  Private
router.delete('/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await Device.findOne({ userId: req.user._id, deviceId });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    await Device.deleteOne({ _id: device._id });
    res.json({ success: true, message: 'Device deleted' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
