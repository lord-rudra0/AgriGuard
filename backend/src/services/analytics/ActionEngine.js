
// Improvement #9: Priority-Based Recommendation Engine (Time-to-Failure)
// Improvement #1: Logic Moved to Backend
import { getStageConfig } from './StageEngine.js';

const toMetricKey = (targetMetric = '') => {
    const normalized = String(targetMetric).toLowerCase();
    if (normalized.includes('temperature') || normalized === 'temp') return 'temperature';
    if (normalized.includes('humidity') || normalized.includes('humid')) return 'humidity';
    if (normalized.includes('co2')) return 'co2';
    return null;
};

export const generateActionRecommendations = async (chartData, predictions = [], stageId = 'fruiting') => {
    if (!chartData || chartData.length === 0) return [];

    const stage = await getStageConfig(stageId);
    const { ideal } = stage;

    const latest = chartData[chartData.length - 1];
    const actions = [];
    let idCounter = 1;

    const MIN_POINTS_PER_METRIC = 12;
    const MIN_OUT_OF_RANGE_FRACTION = 0.2; // at least 20% of samples outside range

    const computeOutOfRangeShare = (metric, predicate) => {
        const points = chartData.filter((d) => typeof d[metric] === 'number');
        if (points.length < MIN_POINTS_PER_METRIC) return 0;
        const count = points.filter((d) => predicate(d[metric])).length;
        return count / points.length;
    };

    /**
     * Helper to score recommendations (Improvement #9)
     * score = basePriority + (24 - TTF) * weight
     */
    const addRecommendation = (props) => {
        const { type, title, action, description, iconName, riskReduction, stabilityGain, targetMetric, outOfRangeShare } = props;

        // Find relevant prediction for TTF logic
        const metricKey = toMetricKey(targetMetric);
        const prediction = predictions.find((p) => {
            if (metricKey && p.metric) return p.metric === metricKey;
            if (metricKey) return String(p.type || '').toLowerCase().includes(metricKey);
            return false;
        });
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
            outOfRangeShare: typeof outOfRangeShare === 'number'
                ? Number((outOfRangeShare * 100).toFixed(0))
                : null,
            impact: {
                riskReduction,
                stabilityGain,
                targetMetric
            }
        });
    };

    // 1. Biological Threshold Checks (Using Stage-Aware Ideals + duration)

    const tempHighShare = computeOutOfRangeShare('temperature', (v) => v > ideal.temperature.max);
    const tempLowShare = computeOutOfRangeShare('temperature', (v) => v < ideal.temperature.min);
    const humidityHighShare = computeOutOfRangeShare('humidity', (v) => v > ideal.humidity.max);
    const humidityLowShare = computeOutOfRangeShare('humidity', (v) => v < ideal.humidity.min);
    const co2HighShare = computeOutOfRangeShare('co2', (v) => v > ideal.co2.max);
    const co2LowShare = computeOutOfRangeShare('co2', (v) => v < ideal.co2.min);

    // Temp Logic
    if (
        typeof latest.temperature === 'number' &&
        latest.temperature > ideal.temperature.max &&
        tempHighShare >= MIN_OUT_OF_RANGE_FRACTION
    ) {
        addRecommendation({
            type: 'high',
            title: 'Temperature Too High',
            action: 'Increase Cooling/Ventilation',
            description: `Temp is ${latest.temperature.toFixed(1)}°C. Ideal max for ${stage.label} is ${ideal.temperature.max}°C.`,
            iconName: 'ThermometerSun',
            riskReduction: -15,
            stabilityGain: 10,
            targetMetric: 'Temperature',
            outOfRangeShare: tempHighShare
        });
    }
    if (
        typeof latest.temperature === 'number' &&
        latest.temperature < ideal.temperature.min &&
        tempLowShare >= MIN_OUT_OF_RANGE_FRACTION
    ) {
        addRecommendation({
            type: 'medium',
            title: 'Temperature Too Low',
            action: 'Check Heating System',
            description: `Temp is ${latest.temperature.toFixed(1)}°C. Ideal min is ${ideal.temperature.min}°C.`,
            iconName: 'ThermometerSnowflake',
            riskReduction: -10,
            stabilityGain: 5,
            targetMetric: 'Temperature',
            outOfRangeShare: tempLowShare
        });
    }

    // Humidity Logic
    if (
        typeof latest.humidity === 'number' &&
        latest.humidity > ideal.humidity.max &&
        humidityHighShare >= MIN_OUT_OF_RANGE_FRACTION
    ) {
        addRecommendation({
            type: 'high',
            title: 'Humidity Too High',
            action: 'Activate Dehumidifiers',
            description: `Humidity is ${latest.humidity.toFixed(1)}%. Target max: ${ideal.humidity.max}%.`,
            iconName: 'Droplets',
            riskReduction: -20,
            stabilityGain: 10,
            targetMetric: 'Humidity',
            outOfRangeShare: humidityHighShare
        });
    }
    if (
        typeof latest.humidity === 'number' &&
        latest.humidity < ideal.humidity.min &&
        humidityLowShare >= MIN_OUT_OF_RANGE_FRACTION
    ) {
        addRecommendation({
            type: 'high',
            title: 'Humidity Too Low',
            action: 'Apply Misting / Wet Walls',
            description: `Humidity is ${latest.humidity.toFixed(1)}%. Target min: ${ideal.humidity.min}%.`,
            iconName: 'Droplets',
            riskReduction: -20,
            stabilityGain: 10,
            targetMetric: 'Humidity',
            outOfRangeShare: humidityLowShare
        });
    }

    // CO2 Logic
    if (
        typeof latest.co2 === 'number' &&
        latest.co2 > ideal.co2.max &&
        co2HighShare >= MIN_OUT_OF_RANGE_FRACTION
    ) {
        addRecommendation({
            type: 'medium',
            title: 'High CO2 Concentration',
            action: 'Force Exhaust Fans',
            description: `CO2 is ${Math.round(latest.co2)}ppm. Recommended max for ${stage.label} is ${ideal.co2.max}ppm.`,
            iconName: 'Wind',
            riskReduction: -12,
            stabilityGain: 8,
            targetMetric: 'CO2',
            outOfRangeShare: co2HighShare
        });
    }
    if (
        typeof latest.co2 === 'number' &&
        latest.co2 < ideal.co2.min &&
        co2LowShare >= MIN_OUT_OF_RANGE_FRACTION
    ) {
        addRecommendation({
            type: 'medium',
            title: 'CO2 Too Low',
            action: 'Reduce Exhaust / Stabilize Air Exchange',
            description: `CO2 is ${Math.round(latest.co2)}ppm. Target min for ${stage.label} is ${ideal.co2.min}ppm.`,
            iconName: 'Wind',
            riskReduction: -8,
            stabilityGain: 6,
            targetMetric: 'CO2',
            outOfRangeShare: co2LowShare
        });
    }

    // 2. Pattern Matching Logic (Compound Risks)
    const heatStressTemp = ideal.temperature.max + 1;
    const heatStressHumidity = ideal.humidity.max;
    if (
        typeof latest.temperature === 'number' &&
        typeof latest.humidity === 'number' &&
        latest.temperature > heatStressTemp &&
        latest.humidity > heatStressHumidity
    ) {
        addRecommendation({
            type: 'critical',
            title: 'Mushroom Blotch Warning',
            action: 'Full Ventilation Purge',
            description: `Heat/moisture spike detected (${latest.temperature.toFixed(1)}°C, ${latest.humidity.toFixed(1)}%). Immediate purge recommended.`,
            iconName: 'AlertTriangle',
            riskReduction: -40,
            stabilityGain: 20,
            targetMetric: 'Overall Env'
        });
    }

    // If everything is within ideal ranges, return no recommendations.
    // The frontend will interpret this as \"no actions needed\" instead of showing a generic success card.
    if (actions.length === 0) {
        return [];
    }

    // Sort by Score/Priority (Imminent & Critical First)
    return actions.sort((a, b) => b.score - a.score);
};
