import express from 'express';
import SensorData from '../../models/SensorData.js';
import UserSettings from '../../models/UserSettings.js';
import { authenticateToken } from '../../middleware/auth.js';
import { evaluateAutomationsForReadings } from '../../services/automation/AutomationEngine.js';
import { checkAndCreateAlerts, determineStatus, parseIngestionTimestamp } from './utils.js';

const router = express.Router();

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
    if (sensorType) query.sensorType = sensorType;

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

router.post('/data', authenticateToken, async (req, res) => {
  try {
    const { deviceId, readings, timestamp: batchTimestamp } = req.body;
    const fallbackBatchTimestamp = batchTimestamp ?? Date.now();

    if (!deviceId || !readings || !Array.isArray(readings)) {
      return res.status(400).json({ message: 'Device ID and readings array are required' });
    }

    const sensorDataArray = readings.map((reading) => ({
      timestamp: parseIngestionTimestamp(reading, fallbackBatchTimestamp),
      metadata: {
        userId: req.user._id,
        deviceId,
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

    const requestDedupedMap = new Map();
    sensorDataArray.forEach((doc) => {
      const key = `${doc.metadata.sensorType}|${doc.timestamp.getTime()}`;
      if (!requestDedupedMap.has(key)) requestDedupedMap.set(key, doc);
    });
    const requestDeduped = [...requestDedupedMap.values()];

    const uniqueTimestamps = [...new Set(requestDeduped.map((d) => d.timestamp.getTime()))]
      .map((ms) => new Date(ms));
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

    const settings = await UserSettings.findOne({ userId: req.user._id }).lean();
    const alerts = await checkAndCreateAlerts(
      req.user._id,
      savedData,
      settings?.system?.alertDebounceMs
    );

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
      const dashboardData = {};
      readings.forEach((r) => { dashboardData[r.type] = r.value; });
      dashboardData.timestamp = new Date();
      dashboardData.lastUpdated = dashboardData.timestamp;

      io.to(`user_${req.user._id}`).emit('sensorData', dashboardData);
      alerts.forEach((alert) => {
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

export default router;
