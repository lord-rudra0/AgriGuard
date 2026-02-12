
// Growth Engine: Biological Compliance Analytics
import { getStageConfig } from './StageEngine.js';

export const calculateGrowthProfile = async (chartData, selectedStageId = 'fruiting') => {
    const stageConfig = await getStageConfig(selectedStageId);
    if (!chartData || chartData.length === 0) return null;

    const requiredMetrics = ['temperature', 'humidity', 'co2'];
    let evaluablePoints = 0;
    let idealTime = 0;
    let stressTime = 0;

    const details = {
        temperature: { ideal: 0, stress: 0, compliance: 0, samples: 0 },
        humidity: { ideal: 0, stress: 0, compliance: 0, samples: 0 },
        co2: { ideal: 0, stress: 0, compliance: 0, samples: 0 }
    };

    chartData.forEach(d => {
        const hasAllMetrics = requiredMetrics.every((key) => typeof d[key] === 'number');
        if (!hasAllMetrics) {
            requiredMetrics.forEach((key) => {
                if (typeof d[key] === 'number') details[key].samples++;
            });
            return;
        }

        evaluablePoints++;
        let isPointIdeal = true;
        let isPointStress = false;

        requiredMetrics.forEach(key => {
            const val = d[key];
            const range = stageConfig.ideal[key];
            details[key].samples++;

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

    requiredMetrics.forEach(key => {
        const sampleCount = details[key].samples;
        details[key].compliance = sampleCount > 0
            ? Math.round((details[key].ideal / sampleCount) * 100)
            : 0;
    });

    const complianceScore = evaluablePoints > 0 ? Math.round((idealTime / evaluablePoints) * 100) : 0;
    const stressScore = evaluablePoints > 0 ? Math.round((stressTime / evaluablePoints) * 100) : 0;

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
            ideal: stageConfig.ideal,
            totalHours: evaluablePoints,
            inputRows: chartData.length,
            insufficientData: evaluablePoints === 0,
            isNightMode: stageConfig.isNightMode || false
        }
    };
};
