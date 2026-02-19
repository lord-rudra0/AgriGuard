import ReportSchedule from '../../../models/ReportSchedule.js';
import NotificationToken from '../../../models/NotificationToken.js';
import Alert from '../../../models/Alert.js';
import Device from '../../../models/Device.js';
import { getNotificationPreferences, evaluatePushDelivery } from '../../notificationPreferences.js';
import { generateProactiveRiskAlerts } from '../../alerts/proactiveRiskAlerts.js';
import { toCanonicalSeverity } from '../../alerts/severity.js';
import {
  REPORT_QUESTION,
  NOTIFICATION_QUESTION,
  normalizeConfirm,
  normalizeOptionalText,
  toReportSchedulePayload,
  toAlertPayload,
  emitTalkAction
} from './shared.js';

let webpushModulePromise = null;
const getWebpush = async () => {
  if (!webpushModulePromise) {
    webpushModulePromise = import('web-push').catch(() => null);
  }
  return webpushModulePromise;
};

const sendPushToUser = async (userId, payload, options = {}) => {
  const severity = toCanonicalSeverity(options.severity || payload?.severity || 'warning');
  const prefs = await getNotificationPreferences(userId);
  const delivery = evaluatePushDelivery({ prefs, severity });
  if (!delivery.allowed) {
    return {
      sent: 0,
      failed: 0,
      deferred: !!delivery.deferred,
      skipped: true,
      message: delivery.reason || 'Push notification was blocked by user preferences'
    };
  }

  const tokens = await NotificationToken.find({ userId }).lean();
  if (!tokens || tokens.length === 0) return { sent: 0, failed: 0, message: "No push subscriptions found for this user" };
  const webpush = await getWebpush();
  if (!webpush) return { sent: 0, failed: tokens.length, message: "web-push not installed on server" };

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return { sent: 0, failed: tokens.length, message: "VAPID keys not configured on server" };
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const serializedPayload = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  for (const t of tokens) {
    const sub = { endpoint: t.endpoint, keys: { p256dh: t.keys?.p256dh, auth: t.keys?.auth } };
    try {
      await webpush.sendNotification(sub, serializedPayload);
      sent += 1;
    } catch (err) {
      failed += 1;
      if (err?.statusCode === 410) await NotificationToken.deleteOne({ _id: t._id });
    }
  }
  return { sent, failed };
};

const executeListReportSchedules = async (userId) => {
  const schedules = await ReportSchedule.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();
  return { schedules: schedules.map(toReportSchedulePayload) };
};

const executeCreateReportSchedule = async (args, userId, socket) => {
  if (!normalizeConfirm(args?.confirm)) {
    return { needsMoreInfo: true, nextField: 'confirm', question: REPORT_QUESTION.confirmCreate };
  }
  const name = normalizeOptionalText(args?.name);
  const email = normalizeOptionalText(args?.email);
  if (!name || !email) return { error: "name and email are required" };
  const timeframe = normalizeOptionalText(args?.timeframe) || '24h';
  const frequency = normalizeOptionalText(args?.frequency) || 'daily';
  const hourRaw = args?.hourLocal === undefined ? 8 : Number(args.hourLocal);
  if (!Number.isFinite(hourRaw) || hourRaw < 0 || hourRaw > 23) return { error: "hourLocal must be between 0 and 23" };

  const schedule = await ReportSchedule.create({
    userId,
    name,
    timeframe,
    email,
    frequency,
    hourLocal: Math.floor(hourRaw),
    enabled: args?.enabled === undefined ? true : Boolean(args.enabled)
  });
  const serialized = toReportSchedulePayload(schedule);
  emitTalkAction(socket, 'report_schedule_created', { schedule: serialized });
  return { success: true, schedule: serialized };
};

const executeDeleteReportSchedule = async (args, userId, socket) => {
  const scheduleId = normalizeOptionalText(args?.scheduleId);
  if (!scheduleId) return { error: "scheduleId is required" };
  const schedule = await ReportSchedule.findOneAndDelete({ _id: scheduleId, userId });
  if (!schedule) return { error: "Report schedule not found" };
  emitTalkAction(socket, 'report_schedule_deleted', { scheduleId });
  return { success: true, message: "Report schedule deleted", scheduleId };
};

