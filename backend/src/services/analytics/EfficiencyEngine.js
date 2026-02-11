
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

    const totalPoints = chartData.length;

    // Improvement #6: Using historical farm baseline (simplified for logic)
    // In production, this would fetch from a Daily Aggregate baseline
    const BASELINE_CO2_MIN = 380;

    for (let i = 0; i < chartData.length; i++) {
        const d = chartData[i];
        const prev = i > 0 ? chartData[i - 1] : d;

        // 1. Ventilation (CO2)
        if (d.co2 < BASELINE_CO2_MIN) lowCo2Count++;
        if (Math.abs(d.co2 - prev.co2) > 200) rapidCo2Fluctuation++;

        // 2. Water (Humidity)
        if (d.humidity > 98) overMistingCount++;
        if (prev.humidity - d.humidity > 15) humidityDropCount++;

        // 3. Energy (Light)
        const light = d.light || 0;
        if (light > 500) overLightingCount++;
    }

    // Ventilation Rules
    if (lowCo2Count > totalPoints * 0.5) {
        result.ventilation.score = 60;
        result.ventilation.status = 'Over-Ventilating';
        result.ventilation.issue = 'Fans running excessively. CO2 is below ambient needs.';
    } else if (rapidCo2Fluctuation > totalPoints * 0.2) {
        result.ventilation.score = 75;
        result.ventilation.status = 'Unstable Cycling';
        result.ventilation.issue = 'Rapid CO2 swings detect fan cycling issues.';
    }

    // Water Rules
    if (overMistingCount > totalPoints * 0.3) {
        result.water.score = 50;
        result.water.status = 'Saturation Risk';
        result.water.issue = 'Humidity >98% for prolonged periods. Risk of bacterial blotch.';
    } else if (humidityDropCount > 3) {
        result.water.score = 80;
        result.water.status = 'Inefficient Misting';
        result.water.issue = 'Large humidity drops detected. Check sealings.';
    }

    // Energy Rules
    const lightOnPct = (overLightingCount / totalPoints) * 100;
    if (lightOnPct > 60) {
        result.energy.score = 70;
        result.energy.status = 'High Consumption';
        result.energy.issue = 'Lighting duration exceeds 14 hours.';
    }

    const overallScore = Math.round(
        (result.ventilation.score + result.water.score + result.energy.score) / 3
    );

    return { ...result, overallScore };
};
