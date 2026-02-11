
import { getStageConfig } from './StageEngine.js'; // Item 12: Centralized Config
import { normalizeRisk, calculateConfidence } from './AnalyticsCore.js'; // Item 2: Normalization, Item 7: Confidence

export const calculateRiskProfile = (sensorData, userId) => {
    // 1. Get Configuration (Stage-Aware)
    const stage = getStageConfig('fruiting'); // In future, fetch actual stage for userId
    const { ideal } = stage;

    // 2. Aggregate Data (Latest snapshot strategy for Real-time Risk)
    // For robust risk, we look at the last "valid" reading for each sensor
    // We assume sensorData is an array of recent readings

    // Sort slightly to be sure we have latest
    const latestMap = {};
    if (Array.isArray(sensorData)) {
        sensorData.forEach(d => {
            // If d is Aggregated (has _id.sensorType)
            if (d._id && d._id.sensorType) {
                // For aggregated history, we take the average of the last hour as "current"
                latestMap[d._id.sensorType] = d.avgValue;
            } else if (d.metadata && d.metadata.sensorType) {
                // Raw data
                latestMap[d.metadata.sensorType] = d.value;
            }
        });
    }

    const currentTemp = latestMap['temperature'] || 0;
    const currentHum = latestMap['humidity'] || 0;
    const currentCo2 = latestMap['co2'] || 0;

    // 3. Dynamic Normalization (Item 2)
    // Calculate risk per factor based on stage-specific weights

    // Temp Risk
    const tempRiskRaw = normalizeRisk(currentTemp, ideal.temperature.ideal, ideal.temperature.min, ideal.temperature.max);
    // Hum Risk
    const humRiskRaw = normalizeRisk(currentHum, ideal.humidity.ideal, ideal.humidity.min, ideal.humidity.max);
    // CO2 Risk
    const co2RiskRaw = normalizeRisk(currentCo2, ideal.co2.ideal, ideal.co2.min, ideal.co2.max);

    // 4. Weighted Sum (Item 2)
    let weightedSum =
        (tempRiskRaw * ideal.temperature.weight) +
        (humRiskRaw * ideal.humidity.weight) +
        (co2RiskRaw * ideal.co2.weight);

    // 5. Special Risk Patterns (Logic from old frontend, but formalized)
    // Heat Stress Multiplier: If Temp AND Hum are high, risk explodes
    if (currentTemp > 25 && currentHum > 70) {
        weightedSum *= 1.5;
    }

    // Mold Risk: If Temp Mod-High AND Hum Very High
    if (currentTemp > 22 && currentHum > 85) {
        weightedSum *= 1.3;
    }

    // Clamp to 0-100
    const finalRiskScore = Math.min(100, Math.round(weightedSum));

    // 6. Confidence Score (Item 7)
    // Simple mock based on data availability
    const dataPoints = Object.keys(latestMap).length;
    const expectedPoints = 3; // Temp, Hum, CO2
    const confidence = calculateConfidence(dataPoints, expectedPoints);

    // 7. Risk Classification
    let level = 'Low';
    let color = 'text-emerald-500';
    if (finalRiskScore > 70) { level = 'Critical'; color = 'text-rose-500'; }
    else if (finalRiskScore > 30) { level = 'Moderate'; color = 'text-amber-500'; }

    return {
        score: finalRiskScore,
        level,
        levelColor: color,
        confidence,
        breakdown: {
            temperature: Math.round(tempRiskRaw),
            humidity: Math.round(humRiskRaw),
            co2: Math.round(co2RiskRaw)
        },
        meta: {
            stage: stage.label,
            idealTemp: ideal.temperature.ideal
        }
    };
};
