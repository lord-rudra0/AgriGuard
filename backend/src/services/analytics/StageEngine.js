
import GrowthStage from '../../models/GrowthStage.js';

// Centralized configuration for growth stages (Improvement #12)
// This serves as the single source of truth for biological rules.

const FALLBACK_STAGES = {
    spawnRun: {
        id: 'spawnRun',
        label: 'Spawn Run (Colonization)',
        ideal: {
            temperature: { min: 24, max: 27, ideal: 25.5, weight: 0.3 },
            humidity: { min: 90, max: 100, ideal: 95, weight: 0.2 },
            co2: { min: 5000, max: 20000, ideal: 10000, weight: 0.5 },
            light: { min: 0, max: 100, ideal: 0, weight: 0.0 }
        }
    },
    fruiting: {
        id: 'fruiting',
        label: 'Fruiting (Development)',
        ideal: {
            temperature: { min: 20, max: 24, ideal: 22, weight: 0.4 },
            humidity: { min: 85, max: 95, ideal: 90, weight: 0.4 },
            co2: { min: 400, max: 1000, ideal: 600, weight: 0.2 },
            light: { min: 100, max: 1000, ideal: 500, weight: 0.0 }
        }
    }
};

export const getStageConfig = async (stageId = 'fruiting') => {
    let config;
    try {
        config = await GrowthStage.findOne({ id: stageId, isActive: true }).lean();
    } catch (error) {
        console.error('Error fetching growth stage from DB:', error);
    }

    if (!config) {
        config = JSON.parse(JSON.stringify(FALLBACK_STAGES[stageId] || FALLBACK_STAGES.fruiting));
    }

    // Improvement #1: Diurnal Shifting (Circadian Alignment)
    // Only apply to Fruiting stage as colonization (spawnRun) requires constant high heat.
    if (stageId === 'fruiting') {
        const hour = new Date().getHours();
        const isNight = hour >= 22 || hour < 6;
        if (isNight) {
            // Apply night shift: Lower temp, slightly higher humidity targets
            config.ideal.temperature.ideal -= 2;
            config.ideal.humidity.ideal = Math.min(100, config.ideal.humidity.ideal + 5);
            config.label += ' (Night Mode)';
            config.isNightMode = true;
        }
    }

    return config;
};

export const getAllStages = async () => {
    try {
        const stages = await GrowthStage.find({ isActive: true }).lean();
        if (stages.length > 0) {
            const result = {};
            stages.forEach(s => result[s.id] = s);
            return result;
        }
    } catch (e) {
        console.error('Error fetching all stages from DB:', e);
    }
    return FALLBACK_STAGES;
};

export const getCurrentStage = async (userId) => {
    // For now, default to Fruiting as per user demo requirements.
    return 'fruiting';
};
