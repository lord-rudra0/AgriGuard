import React, { useMemo } from 'react';
import {
    Activity,
    ShieldCheck,
    AlertTriangle,
    Wifi,
    ServerCrash,
    CheckCircle2,
    Database,
    ZapOff
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const SystemHealthAnalytics = ({ healthProfile }) => {
    if (!healthProfile) return null;
    const systemHealth = healthProfile;

    const getTrustColor = (score) => {
        if (score >= 90) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (score >= 70) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    };

    const getRingColor = (score) => {
        if (score >= 90) return '#10b981'; // emerald-500
        if (score >= 70) return '#f59e0b'; // amber-500
        return '#f43f5e'; // rose-500
    };


    return (
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 shadow-lg relative overflow-hidden transition-all duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                <h3 className="text-base font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    </div>
                    System Intelligence
                </h3>

                <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${systemHealth.systemConfidence >= 90
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    }`}>
                    <Activity className="w-4 h-4" />
                    System Confidence: {systemHealth.systemConfidence}%
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Trust Scores (Per Sensor) */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.entries(systemHealth.sensors).map(([key, data]) => (
                        <div key={key} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">

                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{data.label}</span>
                                <Wifi className={`w-3 h-3 ${data.reliability > 90 ? 'text-emerald-500' : 'text-rose-500'}`} />
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                                <div className="relative w-12 h-12 flex items-center justify-center">
                                    {/* Simple SVG Ring */}
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                                        <circle cx="24" cy="24" r="20" stroke={getRingColor(data.trust)} strokeWidth="4" fill="transparent"
                                            strokeDasharray={125.6}
                                            strokeDashoffset={125.6 - (125.6 * data.trust / 100)}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <span className="absolute text-[10px] font-black text-gray-900 dark:text-white">{data.trust}%</span>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-900 dark:text-white">Trust Score</div>
                                    <div className="text-[10px] text-gray-400">{data.gaps > 0 ? `${data.gaps} gaps` : 'Stable'}</div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Reliability</span>
                                    <span className={`font-bold ${data.reliability < 90 ? 'text-rose-500' : 'text-emerald-500'}`}>{data.reliability}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${data.reliability < 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${data.reliability}%` }} />
                                </div>

                                <div className="flex justify-between text-[10px] mt-1">
                                    <span className="text-gray-500">Data Quality</span>
                                    <span className={`font-bold ${data.quality < 90 ? 'text-amber-500' : 'text-blue-500'}`}>{data.quality}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${data.quality < 90 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${data.quality}%` }} />
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

                {/* 2. System Status Summary */}
                <div className="bg-indigo-500/5 rounded-2xl p-5 border border-indigo-500/10 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            {systemHealth.systemConfidence > 80 ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                            )}
                            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                {systemHealth.systemConfidence > 80 ? 'System Healthy' : 'Maintenance Needed'}
                            </h4>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {systemHealth.systemConfidence > 95
                                ? 'All sensors reporting high-fidelity data. No significant gaps detected.'
                                : systemHealth.systemConfidence > 80
                                    ? 'Minor data gaps detected. Check Wi-Fi stability.'
                                    : 'Significant data loss or noise detected. Inspect hardware immediately.'
                            }
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/5">
                            <Database className="w-4 h-4 text-indigo-500" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Total Packets</span>
                                <span className="text-xs font-black text-gray-900 dark:text-white">{systemHealth.totalPoints}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/5">
                            <ZapOff className={`w-4 h-4 ${systemHealth.totalGaps > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Missed Packets</span>
                                <span className={`text-xs font-black ${systemHealth.totalGaps > 0 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                                    {systemHealth.totalGaps}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default SystemHealthAnalytics;
