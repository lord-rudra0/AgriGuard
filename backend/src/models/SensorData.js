import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
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
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['safe', 'warning', 'danger'],
    default: 'safe'
  },
  metadata: {
    batteryLevel: Number,
    signalStrength: Number,
    calibrationDate: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
sensorDataSchema.index({ userId: 1, createdAt: -1 });
sensorDataSchema.index({ deviceId: 1, createdAt: -1 });
sensorDataSchema.index({ sensorType: 1, createdAt: -1 });
sensorDataSchema.index({ createdAt: -1 });

// Compound index for analytics queries
sensorDataSchema.index({ userId: 1, sensorType: 1, createdAt: -1 });

export default mongoose.model('SensorData', sensorDataSchema);