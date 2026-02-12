import AutomationRule from '../../models/AutomationRule.js';
import SensorData from '../../models/SensorData.js';
import DeviceCommand from '../../models/DeviceCommand.js';

const isFiniteNumber = (v) => Number.isFinite(Number(v));

const evaluateRuleCondition = (rule, value) => {
  const val = Number(value);
  if (!Number.isFinite(val)) return false;

  if (rule.operator === 'gt') return val > Number(rule.value);
  if (rule.operator === 'gte') return val >= Number(rule.value);
  if (rule.operator === 'lt') return val < Number(rule.value);
  if (rule.operator === 'lte') return val <= Number(rule.value);
  if (rule.operator === 'between') return val >= Number(rule.min) && val <= Number(rule.max);
  if (rule.operator === 'outside') return val < Number(rule.min) || val > Number(rule.max);
  return false;
};

const passesDurationWindow = async (rule, userId, deviceId, now) => {
  const durationMinutes = Number(rule.durationMinutes || 0);
  if (durationMinutes <= 0) return true;

  const windowStart = new Date(now.getTime() - durationMinutes * 60 * 1000);
  const samples = await SensorData.find(
    {
      'metadata.userId': userId,
      'metadata.deviceId': deviceId,
      'metadata.sensorType': rule.metric,
      timestamp: { $gte: windowStart, $lte: now }
    },
    { value: 1, timestamp: 1 }
  )
    .sort({ timestamp: 1 })
    .lean();

  if (samples.length === 0) return false;
  return samples.every((s) => evaluateRuleCondition(rule, s.value));
};

export const evaluateAutomationsForReadings = async ({
  userId,
  deviceId,
  readings = [],
  io = null
}) => {
  if (!userId || !deviceId || !Array.isArray(readings) || readings.length === 0) {
    return { triggered: [] };
  }

  const normalized = readings
    .map((r) => ({
      type: r?.type || r?.metadata?.sensorType,
      value: Number(r?.value),
      timestamp: r?.timestamp ? new Date(r.timestamp) : new Date()
    }))
    .filter((r) => r.type && Number.isFinite(r.value));
  if (normalized.length === 0) return { triggered: [] };

  const metricSet = [...new Set(normalized.map((r) => r.type))];
  const now = new Date();
  const rules = await AutomationRule.find({
    userId,
    enabled: true,
    metric: { $in: metricSet },
    $or: [{ deviceId: null }, { deviceId }]
  });

  if (rules.length === 0) return { triggered: [] };

  const triggered = [];
  const triggeredRuleIds = new Set();

  for (const reading of normalized) {
    const candidates = rules.filter((r) => r.metric === reading.type);
    for (const rule of candidates) {
      const ruleId = String(rule._id);
      if (triggeredRuleIds.has(ruleId)) continue;
      if (!evaluateRuleCondition(rule, reading.value)) continue;

      const cooldownMinutes = Math.max(Number(rule.cooldownMinutes || 0), 0);
      if (rule.lastTriggeredAt) {
        const since = now.getTime() - new Date(rule.lastTriggeredAt).getTime();
        if (since < cooldownMinutes * 60 * 1000) continue;
      }

      const sustained = await passesDurationWindow(rule, userId, deviceId, now);
      if (!sustained) continue;

      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
      const durationSeconds = isFiniteNumber(rule?.action?.durationSeconds)
        ? Number(rule.action.durationSeconds)
        : null;
      const command = await DeviceCommand.create({
        userId,
        deviceId,
        actuator: rule.action.actuator,
        state: rule.action.state,
        durationSeconds: rule.action.state === 'on' ? durationSeconds : null,
        source: 'automation',
        status: 'pending',
        issuedAt: now,
        expiresAt
      });

      rule.lastTriggeredAt = now;
      await rule.save();

      const payload = {
        ruleId,
        ruleName: rule.name,
        metric: rule.metric,
        conditionValue: reading.value,
        deviceId,
        command: {
          id: String(command._id),
          actuator: command.actuator,
          state: command.state,
          durationSeconds: command.durationSeconds,
          status: command.status
        }
      };
      triggered.push(payload);
      triggeredRuleIds.add(ruleId);

      if (io) {
        io.to(`user_${String(userId)}`).emit('automation:triggered', payload);
      }
    }
  }

  return { triggered };
};
