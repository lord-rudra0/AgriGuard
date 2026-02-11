
import { getStageConfig } from './StageEngine.js';

export const calculateStabilityProfile = (aggregatedData) => {
    // aggregatedData is expected to be sorted array of hourly data
    // Format: [{ _id: { sensorType, date, hour }, avgValue, ... }]

    const stage = getStageConfig('fruiting');
    const stabilityProfiles = {};
    const sensors = ['temperature', 'humidity', 'co2'];

    sensors.forEach(type => {
        // Filter data for this sensor
        const sensorData = aggregatedData.filter(d => d._id?.sensorType === type);

        if (sensorData.length === 0) {
            stabilityProfiles[type] = { score: 0, stableHours: 0, fluctuation: 0 };
            return;
        }

        const ideal = stage.ideal[type];
        const min = ideal.min;
        const max = ideal.max;

        let stableCount = 0;
        let diffSum = 0;
        let streak = 0;
        let maxStreak = 0;

        for (let i = 0; i < sensorData.length; i++) {
            const val = sensorData[i].avgValue;

            // Stability Check (Item 4: Dynamic Stage-Based Range)
            if (val >= min && val <= max) {
                stableCount++;
                streak++;
            } else {
                maxStreak = Math.max(maxStreak, streak);
                streak = 0;
            }

            // Fluctuation (Item 8: Rolling Variance concept simplified for summary)
            if (i > 0) {
                diffSum += Math.abs(val - sensorData[i - 1].avgValue);
            }
        }
        maxStreak = Math.max(maxStreak, streak); // Final check

        const score = Math.round((stableCount / sensorData.length) * 100);
        const fluctuation = sensorData.length > 1 ? (diffSum / (sensorData.length - 1)).toFixed(2) : 0;

        stabilityProfiles[type] = {
            score,
            stablePercent: score,
            unstablePercent: 100 - score,
            maxStable: maxStreak,
            fluctuation: Number(fluctuation),
            idealStdDev: 0 // Placeholder for future expansion
        };
    });

    return stabilityProfiles;
};
