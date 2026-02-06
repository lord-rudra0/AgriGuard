import express from 'express';
import SensorData from '../models/SensorData.js';
import Alert from '../models/Alert.js';
import UserSettings from '../models/UserSettings.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/sensors/data
// @desc    Get sensor data for user
// @access  Private
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const {
      sensorType,
      startDate,
      endDate,
      limit = 50,
      page = 1
    } = req.query;

    const query = { userId: req.user._id };

    if (sensorType) {
      query.sensorType = sensorType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const data = await SensorData.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await SensorData.countDocuments(query);

    res.json({
      data,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get sensor data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST /api/sensors/data
// @desc    Add sensor data (for ESP32 or external devices)
// @access  Private
router.post('/data', authenticateToken, async (req, res) => {
  try {
    const { deviceId, readings } = req.body;

    if (!deviceId || !readings || !Array.isArray(readings)) {
      return res.status(400).json({ message: 'Device ID and readings array are required' });
    }

    const sensorDataArray = readings.map(reading => ({
      userId: req.user._id,
      deviceId,
      sensorType: reading.type,
      value: reading.value,
      unit: reading.unit,
      location: reading.location,
      status: determineStatus(reading.type, reading.value),
      metadata: reading.metadata || {}
    }));

    const savedData = await SensorData.insertMany(sensorDataArray);

    // Check for alerts (respect per-user debounce)
    const settings = await UserSettings.findOne({ userId: req.user._id }).lean();
    const alerts = await checkAndCreateAlerts(
      req.user._id,
      savedData,
      settings?.system?.alertDebounceMs
    );

    // Emit live updates via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Create a combined sensor data object for the dashboard
      const dashboardData = {};
      readings.forEach(r => {
        dashboardData[r.type] = r.value;
      });
      dashboardData.timestamp = new Date();
      dashboardData.lastUpdated = dashboardData.timestamp;

      io.to(`user_${req.user._id}`).emit('sensorData', dashboardData);

      // Emit alerts
      alerts.forEach(alert => {
        io.to(`user_${req.user._id}`).emit('newAlert', alert);
      });
    }

    res.status(201).json({
      message: 'Sensor data saved successfully',
      count: savedData.length,
      alerts: alerts.length
    });
  } catch (error) {
    console.error('Save sensor data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/sensors/analytics
// @desc    Get analytics data
// @access  Private
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;

    let startDate;
    switch (timeframe) {
      case '1h':
        startDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    const analytics = await SensorData.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            sensorType: '$sensorType',
            hour: { $hour: '$createdAt' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          avgValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1, '_id.hour': 1 }
      }
    ]);

    res.json({ analytics, timeframe, startDate });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper function to determine status based on sensor type and value
const determineStatus = (type, value) => {
  const thresholds = {
    temperature: { min: 18, max: 28 },
    humidity: { min: 40, max: 80 },
    co2: { min: 300, max: 600 },
    light: { min: 200, max: 800 },
    soilMoisture: { min: 30, max: 70 }
  };

  const threshold = thresholds[type];
  if (!threshold) return 'unknown';

  if (value >= threshold.min && value <= threshold.max) {
    return 'safe';
  } else if (
    (value >= threshold.min * 0.8 && value < threshold.min) ||
    (value > threshold.max && value <= threshold.max * 1.2)
  ) {
    return 'warning';
  } else {
    return 'danger';
  }
};

// Helper function to check and create alerts
const checkAndCreateAlerts = async (userId, sensorDataArray, debounceMs) => {
  const alerts = [];
  const effectiveDebounceMs = Number(debounceMs ?? process.env.ALERT_DEBOUNCE_MS ?? 5 * 60 * 1000);
  const thresholds = {
    temperature: { min: 18, max: 28 },
    humidity: { min: 40, max: 80 },
    co2: { min: 300, max: 600 },
    light: { min: 200, max: 800 },
    soilMoisture: { min: 30, max: 70 }
  };

  for (const data of sensorDataArray) {
    const threshold = thresholds[data.sensorType];
    if (!threshold) continue;

    const { min, max } = threshold;
    const { value } = data;

    if (value < min || value > max) {
      // Debounce: skip if a recent alert for same sensor/device exists
      const recent = await Alert.findOne({
        userId,
        type: data.sensorType,
        deviceId: data.deviceId,
        createdAt: { $gte: new Date(Date.now() - effectiveDebounceMs) }
      }).sort({ createdAt: -1 });
      if (recent) continue;

      const severity = value < min * 0.8 || value > max * 1.2 ? 'high' : 'medium';

      const alert = new Alert({
        userId,
        type: data.sensorType,
        severity,
        title: `${data.sensorType} Alert`,
        message: `${data.sensorType} is ${value < min ? 'too low' : 'too high'}: ${value} ${data.unit}`,
        value,
        threshold,
        deviceId: data.deviceId
      });

      const savedAlert = await alert.save();
      alerts.push(savedAlert);
    }
  }

  return alerts;
};

export default router;
