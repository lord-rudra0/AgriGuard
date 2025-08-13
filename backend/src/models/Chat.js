import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  type: { type: String, enum: ['group', 'one-to-one'], required: true },
  name: { type: String }, // group name
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  avatar: { type: String }, // group avatar
  isAIGroup: { type: Boolean, default: false },
}, { timestamps: true });

chatSchema.index({ members: 1 });

export default mongoose.model('Chat', chatSchema);
