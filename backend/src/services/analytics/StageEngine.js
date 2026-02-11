
// Centralized configuration for growth stages (Improvement #12)
// This serves as the single source of truth for biological rules.

const STAGES = {
    spawnRun: {
        id: 'spawnRun',
        label: 'Spawn Run (Colonization)',
        ideal: {
            temperature: { min: 24, max: 27, ideal: 25.5, weight: 0.3 },
            humidity: { min: 90, max: 100, ideal: 95, weight: 0.2 },
            co2: { min: 5000, max: 20000, ideal: 10000, weight: 0.5 }, // High CO2 is good
            light: { min: 0, max: 100, ideal: 0, weight: 0.0 } // Dark is better
        },
        durationDays: 14
    },
    fruiting: {
        id: 'fruiting',
        label: 'Fruiting (Development)',
        ideal: {
            temperature: { min: 20, max: 24, ideal: 22, weight: 0.4 },
            humidity: { min: 85, max: 95, ideal: 90, weight: 0.4 },
            co2: { min: 400, max: 1000, ideal: 600, weight: 0.2 }, // Low CO2 needed
            light: { min: 100, max: 1000, ideal: 500, weight: 0.0 }
        },
        durationDays: 7
    }
};

export const getStageConfig = (stageId = 'fruiting') => {
    return STAGES[stageId] || STAGES.fruiting;
};

export const getAllStages = () => STAGES;

// Future: Fetch active stage from DB based on userId/batchId
export const getCurrentStage = async (userId) => {
    // For now, default to Fruiting as per user demo requirements.
    // In production, this would query a Batch/Cycle model.
    return 'fruiting';
};
