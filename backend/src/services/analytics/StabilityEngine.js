import { getStageConfig } from './StageEngine.js';
import { calculateSlope } from './AnalyticsCore.js';

export const calculateStabilityProfile = (aggregatedData) => {
    const stage = getStageConfig('fruiting');
    const stabilityProfiles = {};
    const sensors = ['temperature', 'humidity', 'co2'];

    sensors.forEach(type => {
        const sensorData = aggregatedData.filter(d => d._id?.sensorType === type);

        if (sensorData.length === 0) {
            stabilityProfiles[type] = {
                score: 0,
                stablePercent: 0,
                unstablePercent: 0,
                maxStable: 0,
                maxUnstable: 0,
                fluctuation: 0,
                avgDev: 0,
                maxDelta: 0,
                spikeCount: 0,
                drift: 0,
                driftStatus: 'No Data'
            };
            return;
        }

        const ideal = stage.ideal[type];
        const min = ideal.min;
        const max = ideal.max;
        const target = ideal.ideal;

        let stableCount = 0;
        let diffSum = 0;
        let streak = 0;
        let maxStreak = 0;
        let unstableStreak = 0;
        let maxUnstableStreak = 0;
        let devSum = 0;
        let maxDelta = 0;
        let spikeCount = 0;

        const values = sensorData.map(d => d.avgValue);

        for (let i = 0; i < sensorData.length; i++) {
            const val = sensorData[i].avgValue;
            devSum += Math.abs(val - target);

            // Stability Check
            if (val >= min && val <= max) {
                stableCount++;
                streak++;
                maxUnstableStreak = Math.max(maxUnstableStreak, unstableStreak);
                unstableStreak = 0;
            } else {
                maxStreak = Math.max(maxStreak, streak);
                streak = 0;
                unstableStreak++;
            }

            // Delta & Spikes
            if (i > 0) {
                const delta = Math.abs(val - sensorData[i - 1].avgValue);
                diffSum += delta;
                maxDelta = Math.max(maxDelta, delta);

                const spikeThreshold = type === 'temperature' ? 2 : type === 'humidity' ? 10 : 150;
                if (delta > spikeThreshold) spikeCount++;
            }
        }
        maxStreak = Math.max(maxStreak, streak);
        maxUnstableStreak = Math.max(maxUnstableStreak, unstableStreak);

        const drift = Number(calculateSlope(values).toFixed(3));
        const driftStatus = drift > 0.05 ? 'Drifting Up' : drift < -0.05 ? 'Drifting Down' : 'Stable';

        const score = Math.round((stableCount / sensorData.length) * 100);
        const fluctuation = sensorData.length > 1 ? (diffSum / (sensorData.length - 1)).toFixed(2) : 0;

        stabilityProfiles[type] = {
            score,
            stablePercent: score,
            unstablePercent: 100 - score,
            maxStable: maxStreak,
            maxUnstable: maxUnstableStreak,
            fluctuation: Number(fluctuation),
            avgDev: Number((devSum / sensorData.length).toFixed(1)),
            maxDelta: Number(maxDelta.toFixed(1)),
            spikeCount,
            drift,
            driftStatus,
            stdDevIdeal: 0 // Placeholder
        };
    });

    return stabilityProfiles;
};
