import SensorData from '../../../models/SensorData.js';
import ScanHistory from '../../../models/ScanHistory.js';
import Alert from '../../../models/Alert.js';
import { emitTalkAction } from './shared.js';
import { buildWindowComparison } from '../../analytics/windowComparison.js';

export const executeBaseTool = async (name, args, userId, socket) => {
  if (name === "navigate_to") {
    const pagePath = `/${args.page === 'dashboard' ? '' : args.page}`;
    emitTalkAction(socket, 'navigate', { path: pagePath });
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

  if (name === "summarize_what_changed") {
    const result = await buildWindowComparison({
      userId,
      baselineStart: args?.baselineStart,
      baselineEnd: args?.baselineEnd,
      compareStart: args?.compareStart,
      compareEnd: args?.compareEnd,
      sensorTypes: Array.isArray(args?.sensorTypes) ? args.sensorTypes : undefined
    });
    if (result?.error) return { error: result.error };
    return {
      summary: result.summaryText,
      windows: result.windows,
      topChanges: result.topChanges,
      metrics: result.metrics
    };
  }

  return null;
};
