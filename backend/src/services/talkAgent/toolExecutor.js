import SensorData from '../../models/SensorData.js';
import ScanHistory from '../../models/ScanHistory.js';
import Alert from '../../models/Alert.js';
import CalendarEvent from '../../models/CalendarEvent.js';
import Threshold from '../../models/Threshold.js';
import Device from '../../models/Device.js';
import DeviceCommand from '../../models/DeviceCommand.js';
import AutomationRule from '../../models/AutomationRule.js';
import ReportSchedule from '../../models/ReportSchedule.js';

const NEXT_FIELD_QUESTION = {
  title: "What should the event title be?",
  startAt: "What is the start date and time?",
  endAt: "What is the end date and time? You can say 'none'.",
  description: "Do you want to add a description? You can say 'none'.",
  roomId: "Do you want to assign this to a room? You can say 'none'.",
  reminderMinutes: "Any reminders in minutes before the event? Example: 15, 60. You can say 'none'.",
  confirm: "Please confirm: should I create this calendar event now?"
};

const DEVICE_CONTROL_QUESTION = {
  device: "Which device should I control? Please provide device ID or name.",
  confirm: "Please confirm: should I send this device command now?",
  safetyConfirm: "Safety check: this is a high-risk command. Please explicitly confirm again to proceed."
};
const AUTOMATION_RULE_QUESTION = {
  confirm: "Please confirm: should I create this automation rule now?"
};
const REPORT_QUESTION = {
  confirmCreate: "Please confirm: should I create this report schedule now?",
  confirmRunNow: "Please confirm: should I send this report now?"
};
const HIGH_RISK_ACTUATORS = new Set(['pump', 'irrigation']);
const HIGH_RISK_DURATION_MINUTES = 15;

const normalizeConfirm = (value) => {
  if (value === true) return true;
  const str = String(value || '').trim().toLowerCase();
  return ['true', 'yes', 'y', 'confirm', 'confirmed', 'ok', 'okay'].includes(str);
};

