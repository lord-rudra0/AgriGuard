
// Improvement #1: Unified Backend Analytics Service
import { calculateRiskProfile } from './RiskEngine.js';
import { calculateStabilityProfile } from './StabilityEngine.js';
import { calculateEfficiencyProfile } from './EfficiencyEngine.js';
import { calculateSystemHealthProfile } from './SystemHealthEngine.js';
import { calculatePredictiveForecasts } from './PredictiveEngine.js';
import { calculateGrowthProfile } from './GrowthEngine.js';
import { generateActionRecommendations } from './ActionEngine.js';

/**
 * Orchestrates the full analytics suite for a user.
 */
export const getFullAnalytics = async (sensorData, historyData, userId, stageId = 'fruiting') => {
    // 1. Process Raw Recent Data for Real-time metrics (Risk, Recommendations, Predictive)
    // 2. Process Aggregated History for long-term metrics (Stability, Efficiency, SystemHealth, Growth)

    // Note: In a production environment, sensorData might be the last 100 points, 
    // and historyData might be hourly aggregates for the last 7 days.

    // Convert historyData format to match expected 'chartData' if needed, 
    // or pass through if already formatted as array of objects.
    const chartData = historyData;

    // Compute all modules
    const risk = calculateRiskProfile(sensorData, userId);
    const recommendations = generateActionRecommendations(sensorData);
    const predictions = calculatePredictiveForecasts(sensorData);
    const stability = calculateStabilityProfile(historyData);
    const efficiency = calculateEfficiencyProfile(historyData);
    const health = calculateSystemHealthProfile(historyData);
    const growth = calculateGrowthProfile(historyData, stageId);

    // Calculate Summary (Min, Max, Avg) for History
    const summary = {};
    const sensorTypes = [...new Set(historyData.map(d => d._id?.sensorType).filter(Boolean))];

    sensorTypes.forEach(type => {
        const values = historyData
            .filter(d => d._id?.sensorType === type)
            .map(d => d.avgValue)
            .filter(v => typeof v === 'number');

        if (values.length > 0) {
            summary[type] = {
                min: Math.min(...values),
                max: Math.max(...values),
                avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
            };
        }
    });

    // Improvement #7: Calculate Global Confidence
    const globalConfidence = Math.round(
        (risk.confidence * 0.4) + (health.systemConfidence * 0.6)
    );

    return {
        timestamp: new Date(),
        globalConfidence,
        summary,
        risk,
        recommendations,
        predictions,
        stability,
        efficiency,
        health,
        growth
    };
};
