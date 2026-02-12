import express from 'express';
import SensorData from '../../models/SensorData.js';
import { authenticateToken } from '../../middleware/auth.js';
import { getFullAnalytics } from '../../services/analytics/AnalyticsService.js';

const router = express.Router();

router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const timeframeStart = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    const startDate = new Date(Date.now() - (timeframeStart[timeframe] || timeframeStart['24h']));

    const analytics = await SensorData.aggregate([
      {
        $match: {
          'metadata.userId': req.user._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            sensorType: '$metadata.sensorType',
            hour: { $hour: '$timestamp' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          avgValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1, '_id.hour': 1 } }
    ]);

    const buckets = {};
    analytics.forEach((row) => {
      const sensorType = row?._id?.sensorType;
      const date = row?._id?.date;
      const hour = row?._id?.hour;
      const value = row?.avgValue;
      if (!sensorType || !date || typeof hour !== 'number' || typeof value !== 'number') return;
      const key = `${date}T${String(hour).padStart(2, '0')}:00:00.000Z`;
      if (!buckets[key]) buckets[key] = { time: key };
      buckets[key][sensorType] = value;
    });

    const series = Object.values(buckets).sort((a, b) => new Date(a.time) - new Date(b.time));
    res.json({ analytics, series, timeframe, startDate });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/analytics/full', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '24h', stage = 'fruiting' } = req.query;
    const timeframeMsMap = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    const startDate = new Date(Date.now() - (timeframeMsMap[timeframe] || timeframeMsMap['24h']));

    const MAX_RECENT_POINTS = 5000;
    const recentData = (await SensorData.find({
      'metadata.userId': req.user._id,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 }).limit(MAX_RECENT_POINTS)).reverse();

    const { default: SensorHistory } = await import('../../models/SensorHistory.js');
    const precomputed = await SensorHistory.find({
      'metadata.userId': req.user._id,
      interval: 'hourly',
      startTime: { $gte: startDate }
    }).lean();

    const latestPrecomputed = precomputed.length > 0
      ? precomputed.reduce((latest, item) => (item.endTime > latest ? item.endTime : latest), precomputed[0].endTime)
      : startDate;

    const rawTip = await SensorData.aggregate([
      {
        $match: {
          'metadata.userId': req.user._id,
          timestamp: { $gt: latestPrecomputed }
        }
      },
      {
        $group: {
          _id: {
            sensorType: '$metadata.sensorType',
            bucketStart: {
              $dateFromParts: {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' },
                hour: { $hour: '$timestamp' }
              }
            }
          },
          avgValue: { $avg: '$value' }
        }
      },
      { $project: { _id: { sensorType: '$_id.sensorType' }, avgValue: 1, timestamp: '$_id.bucketStart' } },
      { $sort: { timestamp: 1 } }
    ]);

    const merged = {};
    const addPoint = (sensorType, timestamp, value) => {
      const ts = new Date(timestamp);
      if (!sensorType || !Number.isFinite(value) || Number.isNaN(ts.getTime())) return;
      const hourStart = new Date(ts);
      hourStart.setMinutes(0, 0, 0);
      const key = `${sensorType}|${hourStart.toISOString()}`;
      if (!merged[key]) {
        merged[key] = { sensorType, timestamp: new Date(hourStart), sum: 0, count: 0 };
      }
      merged[key].sum += value;
      merged[key].count += 1;
    };

    precomputed.forEach((h) => addPoint(h?.metadata?.sensorType, h?.startTime, h?.metrics?.avg));
    rawTip.forEach((r) => addPoint(r?._id?.sensorType, r?.timestamp, r?.avgValue));

    const historyData = Object.values(merged)
      .map((entry) => ({
        _id: { sensorType: entry.sensorType },
        avgValue: entry.count > 0 ? entry.sum / entry.count : 0,
        timestamp: entry.timestamp
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const timeBuckets = {};
    historyData.forEach((d) => {
      const timeKey = d.timestamp.toISOString();
      if (!timeBuckets[timeKey]) timeBuckets[timeKey] = { name: timeKey };
      timeBuckets[timeKey][d._id.sensorType] = d.avgValue;
    });
    const formattedHistory = Object.values(timeBuckets).sort((a, b) => new Date(a.name) - new Date(b.name));

    const fullAnalytics = await getFullAnalytics(recentData, historyData, req.user._id, stage);
    res.json({
      success: true,
      data: fullAnalytics,
      history: formattedHistory
    });
  } catch (error) {
    console.error('Full analytics error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
