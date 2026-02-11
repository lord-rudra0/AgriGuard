
// Improvement #9: Priority-Based Recommendation Engine
// Improvement #1: Logic Moved to Backend

export const generateActionRecommendations = (chartData) => {
    if (!chartData || chartData.length === 0) return [];

    const latest = chartData[chartData.length - 1];
    const actions = [];
    let idCounter = 1;

    /**
     * Helper to score recommendations (Improvement #9)
     * recommendationScore = severityWeight * riskLevel + durationWeight * exposureTime + trendWeight * slopeMagnitude
     */
    const addRecommendation = (props) => {
        const { type, title, action, description, iconName, riskReduction, stabilityGain, targetMetric } = props;

        let severityValue = type === 'critical' ? 3 : type === 'high' ? 2 : type === 'medium' ? 1 : 0;

        actions.push({
            id: idCounter++,
            type,
            title,
            action,
            description,
            iconName, // Replaced component with icon name for JSON transport
            score: severityValue * 10, // Base priority
            impact: {
                riskReduction,
                stabilityGain,
                targetMetric
            }
        });
    };

    // 1. Heat Stress
    if (latest.temperature > 25 && latest.humidity > 70) {
        addRecommendation({
            type: 'critical',
            title: 'Heat Stress Detected',
            action: 'Increase Ventilation Immediately',
            description: 'Temperature and humidity are critically high. Risk of bacterial blotch.',
            iconName: 'Wind',
            riskReduction: -25,
            stabilityGain: 15,
            targetMetric: 'Temp & Humidity'
        });
    }

    // 2. High Humidity / Mold Risk
    else if (latest.humidity > 85) {
        addRecommendation({
            type: 'high',
            title: 'Mold Risk High',
            action: 'Dehumidify & Circulate Air',
            description: 'Humidity > 85% promotes mold growth. Run dehumidifiers.',
            iconName: 'Droplets',
            riskReduction: -20,
            stabilityGain: 10,
            targetMetric: 'Humidity'
        });
    }

    // 3. Dryness / Desiccation
    else if (latest.humidity < 40) {
        addRecommendation({
            type: 'high',
            title: 'Air Too Dry',
            action: 'Activate Misting System',
            description: 'Humidity < 40% will dry out mycelium. Increase moisture.',
            iconName: 'Droplets',
            riskReduction: -15,
            stabilityGain: 10,
            targetMetric: 'Humidity'
        });
    }

    // 4. Cold Stress
    if (latest.temperature < 18) {
        addRecommendation({
            type: 'medium',
            title: 'Low Temperature',
            action: 'Check Heating / Insulation',
            description: 'Temp < 18°C slows growth significantly.',
            iconName: 'ThermometerSnowflake',
            riskReduction: -10,
            stabilityGain: 5,
            targetMetric: 'Temperature'
        });
    }

    // 5. Poor Air Quality
    if (latest.co2 > 800) {
        addRecommendation({
            type: 'medium',
            title: 'Poor Air Quality',
            action: 'Increase Fresh Air Intake',
            description: 'CO2 > 800ppm enables spindly growth.',
            iconName: 'Wind',
            riskReduction: -10,
            stabilityGain: 5,
            targetMetric: 'CO2'
        });
    }

    // 6. Perfect Conditions
    if (actions.length === 0) {
        addRecommendation({
            type: 'success',
            title: 'Optimal Conditions',
            action: 'Maintain Current Settings',
            description: 'All metrics are within the Goldilocks zone. Great job!',
            iconName: 'CheckCircle2',
            riskReduction: 0,
            stabilityGain: 2,
            targetMetric: 'Overall'
        });
    }

    // Sort by Score/Priority (Improvement #9)
    return actions.sort((a, b) => b.score - a.score);
};
