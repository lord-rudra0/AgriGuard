import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  tokenLast4: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  lastSeenAt: {
    type: Date
  },
  metadata: {
    location: String,
    notes: String
  }
}, {
  timestamps: true
});

deviceSchema.index({ userId: 1, deviceId: 1 });
deviceSchema.index({ userId: 1, active: 1 });

export default mongoose.model('Device', deviceSchema);
