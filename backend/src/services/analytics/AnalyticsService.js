
// Improvement #1: Unified Backend Analytics Service
import { calculateRiskProfile } from './RiskEngine.js';
import { calculateStabilityProfile } from './StabilityEngine.js';
import { calculateEfficiencyProfile } from './EfficiencyEngine.js';
import { calculateSystemHealthProfile } from './SystemHealthEngine.js';
import { calculatePredictiveForecasts } from './PredictiveEngine.js';
import { calculateGrowthProfile } from './GrowthEngine.js';
import { generateActionRecommendations } from './ActionEngine.js';
import { calculateBaselines, getBaselineDeviation } from './BaselineEngine.js'; // Item 6: Baselines

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
 */
export const getFullAnalytics = async (sensorData, historyData, userId, stageId = 'fruiting') => {
    // 1. Process Raw Recent Data for Real-time metrics (Risk, Recommendations, Predictive)
    // 2. Process Aggregated History for long-term metrics (Stability, Efficiency, SystemHealth, Growth)

    // Note: In a production environment, sensorData might be the last 100 points, 
    // and historyData might be hourly aggregates for the last 7 days.

    // Contract normalization:
    // - groupedHistory: [{ _id: { sensorType }, avgValue, timestamp }]
    // - wideHistory/wideRecent: [{ name/time, temperature?, humidity?, co2?, ... }]
    const groupedHistory = Array.isArray(historyData) ? historyData : [];
    const wideHistory = normalizeHistoryToWideRows(groupedHistory);
    const wideRecent = normalizeRawToWideRows(Array.isArray(sensorData) ? sensorData : []);

    // Compute all modules
    const risk = await calculateRiskProfile(sensorData, stageId);
    const predictions = await calculatePredictiveForecasts(wideRecent, stageId);
    const recommendations = await generateActionRecommendations(wideRecent, predictions, stageId);
    const stability = await calculateStabilityProfile(groupedHistory, stageId);
    const efficiency = calculateEfficiencyProfile(wideHistory);
    const health = calculateSystemHealthProfile(wideHistory);
    const growth = await calculateGrowthProfile(wideHistory, stageId);

    // Calculate Summary (Min, Max, Avg) for History
    const summary = {};
    const sensorTypes = [...new Set(groupedHistory.map(d => d._id?.sensorType).filter(Boolean))];

    // Get 7-Day Baselines (Improvement #6)
    const baselines = await calculateBaselines(userId);

    sensorTypes.forEach(type => {
        const values = groupedHistory
            .filter(d => d._id?.sensorType === type)
            .map(d => d.avgValue)
            .filter(v => typeof v === 'number');

        if (values.length > 0) {
            const currentAvg = values.reduce((a, b) => a + b, 0) / values.length;
            const b = baselines[type];

            summary[type] = {
                min: Math.round(Math.min(...values) * 10) / 10,
                max: Math.round(Math.max(...values) * 10) / 10,
                avg: Math.round(currentAvg * 10) / 10,
                baselineAvg: b ? b.baselineAvg : null,
                baselineDev: b ? getBaselineDeviation(currentAvg, b) : 0
            };
        }
    });

    // Improvement #7: Calculate Global Confidence
    const recencyCoverage = Math.min(100, Math.round((wideRecent.length / 3) * 100));
    const globalConfidence = Math.round(
        (risk.confidence * 0.35) + (health.systemConfidence * 0.5) + (recencyCoverage * 0.15)
    );

    return {
        timestamp: new Date(),
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
