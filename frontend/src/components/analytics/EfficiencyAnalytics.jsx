import React, { useMemo, useState } from 'react';
import {
    Zap,
    Wind,
    Droplets,
    Sun,
    TrendingDown,
    Award,
    Sparkles,
    Loader2,
    MessageSquarePlus,
    CheckCircle2
} from 'lucide-react';
import axios from 'axios';

const EfficiencyAnalytics = ({ efficiencyProfile }) => {
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');

    if (!efficiencyProfile) return null;
    const efficiency = efficiencyProfile;

    // AI Handler
    const handleAskAI = async (e) => {
        e.stopPropagation();
        if (aiAnalysis) return;

        setLoadingAnalysis(true);
        try {
            const prompt = `Analyze my farm's efficiency. 
            Overall Efficiency: ${efficiency.overallScore}%.
            Ventilation: ${efficiency.ventilation.status} (${efficiency.ventilation.issue || 'No issues'}).
            Water: ${efficiency.water.status} (${efficiency.water.issue || 'No issues'}).
            Energy: ${efficiency.energy.status} (${efficiency.energy.issue || 'No issues'}).
            Provide 3 specific, actionable optimization tips to save resources/money.`;

            const token = localStorage.getItem('token');
            const res = await axios.post('/api/chat/ai', { message: prompt }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const text = res.data?.message || res.data?.reply || res.data?.text || 'Could not generate advice.';
            setAiAnalysis(text);
        } catch (err) {
            console.error(err);
            setAiAnalysis('Failed to contact AI.');
        } finally {
            setLoadingAnalysis(false);
        }
    };

    if (!efficiency) return null;

    return (
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 shadow-lg relative overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-emerald-500" />
                    </div>
                    Efficiency & Optimization
                </h3>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-wider">
                    {efficiency.overallScore}% Efficient
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(efficiency).map(([key, data]) => {
                    if (key === 'overallScore') return null;
                    const Icon = key === 'ventilation' ? Wind : key === 'water' ? Droplets : Zap;
                    return (
                        <div key={key} className={`bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border ${data.score < 80 ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-100 dark:border-white/5'}`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm ${data.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`text-xl font-black ${data.score < 70 ? 'text-rose-500' : data.score < 90 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {data.score}%
                                </span>
                            </div>
                            <div className="mb-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">{key}</h4>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{data.status}</p>
                            </div>
                            {data.issue && (
                                <div className="mt-2 text-[10px] font-medium text-rose-500 bg-rose-500/10 p-1.5 rounded-lg flex items-start gap-1">
                                    <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                    {data.issue}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* AI Optimization Insight */}
            <div className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Optimization Opportunities
                        </h4>
                    </div>
                    {!aiAnalysis && (
                        <button
                            onClick={handleAskAI}
                            disabled={loadingAnalysis}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold shadow-sm"
                        >
                            {loadingAnalysis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Run Audit
                        </button>
                    )}
                </div>

                {aiAnalysis ? (
                    <div className="mt-2 animate-in fade-in slide-in-from-top-2 relative z-10">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                            {aiAnalysis}
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('open-chatbot', {
                                        detail: {
                                            prompt: `Regarding the efficiency audit: ${aiAnalysis}. How do I implement these changes?`
                                        }
                                    }));
                                }}
                                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-emerald-500 transition-colors"
                            >
                                <MessageSquarePlus className="w-3 h-3" />
                                View Action Plan
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 relative z-10">
                        Identifies resource leaks (water, energy) and suggests configuration changes to save costs.
                    </p>
                )}
            </div>

        </div>
    );
};

export default EfficiencyAnalytics;
