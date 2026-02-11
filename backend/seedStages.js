import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GrowthStage from './src/models/GrowthStage.js';

dotenv.config();

const STAGES = [
    {
        id: 'spawnRun',
        label: 'Spawn Run (Colonization)',
        description: 'Mushroom mycelium colonizes the substrate. High CO2 is beneficial for growth.',
        ideal: {
            temperature: { min: 24, max: 27, ideal: 25.5, weight: 0.3 },
            humidity: { min: 90, max: 100, ideal: 95, weight: 0.2 },
            co2: { min: 5000, max: 20000, ideal: 10000, weight: 0.5 },
            light: { min: 0, max: 100, ideal: 0, weight: 0.0 }
        }
    },
    {
        id: 'fruiting',
        label: 'Fruiting (Development)',
        description: 'Mushrooms begin to develop caps and stems. Requires lower temperatures and fresh air (low CO2).',
        ideal: {
            temperature: { min: 20, max: 24, ideal: 22, weight: 0.4 },
            humidity: { min: 85, max: 95, ideal: 90, weight: 0.4 },
            co2: { min: 400, max: 1000, ideal: 600, weight: 0.2 },
            light: { min: 100, max: 1000, ideal: 500, weight: 0.0 }
        }
    }
];

async function seedStages() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        for (const stage of STAGES) {
            await GrowthStage.findOneAndUpdate({ id: stage.id }, stage, { upsert: true, new: true });
            console.log(`Seeded stage: ${stage.label}`);
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedStages();
