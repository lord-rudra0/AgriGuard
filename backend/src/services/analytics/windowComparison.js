import SensorData from '../../models/SensorData.js';

const DEFAULT_SENSOR_TYPES = ['temperature', 'humidity', 'co2', 'light', 'soilMoisture'];

const toDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const sortByMagnitudeDesc = (items) =>
  [...items].sort((a, b) => Math.abs(b?.change?.abs || 0) - Math.abs(a?.change?.abs || 0));

const directionFromDelta = (delta, epsilon = 0.0001) => {
  if (!Number.isFinite(delta)) return 'no_data';
  if (Math.abs(delta) <= epsilon) return 'stable';
  return delta > 0 ? 'up' : 'down';
};

const formatChangeLine = (row) => {
  const sensor = row.sensorType;
  if (!row.baseline || !row.compare) return `${sensor}: insufficient data for one of the windows.`;
  const sign = row.change.abs > 0 ? '+' : '';
  const pct = Number.isFinite(row.change.pct) ? ` (${sign}${row.change.pct.toFixed(1)}%)` : '';
  return `${sensor}: ${row.baseline.avg.toFixed(2)} -> ${row.compare.avg.toFixed(2)} (${sign}${row.change.abs.toFixed(2)}${pct})`;
};

const buildRuleSummary = (rows) => {
  if (!rows.length) return 'No sensor data found in the selected time windows.';
  const top = sortByMagnitudeDesc(rows).slice(0, 3);
  const lines = top.map(formatChangeLine);
  return `Top changes:\n- ${lines.join('\n- ')}`;
};

const aggregateWindow = async ({ userId, start, end, sensorTypes }) => {
  const match = {
    'metadata.userId': userId,
    timestamp: { $gte: start, $lt: end }
  };
  if (sensorTypes?.length) {
    match['metadata.sensorType'] = { $in: sensorTypes };
  }

  const rows = await SensorData.aggregate([
    { $match: match },
    { $sort: { timestamp: 1 } },
    {
      $group: {
        _id: '$metadata.sensorType',
        count: { $sum: 1 },
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
        firstValue: { $first: '$value' },
        lastValue: { $last: '$value' },
        unit: { $last: '$unit' }
      }
    }
  ]);

  const map = new Map();
  for (const row of rows) {
    map.set(String(row._id), {
      sensorType: String(row._id),
      count: Number(row.count || 0),
      avg: Number(row.avg || 0),
      min: Number(row.min || 0),
      max: Number(row.max || 0),
      firstValue: Number(row.firstValue || 0),
      lastValue: Number(row.lastValue || 0),
      unit: row.unit || ''
    });
  }
  return map;
};

export const buildWindowComparison = async ({
  userId,
  baselineStart,
  baselineEnd,
  compareStart,
  compareEnd,
  sensorTypes = DEFAULT_SENSOR_TYPES
}) => {
  const bStart = toDate(baselineStart);
  const bEnd = toDate(baselineEnd);
  const cStart = toDate(compareStart);
  const cEnd = toDate(compareEnd);

  if (!bStart || !bEnd || !cStart || !cEnd) {
    return { error: 'All time window boundaries must be valid ISO datetimes.' };
  }
  if (bStart >= bEnd || cStart >= cEnd) {
    return { error: 'Each time window must have start < end.' };
  }

  const sensors = Array.isArray(sensorTypes) && sensorTypes.length
    ? sensorTypes.map((s) => String(s))
    : DEFAULT_SENSOR_TYPES;

  const [baselineMap, compareMap] = await Promise.all([
    aggregateWindow({ userId, start: bStart, end: bEnd, sensorTypes: sensors }),
    aggregateWindow({ userId, start: cStart, end: cEnd, sensorTypes: sensors })
  ]);

  const union = new Set([...baselineMap.keys(), ...compareMap.keys(), ...sensors]);
  const rows = [];
  for (const sensorType of union) {
    const baseline = baselineMap.get(sensorType) || null;
    const compare = compareMap.get(sensorType) || null;
    const changeAbs = baseline && compare ? compare.avg - baseline.avg : NaN;
    const changePct = baseline && compare && Math.abs(baseline.avg) > 0.0001
      ? ((compare.avg - baseline.avg) / Math.abs(baseline.avg)) * 100
      : NaN;
    rows.push({
      sensorType,
      unit: compare?.unit || baseline?.unit || '',
      baseline,
      compare,
      change: {
        abs: changeAbs,
        pct: changePct,
        direction: directionFromDelta(changeAbs)
      }
    });
  }

  const ranked = sortByMagnitudeDesc(rows).filter((r) => Number.isFinite(r?.change?.abs));
  const topChanges = ranked.slice(0, 3).map((r) => ({
    sensorType: r.sensorType,
    abs: r.change.abs,
    pct: r.change.pct,
    direction: r.change.direction,
    unit: r.unit
  }));

  return {
    windows: {
      baseline: { start: bStart, end: bEnd },
      compare: { start: cStart, end: cEnd }
    },
    metrics: rows,
    topChanges,
    summaryText: buildRuleSummary(rows)
  };
};
