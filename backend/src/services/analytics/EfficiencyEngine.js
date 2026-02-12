
// Improvement #6: Efficiency Analytics with Baseline Context
export const calculateEfficiencyProfile = (chartData) => {
    if (!chartData || chartData.length === 0) return null;

    const result = {
        ventilation: { score: 100, status: 'Optimal', issue: null },
        water: { score: 100, status: 'Optimal', issue: null },
        energy: { score: 100, status: 'Optimal', issue: null },
    };

    let lowCo2Count = 0;
    let rapidCo2Fluctuation = 0;
    let overMistingCount = 0;
    let humidityDropCount = 0;
    let overLightingCount = 0;

    const sampleCounts = {
        co2: 0,
        co2Delta: 0,
        humidity: 0,
        humidityDelta: 0,
        light: 0
    };
    const minSamples = 3;

    // Improvement #6: Using historical farm baseline (simplified for logic)
    // In production, this would fetch from a Daily Aggregate baseline
    const BASELINE_CO2_MIN = 380;

    for (let i = 0; i < chartData.length; i++) {
        const d = chartData[i];
        const prev = i > 0 ? chartData[i - 1] : d;

        // 1. Ventilation (CO2)
        if (typeof d.co2 === 'number') {
            sampleCounts.co2++;
            if (d.co2 < BASELINE_CO2_MIN) lowCo2Count++;
        }
        if (typeof d.co2 === 'number' && typeof prev.co2 === 'number') {
            sampleCounts.co2Delta++;
            if (Math.abs(d.co2 - prev.co2) > 200) rapidCo2Fluctuation++;
        }

        // 2. Water (Humidity)
        if (typeof d.humidity === 'number') {
            sampleCounts.humidity++;
            if (d.humidity > 98) overMistingCount++;
        }
        if (typeof d.humidity === 'number' && typeof prev.humidity === 'number') {
            sampleCounts.humidityDelta++;
            if (prev.humidity - d.humidity > 15) humidityDropCount++;
        }

        // 3. Energy (Light)
        if (typeof d.light === 'number') {
            sampleCounts.light++;
            if (d.light > 500) overLightingCount++;
        }
    }

    // Ventilation Rules
    if (sampleCounts.co2 < minSamples) {
        result.ventilation.score = 0;
        result.ventilation.status = 'Insufficient Data';
        result.ventilation.issue = 'Not enough CO2 samples for ventilation efficiency analysis.';
    } else if (lowCo2Count > sampleCounts.co2 * 0.5) {
        result.ventilation.score = 60;
        result.ventilation.status = 'Over-Ventilating';
        result.ventilation.issue = 'Fans running excessively. CO2 is below ambient needs.';
    } else if (sampleCounts.co2Delta >= minSamples && rapidCo2Fluctuation > sampleCounts.co2Delta * 0.2) {
        result.ventilation.score = 75;
        result.ventilation.status = 'Unstable Cycling';
        result.ventilation.issue = 'Rapid CO2 swings detect fan cycling issues.';
    }

    // Water Rules
    if (sampleCounts.humidity < minSamples) {
        result.water.score = 0;
        result.water.status = 'Insufficient Data';
        result.water.issue = 'Not enough humidity samples for water efficiency analysis.';
    } else if (overMistingCount > sampleCounts.humidity * 0.3) {
        result.water.score = 50;
        result.water.status = 'Saturation Risk';
        result.water.issue = 'Humidity >98% for prolonged periods. Risk of bacterial blotch.';
    } else if (sampleCounts.humidityDelta >= minSamples && humidityDropCount > 3) {
        result.water.score = 80;
        result.water.status = 'Inefficient Misting';
        result.water.issue = 'Large humidity drops detected. Check sealings.';
    }

    // Energy Rules
    if (sampleCounts.light < minSamples) {
        result.energy.score = 0;
        result.energy.status = 'Insufficient Data';
        result.energy.issue = 'Not enough light samples for energy efficiency analysis.';
    } else {
        const lightOnPct = (overLightingCount / sampleCounts.light) * 100;
        if (lightOnPct > 60) {
            result.energy.score = 70;
            result.energy.status = 'High Consumption';
            result.energy.issue = 'Lighting duration exceeds 14 hours.';
        }
    }

    const scoreItems = [result.ventilation.score, result.water.score, result.energy.score];
    const validScores = scoreItems.filter((v) => typeof v === 'number' && v > 0);
    const overallScore = validScores.length > 0
        ? Math.round(validScores.reduce((sum, v) => sum + v, 0) / validScores.length)
        : 0;

    return { ...result, overallScore, sampleCounts };
};
