import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['temperature', 'humidity', 'co2', 'light', 'soilMoisture', 'system', 'maintenance'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical', 'low', 'medium', 'high'],
    required: true
  },
  severityLevel: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'warning'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  origin: {
    type: String,
    enum: ['reactive', 'predictive', 'manual', 'system'],
    default: 'reactive'
  },
  riskCategory: {
    type: String,
    enum: ['disease', 'weather_stress', 'irrigation'],
    default: null
  },
  prediction: {
    windowMinutes: { type: Number, min: 1, default: null },
    score: { type: Number, min: 0, max: 100, default: null },
    basedOn: [{ type: String }]
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  value: {
    type: Number
  },
  threshold: {
    min: Number,
    max: Number
  },
  deviceId: {
    type: String,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actionTaken: {
    type: String,
    trim: true
  },
  notificationSent: {
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  followupEventId: {
    type: String,
    default: null,
    index: true
  },
  followupScheduledAt: {
    type: Date,
    default: null
  },
  followupSource: {
    type: String,
    enum: ['manual', 'auto'],
    default: null
  },
  followupProcessingAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
alertSchema.index({ userId: 1, createdAt: -1 });
alertSchema.index({ severity: 1, createdAt: -1 });
alertSchema.index({ type: 1, createdAt: -1 });
alertSchema.index({ isResolved: 1, createdAt: -1 });
alertSchema.index({ isRead: 1, createdAt: -1 });
alertSchema.index({ origin: 1, createdAt: -1 });
alertSchema.index({ riskCategory: 1, createdAt: -1 });

export default mongoose.model('Alert', alertSchema);
