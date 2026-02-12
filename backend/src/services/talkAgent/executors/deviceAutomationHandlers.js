import Device from '../../../models/Device.js';
import DeviceCommand from '../../../models/DeviceCommand.js';
import AutomationRule from '../../../models/AutomationRule.js';
import {
  DEVICE_CONTROL_QUESTION,
  AUTOMATION_RULE_QUESTION,
  normalizeConfirm,
  normalizeOptionalText,
  toDevicePayload,
  toAutomationRulePayload,
  emitTalkAction
} from './shared.js';

const HIGH_RISK_ACTUATORS = new Set(['pump', 'irrigation']);
const HIGH_RISK_DURATION_MINUTES = 15;

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
    }).sort({ updatedAt: -1 }).limit(5);
    if (matches.length === 0) return { error: "No active device found with that name" };
    if (matches.length > 1) {
      return { needsMoreInfo: true, question: "I found multiple devices with that name. Please provide deviceId.", devices: matches.map(toDevicePayload) };
    }
    return { device: matches[0] };
  }
  const devices = await Device.find({ userId, active: true }).sort({ updatedAt: -1 }).limit(5);
  if (devices.length === 1) return { device: devices[0] };
  if (devices.length === 0) return { error: "No active devices found for your account" };
  return { needsMoreInfo: true, question: DEVICE_CONTROL_QUESTION.device, devices: devices.map(toDevicePayload) };
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
  if (!actuator || !['pump', 'fan', 'light', 'irrigation'].includes(actuator)) return { error: "actuator must be one of: pump, fan, light, irrigation" };
  if (!state || !['on', 'off'].includes(state)) return { error: "state must be 'on' or 'off'" };
  if (!normalizeConfirm(args?.confirm)) return { needsMoreInfo: true, nextField: 'confirm', question: DEVICE_CONTROL_QUESTION.confirm };

  const resolved = await resolveTargetDevice(args, userId);
  if (resolved.error || resolved.needsMoreInfo) return resolved;
  const device = resolved.device;

  const durationRaw = args?.durationMinutes;
  const durationMinutes = durationRaw === undefined || durationRaw === null || durationRaw === '' ? null : Number(durationRaw);
  if (durationMinutes !== null && (!Number.isFinite(durationMinutes) || durationMinutes <= 0)) {
    return { error: "durationMinutes must be a positive number when provided" };
  }
  const isHighRisk = state === 'on' && HIGH_RISK_ACTUATORS.has(actuator) && (durationMinutes === null || durationMinutes > HIGH_RISK_DURATION_MINUTES);
  if (isHighRisk && !normalizeConfirm(args?.safetyConfirm)) {
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
  emitTalkAction(socket, 'device_command_created', { command: payload });
  return { success: true, command: payload };
};

const executeListAutomationRules = async (args, userId) => {
  const query = { userId };
  if (args?.metric) query.metric = String(args.metric);
  if (args?.deviceId) query.deviceId = String(args.deviceId);
  const rules = await AutomationRule.find(query).sort({ updatedAt: -1 }).limit(100).lean();
  return { rules: rules.map(toAutomationRulePayload) };
};

const executeCreateAutomationRule = async (args, userId, socket) => {
  if (!normalizeConfirm(args?.confirm)) return { needsMoreInfo: true, nextField: 'confirm', question: AUTOMATION_RULE_QUESTION.confirm };
  const name = normalizeOptionalText(args?.name);
  const metric = normalizeOptionalText(args?.metric);
  const operator = normalizeOptionalText(args?.operator);
  const actuator = normalizeOptionalText(args?.actuator);
  const state = normalizeOptionalText(args?.state);
  if (!name || !metric || !operator || !actuator || !state) return { error: "name, metric, operator, actuator, and state are required" };
  const value = args?.value === undefined ? NaN : Number(args.value);
  const min = args?.min === undefined ? NaN : Number(args.min);
  const max = args?.max === undefined ? NaN : Number(args.max);
  const conditionError = validateAutomationCondition(operator, value, min, max);
  if (conditionError) return { error: conditionError };

  const durationMinutes = args?.durationMinutes === undefined ? 0 : Number(args.durationMinutes);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) return { error: "durationMinutes must be a non-negative number" };
  const cooldownMinutes = args?.cooldownMinutes === undefined ? 10 : Number(args.cooldownMinutes);
  if (!Number.isFinite(cooldownMinutes) || cooldownMinutes < 0) return { error: "cooldownMinutes must be a non-negative number" };

  const adm = args?.actionDurationMinutes;
  const actionDurationMinutes = adm === undefined || adm === null || adm === '' ? null : Number(adm);
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
    action: { actuator, state, durationSeconds: actionDurationMinutes ? Math.round(actionDurationMinutes * 60) : null },
    enabled: args?.enabled === undefined ? true : Boolean(args.enabled),
    notes: normalizeOptionalText(args?.notes) || ''
  });

  const serialized = toAutomationRulePayload(rule);
  emitTalkAction(socket, 'automation_rule_created', { rule: serialized });
  return { success: true, rule: serialized };
};

const executeToggleAutomationRule = async (args, userId, socket) => {
  const ruleId = normalizeOptionalText(args?.ruleId);
  if (!ruleId) return { error: "ruleId is required" };
  if (typeof args?.enabled !== 'boolean') return { error: "enabled must be true or false" };
  const rule = await AutomationRule.findOneAndUpdate({ _id: ruleId, userId }, { $set: { enabled: args.enabled } }, { new: true });
  if (!rule) return { error: "Automation rule not found" };
  const serialized = toAutomationRulePayload(rule);
  emitTalkAction(socket, 'automation_rule_updated', { rule: serialized });
  return { success: true, rule: serialized };
};

const executeDeleteAutomationRule = async (args, userId, socket) => {
  const ruleId = normalizeOptionalText(args?.ruleId);
  if (!ruleId) return { error: "ruleId is required" };
  const rule = await AutomationRule.findOneAndDelete({ _id: ruleId, userId });
  if (!rule) return { error: "Automation rule not found" };
  emitTalkAction(socket, 'automation_rule_deleted', { ruleId });
  return { success: true, message: "Automation rule deleted", ruleId };
};

export const executeDeviceAutomationTool = async (name, args, userId, socket) => {
  if (name === "list_devices") return executeListDevices(userId);
  if (name === "control_device") return executeControlDevice(args, userId, socket);
  if (name === "list_automation_rules") return executeListAutomationRules(args, userId);
  if (name === "create_automation_rule") return executeCreateAutomationRule(args, userId, socket);
  if (name === "toggle_automation_rule") return executeToggleAutomationRule(args, userId, socket);
  if (name === "delete_automation_rule") return executeDeleteAutomationRule(args, userId, socket);
  return null;
};
