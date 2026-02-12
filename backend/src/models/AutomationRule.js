import mongoose from 'mongoose';

const automationRuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    metric: {
      type: String,
      enum: ['temperature', 'humidity', 'co2', 'light', 'soilMoisture'],
      required: true,
      index: true
    },
    operator: {
      type: String,
      enum: ['gt', 'gte', 'lt', 'lte', 'between', 'outside'],
      required: true
    },
    value: {
      type: Number,
      default: null
    },
    min: {
      type: Number,
      default: null
    },
    max: {
      type: Number,
      default: null
    },
    durationMinutes: {
      type: Number,
      default: 0
    },
    cooldownMinutes: {
      type: Number,
      default: 10
    },
    deviceId: {
      type: String,
      default: null,
      trim: true
    },
    action: {
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
      }
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true
    },
    lastTriggeredAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

automationRuleSchema.index({ userId: 1, enabled: 1, metric: 1, deviceId: 1 });

export default mongoose.model('AutomationRule', automationRuleSchema);
