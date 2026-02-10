import React from 'react';
import { ShieldCheck, AlertTriangle, Zap, Activity, Clock, Target } from 'lucide-react';

const StabilityAnalytics = ({ data, activeTypes }) => {
    if (!data || Object.keys(data).length === 0) return null;

    const displayTypes = activeTypes || Object.keys(data);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTypes.map((type) => {
                const stats = data[type];
                if (!stats) return null;

                const isVeryStable = stats.score >= 90;
                const isStable = stats.score >= 70;

                return (
                    <div key={type} className="group bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                        {/* Background Accent */}
                        <div className={`absolute top-0 right-0 w-32 h-32 -translate-y-12 translate-x-12 blur-3xl rounded-full opacity-20 ${isVeryStable ? 'bg-emerald-500' : isStable ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${isVeryStable ? 'bg-emerald-500/10 text-emerald-600' : isStable ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'
                                    }`}>
                                    {isVeryStable ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white leading-none capitalize">{type}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Stability Profile</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-2xl font-black ${isVeryStable ? 'text-emerald-500' : isStable ? 'text-amber-500' : 'text-rose-500'
                                    }`}>
                                    {stats.score}%
                                </span>
                                <p className="text-[9px] font-black text-gray-400 uppercase leading-none">Score</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Progress Bar */}
                            <div className="relative h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ${isVeryStable ? 'bg-emerald-500' : isStable ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                    style={{ width: `${stats.score}%` }}
                                />
                            </div>

                            {/* Main Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                                        <Zap className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Fluctuation</span>
                                    </div>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">{stats.fluctuation}</span>
                                    <span className="text-[10px] text-gray-400 ml-1 font-bold">idx</span>
                                </div>

                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                                        <Target className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Std Dev Ideal</span>
                                    </div>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">{stats.stdDevIdeal}</span>
                                </div>
                            </div>

                            {/* Consistency Ranges */}
                            <div className="p-4 bg-indigo-500/5 dark:bg-indigo-400/5 border border-indigo-500/10 dark:border-indigo-400/10 rounded-2xl">
                                <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                    <span>Stability Periods</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                        Live Analysis
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-xs font-black text-gray-900 dark:text-white">{stats.maxStable}h</span>
                                        </div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Longest Stable</p>
                                    </div>
                                    <div className="w-px h-8 bg-indigo-500/10" />
                                    <div className="flex-1 text-right">
                                        <div className="flex items-center justify-end gap-2 mb-1">
                                            <span className="text-xs font-black text-gray-900 dark:text-white">{stats.maxUnstable}h</span>
                                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                        </div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Longest Unstable</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stacked Percentage Bar */}
                            <div className="pt-2">
                                <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                                    <span className="text-emerald-500">Stable ({stats.stablePercent}%)</span>
                                    <span className="text-rose-500">Unstable ({stats.unstablePercent}%)</span>
                                </div>
                                <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
                                    <div className="h-full bg-emerald-500" style={{ width: `${stats.stablePercent}%` }} />
                                    <div className="h-full bg-rose-500" style={{ width: `${stats.unstablePercent}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StabilityAnalytics;
