import express from 'express';
import crypto from 'crypto';
import SensorData from '../../models/SensorData.js';
import Device from '../../models/Device.js';
import UserSettings from '../../models/UserSettings.js';
import { evaluateAutomationsForReadings } from '../../services/automation/AutomationEngine.js';
import { authenticateToken } from '../../middleware/auth.js';
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

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomBetween = (min, max) => Math.random() * (max - min) + min;

const generateDummySeriesPoint = (idx, timestamp) => {
  const hour = new Date(timestamp).getHours();
  const daylightFactor = hour >= 7 && hour <= 18 ? 1 : 0.15;

  const temperature = 23 + Math.sin(idx / 6) * 2 + randomBetween(-0.7, 0.7);
  const humidity = 78 + Math.sin(idx / 5) * 8 + randomBetween(-2.2, 2.2);
  const co2 = 470 + Math.sin(idx / 7) * 110 + randomBetween(-25, 25);
  const light = (600 + Math.sin(idx / 4) * 140 + randomBetween(-40, 40)) * daylightFactor;
  const soilMoisture = 52 + Math.sin(idx / 8) * 9 + randomBetween(-2, 2);

  // Periodic anomaly to help verify alert/notification flows
  const anomaly = idx > 0 && idx % 23 === 0;

  return {
    temperature: clamp(anomaly ? temperature + 6 : temperature, 12, 40),
    humidity: clamp(anomaly ? humidity - 18 : humidity, 25, 99),
    co2: clamp(anomaly ? co2 + 420 : co2, 250, 2200),
    light: clamp(light, 0, 1200),
    soilMoisture: clamp(anomaly ? soilMoisture - 12 : soilMoisture, 10, 90)
  };
};

const ensureVirtualDeviceForUser = async ({ userId, requestedDeviceId = '' }) => {
  const cleanRequested = String(requestedDeviceId || '').trim();
  const baseId = cleanRequested || `SIM-${String(userId).slice(-6).toUpperCase()}`;

  // If requested ID already exists under this user, reuse it.
  if (cleanRequested) {
    const existing = await Device.findOne({ userId, deviceId: baseId });
    if (existing) return existing;
  }

  const existingUserDevice = await Device.findOne({ userId, active: true }).sort({ updatedAt: -1 });
  if (existingUserDevice) return existingUserDevice;

  let candidate = baseId;
  let suffix = 1;
  while (await Device.findOne({ deviceId: candidate })) {
    suffix += 1;
    candidate = `${baseId}-${suffix}`;
  }

  const syntheticTokenSeed = `virtual:${String(userId)}:${candidate}:${Date.now()}:${Math.random()}`;
  const syntheticFactorySeed = `factory:${String(userId)}:${candidate}:${Date.now()}:${Math.random()}`;

  return Device.create({
    userId,
    name: 'Virtual Test Device',
    deviceId: candidate,
    tokenHash: crypto.createHash('sha256').update(syntheticTokenSeed).digest('hex'),
    tokenLast4: candidate.slice(-4).padStart(4, '0'),
    factoryTokenHash: crypto.createHash('sha256').update(syntheticFactorySeed).digest('hex'),
    claimedAt: new Date(),
    active: true,
    metadata: {
      location: 'Greenhouse 1',
      notes: 'Auto-created for dummy data generation'
    }
  });
};

