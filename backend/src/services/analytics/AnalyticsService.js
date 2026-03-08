
// Improvement #1: Unified Backend Analytics Service
import { calculateRiskProfile } from './RiskEngine.js';
import { calculateStabilityProfile } from './StabilityEngine.js';
import { calculateEfficiencyProfile } from './EfficiencyEngine.js';
import { calculateSystemHealthProfile } from './SystemHealthEngine.js';
import { calculatePredictiveForecasts } from './PredictiveEngine.js';
import { calculateGrowthProfile } from './GrowthEngine.js';
import { generateActionRecommendations } from './ActionEngine.js';
import { calculateBaselines, getBaselineDeviation } from './BaselineEngine.js'; // Item 6: Baselines
import { getStageConfig } from './StageEngine.js';

const toMs = (value) => {
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
};

const toISOStringSafe = (value) => {
    const ms = toMs(value);
    return ms === null ? null : new Date(ms).toISOString();
};

const normalizeRawToWideRows = (sensorData = []) => {
    const rows = {};

    sensorData.forEach((d) => {
        const sensorType = d?.metadata?.sensorType;
        const value = d?.value;
        const key = toISOStringSafe(d?.timestamp);
        if (!sensorType || typeof value !== 'number' || !key) return;

        if (!rows[key]) rows[key] = { name: key, time: key };
        rows[key][sensorType] = value;
    });

    return Object.values(rows).sort((a, b) => new Date(a.name) - new Date(b.name));
};

const normalizeHistoryToWideRows = (historyData = []) => {
    const rows = {};

    historyData.forEach((d) => {
        const sensorType = d?._id?.sensorType;
        const value = d?.avgValue;
        const key = toISOStringSafe(d?.timestamp);
        if (!sensorType || typeof value !== 'number' || !key) return;

        if (!rows[key]) rows[key] = { name: key, time: key };
        rows[key][sensorType] = value;
    });

    return Object.values(rows).sort((a, b) => new Date(a.name) - new Date(b.name));
};

/**
 * Orchestrates the full analytics suite for a user.
 *
 * sensorData: raw recent SensorData documents for the selected timeframe
 * historyData: aggregated/hourly SensorData documents for the same window
 */
export const getFullAnalytics = async (sensorData, historyData, userId, stageId = 'fruiting') => {
    // 1. Process Raw Recent Data for Real-time metrics (Risk, Recommendations, Predictive)
    // 2. Process Aggregated History for long-term metrics (Stability, Efficiency, SystemHealth, Growth)

    // Note: In a production environment, sensorData might be the last 100 points, 
    // and historyData might be hourly aggregates for the last 7 days.

    // Contract normalization:
    // - groupedHistory: [{ _id: { sensorType }, avgValue, timestamp }]
    // - wideHistory/wideRecent: [{ name/time, temperature?, humidity?, co2?, ... }]
    const rawRecent = Array.isArray(sensorData) ? sensorData : [];
    const groupedHistory = Array.isArray(historyData) ? historyData : [];
    const wideHistory = normalizeHistoryToWideRows(groupedHistory);
    const wideRecent = normalizeRawToWideRows(rawRecent);

    // Basic sample coverage metrics for UX
    const sampleCounts = {};
    let lastSampleAt = null;
    rawRecent.forEach((d) => {
        const type = d?.metadata?.sensorType;
        if (!type) return;
        sampleCounts[type] = (sampleCounts[type] || 0) + 1;
        const ts = d?.timestamp ? new Date(d.timestamp) : null;
        if (ts && Number.isFinite(ts.getTime())) {
            if (!lastSampleAt || ts > lastSampleAt) lastSampleAt = ts;
        }
    });
    const totalSamples = Object.values(sampleCounts).reduce((sum, n) => sum + n, 0);

    // Compute all modules
    const risk = await calculateRiskProfile(rawRecent, stageId);
    const predictions = await calculatePredictiveForecasts(wideRecent, stageId);
    const recommendations = await generateActionRecommendations(wideRecent, predictions, stageId);
    const stability = await calculateStabilityProfile(groupedHistory, stageId);
    const efficiency = calculateEfficiencyProfile(wideHistory);
    const health = calculateSystemHealthProfile(wideHistory);
    const growth = await calculateGrowthProfile(wideHistory, stageId);

    // Calculate Summary (Min, Max, Avg, time-in-range) for History
    const summary = {};
    const sensorTypes = [...new Set(groupedHistory.map(d => d._id?.sensorType).filter(Boolean))];

    // Get 7-Day Baselines (Improvement #6)
    const baselines = await calculateBaselines(userId);
    const stageConfig = await getStageConfig(stageId);

    sensorTypes.forEach(type => {
        const historyForType = groupedHistory
            .filter(d => d._id?.sensorType === type && typeof d.avgValue === 'number');
        const values = historyForType.map(d => d.avgValue).filter(v => typeof v === 'number');

        if (values.length > 0) {
            const currentAvg = values.reduce((a, b) => a + b, 0) / values.length;
            const b = baselines[type];

            // Time-in-range metrics (percentage of buckets in safe / near / danger bands)
            let safe = 0;
            let near = 0;
            let danger = 0;
            const idealRange = stageConfig?.ideal?.[type];
            if (idealRange && typeof idealRange.min === 'number' && typeof idealRange.max === 'number') {
                historyForType.forEach((row) => {
                    const v = row.avgValue;
                    if (!Number.isFinite(v)) return;
                    if (v >= idealRange.min && v <= idealRange.max) {
                        safe += 1;
                    } else if (v >= idealRange.min * 0.9 && v <= idealRange.max * 1.1) {
                        near += 1;
                    } else {
                        danger += 1;
                    }
                });
            }
            const totalBuckets = safe + near + danger;
            const safePct = totalBuckets > 0 ? Math.round((safe / totalBuckets) * 100) : null;
            const nearPct = totalBuckets > 0 ? Math.round((near / totalBuckets) * 100) : null;
            const dangerPct = totalBuckets > 0 ? Math.max(0, 100 - safePct - nearPct) : null;

            summary[type] = {
                min: Math.round(Math.min(...values) * 10) / 10,
                max: Math.round(Math.max(...values) * 10) / 10,
                avg: Math.round(currentAvg * 10) / 10,
                baselineAvg: b ? b.baselineAvg : null,
                baselineDev: b ? getBaselineDeviation(currentAvg, b) : 0,
                safePct,
                nearPct,
                dangerPct
            };
        }
    });

    // Improvement #7: Calculate Global Confidence
    const recencyCoverage = Math.min(100, Math.round((wideRecent.length / 3) * 100));
    const riskConfidence = Number(risk?.confidence);
    const healthConfidence = Number(health?.systemConfidence);
    const globalConfidence = Math.round(
        ((Number.isFinite(riskConfidence) ? riskConfidence : 0) * 0.35) +
        ((Number.isFinite(healthConfidence) ? healthConfidence : 0) * 0.5) +
        (recencyCoverage * 0.15)
    );

    return {
        timestamp: new Date(),
        totalSamples,
        sampleCounts,
        lastSampleAt,
        globalConfidence,
        summary,
        baselines, // Include full baseline objects for frontend
        risk,
        recommendations,
        predictions,
        stability,
        efficiency,
        health,
        growth
    };
};
