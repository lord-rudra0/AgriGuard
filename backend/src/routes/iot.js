import express from 'express';
import crypto from 'crypto';
import SensorData from '../models/SensorData.js';
import Alert from '../models/Alert.js';
import Device from '../models/Device.js';
import UserSettings from '../models/UserSettings.js';

const router = express.Router();

// Track last-seen time per device for simple connection logging
const deviceLastSeen = new Map();
const DEVICE_ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

const normalizeType = (type) => {
  if (!type) return null;
  const t = String(type).toLowerCase();
  if (t === 'soil' || t === 'soilmoisture' || t === 'soil_moisture') return 'soilMoisture';
  if (t === 'gas') return 'co2';
  if (t === 'temperature') return 'temperature';
  if (t === 'humidity') return 'humidity';
  if (t === 'co2') return 'co2';
  if (t === 'light') return 'light';
  return null;
};

const parseIngestionTimestamp = (raw, fallbackRaw = null) => {
  const base = raw ?? fallbackRaw ?? Date.now();
  const dt = new Date(base);
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
};

const normalizeReading = (reading) => {
  if (!reading) return null;
  const type = normalizeType(reading.type);
  if (!type) return null;

  let value = Number(reading.value);
  if (!Number.isFinite(value)) return null;

  let unit = reading.unit ? String(reading.unit) : '';

  // Convert percent-based readings to expected units for UI thresholds
  if (type === 'co2' && unit === '%') {
    value = value * 100;
    unit = 'ppm';
  }
  if (type === 'light' && unit === '%') {
    value = value * 10;
    unit = 'lux';
  }

  if (!unit) {
    unit = type === 'temperature' ? 'C'
      : type === 'humidity' ? '%'
        : type === 'co2' ? 'ppm'
          : type === 'light' ? 'lux'
            : '%';
  }

  return {
    type,
    value,
    unit,
    timestamp: reading.timestamp ?? reading.ts ?? reading.metadata?.timestamp ?? null,
    location: reading.location,
    metadata: reading.metadata || {}
  };
};

const parseLine = (line) => {
  const readings = [];
  const temp = /Temp:\s*([0-9.]+)/i.exec(line);
  const hum = /Hum:\s*([0-9.]+)/i.exec(line);
  const gas = /Gas:\s*([0-9.]+)%/i.exec(line);
  const lightOff = /Light:\s*OFF/i.exec(line);
  const lightOn = /Light:\s*ON\s*([0-9.]+)%/i.exec(line);
  const soil = /Soil:\s*([0-9.]+)%/i.exec(line);

  if (temp) readings.push({ type: 'temperature', value: Number(temp[1]), unit: 'C' });
  if (hum) readings.push({ type: 'humidity', value: Number(hum[1]), unit: '%' });
  if (gas) readings.push({ type: 'co2', value: Number(gas[1]) * 100, unit: 'ppm' });
  if (lightOff) readings.push({ type: 'light', value: 0, unit: 'lux' });
  if (lightOn) readings.push({ type: 'light', value: Number(lightOn[1]) * 10, unit: 'lux' });
  if (soil) readings.push({ type: 'soilMoisture', value: Number(soil[1]), unit: '%' });

  return readings;
};

const determineStatus = (type, value) => {
  const thresholds = {
    temperature: { min: 18, max: 28 },
    humidity: { min: 40, max: 80 },
    co2: { min: 300, max: 600 },
    light: { min: 200, max: 800 },
    soilMoisture: { min: 30, max: 70 }
  };

  const threshold = thresholds[type];
  if (!threshold) return 'safe';

  if (value >= threshold.min && value <= threshold.max) {
    return 'safe';
  } else if (
    (value >= threshold.min * 0.8 && value < threshold.min) ||
    (value > threshold.max && value <= threshold.max * 1.2)
  ) {
    return 'warning';
  }
  return 'danger';
};

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

router.post('/ingest', async (req, res) => {
  try {
    let resolvedUserId = null;
    let resolvedDeviceId = null;

    const deviceToken = req.headers['x-device-token'] || req.query.deviceToken || req.body?.deviceToken;
    if (deviceToken) {
      const tokenHash = crypto.createHash('sha256').update(String(deviceToken)).digest('hex');
      const device = await Device.findOne({ tokenHash, active: true });
      if (!device) {
        return res.status(401).json({ message: 'Invalid device token' });
      }
      if (!device.userId) {
        return res.status(403).json({ message: 'Device not claimed' });
      }
      resolvedUserId = device.userId;
      resolvedDeviceId = device.deviceId;
      device.lastSeenAt = new Date();
      await device.save();
    } else {
      // Legacy / fallback flow using shared IoT API key + explicit userId
      const expectedKey = process.env.IOT_API_KEY;
      if (!expectedKey) {
        return res.status(503).json({ message: 'IOT_API_KEY not set on server' });
      }
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
    if (!incomingReadings && typeof line === 'string') {
      incomingReadings = parseLine(line);
    }

    if (!incomingReadings || incomingReadings.length === 0) {
      return res.status(400).json({ message: 'No readings provided' });
    }

    const normalized = incomingReadings
      .map(normalizeReading)
      .filter(Boolean);

    if (normalized.length === 0) {
      return res.status(400).json({ message: 'No valid readings after normalization' });
    }

    const sensorDataArray = normalized.map(reading => ({
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

    // De-duplicate within request by (sensorType, timestamp)
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

    // Log device connection when first seen or after offline window
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
    if (io) {
      const dashboardData = {};
      normalized.forEach(r => {
        dashboardData[r.type] = r.value;
      });
      dashboardData.deviceId = resolvedDeviceId;
      dashboardData.timestamp = new Date();
      dashboardData.lastUpdated = dashboardData.timestamp;
      io.to(`user_${String(resolvedUserId)}`).emit('sensorData', dashboardData);

      alerts.forEach(alert => {
        io.to(`user_${String(resolvedUserId)}`).emit('newAlert', alert);
      });
    }

    return res.status(201).json({
      message: 'IoT data ingested',
      count: savedData.length,
      duplicatesIgnored: sensorDataArray.length - toInsert.length,
      alerts: alerts.length
    });
  } catch (error) {
    console.error('IoT ingest error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
