import SensorData from '../../models/SensorData.js';
import RoomPhase from '../../models/RoomPhase.js';

const SENSOR_TYPES = ['temperature', 'humidity', 'co2', 'light', 'soilMoisture'];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getDefaultTargets = () => ({
  temperature: 24,
  humidity: 85,
  co2: 900,
  light: 300,
  soilMoisture: 55
});

const aggregateRecentSensorProfile = async (userId, windowDays = 14) => {
  const start = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const rows = await SensorData.aggregate([
    {
      $match: {
        'metadata.userId': userId,
        timestamp: { $gte: start },
        'metadata.sensorType': { $in: SENSOR_TYPES }
      }
    },
    {
      $group: {
        _id: '$metadata.sensorType',
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
        count: { $sum: 1 },
        unit: { $last: '$unit' }
      }
    }
  ]);

  const out = {};
  for (const r of rows) {
    out[String(r._id)] = {
      avg: Number(r.avg || 0),
      min: Number(r.min || 0),
      max: Number(r.max || 0),
      count: Number(r.count || 0),
      unit: r.unit || ''
    };
  }
  return out;
};

const resolveTargetsFromPhases = (phases = []) => {
  if (!phases.length) return getDefaultTargets();
  const totals = { temperature: 0, humidity: 0, co2: 0, light: 0, soilMoisture: 0 };
  let n = 0;
  for (const p of phases) {
    const s = p?.active?.setpoints;
    if (!s) continue;
    totals.temperature += Number(s.temperature || 0);
    totals.humidity += Number(s.humidity || 0);
    totals.co2 += Number(s.co2 || 0);
    totals.light += Number(s.light || 0);
    n += 1;
  }
  if (!n) return getDefaultTargets();
  return {
    temperature: totals.temperature / n,
    humidity: totals.humidity / n,
    co2: totals.co2 / n,
    light: totals.light / n,
    soilMoisture: getDefaultTargets().soilMoisture
  };
};

const buildRisks = ({ profile, targets }) => {
  const risks = [];
  for (const metric of Object.keys(targets)) {
    const current = profile?.[metric]?.avg;
    if (!Number.isFinite(current)) continue;
    const target = targets[metric];
    const delta = current - target;
    const pct = Math.abs(target) > 0.0001 ? (delta / Math.abs(target)) * 100 : 0;
    const absPct = Math.abs(pct);
    const severity = absPct >= 20 ? 'high' : absPct >= 10 ? 'medium' : 'low';
    if (severity === 'low') continue;

    risks.push({
      metric,
      severity,
      current,
      target,
      delta,
      deltaPct: pct,
      recommendation:
        metric === 'temperature'
          ? (delta > 0 ? 'Increase ventilation / reduce heat load.' : 'Review heating schedule and insulation.')
          : metric === 'humidity'
            ? (delta > 0 ? 'Increase airflow and dehumidification cycles.' : 'Increase humidification and reduce dry-air leaks.')
            : metric === 'co2'
              ? (delta > 0 ? 'Reduce CO2 dosing and verify sensor calibration.' : 'Increase CO2 enrichment in active growth windows.')
              : metric === 'light'
                ? (delta > 0 ? 'Reduce light intensity or photoperiod.' : 'Increase light intensity or photoperiod.')
                : 'Tune irrigation schedule and verify soil moisture sensor.'
    });
  }
  return risks.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
};

const weekTheme = (weekNumber) => {
  const idx = (weekNumber - 1) % 4;
  if (idx === 0) return 'Stabilization';
  if (idx === 1) return 'Optimization';
  if (idx === 2) return 'Efficiency';
  return 'Resilience';
};

const buildWeeklyPlan = ({ weeksAhead, topRisks, activePhases, cropType, phaseName }) => {
  const plan = [];
  for (let i = 1; i <= weeksAhead; i += 1) {
    const theme = weekTheme(i);
    const actions = [];
    if (i === 1 && topRisks.length) {
      actions.push(`Prioritize ${topRisks[0].metric} correction and verify daily trend direction.`);
    }
    if (topRisks[1]) actions.push(`Track ${topRisks[1].metric} twice daily and adjust thresholds if deviation persists.`);
    if (activePhases.length) actions.push(`Validate setpoints for active phase '${activePhases[0].active?.name || 'current'}'.`);
    if (cropType) actions.push(`Align nutrient and environment checks with crop profile: ${cropType}.`);
    if (phaseName) actions.push(`Focus decision-making for phase: ${phaseName}.`);
    if (!actions.length) actions.push('Monitor all core metrics and keep deviations within 10% of targets.');

    plan.push({
      week: i,
      theme,
      actions
    });
  }
  return plan;
};

const toSummaryText = ({ weeksAhead, cropType, phaseName, topRisks, activePhases }) => {
  const context = [
    cropType ? `crop: ${cropType}` : null,
    phaseName ? `phase focus: ${phaseName}` : null,
    activePhases.length ? `active rooms: ${activePhases.length}` : null
  ].filter(Boolean).join(', ');

  if (!topRisks.length) {
    return `Seasonal strategy (${weeksAhead} weeks): conditions are stable${context ? ` (${context})` : ''}. Keep monitoring and continue gradual optimization.`;
  }

  const highlights = topRisks.slice(0, 2).map((r) => `${r.metric} (${r.deltaPct > 0 ? '+' : ''}${r.deltaPct.toFixed(1)}%)`);
  return `Seasonal strategy (${weeksAhead} weeks): prioritize ${highlights.join(' and ')}${context ? ` (${context})` : ''}.`;
};

export const buildSeasonalStrategy = async ({
  userId,
  weeksAhead = 4,
  roomId = null,
  cropType = null,
  phaseName = null
}) => {
  const weeks = clamp(Number(weeksAhead) || 4, 1, 12);
  const phaseQuery = { userId };
  if (roomId) phaseQuery.roomId = String(roomId);
  const activePhases = await RoomPhase.find(phaseQuery).sort({ updatedAt: -1 }).limit(20).lean();

  const targets = resolveTargetsFromPhases(activePhases);
  const profile = await aggregateRecentSensorProfile(userId, 14);
  const risks = buildRisks({ profile, targets });
  const weeklyPlan = buildWeeklyPlan({
    weeksAhead: weeks,
    topRisks: risks.slice(0, 3),
    activePhases,
    cropType: cropType ? String(cropType) : null,
    phaseName: phaseName ? String(phaseName) : null
  });

  return {
    horizonWeeks: weeks,
    context: {
      cropType: cropType || null,
      phaseName: phaseName || null,
      roomId: roomId || null,
      activeRoomCount: activePhases.length
    },
    targets,
    profile,
    risks,
    weeklyPlan,
    summaryText: toSummaryText({
      weeksAhead: weeks,
      cropType: cropType ? String(cropType) : null,
      phaseName: phaseName ? String(phaseName) : null,
      topRisks: risks,
      activePhases
    })
  };
};
