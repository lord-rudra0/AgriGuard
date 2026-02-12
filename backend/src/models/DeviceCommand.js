import mongoose from 'mongoose';

const deviceCommandSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    actuator: {
      type: String,
      enum: ['pump', 'fan', 'light', 'irrigation'],
      required: true
    },
    state: {
      type: String,
      enum: ['on', 'off'],
      required: true
    },
    durationSeconds: {
      type: Number,
      default: null
    },
    source: {
      type: String,
      enum: ['talk_ai', 'manual', 'automation'],
      default: 'talk_ai'
    },
    status: {
      type: String,
      enum: ['pending', 'delivered', 'executed', 'failed', 'expired', 'cancelled'],
      default: 'pending',
      index: true
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    expiresAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    resultMessage: {
      type: String,
      default: ''
    },
    metadata: {
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  },
  { timestamps: true }
);

deviceCommandSchema.index({ userId: 1, deviceId: 1, status: 1, issuedAt: -1 });

export default mongoose.model('DeviceCommand', deviceCommandSchema);
