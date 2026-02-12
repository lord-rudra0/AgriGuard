import mongoose from 'mongoose';
import { pruneStaleSubscriptions } from '../jobs/pruneSubscriptions.js';
import { runAutoAlertFollowups } from '../jobs/autoAlertFollowups.js';

const SCHEDULER_INTERVAL_MS = 5 * 60 * 1000;
const CAL_REMINDER_INTERVAL_MS = 60 * 1000;
const PRUNE_INTERVAL_MS = 6 * 60 * 60 * 1000;
const HISTORY_AGG_INTERVAL_MS = 60 * 60 * 1000;
const AUTO_FOLLOWUP_INTERVAL_MS = 5 * 60 * 1000;

let schedulerTimer = null;
let calTimer = null;
let pruneTimer = null;
let historyAggTimer = null;
let autoFollowupTimer = null;

const isSameLocalDate = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
};

const shouldRunScheduleNow = (schedule, now) => {
  const last = schedule.lastRunAt ? new Date(schedule.lastRunAt) : null;
  const runHour = Number.isFinite(Number(schedule.hourLocal)) ? Number(schedule.hourLocal) : 8;
  if (now.getHours() < runHour) return false;

  if (schedule.frequency === 'weekly') {
    if (now.getDay() === 0) return false;
    const currentWeekStart = getWeekStart(now);
    return !last || last < currentWeekStart;
  }

  return !last || !isSameLocalDate(last, now);
};

const startScheduler = async () => {
  if (schedulerTimer) return;
  try {
    const { default: ReportSchedule } = await import('../models/ReportSchedule.js');
    const { runScheduleAndEmail } = await import('../routes/reports.js');
    schedulerTimer = setInterval(async () => {
      try {
        const now = new Date();
        const items = await ReportSchedule.find({ enabled: true }).lean();
        for (const s of items) {
          if (shouldRunScheduleNow(s, now)) {
            const result = await runScheduleAndEmail(s, { respectQuietHours: true });
            if (!result?.sent) continue;
            await ReportSchedule.updateOne({ _id: s._id }, { $set: { lastRunAt: new Date() } });
          }
        }
      } catch (e) {
        console.error('Scheduler error', e);
      }
    }, SCHEDULER_INTERVAL_MS);
    console.log('✅ Scheduler started successfully');
  } catch (error) {
    console.error('❌ Failed to start scheduler:', error.message);
  }
};

const startCalendarReminderScheduler = async (io) => {
  if (calTimer) return;
  try {
    const { default: CalendarEvent } = await import('../models/CalendarEvent.js');
    const { default: Alert } = await import('../models/Alert.js');
    calTimer = setInterval(async () => {
      try {
        const now = new Date();
        const windowStart = new Date(now.getTime() - 60 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
        const candidates = await CalendarEvent.find({
          startAt: { $gte: windowStart, $lte: windowEnd },
          reminders: { $exists: true, $ne: [] },
        }).limit(1000);

        for (const ev of candidates) {
          const startMs = new Date(ev.startAt).getTime();
          for (const r of ev.reminders || []) {
            const minutes = Number(r.minutesBefore);
            if (!Number.isFinite(minutes)) continue;
            if (ev.deliveredReminders?.includes(minutes)) continue;
            if (Date.now() < startMs - minutes * 60 * 1000) continue;

            const alertDoc = await Alert.create({
              userId: ev.userId,
              type: 'system',
              severity: 'medium',
              title: 'Event Reminder',
              message: `${ev.title}${ev.roomId ? ' @ ' + ev.roomId : ''} starts at ${new Date(startMs).toLocaleString()}`,
            });

            io.to(`user_${String(ev.userId)}`).emit('newAlert', {
              type: 'system',
              severity: 'medium',
              title: 'Event Reminder',
              message: alertDoc.message,
              timestamp: new Date(),
            });

            await CalendarEvent.updateOne(
              { _id: ev._id },
              { $addToSet: { deliveredReminders: minutes } }
            );
          }
        }
      } catch (e) {
        console.error('Calendar reminder scheduler error', e);
      }
    }, CAL_REMINDER_INTERVAL_MS);
    console.log('✅ Calendar reminder scheduler started successfully');
  } catch (error) {
    console.error('❌ Failed to start calendar reminder scheduler:', error.message);
  }
};

const startPruneJob = async () => {
  if (pruneTimer) return;
  if (!process.env.MONGO_URI) return console.log('Prune job not started: MONGO_URI not configured');
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return console.log('Prune job not started: VAPID keys not configured');
  }

  pruneTimer = setInterval(async () => {
    try {
      await pruneStaleSubscriptions({ limit: 300 });
    } catch (e) {
      console.error('Prune job error', e);
    }
  }, PRUNE_INTERVAL_MS);
  console.log('✅ Prune job scheduled (every 6 hours)');
};

const startHistoryAggregationScheduler = async () => {
  if (historyAggTimer || !process.env.MONGO_URI) return;
  try {
    const { runHistoryAggregation } = await import('../jobs/aggregateHistory.js');
    runHistoryAggregation();
    historyAggTimer = setInterval(async () => runHistoryAggregation(), HISTORY_AGG_INTERVAL_MS);
    console.log('✅ Sensor history aggregation scheduler started (every 1 hour)');
  } catch (error) {
    console.error('❌ Failed to start history aggregation scheduler:', error.message);
  }
};

const startAutoFollowupScheduler = async (io) => {
  if (autoFollowupTimer) return;
  autoFollowupTimer = setInterval(async () => {
    try {
      await runAutoAlertFollowups({ io, limit: 200 });
    } catch (e) {
      console.error('Auto follow-up scheduler error', e);
    }
  }, AUTO_FOLLOWUP_INTERVAL_MS);
  console.log('✅ Auto follow-up scheduler started (every 5 minutes)');
};

export const startBackgroundJobs = ({ io }) => {
  setTimeout(() => {
    startScheduler();
    startCalendarReminderScheduler(io);
    startAutoFollowupScheduler(io);
  }, 5000);

  setTimeout(() => {
    startPruneJob();
  }, 10000);

  setTimeout(() => {
    startHistoryAggregationScheduler();
  }, 15000);
};

export const setupGracefulShutdown = ({ server }) => {
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
};
