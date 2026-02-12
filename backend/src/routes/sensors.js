import express from 'express';
import SensorData from '../models/SensorData.js';
import Alert from '../models/Alert.js';
import UserSettings from '../models/UserSettings.js';
import { authenticateToken } from '../middleware/auth.js';
import { getFullAnalytics } from '../services/analytics/AnalyticsService.js';
import { evaluateAutomationsForReadings } from '../services/automation/AutomationEngine.js';


const router = express.Router();

const parseIngestionTimestamp = (reading, fallbackRaw = null) => {
  const raw = reading?.timestamp ?? reading?.ts ?? reading?.metadata?.timestamp ?? fallbackRaw ?? Date.now();
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
};

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
    const { deviceId, readings, timestamp: batchTimestamp } = req.body;
    const fallbackBatchTimestamp = batchTimestamp ?? Date.now();

    if (!deviceId || !readings || !Array.isArray(readings)) {
      return res.status(400).json({ message: 'Device ID and readings array are required' });
    }

    const sensorDataArray = readings.map(reading => ({
      timestamp: parseIngestionTimestamp(reading, fallbackBatchTimestamp),
      metadata: {
        userId: req.user._id,
        deviceId: deviceId,
        sensorType: reading.type,
        location: reading.location || 'Greenhouse 1',
      },
      value: reading.value,
      unit: reading.unit,
      status: determineStatus(reading.type, reading.value),
      extra: {
        batteryLevel: reading.metadata?.batteryLevel,
        signalStrength: reading.metadata?.signalStrength
      }
    }));

    // De-duplicate within the same request by (sensorType, timestamp)
    const requestDedupedMap = new Map();
    sensorDataArray.forEach((doc) => {
      const key = `${doc.metadata.sensorType}|${doc.timestamp.getTime()}`;
      if (!requestDedupedMap.has(key)) requestDedupedMap.set(key, doc);
    });
    const requestDeduped = [...requestDedupedMap.values()];

    const uniqueTimestamps = [...new Set(requestDeduped.map((d) => d.timestamp.getTime()))].map((ms) => new Date(ms));
    const uniqueSensorTypes = [...new Set(requestDeduped.map((d) => d.metadata.sensorType))];

    const existing = uniqueTimestamps.length > 0
      ? await SensorData.find(
        {
          'metadata.userId': req.user._id,
          'metadata.deviceId': deviceId,
          'metadata.sensorType': { $in: uniqueSensorTypes },
          timestamp: { $in: uniqueTimestamps }
        },
        { 'metadata.sensorType': 1, timestamp: 1 }
      ).lean()
      : [];

    const existingKeys = new Set(
      existing.map((d) => `${d.metadata?.sensorType}|${new Date(d.timestamp).getTime()}`)
    );

    const toInsert = requestDeduped.filter(
      (d) => !existingKeys.has(`${d.metadata.sensorType}|${d.timestamp.getTime()}`)
    );

    const savedData = toInsert.length > 0 ? await SensorData.insertMany(toInsert) : [];

    // Check for alerts (respect per-user debounce)
    const settings = await UserSettings.findOne({ userId: req.user._id }).lean();
    const alerts = await checkAndCreateAlerts(
      req.user._id,
      savedData,
      settings?.system?.alertDebounceMs
    );

    // Emit live updates via Socket.IO
    const io = req.app.get('io');
    const automation = await evaluateAutomationsForReadings({
      userId: req.user._id,
      deviceId,
      readings: savedData.map((d) => ({
        type: d?.metadata?.sensorType,
        value: d?.value,
        timestamp: d?.timestamp
      })),
      io
    });
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

    return res.status(201).json({
      message: 'Sensor data saved successfully',
      count: savedData.length,
      duplicatesIgnored: sensorDataArray.length - toInsert.length,
      alerts: alerts.length,
      automationsTriggered: automation.triggered.length
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
          'metadata.userId': req.user._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            sensorType: '$metadata.sensorType',
            hour: { $hour: '$timestamp' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
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

    const buckets = {};
    analytics.forEach((row) => {
      const sensorType = row?._id?.sensorType;
      const date = row?._id?.date;
      const hour = row?._id?.hour;
      const value = row?.avgValue;
      if (!sensorType || !date || typeof hour !== 'number' || typeof value !== 'number') return;

      const hourString = String(hour).padStart(2, '0');
      const key = `${date}T${hourString}:00:00.000Z`;
      if (!buckets[key]) buckets[key] = { time: key };
      buckets[key][sensorType] = value;
    });

    const series = Object.values(buckets).sort((a, b) => new Date(a.time) - new Date(b.time));

    res.json({ analytics, series, timeframe, startDate });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/sensors/analytics/full
// @desc    Get precomputed production-grade analytics
// @access  Private
router.get('/analytics/full', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '24h', stage = 'fruiting' } = req.query;

    const timeframeMsMap = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const timeframeMs = timeframeMsMap[timeframe] || timeframeMsMap['24h'];
    let startDate;
    startDate = new Date(Date.now() - timeframeMs);

    // 1. Get recent raw data (for Risk/Predictive)
    // Use timeframe-aligned window for consistency with selected analytics range.
    // Cap point count to prevent very large payloads for long windows.
    const MAX_RECENT_POINTS = 5000;
    const recentData = (await SensorData.find({
      'metadata.userId': req.user._id,
      timestamp: { $gte: startDate }
    })
      .sort({ timestamp: -1 })
      .limit(MAX_RECENT_POINTS))
      .reverse();

    // 2. Get Aggregated History (Hybrid Approach: Precomputed + Recent Raw)
    const { default: SensorHistory } = await import('../models/SensorHistory.js');

    // a. Fetch precomputed hourly buckets from SensorHistory
    const precomputed = await SensorHistory.find({
      'metadata.userId': req.user._id,
      interval: 'hourly',
      startTime: { $gte: startDate }
    }).lean();

    // b. Find most recent precomputed bucket to know where to start raw aggregation
    const latestPrecomputed = precomputed.length > 0
      ? precomputed.reduce((latest, item) => (item.endTime > latest ? item.endTime : latest), precomputed[0].endTime)
      : startDate;

    // c. Aggregate only the missing "tip" (raw data since last precomputed bucket)
    const rawTip = await SensorData.aggregate([
      {
        $match: {
          'metadata.userId': req.user._id,
          timestamp: { $gt: latestPrecomputed }
        }
      },
      {
        $group: {
          _id: {
            sensorType: '$metadata.sensorType',
            bucketStart: {
              $dateFromParts: {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' },
                hour: { $hour: '$timestamp' }
              }
            }
          },
          avgValue: { $avg: '$value' }
        }
      },
      {
        $project: {
          _id: { sensorType: '$_id.sensorType' },
          avgValue: 1,
          timestamp: '$_id.bucketStart'
        }
      },
      {
        $sort: { timestamp: 1 }
      }
    ]);

    // 3. Format into structure expected by Engines
    // We combine precomputed (SensorHistory) and rawTip by (sensorType, hour)
    // to avoid duplicate/overlap artifacts.
    const merged = {};
    const addPoint = (sensorType, timestamp, value) => {
      const ts = new Date(timestamp);
      if (!sensorType || !Number.isFinite(value) || Number.isNaN(ts.getTime())) return;

      const hourStart = new Date(ts);
      hourStart.setMinutes(0, 0, 0);
      const key = `${sensorType}|${hourStart.toISOString()}`;
      if (!merged[key]) {
        merged[key] = {
          sensorType,
          timestamp: new Date(hourStart),
          sum: 0,
          count: 0
        };
      }
      merged[key].sum += value;
      merged[key].count += 1;
    };

    precomputed.forEach((h) => addPoint(h?.metadata?.sensorType, h?.startTime, h?.metrics?.avg));
    rawTip.forEach((r) => addPoint(r?._id?.sensorType, r?.timestamp, r?.avgValue));

    const historyData = Object.values(merged)
      .map((entry) => ({
        _id: { sensorType: entry.sensorType },
        avgValue: entry.count > 0 ? entry.sum / entry.count : 0,
        timestamp: entry.timestamp
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const timeBuckets = {};
    historyData.forEach(d => {
      const timeKey = d.timestamp.toISOString();
      if (!timeBuckets[timeKey]) timeBuckets[timeKey] = { name: timeKey };
      timeBuckets[timeKey][d._id.sensorType] = d.avgValue;
    });
    const formattedHistory = Object.values(timeBuckets).sort((a, b) => new Date(a.name) - new Date(b.name));

    // 3. Call Analytics Service
    const fullAnalytics = await getFullAnalytics(recentData, historyData, req.user._id, stage);

    res.json({
      success: true,
      data: fullAnalytics,
      history: formattedHistory // Still return history for charts
    });

  } catch (error) {
    console.error('Full analytics error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// @route   DELETE /api/sensors/data
// @desc    Purge sensor data for a specific device
// @access  Private
router.delete('/data', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required to purge data' });
    }

    const result = await SensorData.deleteMany({
      'metadata.userId': req.user._id,
      'metadata.deviceId': deviceId
    });

    res.json({
      success: true,
      message: `Successfully purged ${result.deletedCount} records for device ${deviceId}`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Purge sensor data error:', error);
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
    const sType = data.metadata?.sensorType || data.sensorType;
    const dId = data.metadata?.deviceId || data.deviceId;

    const threshold = thresholds[sType];
    if (!threshold) continue;

    const { min, max } = threshold;
    const { value } = data;

    if (value < min || value > max) {
      // Debounce: skip if a recent alert for same sensor/device exists
      const recent = await Alert.findOne({
        userId,
        type: sType,
        deviceId: dId,
        createdAt: { $gte: new Date(Date.now() - effectiveDebounceMs) }
      }).sort({ createdAt: -1 });
      if (recent) continue;

      const severity = value < min * 0.8 || value > max * 1.2 ? 'high' : 'medium';

      const alert = new Alert({
        userId,
        type: sType,
        severity,
        title: `${sType} Alert`,
        message: `${sType} is ${value < min ? 'too low' : 'too high'}: ${value} ${data.unit}`,
        value,
        threshold,
        deviceId: dId
      });

      const savedAlert = await alert.save();
      alerts.push(savedAlert);
    }
  }

  return alerts;
};

// @route   GET /api/sensors/history
// @desc    Get aggregated historical sensor data
// @access  Private
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

    if (deviceId) {
      query['metadata.deviceId'] = deviceId;
    }

    if (sensorType) {
      query['metadata.sensorType'] = sensorType;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const { default: SensorHistory } = await import('../models/SensorHistory.js');
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
