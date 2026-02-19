export const NEXT_FIELD_QUESTION = {
  title: "What should the event title be?",
  startAt: "What is the start date and time?",
  endAt: "What is the end date and time? You can say 'none'.",
  description: "Do you want to add a description? You can say 'none'.",
  roomId: "Do you want to assign this to a room? You can say 'none'.",
  reminderMinutes: "Any reminders in minutes before the event? Example: 15, 60. You can say 'none'.",
  confirm: "Please confirm: should I create this calendar event now?"
};

export const DEVICE_CONTROL_QUESTION = {
  device: "Which device should I control? Please provide device ID or name.",
  confirm: "Please confirm: should I send this device command now?",
  safetyConfirm: "Safety check: this is a high-risk command. Please explicitly confirm again to proceed."
};

export const AUTOMATION_RULE_QUESTION = {
  confirm: "Please confirm: should I create this automation rule now?"
};

export const REPORT_QUESTION = {
  confirmCreate: "Please confirm: should I create this report schedule now?",
  confirmRunNow: "Please confirm: should I send this report now?"
};

export const NOTIFICATION_QUESTION = {
  confirm: "Please confirm: should I send this push notification now?"
};

export const normalizeConfirm = (value) => {
  if (value === true) return true;
  const str = String(value || '').trim().toLowerCase();
  return ['true', 'yes', 'y', 'confirm', 'confirmed', 'ok', 'okay'].includes(str);
};

export const normalizeReminderMinutes = (value) => {
  if (Array.isArray(value)) {
    return value.filter((m) => Number.isFinite(Number(m))).map((m) => Number(m));
  }
  const str = String(value ?? '').trim().toLowerCase();
  if (!str || str === 'none' || str === 'no' || str === 'null') return [];
  return String(value)
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
};

export const normalizeOptionalText = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (!str) return null;
  if (str.toLowerCase() === 'none') return null;
  return str;
};

export const normalizeOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
};

export const toCalendarEventPayload = (event) => ({
  id: String(event._id),
  title: event.title,
  startAt: event.startAt,
  endAt: event.endAt || null
});

export const toAlertPayload = (alert) => ({
  id: String(alert._id),
  title: alert.title,
  severity: alert.severity,
  severityLevel: alert.severityLevel || null,
  confidence: alert.confidence ?? null,
  origin: alert.origin || 'reactive',
  riskCategory: alert.riskCategory || null,
  prediction: alert.prediction || null,
  message: alert.message,
  isResolved: !!alert.isResolved,
  isRead: !!alert.isRead
});

export const toThresholdPayload = (threshold) => ({
  id: String(threshold._id),
  name: threshold.name,
  metric: threshold.metric,
  roomId: threshold.roomId ?? null,
  min: threshold.min ?? null,
  max: threshold.max ?? null,
  severity: threshold.severity,
  enabled: !!threshold.enabled,
  notes: threshold.notes || '',
  updatedAt: threshold.updatedAt || null
});

export const toDevicePayload = (device) => ({
  id: String(device._id),
  name: device.name,
  deviceId: device.deviceId,
  active: !!device.active,
  lastSeenAt: device.lastSeenAt || null
});

export const toAutomationRulePayload = (rule) => ({
  id: String(rule._id),
  name: rule.name,
  metric: rule.metric,
  operator: rule.operator,
  value: rule.value ?? null,
  min: rule.min ?? null,
  max: rule.max ?? null,
  durationMinutes: Number(rule.durationMinutes || 0),
  cooldownMinutes: Number(rule.cooldownMinutes || 0),
  deviceId: rule.deviceId ?? null,
  action: {
    actuator: rule?.action?.actuator,
    state: rule?.action?.state,
    durationSeconds: rule?.action?.durationSeconds ?? null
  },
  enabled: !!rule.enabled,
  lastTriggeredAt: rule.lastTriggeredAt || null,
  notes: rule.notes || ''
});

export const toReportSchedulePayload = (schedule) => ({
  id: String(schedule._id),
  name: schedule.name,
  timeframe: schedule.timeframe,
  email: schedule.email,
  frequency: schedule.frequency,
  hourLocal: schedule.hourLocal,
  enabled: !!schedule.enabled,
  lastRunAt: schedule.lastRunAt || null
});

export const emitTalkAction = (socket, action, payload = {}) => {
  socket.emit('talk:action', { action, ...payload });
};
