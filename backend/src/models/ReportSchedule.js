import mongoose from 'mongoose';

const ReportScheduleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    timeframe: { type: String, enum: ['1h', '24h', '7d', '30d'], default: '24h' },
    types: [{ type: String }],
    email: { type: String, required: true },
    frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    hourLocal: { type: Number, default: 8 }, // 0..23
    enabled: { type: Boolean, default: true },
    lastRunAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('ReportSchedule', ReportScheduleSchema);
