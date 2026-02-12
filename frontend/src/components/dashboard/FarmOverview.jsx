import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    ShieldAlert,
    ScanLine,
    ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FarmOverview = () => {
    const [analyticsData, setAnalyticsData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Analytics Summary (Last 24h)
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Assuming standard analytics endpoint returns hourly data
                const res = await axios.get('/api/sensors/analytics', { params: { timeframe: '24h' } });
                setAnalyticsData((res.data?.series && res.data.series.length > 0) ? res.data.series : (res.data?.analytics || []));
            } catch (err) {
                console.error("Failed to fetch farm overview analytics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
        // Refresh every 5 minutes
        const interval = setInterval(fetchAnalytics, 300000);
        return () => clearInterval(interval);
    }, []);

    const hourlySeries = useMemo(() => {
        if (!analyticsData || analyticsData.length === 0) return [];

        // Preferred server-side shape: [{ time, temperature?, humidity?, co2?, ... }]
        if (analyticsData.every((row) => typeof row?.time === 'string')) {
            return [...analyticsData].sort((a, b) => new Date(a.time) - new Date(b.time));
        }

        // Backward-compatible fallback for grouped rows.
        const buckets = {};
        analyticsData.forEach((row) => {
            const sensorType = row?._id?.sensorType;
            const date = row?._id?.date;
            const hour = row?._id?.hour;
            const value = row?.avgValue;
            if (!sensorType || !date || typeof hour !== 'number' || typeof value !== 'number') return;

            const hourString = String(hour).padStart(2, '0');
            const key = `${date}T${hourString}:00:00.000Z`;
            if (!buckets[key]) buckets[key] = { time: key };
            buckets[key][sensorType] = value;
        });

        return Object.values(buckets).sort((a, b) => new Date(a.time) - new Date(b.time));
    }, [analyticsData]);

    const metrics = useMemo(() => {
        if (!hourlySeries || hourlySeries.length === 0) return null;

        const totalPoints = hourlySeries.length;
        const lastPoint = hourlySeries[totalPoints - 1];

        // 1. Stability Score
        // Count hours in "safe" range (generic mushroom range)
        // Temp: 18-28, Hum: 80-95 (Fruiting) or 90-100 (Spawn), CO2 < 1000 (Fruiting)
        // Let's use a blended safe range for "General Stability"
        let stableCount = 0;
        let stableSamples = 0;
        hourlySeries.forEach(d => {
            if (typeof d.temperature !== 'number' || typeof d.humidity !== 'number') return;
            stableSamples++;
            if (d.temperature >= 20 && d.temperature <= 26 &&
                d.humidity >= 80 && d.humidity <= 99) {
                stableCount++;
            }
        });
        const stabilityScore = stableSamples > 0 ? Math.round((stableCount / stableSamples) * 100) : 0;

        // 2. Ecosystem Risk Level
        // Based on latest reading
        let riskLevel = 'Low';
        let riskColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';

        if (lastPoint && typeof lastPoint.temperature === 'number' && typeof lastPoint.humidity === 'number') {
            if (lastPoint.temperature > 28 || lastPoint.humidity < 70) {
                riskLevel = 'High';
                riskColor = 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
            } else if (lastPoint.temperature > 26 || lastPoint.humidity < 80) {
                riskLevel = 'Medium';
                riskColor = 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
            }
        }

        // 3. Growth Compliance
        // Determine Stage by CO2: High (>2000) = Spawn Run, Low (<1500) = Fruiting
        // Default to Fruiting if unsure/mixed
        const co2Values = hourlySeries.map((curr) => curr.co2).filter((v) => typeof v === 'number');
        const avgCo2 = co2Values.length > 0
            ? co2Values.reduce((acc, val) => acc + val, 0) / co2Values.length
            : 0;
        const stage = avgCo2 > 2000 ? 'Spawn Run' : 'Fruiting';

        // Calculate compliance for inferred stage
        let compliantCount = 0;
        let complianceSamples = 0;
        hourlySeries.forEach(d => {
            if (typeof d.temperature !== 'number' || typeof d.humidity !== 'number') return;
            if (stage === 'Spawn Run') {
                complianceSamples++;
                if (d.temperature >= 24 && d.temperature <= 27 && d.humidity >= 90) compliantCount++;
            } else {
                // Fruiting
                if (typeof d.co2 !== 'number') return;
                complianceSamples++;
                if (d.temperature >= 20 && d.temperature <= 24 && d.humidity >= 85 && d.co2 < 1000) compliantCount++;
            }
        });
        const complianceScore = complianceSamples > 0 ? Math.round((compliantCount / complianceSamples) * 100) : 0;

        // 4. System Confidence
        // Based on data density (expected 24 points for 24h)
        // If we have 24 sorted points, 100%. If gaps, reduce.
        const expectedPoints = 24; // approx for 24h
        const confidenceScore = Math.min(100, Math.round((totalPoints / expectedPoints) * 100));
        const systemStatus = confidenceScore > 90 ? 'Reliable' : 'Degraded';

        return {
            stabilityScore,
            riskLevel,
            riskColor,
            stage,
            complianceScore,
            confidenceScore,
            systemStatus
        };
    }, [hourlySeries]);


    if (loading || !metrics) return (
        // Simple skeleton to prevent layout shift
        <div className="mb-8 animate-pulse">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>)}
            </div>
        </div>
    );

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Farm Overview
                </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">

                {/* 1. Farm Stability */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stability</span>
                        <Activity className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {metrics.stabilityScore}%
                        </div>
                        <div className={`text-xs font-medium mt-1 ${metrics.stabilityScore > 80 ? 'text-emerald-500' :
                                metrics.stabilityScore > 60 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                            {metrics.stabilityScore > 90 ? 'Thriving' :
                                metrics.stabilityScore > 75 ? 'Stable' :
                                    metrics.stabilityScore > 50 ? 'Watch' : 'Critical'}
                        </div>
                    </div>
                </div>

                {/* 2. Ecosystem Risk */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk Level</span>
                        <ShieldAlert className={`w-4 h-4 ${metrics.riskLevel === 'High' ? 'text-rose-500' : 'text-gray-400'}`} />
                    </div>
                    <div>
                        <div className={`inline-flex px-2 py-0.5 rounded-md text-sm font-bold border ${metrics.riskColor}`}>
                            {metrics.riskLevel}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                            Current Assessment
                        </div>
                    </div>
                </div>

                {/* 3. Growth Compliance */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Growth</span>
                        <ScanLine className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {metrics.complianceScore}%
                        </div>
                        <div className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {metrics.stage}
                        </div>
                    </div>
                </div>

                {/* 4. System Confidence */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">System</span>
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {metrics.confidenceScore}%
                        </div>
                        <div className={`text-xs font-medium mt-1 ${metrics.confidenceScore > 90 ? 'text-blue-500' : 'text-amber-500'}`}>
                            {metrics.systemStatus}
                        </div>
                    </div>
                </div>

            </div>

            {/* Insight Teaser Strip */}
            <Link to="/analytics" className="group block">
                <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg text-sm transition-all hover:bg-indigo-100 dark:hover:bg-indigo-500/20">
                    <AlertTriangle className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                        {metrics.riskLevel === 'High' ? 'Critical conditions detected — Action required' :
                            metrics.complianceScore < 80 ? 'Growth compliance dropping — Check parameters' :
                                'System running optimally — View detailed analysis'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform ml-auto" />
                </div>
            </Link>

        </div>
    );
};

export default FarmOverview;
