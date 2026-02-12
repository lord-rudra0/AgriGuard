import mongoose from 'mongoose';
import SensorHistory from '../models/SensorHistory.js';
import SensorData from '../models/SensorData.js';

/**
 * Aggregates raw sensor data into hourly, daily, or weekly buckets.
 * @param {string} userId - ID of the user
 * @param {string} interval - 'hourly', 'daily', or 'weekly'
 * @param {Date} startTime - Start of the interval
 * @param {Date} endTime - End of the interval
 */
export async function aggregateSensorData(userId, interval, startTime, endTime) {
    try {
        const pipeline = [
            {
                $match: {
                    'metadata.userId': new mongoose.Types.ObjectId(userId),
                    timestamp: { $gte: startTime, $lt: endTime }
                }
            },
            {
                $group: {
                    _id: {
                        deviceId: '$metadata.deviceId',
                        sensorType: '$metadata.sensorType',
                        userId: '$metadata.userId'
                    },
                    min: { $min: '$value' },
                    max: { $max: '$value' },
                    avg: { $avg: '$value' },
                    count: { $sum: 1 }
                }
            }
        ];

        const results = await SensorData.aggregate(pipeline);

        for (const res of results) {
            await SensorHistory.findOneAndUpdate(
                {
                    'metadata.userId': res._id.userId,
                    'metadata.deviceId': res._id.deviceId,
                    'metadata.sensorType': res._id.sensorType,
                    interval,
                    startTime,
                    endTime
                },
                {
                    $set: {
                        metrics: {
                            min: res.min,
                            max: res.max,
                            avg: Number(res.avg.toFixed(2)),
                            count: res.count
                        }
                    }
                },
                { upsert: true, new: true }
            );
        }
    } catch (error) {
        console.error(`Error aggregating sensor data for ${interval}:`, error);
    }
}

/**
 * Main job runner to be called by the scheduler.
 */
export async function runHistoryAggregation() {
    try {
        const now = new Date();

        // 1. Hourly Aggregation (for the previous hour)
        const currentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
        const prevHourStart = new Date(currentHourStart.getTime() - 60 * 60 * 1000);

        // 2. Daily Aggregation (for the previous day)
        const currentDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const prevDayStart = new Date(currentDayStart.getTime() - 24 * 60 * 60 * 1000);

        // 3. Weekly Aggregation (rolling previous 7 full days)
        const prevWeekStart = new Date(currentDayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get unique users to aggregate for
        const userIds = await SensorData.distinct('metadata.userId');

        for (const userId of userIds) {
            // Hourly run
            await aggregateSensorData(userId, 'hourly', prevHourStart, currentHourStart);

            // Daily run
            await aggregateSensorData(userId, 'daily', prevDayStart, currentDayStart);

            // Weekly run
            await aggregateSensorData(userId, 'weekly', prevWeekStart, currentDayStart);
        }

        console.log(`[${new Date().toISOString()}] Sensor history aggregation complete.`);
    } catch (error) {
        console.error('Failed to run history aggregation job:', error);
    }
}
