import mongoose from 'mongoose';

const idealMetricSchema = new mongoose.Schema({
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    ideal: { type: Number, required: true },
    weight: { type: Number, default: 1 }
}, { _id: false });

const growthStageSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    label: { type: String, required: true },
    description: { type: String },
    ideal: {
        temperature: { type: idealMetricSchema, required: true },
        humidity: { type: idealMetricSchema, required: true },
        co2: { type: idealMetricSchema, required: true },
        light: { type: idealMetricSchema },
        soilMoisture: { type: idealMetricSchema }
    },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

export default mongoose.model('GrowthStage', growthStageSchema);