const normalizeReminderMinutes = (value) => {
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

const toCalendarEventPayload = (event) => ({
  id: String(event._id),
  title: event.title,
  startAt: event.startAt,
  endAt: event.endAt || null
});

const emitCalendarAction = (socket, action, payload) => {
  socket.emit('talk:action', { action, ...payload });
};

const emitAlertAction = (socket, action, payload) => {
  socket.emit('talk:action', { action, ...payload });
};

const toAlertPayload = (alert) => ({
  id: String(alert._id),
  title: alert.title,
  severity: alert.severity,
  message: alert.message,
  isResolved: !!alert.isResolved,
  isRead: !!alert.isRead
});

const toThresholdPayload = (threshold) => ({
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

const toDevicePayload = (device) => ({
  id: String(device._id),
  name: device.name,
  deviceId: device.deviceId,
  active: !!device.active,
  lastSeenAt: device.lastSeenAt || null
});

const toAutomationRulePayload = (rule) => ({
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
const toReportSchedulePayload = (schedule) => ({
  id: String(schedule._id),
  name: schedule.name,
  timeframe: schedule.timeframe,
  email: schedule.email,
  frequency: schedule.frequency,
  hourLocal: schedule.hourLocal,
  enabled: !!schedule.enabled,
  lastRunAt: schedule.lastRunAt || null
});

const emitThresholdAction = (socket, action, payload) => {
  socket.emit('talk:action', { action, ...payload });
};
const emitAutomationAction = (socket, action, payload) => {
  socket.emit('talk:action', { action, ...payload });
};
const emitReportAction = (socket, action, payload) => {
  socket.emit('talk:action', { action, ...payload });
};

const normalizeOptionalText = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (!str) return null;
  if (str.toLowerCase() === 'none') return null;
  return str;
};

const normalizeOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
};

const resolveTargetDevice = async (args, userId) => {
  const requestedDeviceId = normalizeOptionalText(args?.deviceId);
  const requestedDeviceName = normalizeOptionalText(args?.deviceName);

  if (requestedDeviceId) {
    const device = await Device.findOne({ userId, deviceId: requestedDeviceId, active: true });
    return device ? { device } : { error: "Device not found or inactive" };
  }

  if (requestedDeviceName) {
    const matches = await Device.find({
      userId,
      active: true,
      name: { $regex: `^${requestedDeviceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    })
      .sort({ updatedAt: -1 })
      .limit(5);

    if (matches.length === 0) return { error: "No active device found with that name" };
    if (matches.length > 1) {
      return {
        needsMoreInfo: true,
        question: "I found multiple devices with that name. Please provide deviceId.",
        devices: matches.map(toDevicePayload)
      };
    }
    return { device: matches[0] };
  }

  const devices = await Device.find({ userId, active: true }).sort({ updatedAt: -1 }).limit(5);
  if (devices.length === 1) return { device: devices[0] };
  if (devices.length === 0) return { error: "No active devices found for your account" };

  return {
    needsMoreInfo: true,
    question: DEVICE_CONTROL_QUESTION.device,
    devices: devices.map(toDevicePayload)
  };
};

const executeListDevices = async (userId) => {
  const now = Date.now();
  const ONLINE_WINDOW_MS = 2 * 60 * 1000;

  const devices = await Device.find({ userId })
    .select('name deviceId active lastSeenAt createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean();

  return {
    devices: devices.map((d) => ({
      ...toDevicePayload(d),
      online: !!d.lastSeenAt && (now - new Date(d.lastSeenAt).getTime()) <= ONLINE_WINDOW_MS
    }))
  };
};

const executeControlDevice = async (args, userId, socket) => {
  const actuator = normalizeOptionalText(args?.actuator);
  const state = normalizeOptionalText(args?.state);
  if (!actuator || !['pump', 'fan', 'light', 'irrigation'].includes(actuator)) {
    return { error: "actuator must be one of: pump, fan, light, irrigation" };
  }
  if (!state || !['on', 'off'].includes(state)) {
    return { error: "state must be 'on' or 'off'" };
  }

  if (!normalizeConfirm(args?.confirm)) {
    return { needsMoreInfo: true, nextField: 'confirm', question: DEVICE_CONTROL_QUESTION.confirm };
  }

  const resolved = await resolveTargetDevice(args, userId);
  if (resolved.error || resolved.needsMoreInfo) return resolved;
  const device = resolved.device;

  const durationRaw = args?.durationMinutes;
  const durationMinutes = durationRaw === undefined || durationRaw === null || durationRaw === ''
    ? null
    : Number(durationRaw);
  if (durationMinutes !== null && (!Number.isFinite(durationMinutes) || durationMinutes <= 0)) {
    return { error: "durationMinutes must be a positive number when provided" };
  }

  const isHighRiskCommand = state === 'on'
    && HIGH_RISK_ACTUATORS.has(actuator)
    && (durationMinutes === null || durationMinutes > HIGH_RISK_DURATION_MINUTES);
  if (isHighRiskCommand && !normalizeConfirm(args?.safetyConfirm)) {
    return {
      needsMoreInfo: true,
      nextField: 'safetyConfirm',
      question: `${DEVICE_CONTROL_QUESTION.safetyConfirm} Actuator: ${actuator}, duration: ${durationMinutes ?? 'no auto-off set'}.`
    };
  }

  const durationSeconds = durationMinutes ? Math.round(durationMinutes * 60) : null;
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 10 * 60 * 1000);

  const command = await DeviceCommand.create({
    userId,
    deviceId: device.deviceId,
    actuator,
    state,
    durationSeconds: state === 'on' ? durationSeconds : null,
    source: 'talk_ai',
    status: 'pending',
    issuedAt,
    expiresAt,
    metadata: { requestedBy: userId }
  });

  const payload = {
    id: String(command._id),
    deviceId: command.deviceId,
    actuator: command.actuator,
    state: command.state,
    durationSeconds: command.durationSeconds,
    status: command.status,
    issuedAt: command.issuedAt
  };
  socket.emit('talk:action', { action: 'device_command_created', command: payload });
  return { success: true, command: payload };
};

const executeListThresholds = async (args, userId) => {
  const query = { userId };
  if (args?.metric) query.metric = String(args.metric);
  if (args?.roomId) query.roomId = String(args.roomId);

  const thresholds = await Threshold.find(query).sort({ updatedAt: -1 }).limit(100).lean();
  return { thresholds: thresholds.map(toThresholdPayload) };
};

const validateAutomationCondition = (operator, value, min, max) => {
  if (['gt', 'gte', 'lt', 'lte'].includes(operator)) {
    if (!Number.isFinite(value)) return "value is required for operator gt/gte/lt/lte";
  } else if (['between', 'outside'].includes(operator)) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return "min and max are required for operator between/outside";
    if (min >= max) return "min must be less than max";
  } else {
    return "operator must be one of: gt, gte, lt, lte, between, outside";
  }
  return null;
};

const executeListAutomationRules = async (args, userId) => {
  const query = { userId };
  if (args?.metric) query.metric = String(args.metric);
  if (args?.deviceId) query.deviceId = String(args.deviceId);

  const rules = await AutomationRule.find(query).sort({ updatedAt: -1 }).limit(100).lean();
  return { rules: rules.map(toAutomationRulePayload) };
};

const executeCreateAutomationRule = async (args, userId, socket) => {
  if (!normalizeConfirm(args?.confirm)) {
    return { needsMoreInfo: true, nextField: 'confirm', question: AUTOMATION_RULE_QUESTION.confirm };
  }

  const name = normalizeOptionalText(args?.name);
  const metric = normalizeOptionalText(args?.metric);
  const operator = normalizeOptionalText(args?.operator);
  const actuator = normalizeOptionalText(args?.actuator);
  const state = normalizeOptionalText(args?.state);
  if (!name || !metric || !operator || !actuator || !state) {
    return { error: "name, metric, operator, actuator, and state are required" };
  }

  const value = args?.value === undefined ? NaN : Number(args.value);
  const min = args?.min === undefined ? NaN : Number(args.min);
  const max = args?.max === undefined ? NaN : Number(args.max);
  const conditionError = validateAutomationCondition(operator, value, min, max);
  if (conditionError) return { error: conditionError };

  const durationMinutesRaw = args?.durationMinutes;
  const durationMinutes = durationMinutesRaw === undefined ? 0 : Number(durationMinutesRaw);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
    return { error: "durationMinutes must be a non-negative number" };
  }

  const cooldownMinutesRaw = args?.cooldownMinutes;
  const cooldownMinutes = cooldownMinutesRaw === undefined ? 10 : Number(cooldownMinutesRaw);
  if (!Number.isFinite(cooldownMinutes) || cooldownMinutes < 0) {
    return { error: "cooldownMinutes must be a non-negative number" };
  }

  const actionDurationMinutesRaw = args?.actionDurationMinutes;
  const actionDurationMinutes = actionDurationMinutesRaw === undefined || actionDurationMinutesRaw === null || actionDurationMinutesRaw === ''
    ? null
    : Number(actionDurationMinutesRaw);
  if (actionDurationMinutes !== null && (!Number.isFinite(actionDurationMinutes) || actionDurationMinutes <= 0)) {
    return { error: "actionDurationMinutes must be a positive number when provided" };
  }

  const rule = await AutomationRule.create({
    userId,
    name,
    metric,
    operator,
    value: ['gt', 'gte', 'lt', 'lte'].includes(operator) ? value : null,
    min: ['between', 'outside'].includes(operator) ? min : null,
    max: ['between', 'outside'].includes(operator) ? max : null,
    durationMinutes,
    cooldownMinutes,
    deviceId: normalizeOptionalText(args?.deviceId),
    action: {
      actuator,
      state,
      durationSeconds: actionDurationMinutes ? Math.round(actionDurationMinutes * 60) : null
    },
    enabled: args?.enabled === undefined ? true : Boolean(args.enabled),
    notes: normalizeOptionalText(args?.notes) || ''
  });

  const serialized = toAutomationRulePayload(rule);
  emitAutomationAction(socket, 'automation_rule_created', { rule: serialized });
  return { success: true, rule: serialized };
};

const executeToggleAutomationRule = async (args, userId, socket) => {
  const ruleId = normalizeOptionalText(args?.ruleId);
  if (!ruleId) return { error: "ruleId is required" };
  if (typeof args?.enabled !== 'boolean') return { error: "enabled must be true or false" };

  const rule = await AutomationRule.findOneAndUpdate(
    { _id: ruleId, userId },
    { $set: { enabled: args.enabled } },
    { new: true }
  );
  if (!rule) return { error: "Automation rule not found" };
  const serialized = toAutomationRulePayload(rule);
  emitAutomationAction(socket, 'automation_rule_updated', { rule: serialized });
  return { success: true, rule: serialized };
};

const executeDeleteAutomationRule = async (args, userId, socket) => {
  const ruleId = normalizeOptionalText(args?.ruleId);
  if (!ruleId) return { error: "ruleId is required" };

  const rule = await AutomationRule.findOneAndDelete({ _id: ruleId, userId });
  if (!rule) return { error: "Automation rule not found" };
  emitAutomationAction(socket, 'automation_rule_deleted', { ruleId });
  return { success: true, message: "Automation rule deleted", ruleId };
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
  if (!Number.isFinite(hourRaw) || hourRaw < 0 || hourRaw > 23) {
    return { error: "hourLocal must be between 0 and 23" };
  }

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
  emitReportAction(socket, 'report_schedule_created', { schedule: serialized });
  return { success: true, schedule: serialized };
};

const executeDeleteReportSchedule = async (args, userId, socket) => {
  const scheduleId = normalizeOptionalText(args?.scheduleId);
  if (!scheduleId) return { error: "scheduleId is required" };

  const schedule = await ReportSchedule.findOneAndDelete({ _id: scheduleId, userId });
  if (!schedule) return { error: "Report schedule not found" };

  emitReportAction(socket, 'report_schedule_deleted', { scheduleId });
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

  const { runScheduleAndEmail } = await import('../../routes/reports.js');
  await runScheduleAndEmail(schedule);

  if (scheduleId) {
    await ReportSchedule.updateOne({ _id: scheduleId, userId }, { $set: { lastRunAt: new Date() } });
  }

  emitReportAction(socket, 'report_sent', {
    scheduleId: scheduleId || null,
    email: schedule.email,
    timeframe: schedule.timeframe
  });
  return {
    success: true,
    message: "Report send triggered",
    report: {
      name: schedule.name,
      email: schedule.email,
      timeframe: schedule.timeframe
    }
  };
};

const executeCreateThreshold = async (args, userId, socket) => {
  const name = normalizeOptionalText(args?.name);
  const metric = normalizeOptionalText(args?.metric);
  if (!name || !metric) return { error: "name and metric are required" };

  const min = normalizeOptionalNumber(args?.min);
  const max = normalizeOptionalNumber(args?.max);
  if (Number.isNaN(min) || Number.isNaN(max)) {
    return { error: "min/max must be valid numbers when provided" };
  }
  if (min == null && max == null) {
    return { error: "At least one of min or max is required" };
  }
  if (min != null && max != null && min > max) {
    return { error: "min cannot be greater than max" };
  }

  const severity = normalizeOptionalText(args?.severity) || 'warning';
  const enabled = args?.enabled === undefined ? true : Boolean(args.enabled);
  const roomId = normalizeOptionalText(args?.roomId);
  const notes = normalizeOptionalText(args?.notes);

  try {
    const threshold = await Threshold.create({
      userId,
      name,
      metric,
      roomId,
      min,
      max,
      severity,
      enabled,
      notes
    });
    const serialized = toThresholdPayload(threshold);
    emitThresholdAction(socket, 'threshold_created', { threshold: serialized });
    return { success: true, threshold: serialized };
  } catch (err) {
    if (err?.code === 11000) {
      return { error: "A threshold with this name/metric/room already exists" };
    }
    throw err;
  }
};

const executeUpdateThreshold = async (args, userId, socket) => {
  const thresholdId = normalizeOptionalText(args?.thresholdId);
  if (!thresholdId) return { error: "thresholdId is required" };

  const existing = await Threshold.findOne({ _id: thresholdId, userId });
  if (!existing) return { error: "Threshold not found" };

  const updates = {};
  if (args?.name !== undefined) {
    const name = normalizeOptionalText(args.name);
    if (!name) return { error: "name cannot be empty" };
    updates.name = name;
  }
  if (args?.roomId !== undefined) updates.roomId = normalizeOptionalText(args.roomId);
  if (args?.notes !== undefined) updates.notes = normalizeOptionalText(args.notes) || '';
  if (args?.severity !== undefined) updates.severity = String(args.severity);
  if (args?.enabled !== undefined) updates.enabled = Boolean(args.enabled);
  if (args?.min !== undefined) {
    const min = normalizeOptionalNumber(args.min);
    if (Number.isNaN(min)) return { error: "min must be a valid number or null" };
    updates.min = min;
  }
  if (args?.max !== undefined) {
    const max = normalizeOptionalNumber(args.max);
    if (Number.isNaN(max)) return { error: "max must be a valid number or null" };
    updates.max = max;
  }

  const finalMin = updates.min !== undefined ? updates.min : existing.min;
  const finalMax = updates.max !== undefined ? updates.max : existing.max;
  if (finalMin != null && finalMax != null && finalMin > finalMax) {
    return { error: "min cannot be greater than max" };
  }

  try {
    const threshold = await Threshold.findOneAndUpdate({ _id: thresholdId, userId }, { $set: updates }, { new: true });
    const serialized = toThresholdPayload(threshold);
    emitThresholdAction(socket, 'threshold_updated', { threshold: serialized });
    return { success: true, threshold: serialized };
  } catch (err) {
    if (err?.code === 11000) {
      return { error: "A threshold with this name/metric/room already exists" };
    }
    throw err;
  }
};

const resolveSingleThreshold = async (args, userId) => {
  const thresholdId = normalizeOptionalText(args?.thresholdId);
  const name = normalizeOptionalText(args?.name);
  const metric = normalizeOptionalText(args?.metric);
  const roomId = normalizeOptionalText(args?.roomId);

  if (thresholdId) {
    const threshold = await Threshold.findOne({ _id: thresholdId, userId });
    return threshold ? { threshold } : { error: "Threshold not found" };
  }

  if (!name) {
    return { error: "Provide thresholdId, or provide name (optionally metric/roomId)" };
  }

  const query = { userId, name };
  if (metric) query.metric = metric;
  if (roomId) query.roomId = roomId;

  const matches = await Threshold.find(query).sort({ updatedAt: -1 }).limit(5);
  if (matches.length === 0) return { error: "Threshold not found" };
  if (matches.length > 1) {
    return {
      needsMoreInfo: true,
      question: "I found multiple thresholds with that name. Please provide thresholdId (or include metric/roomId).",
      matches: matches.map(toThresholdPayload)
    };
  }
  return { threshold: matches[0] };
};

const executeToggleThresholdEnabled = async (args, userId, socket) => {
  if (typeof args?.enabled !== 'boolean') {
    return { error: "enabled must be true or false" };
  }

  const resolved = await resolveSingleThreshold(args, userId);
  if (resolved.error || resolved.needsMoreInfo) return resolved;

  const threshold = await Threshold.findOneAndUpdate(
    { _id: resolved.threshold._id, userId },
    { $set: { enabled: args.enabled } },
    { new: true }
  );
  if (!threshold) return { error: "Threshold not found" };

  const serialized = toThresholdPayload(threshold);
  emitThresholdAction(socket, 'threshold_updated', { threshold: serialized });
  return { success: true, threshold: serialized };
};

const executeDeleteThreshold = async (args, userId, socket) => {
  const resolved = await resolveSingleThreshold(args, userId);
  if (resolved.error || resolved.needsMoreInfo) return resolved;

  const threshold = await Threshold.findOneAndDelete({ _id: resolved.threshold._id, userId });
  if (!threshold) return { error: "Threshold not found" };

  const deletedId = String(threshold._id);
  emitThresholdAction(socket, 'threshold_deleted', { thresholdId: deletedId });
  return { success: true, message: "Threshold deleted", thresholdId: deletedId };
};

const executeResolveAlert = async (args, userId, socket) => {
  const alertId = args?.alertId ? String(args.alertId) : null;
  if (!alertId) return { error: "alertId is required" };

  const update = {
    isResolved: true,
    resolvedAt: new Date(),
    resolvedBy: userId
  };
  if (args?.actionTaken) update.actionTaken = String(args.actionTaken);

  const alert = await Alert.findOneAndUpdate(
    { _id: alertId, userId },
    update,
    { new: true }
  );
  if (!alert) return { error: "Alert not found" };

  const serialized = toAlertPayload(alert);
  emitAlertAction(socket, 'alert_resolved', { alert: serialized });
  return { success: true, alert: serialized };
};

const executeEscalateAlert = async (args, userId, socket) => {
  const alertId = args?.alertId ? String(args.alertId) : null;
  const targetSeverity = args?.severity ? String(args.severity) : null;
  const allowed = ['medium', 'high', 'critical'];
  if (!alertId) return { error: "alertId is required" };
  if (!targetSeverity || !allowed.includes(targetSeverity)) {
    return { error: "severity must be one of: medium, high, critical" };
  }

  const alert = await Alert.findOneAndUpdate(
    { _id: alertId, userId },
    { severity: targetSeverity },
    { new: true }
  );
  if (!alert) return { error: "Alert not found" };

  const serialized = toAlertPayload(alert);
  emitAlertAction(socket, 'alert_escalated', { alert: serialized });
  return { success: true, alert: serialized };
};

const executeCreateAlertFollowupEvent = async (args, userId, socket) => {
  const alertId = args?.alertId ? String(args.alertId) : null;
  if (!alertId) return { error: "alertId is required" };

  const alert = await Alert.findOne({ _id: alertId, userId }).lean();
  if (!alert) return { error: "Alert not found" };

  let startAt = null;
  if (args?.startAt) {
    const parsed = new Date(args.startAt);
    if (Number.isNaN(parsed.getTime())) return { error: "startAt must be a valid datetime" };
    startAt = parsed;
  } else {
    const minutes = Number(args?.minutesFromNow);
    const delayMin = Number.isFinite(minutes) && minutes >= 0 ? minutes : 30;
    startAt = new Date(Date.now() + delayMin * 60 * 1000);
  }

  const reminderMinutes = normalizeReminderMinutes(args?.reminderMinutes);
  const title = args?.title
    ? String(args.title)
    : `Follow up: ${alert.title}`;
  const description = `Alert follow-up task\nSeverity: ${alert.severity}\nMessage: ${alert.message || ''}`;

  const event = await CalendarEvent.create({
    userId,
    title,
    description,
    roomId: alert.deviceId || null,
    startAt,
    reminders: reminderMinutes.map((m) => ({ minutesBefore: m }))
  });

  const serialized = toCalendarEventPayload(event);
  emitCalendarAction(socket, 'calendar_event_created', { event: serialized });
  return { success: true, event: serialized, sourceAlertId: alertId };
};

const ALERT_SEVERITY_ORDER = ['low', 'medium', 'high', 'critical'];

const getNextSeverity = (current = 'low') => {
  const idx = ALERT_SEVERITY_ORDER.indexOf(String(current));
  if (idx < 0 || idx >= ALERT_SEVERITY_ORDER.length - 1) return 'critical';
  return ALERT_SEVERITY_ORDER[idx + 1];
};

const buildAlertPlaybook = (alert) => {
  const recommendations = [];
  const severity = String(alert?.severity || 'low');

  if (severity === 'critical' || severity === 'high') {
    recommendations.push({
      action: 'followup',
      reason: 'High-severity alerts should have a tracked follow-up task.'
    });
    recommendations.push({
      action: 'escalate',
      reason: severity === 'critical'
        ? 'Already critical; escalation not applicable.'
        : `Escalate to ${getNextSeverity(severity)} if issue persists.`
    });
    recommendations.push({
      action: 'resolve',
      reason: 'Resolve only after mitigation is confirmed.'
    });
  } else {
    recommendations.push({
      action: 'resolve',
      reason: 'If condition has normalized, resolve to clear active queue.'
    });
    recommendations.push({
      action: 'followup',
      reason: 'Create follow-up task to verify stability.'
    });
    recommendations.push({
      action: 'escalate',
      reason: `Escalate to ${getNextSeverity(severity)} if repeated or worsening.`
    });
  }

  const recommendedAction = recommendations[0]?.action || 'followup';
  return { recommendedAction, recommendations };
};

const executeTriageAlert = async (args, userId, socket) => {
  const alertId = normalizeOptionalText(args?.alertId);
  if (!alertId) return { error: "alertId is required" };

  const alert = await Alert.findOne({ _id: alertId, userId });
  if (!alert) return { error: "Alert not found" };

  const playbook = buildAlertPlaybook(alert);
  const requestedAction = normalizeOptionalText(args?.action);
  const action = requestedAction || playbook.recommendedAction;
  const confirm = normalizeConfirm(args?.confirm);

  if (!confirm) {
    return {
      needsMoreInfo: true,
      nextField: 'confirm',
      question: `Recommended action is '${playbook.recommendedAction}'. Confirm to execute '${action}'?`,
      playbook: {
        alert: toAlertPayload(alert),
        ...playbook
      }
    };
  }

  if (action === 'resolve') {
    return executeResolveAlert({ alertId, actionTaken: 'Resolved via Talk AI triage playbook' }, userId, socket);
  }

  if (action === 'escalate') {
    const target = normalizeOptionalText(args?.escalateSeverity) || getNextSeverity(alert.severity);
    if (target === alert.severity) {
      return { success: true, message: `Alert is already at ${target} severity`, alert: toAlertPayload(alert) };
    }
    return executeEscalateAlert({ alertId, severity: target }, userId, socket);
  }

  if (action === 'followup') {
    const minsRaw = Number(args?.followupMinutes);
    const minutesFromNow = Number.isFinite(minsRaw) && minsRaw >= 0 ? minsRaw : 30;
    return executeCreateAlertFollowupEvent(
      { alertId, minutesFromNow, title: `Follow up: ${alert.title}` },
      userId,
      socket
    );
  }

  if (action === 'ignore') {
    return { success: true, message: 'No action executed for this alert.', alert: toAlertPayload(alert) };
  }

  return { error: "action must be one of: resolve, escalate, followup, ignore" };
};

const executeCalendarCreate = async (args, userId, socket) => {
  const collectionOrder = ['title', 'startAt', 'endAt', 'description', 'roomId', 'reminderMinutes'];
  const isConfirmed = normalizeConfirm(args?.confirm);

  if (!isConfirmed) {
    const firstMissing = collectionOrder.find((field) => args?.[field] === undefined);
    if (firstMissing) {
      return { needsMoreInfo: true, nextField: firstMissing, question: NEXT_FIELD_QUESTION[firstMissing] };
    }
    return { needsMoreInfo: true, nextField: 'confirm', question: NEXT_FIELD_QUESTION.confirm };
  }

  const startAt = args?.startAt ? new Date(args.startAt) : null;
  const noEndAt = args?.endAt === null
    || String(args?.endAt || '').trim().toLowerCase() === 'none'
    || String(args?.endAt || '').trim() === '';
  const endAt = noEndAt ? null : new Date(args.endAt);

  if (!args?.title || !startAt || Number.isNaN(startAt.getTime())) {
    return { error: "title and valid startAt are required" };
  }
  if (endAt && Number.isNaN(endAt.getTime())) {
    return { error: "endAt must be a valid datetime" };
  }

  const reminderMinutes = normalizeReminderMinutes(args.reminderMinutes);
  const description = args?.description && String(args.description).trim().toLowerCase() !== 'none'
    ? String(args.description)
    : '';
  const roomId = args?.roomId && String(args.roomId).trim().toLowerCase() !== 'none'
    ? String(args.roomId)
    : null;

  const event = await CalendarEvent.create({
    userId,
    title: String(args.title),
    description,
    roomId,
    startAt,
    endAt: endAt && !Number.isNaN(endAt.getTime()) ? endAt : undefined,
    reminders: reminderMinutes.map((m) => ({ minutesBefore: m }))
  });

  const serialized = toCalendarEventPayload(event);
  emitCalendarAction(socket, 'calendar_event_created', { event: serialized });
  return { success: true, event: serialized };
};

const executeCalendarList = async (args, userId) => {
  const startAt = args?.start ? new Date(args.start) : new Date();
  const endAt = args?.end ? new Date(args.end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const limitRaw = Number(args?.limit);
  const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 20, 100);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { error: "start/end must be valid datetimes" };
  }

  const events = await CalendarEvent.find({
    userId,
    startAt: { $gte: startAt, $lte: endAt }
  }).sort({ startAt: 1 }).limit(limit).lean();

  return {
    events: events.map((e) => ({
      id: String(e._id),
      title: e.title,
      startAt: e.startAt,
      endAt: e.endAt || null,
      description: e.description || ''
    }))
  };
};

const executeCalendarUpdate = async (args, userId, socket) => {
  const eventId = args?.eventId ? String(args.eventId) : null;
  if (!eventId) return { error: "eventId is required" };

  const updates = {};
  if (args?.title != null) updates.title = String(args.title);
  if (args?.description != null) updates.description = String(args.description);
  if (args?.roomId !== undefined) updates.roomId = args.roomId ? String(args.roomId) : null;

  if (args?.startAt) {
    const startAt = new Date(args.startAt);
    if (Number.isNaN(startAt.getTime())) return { error: "startAt must be a valid datetime" };
    updates.startAt = startAt;
  }
  if (args?.endAt !== undefined) {
    if (!args.endAt) {
      updates.endAt = undefined;
    } else {
      const endAt = new Date(args.endAt);
      if (Number.isNaN(endAt.getTime())) return { error: "endAt must be a valid datetime" };
      updates.endAt = endAt;
    }
  }
  if (Array.isArray(args?.reminderMinutes)) {
    const reminderMinutes = normalizeReminderMinutes(args.reminderMinutes);
    updates.reminders = reminderMinutes.map((m) => ({ minutesBefore: m }));
  }

  const event = await CalendarEvent.findOneAndUpdate({ _id: eventId, userId }, updates, { new: true });
  if (!event) return { error: "Event not found" };

  const serialized = toCalendarEventPayload(event);
  emitCalendarAction(socket, 'calendar_event_updated', { event: serialized });
  return { success: true, event: serialized };
};

const executeCalendarDelete = async (args, userId, socket) => {
  const eventId = args?.eventId ? String(args.eventId) : null;
  if (!eventId) return { error: "eventId is required" };

  const deleted = await CalendarEvent.deleteOne({ _id: eventId, userId });
  if (deleted.deletedCount > 0) {
    emitCalendarAction(socket, 'calendar_event_deleted', { eventId });
    return { success: true, message: "Event deleted" };
  }
  return { error: "Event not found" };
};

const executeTool = async (name, args, userId, socket) => {
  if (!userId) {
    return { error: "User context missing for tool execution. Please reconnect and try again." };
  }

  if (name === "navigate_to") {
    const pagePath = `/${args.page === 'dashboard' ? '' : args.page}`;
    socket.emit('talk:action', { action: 'navigate', path: pagePath });
    return { success: true, message: `Navigating to ${args.page} page now.` };
  }

  if (name === "get_latest_sensor_data") {
    const data = await SensorData.findOne({
      'metadata.userId': userId,
      'metadata.sensorType': args.sensorType
    }).sort({ timestamp: -1 });
    return data
      ? { value: data.value, unit: data.unit, timestamp: data.timestamp }
      : { message: "No data found for this sensor type." };
  }

  if (name === "list_devices") return executeListDevices(userId);
  if (name === "control_device") return executeControlDevice(args, userId, socket);

  if (name === "get_recent_scans") {
    const scans = await ScanHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('analysis createdAt');
    return { scans: scans.map((s) => ({ result: s.analysis, date: s.createdAt })) };
  }

  if (name === "get_active_alerts") {
    const query = { userId, isResolved: false };
    if (args.minSeverity) {
      const severities = ['low', 'medium', 'high', 'critical'];
      const minIdx = severities.indexOf(args.minSeverity);
      query.severity = { $in: severities.slice(minIdx) };
    }
    const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(10);
    return { alerts: alerts.map((a) => ({ title: a.title, severity: a.severity, message: a.message })) };
  }
  if (name === "resolve_alert") return executeResolveAlert(args, userId, socket);
  if (name === "escalate_alert") return executeEscalateAlert(args, userId, socket);
  if (name === "create_alert_followup_event") return executeCreateAlertFollowupEvent(args, userId, socket);
  if (name === "triage_alert") return executeTriageAlert(args, userId, socket);
  if (name === "list_automation_rules") return executeListAutomationRules(args, userId);
  if (name === "create_automation_rule") return executeCreateAutomationRule(args, userId, socket);
  if (name === "toggle_automation_rule") return executeToggleAutomationRule(args, userId, socket);
  if (name === "delete_automation_rule") return executeDeleteAutomationRule(args, userId, socket);
  if (name === "list_report_schedules") return executeListReportSchedules(userId);
  if (name === "create_report_schedule") return executeCreateReportSchedule(args, userId, socket);
  if (name === "delete_report_schedule") return executeDeleteReportSchedule(args, userId, socket);
  if (name === "run_report_now") return executeRunReportNow(args, userId, socket);
  if (name === "list_thresholds") return executeListThresholds(args, userId);
  if (name === "create_threshold") return executeCreateThreshold(args, userId, socket);
  if (name === "update_threshold") return executeUpdateThreshold(args, userId, socket);
  if (name === "toggle_threshold_enabled") return executeToggleThresholdEnabled(args, userId, socket);
  if (name === "delete_threshold") return executeDeleteThreshold(args, userId, socket);

  if (name === "create_calendar_event") return executeCalendarCreate(args, userId, socket);
  if (name === "list_calendar_events") return executeCalendarList(args, userId);
  if (name === "update_calendar_event") return executeCalendarUpdate(args, userId, socket);
  if (name === "delete_calendar_event") return executeCalendarDelete(args, userId, socket);

  return { error: "Function not found" };
};

export const handleToolCall = async (geminiWs, toolCall, socket) => {
  const responses = [];
  const userId = socket.user?._id || socket.user?.id;

  for (const call of toolCall.functionCalls) {
    const { name, args, id } = call;
    console.log(`[TalkAgent] Executing tool: ${name}`, args);

    let result;
    try {
      result = await executeTool(name, args, userId, socket);
    } catch (err) {
      console.error(`[TalkAgent] Tool error (${name}):`, err);
      result = { error: err.message };
    }

    responses.push({ name, id, response: result });
  }

  if (geminiWs && geminiWs.readyState === 1) {
    geminiWs.send(JSON.stringify({
      toolResponse: { functionResponses: responses }
    }));
    console.log(`[TalkAgent] Sent tool responses for ${responses.length} calls`);
  }
};
