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
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
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

export default mongoose.model('Alert', alertSchema);