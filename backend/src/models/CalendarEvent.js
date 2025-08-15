import mongoose from 'mongoose';

const ReminderSchema = new mongoose.Schema(
  {
    minutesBefore: { type: Number, required: true },
  },
  { _id: false }
);

const CalendarEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    roomId: { type: String, default: null },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date },
    reminders: { type: [ReminderSchema], default: [] },
    deliveredReminders: { type: [Number], default: [] }, // store minutesBefore values already delivered
  },
  { timestamps: true }
);

CalendarEventSchema.index({ userId: 1, startAt: 1 });

export default mongoose.model('CalendarEvent', CalendarEventSchema);