const generateDummyDataForDevice = async ({
  req,
  resolvedUserId,
  resolvedDeviceId,
  location
}) => {
  const pointsRaw = Number(req.body?.points);
  const intervalRaw = Number(req.body?.intervalMinutes);
  const points = Math.min(Math.max(Number.isFinite(pointsRaw) ? Math.floor(pointsRaw) : 48, 1), 500);
  const intervalMinutes = Math.min(Math.max(Number.isFinite(intervalRaw) ? Math.floor(intervalRaw) : 15, 1), 240);
  const intervalMs = intervalMinutes * 60 * 1000;

  const startAtFallback = Date.now() - ((points - 1) * intervalMs);
  const startAt = parseIngestionTimestamp(req.body?.startAt, startAtFallback);

  const sensorDataArray = [];
  for (let i = 0; i < points; i += 1) {
    const pointTs = new Date(startAt.getTime() + (i * intervalMs));
    const sample = generateDummySeriesPoint(i, pointTs);
    const rows = [
      { type: 'temperature', value: sample.temperature, unit: 'C' },
      { type: 'humidity', value: sample.humidity, unit: '%' },
      { type: 'co2', value: sample.co2, unit: 'ppm' },
      { type: 'light', value: sample.light, unit: 'lux' },
      { type: 'soilMoisture', value: sample.soilMoisture, unit: '%' }
    ];

    rows.forEach((row) => {
      const value = Number(row.value.toFixed(2));
      sensorDataArray.push({
        timestamp: pointTs,
        metadata: {
          userId: resolvedUserId,
          deviceId: resolvedDeviceId,
          sensorType: row.type,
          location: location || req.body?.location || 'Greenhouse 1'
        },
        value,
        unit: row.unit,
        status: determineStatus(row.type, value),
        extra: {
          batteryLevel: Number(randomBetween(62, 98).toFixed(0)),
          signalStrength: Number(randomBetween(50, 95).toFixed(0))
        }
      });
    });
  }

  const savedData = sensorDataArray.length > 0 ? await SensorData.insertMany(sensorDataArray) : [];
  const settings = await UserSettings.findOne({ userId: resolvedUserId }).lean();
  const alerts = await checkAndCreateAlerts(
    resolvedUserId,
    savedData,
    settings?.system?.alertDebounceMs
  );

  const io = req.app.get('io');
  if (io) {
    const latest = savedData.slice(-5);
    const dashboardData = {
      deviceId: resolvedDeviceId,
      timestamp: latest[latest.length - 1]?.timestamp || new Date(),
      lastUpdated: latest[latest.length - 1]?.timestamp || new Date()
    };
    latest.forEach((d) => {
      if (d?.metadata?.sensorType) dashboardData[d.metadata.sensorType] = d.value;
    });

    io.to(`user_${String(resolvedUserId)}`).emit('sensorData', dashboardData);
    alerts.forEach((alert) => {
      io.to(`user_${String(resolvedUserId)}`).emit('newAlert', alert);
    });
  }

  return {
    points,
    intervalMinutes,
    savedData,
    alerts,
    sensorDataArray
  };
};

router.post('/dummy-data/auth', authenticateToken, async (req, res) => {
  try {
    const resolvedUserId = req.user?._id;
    const requestedDeviceId = String(req.body?.deviceId || '').trim();

    let targetDevice = null;
    if (requestedDeviceId) {
      targetDevice = await Device.findOne({
        userId: resolvedUserId,
        deviceId: requestedDeviceId,
        active: true
      });
      if (!targetDevice) {
        // Create virtual device automatically when requested one does not exist.
        targetDevice = await ensureVirtualDeviceForUser({ userId: resolvedUserId, requestedDeviceId });
      }
    } else {
      targetDevice = await ensureVirtualDeviceForUser({ userId: resolvedUserId });
    }

    targetDevice.lastSeenAt = new Date();
    await targetDevice.save();

    const result = await generateDummyDataForDevice({
      req,
      resolvedUserId,
      resolvedDeviceId: targetDevice.deviceId,
      location: targetDevice.metadata?.location
    });

    return res.status(201).json({
      message: 'Dummy sensor data generated',
      userId: String(resolvedUserId),
      deviceId: String(targetDevice.deviceId),
      points: result.points,
      intervalMinutes: result.intervalMinutes,
      readingsInserted: result.savedData.length,
      alertsGenerated: result.alerts.length,
      range: {
        from: result.sensorDataArray[0]?.timestamp || null,
        to: result.sensorDataArray[result.sensorDataArray.length - 1]?.timestamp || null
      }
    });
  } catch (error) {
    console.error('Dummy data generation error (auth):', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/dummy-data', async (req, res) => {
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

    const result = await generateDummyDataForDevice({
      req,
      resolvedUserId,
      resolvedDeviceId
    });

    return res.status(201).json({
      message: 'Dummy sensor data generated',
      userId: String(resolvedUserId),
      deviceId: String(resolvedDeviceId),
      points: result.points,
      intervalMinutes: result.intervalMinutes,
      readingsInserted: result.savedData.length,
      alertsGenerated: result.alerts.length,
      range: {
        from: result.sensorDataArray[0]?.timestamp || null,
        to: result.sensorDataArray[result.sensorDataArray.length - 1]?.timestamp || null
      }
    });
  } catch (error) {
    console.error('Dummy data generation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

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
