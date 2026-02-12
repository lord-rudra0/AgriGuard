import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const {
      deviceId,
      sensorType,
      interval = 'hourly',
      startDate,
      endDate
    } = req.query;

    const query = {
      'metadata.userId': req.user._id,
      interval
    };

    if (deviceId) query['metadata.deviceId'] = deviceId;
    if (sensorType) query['metadata.sensorType'] = sensorType;

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const { default: SensorHistory } = await import('../../models/SensorHistory.js');
    const history = await SensorHistory.find(query)
      .sort({ startTime: 1 })
      .lean();

    res.json({
      success: true,
      history,
      count: history.length,
      params: { interval, sensorType, deviceId }
    });
  } catch (error) {
    console.error('Get sensor history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
