import mongoose from 'mongoose';

const sensorHistorySchema = new mongoose.Schema({
    metadata: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        deviceId: {
            type: String,
            required: true,
            trim: true
        },
        sensorType: {
            type: String,
            enum: ['temperature', 'humidity', 'co2', 'light', 'soilMoisture'],
            required: true
        }
    },
    interval: {
        type: String,
        enum: ['hourly', 'daily', 'weekly'],
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    metrics: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
        avg: { type: Number, required: true },
        count: { type: Number, required: true }
    }
}, {
    timestamps: true
});

// Indexes for fast trend analysis
sensorHistorySchema.index({ 'metadata.userId': 1, interval: 1, startTime: -1 });
sensorHistorySchema.index({ 'metadata.deviceId': 1, interval: 1, startTime: -1 });
sensorHistorySchema.index({ startTime: -1, endTime: -1 });

export default mongoose.model('SensorHistory', sensorHistorySchema);
