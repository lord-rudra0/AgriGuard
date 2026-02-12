
import SensorHistory from '../../models/SensorHistory.js';

/**
 * Baseline Engine: Historical Contextualization (Improvement #6)
 * Calculates the rolling 7-day baseline for sensors to compare against current data.
 */
export const calculateBaselines = async (userId) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
        const history = await SensorHistory.aggregate([
            {
                $match: {
                    'metadata.userId': userId,
                    interval: 'daily',
                    startTime: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: '$metadata.sensorType',
                    avgValue: { $avg: '$metrics.avg' },
                    minObserved: { $min: '$metrics.min' },
                    maxObserved: { $max: '$metrics.max' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const baselines = {};
        history.forEach(h => {
            baselines[h._id] = {
                baselineAvg: Number(h.avgValue.toFixed(2)),
                baselineMin: Number(h.minObserved.toFixed(2)),
                baselineMax: Number(h.maxObserved.toFixed(2)),
                daysAnalyzed: h.count
            };
        });

        return baselines;
    } catch (error) {
        console.error('Error calculating baselines:', error);
        return {};
    }
};

/**
 * Compares current value against the baseline to find deviation percentage.
 */
export const getBaselineDeviation = (currentVal, baseline) => {
    if (!baseline || baseline.baselineAvg === 0) return 0;
    const diff = currentVal - baseline.baselineAvg;
    return Number(((diff / baseline.baselineAvg) * 100).toFixed(1));
};
