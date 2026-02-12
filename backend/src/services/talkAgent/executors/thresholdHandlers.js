import Threshold from '../../../models/Threshold.js';
import {
  normalizeOptionalNumber,
  normalizeOptionalText,
  toThresholdPayload,
  emitTalkAction
} from './shared.js';

const resolveSingleThreshold = async (args, userId) => {
  const thresholdId = normalizeOptionalText(args?.thresholdId);
  const name = normalizeOptionalText(args?.name);
  const metric = normalizeOptionalText(args?.metric);
  const roomId = normalizeOptionalText(args?.roomId);

  if (thresholdId) {
    const threshold = await Threshold.findOne({ _id: thresholdId, userId });
    return threshold ? { threshold } : { error: "Threshold not found" };
  }
  if (!name) return { error: "Provide thresholdId, or provide name (optionally metric/roomId)" };

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

export const executeThresholdTool = async (name, args, userId, socket) => {
  if (name === "list_thresholds") {
    const query = { userId };
    if (args?.metric) query.metric = String(args.metric);
    if (args?.roomId) query.roomId = String(args.roomId);
    const thresholds = await Threshold.find(query).sort({ updatedAt: -1 }).limit(100).lean();
    return { thresholds: thresholds.map(toThresholdPayload) };
  }

  if (name === "create_threshold") {
    const ruleName = normalizeOptionalText(args?.name);
    const metric = normalizeOptionalText(args?.metric);
    if (!ruleName || !metric) return { error: "name and metric are required" };

    const min = normalizeOptionalNumber(args?.min);
    const max = normalizeOptionalNumber(args?.max);
    if (Number.isNaN(min) || Number.isNaN(max)) return { error: "min/max must be valid numbers when provided" };
    if (min == null && max == null) return { error: "At least one of min or max is required" };
    if (min != null && max != null && min > max) return { error: "min cannot be greater than max" };

    const severity = normalizeOptionalText(args?.severity) || 'warning';
    const enabled = args?.enabled === undefined ? true : Boolean(args.enabled);
    const roomId = normalizeOptionalText(args?.roomId);
    const notes = normalizeOptionalText(args?.notes);
    try {
      const threshold = await Threshold.create({
        userId,
        name: ruleName,
        metric,
        roomId,
        min,
        max,
        severity,
        enabled,
        notes
      });
      const serialized = toThresholdPayload(threshold);
      emitTalkAction(socket, 'threshold_created', { threshold: serialized });
      return { success: true, threshold: serialized };
    } catch (err) {
      if (err?.code === 11000) return { error: "A threshold with this name/metric/room already exists" };
      throw err;
    }
  }

  if (name === "update_threshold") {
    const thresholdId = normalizeOptionalText(args?.thresholdId);
    if (!thresholdId) return { error: "thresholdId is required" };
    const existing = await Threshold.findOne({ _id: thresholdId, userId });
    if (!existing) return { error: "Threshold not found" };

    const updates = {};
    if (args?.name !== undefined) {
      const n = normalizeOptionalText(args.name);
      if (!n) return { error: "name cannot be empty" };
      updates.name = n;
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
    if (finalMin != null && finalMax != null && finalMin > finalMax) return { error: "min cannot be greater than max" };

    try {
      const threshold = await Threshold.findOneAndUpdate({ _id: thresholdId, userId }, { $set: updates }, { new: true });
      const serialized = toThresholdPayload(threshold);
      emitTalkAction(socket, 'threshold_updated', { threshold: serialized });
      return { success: true, threshold: serialized };
    } catch (err) {
      if (err?.code === 11000) return { error: "A threshold with this name/metric/room already exists" };
      throw err;
    }
  }

  if (name === "toggle_threshold_enabled") {
    if (typeof args?.enabled !== 'boolean') return { error: "enabled must be true or false" };
    const resolved = await resolveSingleThreshold(args, userId);
    if (resolved.error || resolved.needsMoreInfo) return resolved;
    const threshold = await Threshold.findOneAndUpdate(
      { _id: resolved.threshold._id, userId },
      { $set: { enabled: args.enabled } },
      { new: true }
    );
    if (!threshold) return { error: "Threshold not found" };
    const serialized = toThresholdPayload(threshold);
    emitTalkAction(socket, 'threshold_updated', { threshold: serialized });
    return { success: true, threshold: serialized };
  }

  if (name === "delete_threshold") {
    const resolved = await resolveSingleThreshold(args, userId);
    if (resolved.error || resolved.needsMoreInfo) return resolved;
    const threshold = await Threshold.findOneAndDelete({ _id: resolved.threshold._id, userId });
    if (!threshold) return { error: "Threshold not found" };
    const thresholdId = String(threshold._id);
    emitTalkAction(socket, 'threshold_deleted', { thresholdId });
    return { success: true, message: "Threshold deleted", thresholdId };
  }

  return null;
};
