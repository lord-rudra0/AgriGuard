import express from 'express';
import crypto from 'crypto';
import SensorData from '../../models/SensorData.js';
import Device from '../../models/Device.js';
import UserSettings from '../../models/UserSettings.js';
import { evaluateAutomationsForReadings } from '../../services/automation/AutomationEngine.js';
import {
  checkAndCreateAlerts,
  determineStatus,
  normalizeReading,
  parseIngestionTimestamp,
  parseLine
} from './utils.js';

const router = express.Router();

const deviceLastSeen = new Map();
const DEVICE_ONLINE_WINDOW_MS = 2 * 60 * 1000;

router.post('/ingest', async (req, res) => {
  try {
    let resolvedUserId = null;
    let resolvedDeviceId = null;

    const deviceToken = req.headers['x-device-token'] || req.query.deviceToken || req.body?.deviceToken;
    if (deviceToken) {
      const tokenHash = crypto.createHash('sha256').update(String(deviceToken)).digest('hex');
      const device = await Device.findOne({ tokenHash, active: true });
      if (!device) return res.status(401).json({ message: 'Invalid device token' });
      if (!device.userId) return res.status(403).json({ message: 'Device not claimed' });

      resolvedUserId = device.userId;
      resolvedDeviceId = device.deviceId;
      device.lastSeenAt = new Date();
      await device.save();
    } else {
      const expectedKey = process.env.IOT_API_KEY;
      if (!expectedKey) return res.status(503).json({ message: 'IOT_API_KEY not set on server' });

      const providedKey = req.headers['x-iot-key'] || req.query.key || req.body?.apiKey;
      if (String(providedKey || '') !== String(expectedKey)) {
        return res.status(401).json({ message: 'Invalid IoT API key' });
      }

      const { deviceId, userId } = req.body || {};
      if (!deviceId || !userId) {
        return res.status(400).json({ message: 'deviceId and userId are required' });
      }
      resolvedUserId = userId;
      resolvedDeviceId = deviceId;
    }

    const { readings, line, timestamp: batchTimestamp } = req.body || {};
    const fallbackBatchTimestamp = batchTimestamp ?? Date.now();

    let incomingReadings = Array.isArray(readings) ? readings : null;
    if (!incomingReadings && typeof line === 'string') incomingReadings = parseLine(line);
    if (!incomingReadings || incomingReadings.length === 0) {
      return res.status(400).json({ message: 'No readings provided' });
    }

    const normalized = incomingReadings.map(normalizeReading).filter(Boolean);
    if (normalized.length === 0) {
      return res.status(400).json({ message: 'No valid readings after normalization' });
    }

    const sensorDataArray = normalized.map((reading) => ({
      timestamp: parseIngestionTimestamp(reading.timestamp, fallbackBatchTimestamp),
      metadata: {
        userId: resolvedUserId,
        deviceId: resolvedDeviceId,
        sensorType: reading.type,
        location: reading.location || 'Greenhouse 1'
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
          'metadata.userId': resolvedUserId,
          'metadata.deviceId': resolvedDeviceId,
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

    const now = Date.now();
    const lastSeen = deviceLastSeen.get(resolvedDeviceId);
    if (!lastSeen || (now - lastSeen) > DEVICE_ONLINE_WINDOW_MS) {
      console.log(`✅ ESP connected: deviceId=${resolvedDeviceId} userId=${resolvedUserId}`);
    }
    deviceLastSeen.set(resolvedDeviceId, now);

    const settings = await UserSettings.findOne({ userId: resolvedUserId }).lean();
    const alerts = await checkAndCreateAlerts(
      resolvedUserId,
      savedData,
      settings?.system?.alertDebounceMs
    );

    const io = req.app.get('io');
    const automation = await evaluateAutomationsForReadings({
      userId: resolvedUserId,
      deviceId: resolvedDeviceId,
      readings: savedData.map((d) => ({
        type: d?.metadata?.sensorType,
        value: d?.value,
        timestamp: d?.timestamp
      })),
      io
    });

    if (io) {
      const dashboardData = {};
      normalized.forEach((r) => { dashboardData[r.type] = r.value; });
      dashboardData.deviceId = resolvedDeviceId;
      dashboardData.timestamp = new Date();
      dashboardData.lastUpdated = dashboardData.timestamp;
      io.to(`user_${String(resolvedUserId)}`).emit('sensorData', dashboardData);

      alerts.forEach((alert) => {
        io.to(`user_${String(resolvedUserId)}`).emit('newAlert', alert);
      });
    }

    return res.status(201).json({
      message: 'IoT data ingested',
      count: savedData.length,
      duplicatesIgnored: sensorDataArray.length - toInsert.length,
      alerts: alerts.length,
      automationsTriggered: automation.triggered.length
    });
  } catch (error) {
    console.error('IoT ingest error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
