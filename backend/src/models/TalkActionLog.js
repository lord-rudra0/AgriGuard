import mongoose from 'mongoose';

const talkActionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true
    },
    role: {
      type: String,
      default: 'unknown',
      index: true
    },
    toolName: {
      type: String,
      required: true,
      index: true
    },
    callId: {
      type: String,
      required: false
    },
    args: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['success', 'error', 'denied'],
      required: true,
      index: true
    },
    errorMessage: {
      type: String,
      default: ''
    },
    durationMs: {
      type: Number,
      default: 0
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  { timestamps: true }
);

talkActionLogSchema.index({ userId: 1, createdAt: -1 });
talkActionLogSchema.index({ toolName: 1, createdAt: -1 });

export default mongoose.model('TalkActionLog', talkActionLogSchema);
