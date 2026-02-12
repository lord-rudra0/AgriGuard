
// Growth Engine: Biological Compliance Analytics
import { getStageConfig } from './StageEngine.js';

export const calculateGrowthProfile = async (chartData, selectedStageId = 'fruiting') => {
    const stageConfig = await getStageConfig(selectedStageId);
    if (!chartData || chartData.length === 0) return null;

    let totalPoints = chartData.length;
    let idealTime = 0;
    let stressTime = 0;

    const details = {
        temperature: { ideal: 0, stress: 0, compliance: 0 },
        humidity: { ideal: 0, stress: 0, compliance: 0 },
        co2: { ideal: 0, stress: 0, compliance: 0 }
    };

    chartData.forEach(d => {
        let isPointIdeal = true;
        let isPointStress = false;

        ['temperature', 'humidity', 'co2'].forEach(key => {
            const val = d[key] || 0;
            const range = stageConfig.ideal[key];

            if (val >= range.min && val <= range.max) {
                details[key].ideal++;
            } else {
                isPointIdeal = false;
                // "Stress" defined as >10% deviation from safe boundaries
                if (val < range.min * 0.9 || val > range.max * 1.1) {
                    details[key].stress++;
                    isPointStress = true;
                }
            }
        });

        if (isPointIdeal) idealTime++;
        if (isPointStress) stressTime++;
    });

    ['temperature', 'humidity', 'co2'].forEach(key => {
        details[key].compliance = Math.round((details[key].ideal / totalPoints) * 100);
    });

    const complianceScore = Math.round((idealTime / totalPoints) * 100);
    const stressScore = Math.round((stressTime / totalPoints) * 100);

    // Improvement #Stress: Bio-Cumulative Stress Hours (BCSH)
    // A "Health Budget" logic. 20+ hours of stress is considered "Compromised"
    const STRESS_BUDGET = 20;
    const healthBudgetRemaining = Math.max(0, 100 - (stressTime / STRESS_BUDGET) * 100);

    return {
        complianceScore,
        stressScore,
        stressHours: stressTime,
        healthBudgetRemaining: Math.round(healthBudgetRemaining),
        stressStatus: stressTime > STRESS_BUDGET ? 'Compromised' : stressTime > 5 ? 'Warning' : 'Optimal',
        details,
        meta: {
            stageId: stageConfig.id,
            stageLabel: stageConfig.label,
            totalHours: totalPoints,
            isNightMode: stageConfig.isNightMode || false
        }
    };
};
