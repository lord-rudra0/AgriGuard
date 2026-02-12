
// Improvement #2: Dual-Window Smoothing
// Improvement #5: Statistical Significance Checks (R-Squared)
import { calculateMovingAverage, calculateSlope, calculateRSquared } from './AnalyticsCore.js';
import { getStageConfig } from './StageEngine.js';

export const calculatePredictiveForecasts = async (chartData, stageId = 'fruiting') => {
    // 1. Get Biological Bounds
    const stage = await getStageConfig(stageId);
    const { ideal } = stage;

    const MIN_POINTS = 10;
    if (!chartData || chartData.length < MIN_POINTS) return [];

    const grouped = {};
    chartData.forEach(d => {
        ['temperature', 'humidity', 'co2'].forEach(key => {
            if (d[key] !== undefined) {
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(d[key]);
            }
        });
    });

    const results = [];

    for (const key of Object.keys(grouped)) {
        let rawValues = grouped[key];

        // 2. Dual-Window Smoothing (Improvement #2)
        // Fast window to denoise, Slow window to find trend
        const fastSmoothed = calculateMovingAverage(rawValues, 3);
        if (fastSmoothed.length < 5) continue;

        const recentSet = fastSmoothed.slice(-24); // Last 24 points (e.g., 24h if hourly)

        // 3. Statistical Safety Gate (Improvement #5)
        const rSquared = calculateRSquared(recentSet);
        const slope = calculateSlope(recentSet);
        const currentVal = fastSmoothed[fastSmoothed.length - 1];

        const boundary = ideal[key];
        if (!boundary) continue;

        // Gate: Only forecast if R-Squared > 0.6 (Trend is coherent)
        // gate co2 higher because it's naturally jumpy
        const gate = key === 'co2' ? 0.5 : 0.6;

        if (rSquared > gate && Math.abs(slope) > (key === 'co2' ? 5 : 0.05)) {
            let predictedEvent = null;
            let timeToEvent = null;

            if (slope > 0 && currentVal < boundary.max) {
                timeToEvent = (boundary.max - currentVal) / slope;
                predictedEvent = 'High Limit Breach';
            } else if (slope < 0 && currentVal > boundary.min) {
                timeToEvent = (currentVal - boundary.min) / Math.abs(slope);
                predictedEvent = 'Low Limit Breach';
            }

            if (predictedEvent && timeToEvent < 48) { // Up to 48h forecast
                const sensorLabel = key === 'co2'
                    ? 'CO2'
                    : key === 'temperature'
                        ? 'Temperature'
                        : 'Humidity';

                results.push({
                    metric: key,
                    type: sensorLabel,
                    currentValue: Number(currentVal.toFixed(2)),
                    predictedValue: Number((currentVal + (slope * 24)).toFixed(2)),
                    unit: key === 'co2' ? 'ppm' : key === 'temperature' ? '°C' : '%',
                    insight: `${predictedEvent} expected in ${timeToEvent.toFixed(1)}h.`,
                    timeToEvent: Number(timeToEvent.toFixed(1)),
                    confidence: Math.round(rSquared * 100),
                    severity: timeToEvent < 6 ? 'critical' : timeToEvent < 24 ? 'warning' : 'info'
                });
            }
        }
    }

    return results.sort((a, b) => a.timeToEvent - b.timeToEvent);
};
