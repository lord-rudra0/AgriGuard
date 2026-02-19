import React, { useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Clock,
    ArrowRight,
    Activity,
    Sparkles,
    Loader2,
    MessageSquarePlus
} from 'lucide-react';
import axios from 'axios';



const PredictiveAnalytics = ({ predictions = [] }) => {
    if (!predictions || predictions.length === 0) return null;

    return (
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 shadow-lg relative overflow-hidden transition-all duration-500">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-base font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-violet-500" />
                    </div>
                    Predictive Analytics
                </h3>
                <div className="px-3 py-1 bg-violet-500/10 rounded-full border border-violet-500/20 text-[10px] font-black text-violet-500 uppercase tracking-wider">
                    Future Forecast (24h)
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {predictions.map((pred) => (
                    <div key={pred.type} className="group flex flex-col bg-gray-50 dark:bg-black/20 rounded-3xl p-5 border border-gray-100 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-300">

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm text-emerald-500">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white capitalize">{pred.type}</h4>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center gap-4 py-2">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Current State</span>
                                    <span className="text-xl font-black text-gray-900 dark:text-white">{pred.currentValue}{pred.unit}</span>
                                </div>
                                <ArrowRight className="w-6 h-6 text-gray-300" />
                                <div className="flex flex-col text-right">
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter mb-1">Next 24h (Est)</span>
                                    <span className="text-xl font-black text-emerald-500">{pred.predictedValue}{pred.unit}</span>
                                </div>
                            </div>
                        </div>

                        {/* Insight Footer */}
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[10px] font-bold text-gray-500 leading-tight">
                                    {pred.insight}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default PredictiveAnalytics;
