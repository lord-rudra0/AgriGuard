import mongoose from 'mongoose';

const notificationTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String },
    auth: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('NotificationToken', notificationTokenSchema);
