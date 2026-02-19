import Alert from '../../models/Alert.js';
import SensorData from '../../models/SensorData.js';
import { calculateVPD } from '../analytics/AnalyticsCore.js';
import { clampConfidence, severityFromRiskScore } from './severity.js';

const THRESHOLDS = {
  temperature: { min: 18, max: 28 },
  humidity: { min: 40, max: 80 },
  co2: { min: 300, max: 600 },
  light: { min: 200, max: 800 },
  soilMoisture: { min: 30, max: 70 }
};

const CATEGORY_DEFAULT_WINDOWS = {
  irrigation: 240,
  weather_stress: 180,
  disease: 180
};

const groupBySensorType = (docs) => {
  const grouped = new Map();
  for (const doc of docs) {
    const sensorType = doc?.metadata?.sensorType;
    if (!sensorType) continue;
    if (!grouped.has(sensorType)) grouped.set(sensorType, []);
    grouped.get(sensorType).push(doc);
  }
  for (const [k, arr] of grouped.entries()) {
    grouped.set(k, arr.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
  }
  return grouped;
};

const linearTrend = (series) => {
  if (!Array.isArray(series) || series.length < 3) return null;

  const oldest = new Date(series[0].timestamp).getTime();
  const points = series
    .map((s) => ({
      x: (new Date(s.timestamp).getTime() - oldest) / (60 * 1000),
      y: Number(s.value)
    }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

  if (points.length < 3) return null;

  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXX += p.x * p.x;
    sumXY += p.x * p.y;
  }

  const denom = n * sumXX - (sumX * sumX);
  if (!Number.isFinite(denom) || denom === 0) return null;

  const slopePerMinute = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slopePerMinute * sumX) / n;

  const meanY = sumY / n;
  let sst = 0;
  let sse = 0;
  for (const p of points) {
    const predicted = slopePerMinute * p.x + intercept;
    sse += (p.y - predicted) ** 2;
    sst += (p.y - meanY) ** 2;
  }
  const r2 = sst === 0 ? 0 : Math.max(0, Math.min(1, 1 - (sse / sst)));

  const latestPoint = points[points.length - 1];
  return {
    slopePerMinute,
    slopePerHour: slopePerMinute * 60,
    latestValue: latestPoint.y,
    latestTimestamp: new Date(series[series.length - 1].timestamp),
    sampleCount: points.length,
    r2
  };
};

const confidenceFromTrend = (trend) => {
  if (!trend) return 0;
  const densityScore = Math.min(40, trend.sampleCount * 4);
  const fitScore = Math.round(trend.r2 * 35);
  const trendStrength = Math.min(20, Math.abs(trend.slopePerHour) * 4);
  return clampConfidence(35 + densityScore + fitScore + trendStrength, 60);
};

const dedupePredictiveAlert = async ({ userId, deviceId, riskCategory, debounceMs }) => Alert.findOne({
  userId,
  deviceId,
  origin: 'predictive',
  riskCategory,
  isResolved: false,
  createdAt: { $gte: new Date(Date.now() - debounceMs) }
}).lean();

const buildIrrigationRisk = ({ grouped }) => {
  const soilSeries = grouped.get('soilMoisture');
  if (!soilSeries || soilSeries.length < 4) return null;

  const trend = linearTrend(soilSeries);
  if (!trend) return null;

  const windowMinutes = CATEGORY_DEFAULT_WINDOWS.irrigation;
  const projected = trend.latestValue + trend.slopePerMinute * windowMinutes;
  const threshold = THRESHOLDS.soilMoisture;

  const belowNow = trend.latestValue < threshold.min;
  const belowSoon = projected < threshold.min;
  const fallingFast = trend.slopePerHour <= -1.5;

  if (!belowNow && !(belowSoon && fallingFast)) return null;

  const deficitNow = Math.max(0, (threshold.min - trend.latestValue) / (threshold.max - threshold.min));
  const deficitProjected = Math.max(0, (threshold.min - projected) / (threshold.max - threshold.min));
  const trendPenalty = Math.max(0, (-trend.slopePerHour - 0.8) * 12);
  const riskScore = Math.min(100, Math.round((deficitNow * 35) + (deficitProjected * 45) + trendPenalty + 20));

  return {
    riskCategory: 'irrigation',
    type: 'soilMoisture',
    riskScore,
    severityLevel: severityFromRiskScore(riskScore),
    confidence: confidenceFromTrend(trend),
    windowMinutes,
    title: 'Irrigation risk predicted',
    message: `Soil moisture trend projects ${projected.toFixed(1)}% in ~${windowMinutes} minutes (safe min ${threshold.min}%).`,
    value: Number(trend.latestValue.toFixed(2)),
    threshold,
    basedOn: ['soilMoisture_trend']
  };
};

const buildWeatherStressRisk = ({ grouped }) => {
  const tempSeries = grouped.get('temperature');
  const lightSeries = grouped.get('light');
  if ((!tempSeries || tempSeries.length < 4) && (!lightSeries || lightSeries.length < 4)) return null;

  const tempTrend = tempSeries?.length >= 4 ? linearTrend(tempSeries) : null;
  const lightTrend = lightSeries?.length >= 4 ? linearTrend(lightSeries) : null;
  const tempThreshold = THRESHOLDS.temperature;
  const lightThreshold = THRESHOLDS.light;

  const windowMinutes = CATEGORY_DEFAULT_WINDOWS.weather_stress;
  const projectedTemp = tempTrend ? tempTrend.latestValue + tempTrend.slopePerMinute * windowMinutes : null;
  const projectedLight = lightTrend ? lightTrend.latestValue + lightTrend.slopePerMinute * windowMinutes : null;

  let score = 0;
  const basedOn = [];
  if (tempTrend && projectedTemp !== null) {
    if (projectedTemp > tempThreshold.max || projectedTemp < tempThreshold.min) {
      const dist = projectedTemp > tempThreshold.max
        ? projectedTemp - tempThreshold.max
        : tempThreshold.min - projectedTemp;
      score += Math.min(60, dist * 10 + Math.abs(tempTrend.slopePerHour) * 4 + 20);
      basedOn.push('temperature_trend');
    }
  }

  if (lightTrend && projectedLight !== null) {
    if (projectedLight > lightThreshold.max || projectedLight < lightThreshold.min) {
      const dist = projectedLight > lightThreshold.max
        ? (projectedLight - lightThreshold.max) / 50
        : (lightThreshold.min - projectedLight) / 50;
      score += Math.min(45, dist * 8 + Math.abs(lightTrend.slopePerHour) * 2 + 10);
      basedOn.push('light_trend');
    }
  }

  score = Math.min(100, Math.round(score));
  if (score < 35) return null;

  const dominant = tempTrend ? 'temperature' : 'light';
  const dominantValue = tempTrend ? tempTrend.latestValue : lightTrend.latestValue;
  const dominantThreshold = tempTrend ? tempThreshold : lightThreshold;

  return {
    riskCategory: 'weather_stress',
    type: dominant,
    riskScore: score,
    severityLevel: severityFromRiskScore(score),
    confidence: clampConfidence((confidenceFromTrend(tempTrend) + confidenceFromTrend(lightTrend)) / 2, 60),
    windowMinutes,
    title: 'Weather stress risk predicted',
    message: `Trend indicates potential climate stress in ~${windowMinutes} minutes. Check ventilation, shading, and airflow controls.`,
    value: Number(dominantValue.toFixed(2)),
    threshold: dominantThreshold,
    basedOn
  };
};

const buildDiseaseRisk = ({ grouped }) => {
  const tempSeries = grouped.get('temperature');
  const humiditySeries = grouped.get('humidity');
  if (!tempSeries || !humiditySeries || tempSeries.length < 4 || humiditySeries.length < 4) return null;

  const tempTrend = linearTrend(tempSeries);
  const humidityTrend = linearTrend(humiditySeries);
  if (!tempTrend || !humidityTrend) return null;

  const windowMinutes = CATEGORY_DEFAULT_WINDOWS.disease;
  const projectedHumidity = humidityTrend.latestValue + humidityTrend.slopePerMinute * windowMinutes;
  const projectedTemp = tempTrend.latestValue + tempTrend.slopePerMinute * windowMinutes;
  const currentVpd = calculateVPD(tempTrend.latestValue, humidityTrend.latestValue);
  const projectedVpd = calculateVPD(projectedTemp, projectedHumidity);

  const humidPressure = Math.max(0, projectedHumidity - 82);
  const vpdPressure = Math.max(0, 0.45 - projectedVpd) * 100;
  const humidityRising = Math.max(0, humidityTrend.slopePerHour);

  const riskScore = Math.min(100, Math.round((humidPressure * 2.8) + (vpdPressure * 0.8) + (humidityRising * 4)));
  if (riskScore < 35 || projectedHumidity < 80) return null;

  return {
    riskCategory: 'disease',
    type: 'humidity',
    riskScore,
    severityLevel: severityFromRiskScore(riskScore),
    confidence: clampConfidence((confidenceFromTrend(tempTrend) + confidenceFromTrend(humidityTrend)) / 2, 65),
    windowMinutes,
    title: 'Disease risk predicted',
    message: `Humidity/VPD pattern may increase disease pressure (projected RH ${projectedHumidity.toFixed(1)}%, VPD ${projectedVpd.toFixed(2)} kPa).`,
    value: Number(humidityTrend.latestValue.toFixed(2)),
    threshold: THRESHOLDS.humidity,
    basedOn: ['humidity_trend', 'vpd']
  };
};

export const generateProactiveRiskAlerts = async ({
  userId,
  deviceId,
  debounceMs = 5 * 60 * 1000,
  minConfidence = 0,
  allowedCategories = null
}) => {
  if (!userId || !deviceId) return [];

  const lookbackMinutes = 180;
  const docs = await SensorData.find(
    {
      'metadata.userId': userId,
      'metadata.deviceId': deviceId,
      timestamp: { $gte: new Date(Date.now() - lookbackMinutes * 60 * 1000) }
    },
    {
      timestamp: 1,
      value: 1,
      unit: 1,
      metadata: 1
    }
  )
    .sort({ timestamp: -1 })
    .limit(250)
    .lean();

  if (!docs || docs.length < 8) return [];

  const grouped = groupBySensorType(docs);
  const candidates = [
    buildDiseaseRisk({ grouped }),
    buildWeatherStressRisk({ grouped }),
    buildIrrigationRisk({ grouped })
  ].filter(Boolean);

  const created = [];
  for (const candidate of candidates) {
    if (candidate.confidence < minConfidence) continue;
    if (allowedCategories && !allowedCategories.has(candidate.riskCategory)) continue;

    const existing = await dedupePredictiveAlert({
      userId,
      deviceId,
      riskCategory: candidate.riskCategory,
      debounceMs
    });
    if (existing) continue;

    const alert = await Alert.create({
      userId,
      type: candidate.type,
      severity: candidate.severityLevel,
      severityLevel: candidate.severityLevel,
      confidence: candidate.confidence,
      origin: 'predictive',
      riskCategory: candidate.riskCategory,
      prediction: {
        windowMinutes: candidate.windowMinutes,
        score: candidate.riskScore,
        basedOn: candidate.basedOn
      },
      title: candidate.title,
      message: candidate.message,
      value: candidate.value,
      threshold: candidate.threshold,
      deviceId
    });

    created.push(alert);
  }

  return created;
};
