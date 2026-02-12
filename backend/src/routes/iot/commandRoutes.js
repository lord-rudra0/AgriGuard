import express from 'express';
import DeviceCommand from '../../models/DeviceCommand.js';
import { resolveDeviceFromToken } from './utils.js';

const router = express.Router();

router.get('/commands', async (req, res) => {
  try {
    const device = await resolveDeviceFromToken(req);
    if (!device) {
      return res.status(401).json({ message: 'Invalid or unclaimed device token' });
    }

    const now = new Date();
    await DeviceCommand.updateMany(
      {
        userId: device.userId,
        deviceId: device.deviceId,
        status: { $in: ['pending', 'delivered'] },
        expiresAt: { $ne: null, $lt: now }
      },
      { $set: { status: 'expired', completedAt: now, resultMessage: 'Command expired before execution' } }
    );

    const limitRaw = Number(req.query.limit);
    const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 10, 50);

    const commands = await DeviceCommand.find({
      userId: device.userId,
      deviceId: device.deviceId,
      status: 'pending',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    })
      .sort({ issuedAt: 1 })
      .limit(limit);

    if (commands.length > 0) {
      const ids = commands.map((c) => c._id);
      await DeviceCommand.updateMany(
        { _id: { $in: ids }, status: 'pending' },
        { $set: { status: 'delivered', deliveredAt: now } }
      );
    }

    return res.json({
      deviceId: device.deviceId,
      commands: commands.map((c) => ({
        id: String(c._id),
        actuator: c.actuator,
        state: c.state,
        durationSeconds: c.durationSeconds,
        issuedAt: c.issuedAt,
        expiresAt: c.expiresAt
      }))
    });
  } catch (error) {
    console.error('IoT commands fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/commands/:commandId/ack', async (req, res) => {
  try {
    const device = await resolveDeviceFromToken(req);
    if (!device) {
      return res.status(401).json({ message: 'Invalid or unclaimed device token' });
    }

    const { commandId } = req.params;
    const { status, message } = req.body || {};
    if (!['executed', 'failed'].includes(String(status || ''))) {
      return res.status(400).json({ message: "status must be 'executed' or 'failed'" });
    }

    const command = await DeviceCommand.findOne({
      _id: commandId,
      userId: device.userId,
      deviceId: device.deviceId
    });
    if (!command) return res.status(404).json({ message: 'Command not found' });

    command.status = status;
    command.completedAt = new Date();
    command.resultMessage = message ? String(message) : '';
    await command.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${String(device.userId)}`).emit('deviceCommandUpdate', {
        id: String(command._id),
        deviceId: command.deviceId,
        actuator: command.actuator,
        state: command.state,
        status: command.status,
        resultMessage: command.resultMessage,
        completedAt: command.completedAt
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('IoT command ack error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
