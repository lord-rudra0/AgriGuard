
// Improvement #3: Predictive Analytics with Smoothing & 30-Point Regression
// Improvement #5: Statistical Significance Checks
import { calculateMovingAverage, calculateSlope } from './AnalyticsCore.js';

const THRESHOLDS = {
    temperature: { min: 18, max: 28, label: 'Temperature', unit: '°C' },
    humidity: { min: 40, max: 80, label: 'Humidity', unit: '%' },
    co2: { min: 300, max: 600, label: 'CO2', unit: 'ppm' },
    soilMoisture: { min: 30, max: 70, label: 'Soil Moisture', unit: '%' }
};

export const calculatePredictiveForecasts = (chartData) => {
    // Improvement #3: Use 30 points instead of 5
    const MIN_POINTS = 10; // Minimum to attempt
    if (!chartData || chartData.length < MIN_POINTS) return [];

    const grouped = {};
    chartData.forEach(d => {
        Object.keys(THRESHOLDS).forEach(key => {
            if (d[key] !== undefined) {
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(d[key]);
            }
        });
    });

    const results = [];

    Object.keys(grouped).forEach(key => {
        let values = grouped[key];

        // Improvement #3: Smooth data first (Window of 3)
        values = calculateMovingAverage(values, 3);

        // Improvement #3: Take last 30 points (or as many as available)
        const recent = values.slice(-30);
        if (recent.length < 5) return;

        const slope = calculateSlope(recent);
        const currentVal = values[values.length - 1];
        const threshold = THRESHOLDS[key];

        // Improvement #5: Statistical Significance (Slope must be distinct from noise)
        // For production, we'd calculate p-value, but here we use a normalized robustness threshold
        const noiseFloor = key === 'co2' ? 5 : 0.1;
        const isSignificant = Math.abs(slope) > noiseFloor;

        if (isSignificant) {
            let predictedEvent = null;
            let timeToEvent = null;
            let targetBoundary = null;

            if (slope > 0 && currentVal < threshold.max) {
                const diff = threshold.max - currentVal;
                timeToEvent = diff / slope;
                predictedEvent = 'High Limit Breach';
                targetBoundary = threshold.max;
            } else if (slope < 0 && currentVal > threshold.min) {
                const diff = currentVal - threshold.min;
                timeToEvent = diff / Math.abs(slope);
                predictedEvent = 'Low Limit Breach';
                targetBoundary = threshold.min;
            }

            if (predictedEvent && timeToEvent < 24) {
                const predictedValue = Number((currentVal + (slope * 24)).toFixed(2));
                results.push({
                    type: threshold.label,
                    currentValue: Number(currentVal.toFixed(2)),
                    predictedValue: predictedValue,
                    unit: threshold.unit,
                    insight: `${predictedEvent} expected in ${timeToEvent.toFixed(1)}h. Trend: ${slope > 0 ? '+' : ''}${slope.toFixed(2)}${threshold.unit}/h.`,
                    severity: timeToEvent < 4 ? 'critical' : timeToEvent < 12 ? 'warning' : 'info'
                });
            }
        }
    });

    return results.sort((a, b) => (a.hours || 99) - (b.hours || 99));
};
