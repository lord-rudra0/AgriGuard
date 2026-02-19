import UserSettings from '../models/UserSettings.js';
import { toLegacySeverity } from './alerts/severity.js';

const SEVERITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

const parseHourMinute = (value, fallbackMinutes) => {
  const raw = String(value || '').trim();
  const match = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return fallbackMinutes;
  return Number(match[1]) * 60 + Number(match[2]);
};

const getLocalMinuteOfDay = (date, timezone) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
    return hour * 60 + minute;
  } catch {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }
};

export const isInQuietHours = ({ now = new Date(), timezone = 'UTC', quietStart = '22:00', quietEnd = '07:00' }) => {
  const minute = getLocalMinuteOfDay(now, timezone);
  const start = parseHourMinute(quietStart, 22 * 60);
  const end = parseHourMinute(quietEnd, 7 * 60);

  if (start === end) return false;
  if (start < end) return minute >= start && minute < end;
  return minute >= start || minute < end;
};

export const meetsSeverityThreshold = ({ eventSeverity = 'medium', minSeverity = 'low' }) => {
  const eventLegacy = toLegacySeverity(eventSeverity, 'medium');
  const eventRank = SEVERITY_RANK[String(eventLegacy || 'medium').toLowerCase()] || SEVERITY_RANK.medium;
  const minRank = SEVERITY_RANK[String(minSeverity || 'low').toLowerCase()] || SEVERITY_RANK.low;
  return eventRank >= minRank;
};

export const getNotificationPreferences = async (userId) => {
  const settings = await UserSettings.findOne({ userId }).lean();
  const notifications = settings?.notifications || {};
  const timezone = settings?.system?.timezone || 'UTC';

  return {
    timezone,
    emailNotifications: notifications.emailNotifications !== false,
    pushNotifications: notifications.pushNotifications !== false,
    minPushSeverity: String(notifications.minPushSeverity || 'low').toLowerCase(),
    minReportSeverity: String(notifications.minReportSeverity || 'low').toLowerCase(),
    pushQuietHours: {
      enabled: notifications.pushQuietHoursEnabled !== false,
      start: notifications.pushQuietHoursStart || '22:00',
      end: notifications.pushQuietHoursEnd || '07:00'
    },
    reportQuietHours: {
      enabled: notifications.reportQuietHoursEnabled !== false,
      start: notifications.reportQuietHoursStart || '22:00',
      end: notifications.reportQuietHoursEnd || '07:00'
    }
  };
};

export const evaluatePushDelivery = ({ prefs, severity = 'medium', now = new Date() }) => {
  if (!prefs.pushNotifications) return { allowed: false, deferred: false, reason: 'Push notifications are disabled' };
  if (!meetsSeverityThreshold({ eventSeverity: severity, minSeverity: prefs.minPushSeverity })) {
    return {
      allowed: false,
      deferred: false,
      reason: `Push severity threshold is '${prefs.minPushSeverity}'`
    };
  }
  if (
    prefs.pushQuietHours?.enabled &&
    isInQuietHours({
      now,
      timezone: prefs.timezone,
      quietStart: prefs.pushQuietHours.start,
      quietEnd: prefs.pushQuietHours.end
    })
  ) {
    return { allowed: false, deferred: true, reason: 'Current time is within push quiet hours' };
  }
  return { allowed: true, deferred: false };
};

export const evaluateReportDelivery = ({ prefs, now = new Date(), severity = 'medium' }) => {
  if (!prefs.emailNotifications) return { allowed: false, deferred: false, reason: 'Email notifications are disabled' };
  if (!meetsSeverityThreshold({ eventSeverity: severity, minSeverity: prefs.minReportSeverity })) {
    return {
      allowed: false,
      deferred: false,
      reason: `Report severity threshold is '${prefs.minReportSeverity}'`
    };
  }
  if (
    prefs.reportQuietHours?.enabled &&
    isInQuietHours({
      now,
      timezone: prefs.timezone,
      quietStart: prefs.reportQuietHours.start,
      quietEnd: prefs.reportQuietHours.end
    })
  ) {
    return { allowed: false, deferred: true, reason: 'Current time is within report quiet hours' };
  }
  return { allowed: true, deferred: false };
};
