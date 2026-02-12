import crypto from 'crypto';
import Alert from '../../models/Alert.js';
import Device from '../../models/Device.js';

export const normalizeType = (type) => {
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

export const parseIngestionTimestamp = (raw, fallbackRaw = null) => {
  const base = raw ?? fallbackRaw ?? Date.now();
  const dt = new Date(base);
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
};

export const normalizeReading = (reading) => {
  if (!reading) return null;
  const type = normalizeType(reading.type);
  if (!type) return null;

  let value = Number(reading.value);
  if (!Number.isFinite(value)) return null;

  let unit = reading.unit ? String(reading.unit) : '';
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

export const parseLine = (line) => {
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

export const resolveDeviceFromToken = async (req) => {
  const deviceToken = req.headers['x-device-token'] || req.query.deviceToken || req.body?.deviceToken;
  if (!deviceToken) return null;

  const tokenHash = crypto.createHash('sha256').update(String(deviceToken)).digest('hex');
  const device = await Device.findOne({ tokenHash, active: true });
  if (!device || !device.userId) return null;
  return device;
};

export const determineStatus = (type, value) => {
  const thresholds = {
    temperature: { min: 18, max: 28 },
    humidity: { min: 40, max: 80 },
    co2: { min: 300, max: 600 },
    light: { min: 200, max: 800 },
    soilMoisture: { min: 30, max: 70 }
  };

  const threshold = thresholds[type];
  if (!threshold) return 'safe';
  if (value >= threshold.min && value <= threshold.max) return 'safe';
  if (
    (value >= threshold.min * 0.8 && value < threshold.min)
    || (value > threshold.max && value <= threshold.max * 1.2)
  ) {
    return 'warning';
  }
  return 'danger';
};

export const checkAndCreateAlerts = async (userId, sensorDataArray, debounceMs) => {
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
    if (value >= min && value <= max) continue;

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

    alerts.push(await alert.save());
  }

  return alerts;
};
