
// Improvement #9: Priority-Based Recommendation Engine (Time-to-Failure)
// Improvement #1: Logic Moved to Backend
import { getStageConfig } from './StageEngine.js';

export const generateActionRecommendations = async (chartData, predictions = [], stageId = 'fruiting') => {
    if (!chartData || chartData.length === 0) return [];

    const stage = await getStageConfig(stageId);
    const { ideal } = stage;

    const latest = chartData[chartData.length - 1];
    const actions = [];
    let idCounter = 1;

    /**
     * Helper to score recommendations (Improvement #9)
     * score = basePriority + (24 - TTF) * weight
     */
    const addRecommendation = (props) => {
        const { type, title, action, description, iconName, riskReduction, stabilityGain, targetMetric } = props;

        // Find relevant prediction for TTF logic
        const prediction = predictions.find(p => p.type.toLowerCase().includes(targetMetric.toLowerCase()));
        const ttf = prediction ? prediction.timeToEvent : null;

        let baseScore = type === 'critical' ? 50 : type === 'high' ? 30 : 10;

        // TTF Premium: Boost score if event is imminent (within 6h)
        const ttfBoost = ttf && ttf < 6 ? (6 - ttf) * 10 : 0;

        actions.push({
            id: idCounter++,
            type,
            title,
            action,
            description,
            iconName,
            ttf: ttf ? Number(ttf.toFixed(1)) : null,
            score: baseScore + ttfBoost,
            impact: {
                riskReduction,
                stabilityGain,
                targetMetric
            }
        });
    };

    // 1. Biological Threshold Checks (Using Stage-Aware Ideals)

    // Temp Logic
    if (latest.temperature > ideal.temperature.max) {
        addRecommendation({
            type: 'high',
            title: 'Temperature Too High',
            action: 'Increase Cooling/Ventilation',
            description: `Temp is ${latest.temperature.toFixed(1)}°C. Ideal max for ${stage.label} is ${ideal.temperature.max}°C.`,
            iconName: 'ThermometerSun',
            riskReduction: -15,
            stabilityGain: 10,
            targetMetric: 'Temperature'
        });
    } else if (latest.temperature < ideal.temperature.min) {
        addRecommendation({
            type: 'medium',
            title: 'Temperature Too Low',
            action: 'Check Heating System',
            description: `Temp is ${latest.temperature.toFixed(1)}°C. Ideal min is ${ideal.temperature.min}°C.`,
            iconName: 'ThermometerSnowflake',
            riskReduction: -10,
            stabilityGain: 5,
            targetMetric: 'Temperature'
        });
    }

    // Humidity Logic
    if (latest.humidity > ideal.humidity.max) {
        addRecommendation({
            type: 'high',
            title: 'Humidity Too High',
            action: 'Activate Dehumidifiers',
            description: `Humidity is ${latest.humidity.toFixed(1)}%. Target max: ${ideal.humidity.max}%.`,
            iconName: 'Droplets',
            riskReduction: -20,
            stabilityGain: 10,
            targetMetric: 'Humidity'
        });
    } else if (latest.humidity < ideal.humidity.min) {
        addRecommendation({
            type: 'high',
            title: 'Humidity Too Low',
            action: 'Apply Misting / Wet Walls',
            description: `Humidity is ${latest.humidity.toFixed(1)}%. Target min: ${ideal.humidity.min}%.`,
            iconName: 'Droplets',
            riskReduction: -20,
            stabilityGain: 10,
            targetMetric: 'Humidity'
        });
    }

    // CO2 Logic
    if (latest.co2 > ideal.co2.max) {
        addRecommendation({
            type: 'medium',
            title: 'High CO2 Concentration',
            action: 'Force Exhaust Fans',
            description: `CO2 is ${Math.round(latest.co2)}ppm. Recommended max for ${stage.label} is ${ideal.co2.max}ppm.`,
            iconName: 'Wind',
            riskReduction: -12,
            stabilityGain: 8,
            targetMetric: 'CO2'
        });
    }

    // 2. Pattern Matching Logic (Compound Risks)
    if (latest.temperature > 25 && latest.humidity > 85) {
        addRecommendation({
            type: 'critical',
            title: 'Mushroom Blotch Warning',
            action: 'Full Ventilation Purge',
            description: 'Combination of high heat and moisture leads to bacterial blotch. Priority 1.',
            iconName: 'AlertTriangle',
            riskReduction: -40,
            stabilityGain: 20,
            targetMetric: 'Overall Env'
        });
    }

    if (actions.length === 0) {
        addRecommendation({
            type: 'success',
            title: 'Perfect Maintenance',
            action: 'Continue Current Flow',
            description: `All systems nominal for ${stage.label}.`,
            iconName: 'CheckCircle2',
            riskReduction: 0,
            stabilityGain: 2,
            targetMetric: 'Overall'
        });
    }

    // Sort by Score/Priority (Imminent & Critical First)
    return actions.sort((a, b) => b.score - a.score);
};
