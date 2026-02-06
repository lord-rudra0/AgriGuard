import express from 'express';
import SensorData from '../models/SensorData.js';
import Alert from '../models/Alert.js';

const router = express.Router();

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

const checkAndCreateAlerts = async (userId, sensorDataArray) => {
  const alerts = [];
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

router.post('/ingest', async (req, res) => {
  try {
    const expectedKey = process.env.IOT_API_KEY;
    if (!expectedKey) {
      return res.status(503).json({ message: 'IOT_API_KEY not set on server' });
    }

    const providedKey = req.headers['x-iot-key'] || req.query.key || req.body?.apiKey;
    if (String(providedKey || '') !== String(expectedKey)) {
      return res.status(401).json({ message: 'Invalid IoT API key' });
    }

    const { deviceId, userId, readings, line } = req.body || {};
    if (!deviceId || !userId) {
      return res.status(400).json({ message: 'deviceId and userId are required' });
    }

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
      userId,
      deviceId,
      sensorType: reading.type,
      value: reading.value,
      unit: reading.unit,
      location: reading.location,
      status: determineStatus(reading.type, reading.value),
      metadata: reading.metadata || {}
    }));

    const savedData = await SensorData.insertMany(sensorDataArray);
    const alerts = await checkAndCreateAlerts(userId, savedData);

    const io = req.app.get('io');
    if (io) {
      const dashboardData = {};
      normalized.forEach(r => {
        dashboardData[r.type] = r.value;
      });
      dashboardData.timestamp = new Date();
      dashboardData.lastUpdated = dashboardData.timestamp;
      io.to(`user_${String(userId)}`).emit('sensorData', dashboardData);

      alerts.forEach(alert => {
        io.to(`user_${String(userId)}`).emit('newAlert', alert);
      });
    }

    return res.status(201).json({
      message: 'IoT data ingested',
      count: savedData.length,
      alerts: alerts.length
    });
  } catch (error) {
    console.error('IoT ingest error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
