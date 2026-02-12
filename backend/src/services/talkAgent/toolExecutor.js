import SensorData from '../../models/SensorData.js';
import ScanHistory from '../../models/ScanHistory.js';
import Alert from '../../models/Alert.js';
import CalendarEvent from '../../models/CalendarEvent.js';
import Threshold from '../../models/Threshold.js';

const NEXT_FIELD_QUESTION = {
  title: "What should the event title be?",
  startAt: "What is the start date and time?",
  endAt: "What is the end date and time? You can say 'none'.",
  description: "Do you want to add a description? You can say 'none'.",
  roomId: "Do you want to assign this to a room? You can say 'none'.",
  reminderMinutes: "Any reminders in minutes before the event? Example: 15, 60. You can say 'none'.",
  confirm: "Please confirm: should I create this calendar event now?"
};

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

const emitThresholdAction = (socket, action, payload) => {
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

const executeListThresholds = async (args, userId) => {
  const query = { userId };
  if (args?.metric) query.metric = String(args.metric);
  if (args?.roomId) query.roomId = String(args.roomId);

  const thresholds = await Threshold.find(query).sort({ updatedAt: -1 }).limit(100).lean();
  return { thresholds: thresholds.map(toThresholdPayload) };
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
