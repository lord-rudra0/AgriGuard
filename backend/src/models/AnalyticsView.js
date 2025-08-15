import mongoose from 'mongoose';

const AnalyticsViewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    timeframe: { type: String, enum: ['1h', '24h', '7d', '30d'], default: '24h' },
    types: [{ type: String }], // e.g., ['temperature','humidity']
  },
  { timestamps: true }
);

export default mongoose.model('AnalyticsView', AnalyticsViewSchema);
