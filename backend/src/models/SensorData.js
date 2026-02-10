import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
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
    },
    location: {
      type: String,
      trim: true
    }
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['safe', 'warning', 'danger'],
    default: 'safe'
  },
  extra: {
    batteryLevel: Number,
    signalStrength: Number,
    calibrationDate: Date
  }
}, {
  // MongoDB Native Time Series Configuration
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'minutes'
  },
  // We disable timestamps: true because 'timestamp' is our manual time field
  // and Time Series collections are optimized for a single time field.
  timestamps: false
});

// Primary index for metadata filtering (MongoDB handles time index automatically in TS collections)
sensorDataSchema.index({ 'metadata.userId': 1, timestamp: -1 });
sensorDataSchema.index({ 'metadata.deviceId': 1, timestamp: -1 });

export default mongoose.model('SensorData', sensorDataSchema);