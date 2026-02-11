
// Improvement #8: System Health with Robust Anomaly Detection
import { calculateMAD } from './AnalyticsCore.js';

export const calculateSystemHealthProfile = (chartData) => {
    if (!chartData || chartData.length === 0) return null;

    const sensors = {
        temperature: { reliability: 100, quality: 100, trust: 100, gaps: 0, noise: 0, label: 'Thermometer' },
        humidity: { reliability: 100, quality: 100, trust: 100, gaps: 0, noise: 0, label: 'Hygrometer' },
        co2: { reliability: 100, quality: 100, trust: 100, gaps: 0, noise: 0, label: 'CO2 Sensor' }
    };

    const totalPoints = chartData.length;
    let totalGaps = 0;

    // Pre-calculate MAD for each sensor to detect anomalies (Improvement #8)
    const sensorValues = { temperature: [], humidity: [], co2: [] };
    chartData.forEach(d => {
        if (d.temperature !== undefined) sensorValues.temperature.push(d.temperature);
        if (d.humidity !== undefined) sensorValues.humidity.push(d.humidity);
        if (d.co2 !== undefined) sensorValues.co2.push(d.co2);
    });

    const sensorMAD = {
        temperature: calculateMAD(sensorValues.temperature),
        humidity: calculateMAD(sensorValues.humidity),
        co2: calculateMAD(sensorValues.co2)
    };

    for (let i = 1; i < chartData.length; i++) {
        const curr = chartData[i];
        const prev = chartData[i - 1];

        // 1. Reliability (Gap Detection)
        const currTime = new Date(curr.time || curr.name).getTime();
        const prevTime = new Date(prev.time || prev.name).getTime();
        const diffHours = (currTime - prevTime) / 3600000;

        if (diffHours > 1.5) {
            const missedPoints = Math.floor(diffHours) - 1;
            totalGaps += missedPoints;
            Object.keys(sensors).forEach(k => sensors[k].gaps += missedPoints);
        }

        // 2. Data Quality (Improvement #8: Robust Anomaly Detection)
        ['temperature', 'humidity', 'co2'].forEach(key => {
            const val = curr[key];
            const prevVal = prev[key];
            if (val === undefined || prevVal === undefined) return;

            // Use MAD-based threshold if possible (3 * MAD is a standard robust threshold)
            // Fallback to static if MAD is too small (e.g. flat line)
            const threshold = Math.max(sensorMAD[key] * 3, key === 'temperature' ? 5 : key === 'humidity' ? 20 : 1000);

            if (Math.abs(val - prevVal) > threshold) {
                sensors[key].noise++;
            }
        });
    }

    let systemSumTrust = 0;
    Object.keys(sensors).forEach(key => {
        const s = sensors[key];
        const expectedTotal = totalPoints + s.gaps;
        s.reliability = Math.max(0, Math.round(((totalPoints) / expectedTotal) * 100));
        s.quality = Math.max(0, Math.round(((totalPoints - s.noise) / totalPoints) * 100));
        s.trust = Math.round((s.reliability * 0.6) + (s.quality * 0.4));
        systemSumTrust += s.trust;
    });

    const systemConfidence = Math.round(systemSumTrust / 3);

    return {
        sensors,
        systemConfidence,
        totalGaps,
        totalPoints
    };
};
