import mongoose from 'mongoose';

const notificationTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // --- Native Android / iOS (Capacitor Firebase Messaging) ---
  fcmToken: { type: String, default: null, index: true },
  platform: { type: String, enum: ['android', 'ios', 'web'], default: 'web' },

  // --- Web push (existing) ---
  endpoint: { type: String, default: null },
  keys: {
    p256dh: { type: String },
    auth: { type: String }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Keep updatedAt fresh on save
notificationTokenSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('NotificationToken', notificationTokenSchema);
