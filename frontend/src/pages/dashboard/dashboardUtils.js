export const getThreshold = (type) => {
  const thresholds = {
    temperature: { min: 18, max: 28 },
    humidity: { min: 40, max: 80 },
    co2: { min: 300, max: 600 },
    light: { min: 200, max: 800 },
    soilMoisture: { min: 30, max: 70 }
  };
  return thresholds[type];
};

export const getStatus = (type, value) => {
  if (value === undefined || value === null) return 'inactive';
  const threshold = getThreshold(type);
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

export const buildSensorConfigs = (sensorData) => [
  { type: 'temperature', value: sensorData.temperature, unit: '°C' },
  { type: 'humidity', value: sensorData.humidity, unit: '%' },
  { type: 'co2', value: sensorData.co2, unit: 'ppm' },
  { type: 'light', value: sensorData.light, unit: 'lux' },
  { type: 'soilMoisture', value: sensorData.soilMoisture, unit: '%' }
];
