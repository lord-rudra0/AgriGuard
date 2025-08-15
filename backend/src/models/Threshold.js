import mongoose from 'mongoose';

const ThresholdSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    metric: { type: String, enum: ['temperature','humidity','co2','light','soilMoisture'], required: true, index: true },
    roomId: { type: String, default: null }, // optional scope to a room
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    severity: { type: String, enum: ['info','warning','critical'], default: 'warning' },
    enabled: { type: Boolean, default: true },
    notes: { type: String }
  },
  { timestamps: true }
);

ThresholdSchema.index({ userId: 1, metric: 1, roomId: 1, name: 1 }, { unique: true });

export default mongoose.model('Threshold', ThresholdSchema);
