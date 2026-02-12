import { getStageConfig } from './StageEngine.js'; // Item 12: Centralized Config
import { normalizeRisk, calculateConfidence, calculateVPD } from './AnalyticsCore.js'; // Item 2, 7 & 3 (VPD)

export const calculateRiskProfile = async (sensorData, stageId = 'fruiting') => {
    // 1. Get Configuration (Stage-Aware)
    const stage = await getStageConfig(stageId);
    const { ideal } = stage;

    // 2. Aggregate Data
    const latestMap = {};
    if (Array.isArray(sensorData)) {
        sensorData.forEach(d => {
            if (d._id && d._id.sensorType) {
                latestMap[d._id.sensorType] = d.avgValue;
            } else if (d.metadata && d.metadata.sensorType) {
                latestMap[d.metadata.sensorType] = d.value;
            }
        });
    }

    const currentTemp = latestMap['temperature'] || 22;
    const currentHum = latestMap['humidity'] || 85;
    const currentCo2 = latestMap['co2'] || 600;

    // 3. Dynamic Normalization
    const tempRiskRaw = normalizeRisk(currentTemp, ideal.temperature.ideal, ideal.temperature.min, ideal.temperature.max);
    const humRiskRaw = normalizeRisk(currentHum, ideal.humidity.ideal, ideal.humidity.min, ideal.humidity.max);
    const co2RiskRaw = normalizeRisk(currentCo2, ideal.co2.ideal, ideal.co2.min, ideal.co2.max);

    // 4. VPD Calculation & Risk Fusion (Improvement #3)
    const currentVPD = calculateVPD(currentTemp, currentHum);
    // Biological Ideal VPD: 0.45 kPa. Safe range: 0.3 - 0.7
    const vpdRiskRaw = normalizeRisk(currentVPD, 0.45, 0.3, 0.7);

    // 5. Weighted Sum with VPD Fusion
    let weightedSum =
        (tempRiskRaw * 0.25) +
        (humRiskRaw * 0.25) +
        (co2RiskRaw * 0.2) +
        (vpdRiskRaw * 0.3); // High weight for fused VPD

    // Additional Multipliers for extreme extremes
    if (currentVPD < 0.2) weightedSum *= 1.4; // Extreme blotch risk
    if (currentVPD > 1.2) weightedSum *= 1.4; // Extreme dry risk

    const finalRiskScore = Math.min(100, Math.round(weightedSum));

    // 6. Confidence Score (Improved: Density + Entropy)
    const dataPoints = Object.keys(latestMap).length;

    // Calculate variance of temperature as a health proxy (entropy)
    const tempValues = sensorData
        .filter(d => (d.metadata?.sensorType || d._id?.sensorType) === 'temperature')
        .map(d => d.value ?? d.avgValue);

    let variance = 1;
    if (tempValues.length > 5) {
        const avg = tempValues.reduce((a, b) => a + b, 0) / tempValues.length;
        variance = tempValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / tempValues.length;
    }

    const latestTimestampMs = sensorData.reduce((maxTs, d) => {
        const ts = new Date(d.timestamp).getTime();
        return Number.isFinite(ts) ? Math.max(maxTs, ts) : maxTs;
    }, 0);
    const freshnessMinutes = latestTimestampMs > 0
        ? (Date.now() - latestTimestampMs) / (60 * 1000)
        : null;

    const confidence = calculateConfidence(dataPoints, 3, variance, {
        sampleCount: tempValues.length,
        freshnessMinutes,
        staleAfterMinutes: 30
    });

    // 7. Risk Classification
    let level = 'Low';
    let color = 'text-emerald-500';
    if (finalRiskScore > 70) { level = 'Critical'; color = 'text-rose-500'; }
    else if (finalRiskScore > 30) { level = 'Moderate'; color = 'text-amber-500'; }

    return {
        overallScore: finalRiskScore,
        level,
        levelColor: color,
        confidence,
        factors: [
            { name: 'Temperature', value: Math.round(tempRiskRaw), color: '#fbbf24' },
            { name: 'Humidity', value: Math.round(humRiskRaw), color: '#38bdf8' },
            { name: 'VPD Stress', value: Math.round(vpdRiskRaw), color: '#f43f5e' },
            { name: 'CO2', value: Math.round(co2RiskRaw), color: '#818cf8' }
        ],
        signals: [
            { name: 'VPD Metric', value: `${currentVPD} kPa`, type: 'purity' },
            { name: 'Transpiration', value: currentVPD < 0.3 ? 'Stalled' : currentVPD > 0.8 ? 'Excessive' : 'Optimal', type: 'thermal' }
        ],
        meta: {
            stage: stage.label,
            vpd: currentVPD
        }
    };
};