const executeRunReportNow = async (args, userId, socket) => {
  if (!normalizeConfirm(args?.confirm)) {
    return { needsMoreInfo: true, nextField: 'confirm', question: REPORT_QUESTION.confirmRunNow };
  }
  const scheduleId = normalizeOptionalText(args?.scheduleId);
  let schedule = null;
  if (scheduleId) {
    schedule = await ReportSchedule.findOne({ _id: scheduleId, userId }).lean();
    if (!schedule) return { error: "Report schedule not found" };
  } else {
    const name = normalizeOptionalText(args?.name) || 'On-demand Report';
    const email = normalizeOptionalText(args?.email);
    if (!email) return { error: "email is required when scheduleId is not provided" };
    schedule = {
      userId,
      name,
      email,
      timeframe: normalizeOptionalText(args?.timeframe) || '24h',
      frequency: normalizeOptionalText(args?.frequency) || 'daily'
    };
  }

  const { runScheduleAndEmail } = await import('../../../routes/reports.js');
  const reportRun = await runScheduleAndEmail(schedule, { respectQuietHours: false });
  if (!reportRun?.sent) {
    return {
      success: false,
      message: reportRun?.reason || 'Report could not be sent due to notification preferences',
      report: { name: schedule.name, email: schedule.email, timeframe: schedule.timeframe }
    };
  }
  if (scheduleId) {
    await ReportSchedule.updateOne({ _id: scheduleId, userId }, { $set: { lastRunAt: new Date() } });
  }
  emitTalkAction(socket, 'report_sent', {
    scheduleId: scheduleId || null,
    email: schedule.email,
    timeframe: schedule.timeframe
  });
  return {
    success: true,
    message: "Report send triggered",
    report: { name: schedule.name, email: schedule.email, timeframe: schedule.timeframe }
  };
};

const executeSendPushNotification = async (args, userId, socket) => {
  if (!normalizeConfirm(args?.confirm)) {
    return { needsMoreInfo: true, nextField: 'confirm', question: NOTIFICATION_QUESTION.confirm };
  }
  const title = normalizeOptionalText(args?.title);
  const body = normalizeOptionalText(args?.body);
  if (!title || !body) return { error: "title and body are required" };
  const result = await sendPushToUser(userId, { title, body }, { severity: normalizeOptionalText(args?.severity) || 'warning' });
  emitTalkAction(socket, 'push_notification_sent', { title, body, ...result });
  return { success: true, title, body, ...result };
};

const executeGenerateProactiveAlerts = async (args, userId, socket) => {
  const deviceId = normalizeOptionalText(args?.deviceId);
  const minConfidenceRaw = Number(args?.minConfidence);
  const minConfidence = Number.isFinite(minConfidenceRaw) ? Math.max(0, Math.min(100, minConfidenceRaw)) : 55;
  const requestedCategories = Array.isArray(args?.categories)
    ? new Set(args.categories.map((v) => String(v || '').trim().toLowerCase()).filter(Boolean))
    : null;

  const devices = deviceId
    ? [{ deviceId }]
    : await Device.find({ userId, active: true }, { deviceId: 1 }).lean();
  if (!devices || devices.length === 0) return { success: true, generated: [], count: 0, message: 'No active devices found' };

  const collected = [];
  for (const d of devices) {
    const next = await generateProactiveRiskAlerts({
      userId,
      deviceId: d.deviceId,
      minConfidence,
      allowedCategories: requestedCategories
    });
    collected.push(...next);
  }

  const serialized = collected.map(toAlertPayload);
  emitTalkAction(socket, 'proactive_alerts_generated', {
    count: serialized.length,
    alerts: serialized
  });
  return {
    success: true,
    count: serialized.length,
    generated: serialized
  };
};

const executeNotifyAlert = async (args, userId, socket) => {
  if (!normalizeConfirm(args?.confirm)) {
    return { needsMoreInfo: true, nextField: 'confirm', question: NOTIFICATION_QUESTION.confirm };
  }
  const alertId = normalizeOptionalText(args?.alertId);
  if (!alertId) return { error: "alertId is required" };
  const alert = await Alert.findOne({ _id: alertId, userId });
  if (!alert) return { error: "Alert not found" };
  const title = `[${String(alert.severity || '').toUpperCase()}] ${alert.title}`;
  const body = alert.message || 'Alert triggered';
  const result = await sendPushToUser(
    userId,
    { title, body, alertId: String(alert._id) },
    { severity: String(alert.severityLevel || alert.severity || 'warning').toLowerCase() }
  );
  emitTalkAction(socket, 'alert_notification_sent', { alertId: String(alert._id), ...result });
  return { success: true, alert: toAlertPayload(alert), ...result };
};

export const executeReportNotificationTool = async (name, args, userId, socket) => {
  if (name === "list_report_schedules") return executeListReportSchedules(userId);
  if (name === "create_report_schedule") return executeCreateReportSchedule(args, userId, socket);
  if (name === "delete_report_schedule") return executeDeleteReportSchedule(args, userId, socket);
  if (name === "run_report_now") return executeRunReportNow(args, userId, socket);
  if (name === "send_push_notification") return executeSendPushNotification(args, userId, socket);
  if (name === "generate_proactive_alerts") return executeGenerateProactiveAlerts(args, userId, socket);
  if (name === "notify_alert") return executeNotifyAlert(args, userId, socket);
  return null;
};
