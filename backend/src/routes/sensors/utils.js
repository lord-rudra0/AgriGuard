import Alert from '../../models/Alert.js';
import { generateProactiveRiskAlerts } from '../../services/alerts/proactiveRiskAlerts.js';

export const parseIngestionTimestamp = (reading, fallbackRaw = null) => {
  const raw = reading?.timestamp ?? reading?.ts ?? reading?.metadata?.timestamp ?? fallbackRaw ?? Date.now();
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
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
  if (!threshold) return 'unknown';
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

    const severityLevel = value < min * 0.8 || value > max * 1.2 ? 'critical' : 'warning';
    const distance = value < min ? (min - value) : (value - max);
    const span = Math.max(1, max - min);
    const confidence = Math.max(40, Math.min(95, Math.round(55 + ((distance / span) * 80))));
    const alert = new Alert({
      userId,
      type: sType,
      severity: severityLevel,
      severityLevel,
      confidence,
      origin: 'reactive',
      title: `${sType} Alert`,
      message: `${sType} is ${value < min ? 'too low' : 'too high'}: ${value} ${data.unit}`,
      value,
      threshold,
      deviceId: dId
    });

    alerts.push(await alert.save());
  }

  const deviceIds = [...new Set(sensorDataArray.map((d) => d.metadata?.deviceId || d.deviceId).filter(Boolean))];
  for (const deviceId of deviceIds) {
    const proactiveAlerts = await generateProactiveRiskAlerts({
      userId,
      deviceId,
      debounceMs: effectiveDebounceMs
    });
    alerts.push(...proactiveAlerts);
  }

  return alerts;
};
