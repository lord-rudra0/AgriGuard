import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import ReportSchedule from '../models/ReportSchedule.js';
import SensorData from '../models/SensorData.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Generate CSV from analytics aggregation
async function aggregateAnalytics(userId, timeframe = '24h') {
  let startDate;
  switch (timeframe) {
    case '1h':
      startDate = new Date(Date.now() - 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '24h':
    default:
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  const analytics = await SensorData.aggregate([
    { $match: { userId, createdAt: { $gte: startDate } } },
    { $group: {
      _id: {
        sensorType: '$sensorType',
        hour: { $hour: '$createdAt' },
        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      },
      avgValue: { $avg: '$value' },
      minValue: { $min: '$value' },
      maxValue: { $max: '$value' },
      count: { $sum: 1 },
    } },
    { $sort: { '_id.date': 1, '_id.hour': 1 } },
  ]);

  return { analytics, timeframe, startDate };
}

function toCSV(rows) {
  const headers = ['date', 'hour', 'sensorType', 'avgValue', 'minValue', 'maxValue', 'count'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const { sensorType, hour, date } = r._id || {};
    const vals = [date, hour, sensorType, r.avgValue, r.minValue, r.maxValue, r.count];
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

// POST /api/reports/export - returns CSV of analytics
router.post('/export', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '24h' } = req.body || {};
    const { analytics } = await aggregateAnalytics(req.user._id, timeframe);
    const csv = toCSV(analytics);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics_${timeframe}.csv"`);
    res.status(200).send(csv);
  } catch (e) {
    console.error('Export CSV error', e);
    res.status(500).json({ message: 'Failed to export CSV' });
  }
});

// Schedules CRUD
router.get('/schedules', authenticateToken, async (req, res) => {
  const items = await ReportSchedule.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ schedules: items });
});

router.post('/schedules', authenticateToken, async (req, res) => {
  const { name, timeframe = '24h', types = [], email, frequency = 'daily', hourLocal = 8, enabled = true } = req.body || {};
  if (!email || !name) return res.status(400).json({ message: 'Name and email are required' });
  const item = await ReportSchedule.create({ userId: req.user._id, name, timeframe, types, email, frequency, hourLocal, enabled });
  res.status(201).json({ schedule: item });
});

router.delete('/schedules/:id', authenticateToken, async (req, res) => {
  await ReportSchedule.deleteOne({ _id: req.params.id, userId: req.user._id });
  res.json({ ok: true });
});

// Minimal mailer
export async function sendEmailCSV(to, subject, text, csvString, filename) {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[reports] SMTP not configured, skipping email send');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'reports@agronex.local',
      to,
      subject,
      text,
      attachments: [{ filename, content: csvString, contentType: 'text/csv' }],
    });
    
    console.log(`[reports] Email sent to ${to}`);
  } catch (error) {
    console.error('[reports] Failed to send email:', error.message);
  }
}

// Helper to run one schedule (used by scheduler in server.js)
export async function runScheduleAndEmail(schedule) {
  const { analytics } = await aggregateAnalytics(schedule.userId, schedule.timeframe);
  const csv = toCSV(analytics);
  const subject = `AgroNex Analytics Report - ${schedule.name}`;
  const text = `Attached is your ${schedule.frequency} analytics report for timeframe ${schedule.timeframe}.`;
  await sendEmailCSV(schedule.email, subject, text, csv, `analytics_${schedule.timeframe}.csv`);
}

export default router;
