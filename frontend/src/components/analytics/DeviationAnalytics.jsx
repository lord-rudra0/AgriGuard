import React from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, Activity, Target, ArrowRight } from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine
} from 'recharts';

const DeviationAnalytics = ({ data, activeTypes, chartData, timeframe }) => {
    if (!data || Object.keys(data).length === 0) return null;

    // Safety check for chartData to prevent crashes if undefined
    const safeChartData = Array.isArray(chartData) ? chartData : [];

    const displayTypes = activeTypes || Object.keys(data);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayTypes.map((type) => {
                const stats = data[type];
                if (!stats) return null;

                const isDriftingUp = stats.drift > 0.1;
                const isDriftingDown = stats.drift < -0.1;
                const isStable = !isDriftingUp && !isDriftingDown;

                // Prepare chart data for envelope
                const typeChartData = safeChartData.map(d => ({
                    time: d.time || '',
                    val: d[type] ?? null,
                    ideal: (type === 'temperature' ? 23 : type === 'humidity' ? 60 : type === 'co2' ? 450 : 50)
                }));

                return (
                    <div key={type} className="group bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${isDriftingUp ? 'bg-rose-500/10 text-rose-500' : isDriftingDown ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                    {isDriftingUp ? <TrendingUp className="w-5 h-5" /> : isDriftingDown ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white leading-none capitalize">{type}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-tighter ${isDriftingUp ? 'text-rose-500' : isDriftingDown ? 'text-blue-500' : 'text-emerald-500'
                                            }`}>
                                            {stats.driftStatus}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400">({stats.drift > 0 ? '+' : ''}{stats.drift}/hr)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                            {/* Avg Deviation */}
                            <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                                    <Target className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Avg Dev</span>
                                </div>
                                <span className="text-lg font-black text-gray-900 dark:text-white">{stats.avgDev}</span>
                            </div>

                            {/* Max Delta */}
                            <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                                    <Activity className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Max Rate</span>
                                </div>
                                <span className="text-lg font-black text-gray-900 dark:text-white">{stats.maxDelta}</span>
                            </div>

                            {/* Spikes */}
                            <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                                    <Zap className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Spikes</span>
                                </div>
                                <span className={`text-lg font-black ${stats.spikeCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {stats.spikeCount}
                                </span>
                            </div>
                        </div>

                        {/* Deviation Envelope Chart */}
                        <div className="h-32 w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={typeChartData}>
                                    <defs>
                                        <linearGradient id={`gradDev-${type}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isDriftingUp ? '#f43f5e' : isDriftingDown ? '#3b82f6' : '#10b981'} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={isDriftingUp ? '#f43f5e' : isDriftingDown ? '#3b82f6' : '#10b981'} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontSize: '10px' }}
                                        labelStyle={{ color: '#888', marginBottom: '5px' }}
                                    />
                                    <ReferenceLine y={typeChartData[0]?.ideal} stroke="#666" strokeDasharray="3 3" />
                                    <Area
                                        type="monotone"
                                        dataKey="val"
                                        stroke={isDriftingUp ? '#f43f5e' : isDriftingDown ? '#3b82f6' : '#10b981'}
                                        strokeWidth={2}
                                        fill={`url(#gradDev-${type})`}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider text-gray-400 bg-white/50 dark:bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
                                Deviation Envelope
                            </div>
                        </div>

                    </div>
                );
            })}
        </div>
    );
};

export default DeviationAnalytics;
