import React, { useMemo } from 'react';
import {
    Zap,
    ArrowRight,
    ThermometerSnowflake,
    Droplets,
    Wind,
    AlertTriangle,
    MoveUp,
    MoveDown,
    Sprout,
    CheckCircle2,
    MessageSquarePlus,
    Sparkles,
    Loader2
} from 'lucide-react';
import axios from 'axios';

const ActionAnalytics = ({ recommendations = [] }) => {
    const [loadingAnalysis, setLoadingAnalysis] = React.useState({});
    const [aiAnalysis, setAiAnalysis] = React.useState({});

    // Icon Mapping (Improvement #1)
    const IconMap = {
        Wind: <Wind className="w-5 h-5" />,
        Droplets: <Droplets className="w-5 h-5" />,
        ThermometerSnowflake: <ThermometerSnowflake className="w-5 h-5" />,
        CheckCircle2: <CheckCircle2 className="w-5 h-5" />,
        AlertTriangle: <AlertTriangle className="w-5 h-5" />
    };

    const handleAskAI = async (rec, e) => {
        e.stopPropagation();
        if (aiAnalysis[rec.id]) return;

        setLoadingAnalysis(prev => ({ ...prev, [rec.id]: true }));
        try {
            const prompt = `I have a ${rec.title} alert (${rec.description}). The recommendation is to ${rec.action}. Please provide a brief, specific strategy (max 2 sentences) to resolve this.`;
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/chat/ai', { message: prompt }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const text = res.data?.message || res.data?.reply || res.data?.text || 'Could not generate advice.';
            setAiAnalysis(prev => ({ ...prev, [rec.id]: text }));
        } catch (err) {
            console.error(err);
            setAiAnalysis(prev => ({ ...prev, [rec.id]: 'Failed to contact AI.' }));
        } finally {
            setLoadingAnalysis(prev => ({ ...prev, [rec.id]: false }));
        }
    };

    if (!recommendations || recommendations.length === 0) return null;

    return (
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 shadow-lg relative overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-base font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
                    </div>
                    Action & Decision Engine
                </h3>
                <div className="px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[10px] font-black text-indigo-500 uppercase tracking-wider animate-pulse">
                    AI-Powered
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {recommendations.map((rec) => (
                    <div
                        key={rec.id}
                        className={`relative group overflow-hidden rounded-2xl p-[1px] ${rec.type === 'critical' ? 'bg-gradient-to-r from-rose-500 to-orange-500' :
                            rec.type === 'high' ? 'bg-gradient-to-r from-orange-400 to-amber-400' :
                                rec.type === 'success' ? 'bg-gradient-to-r from-emerald-400 to-teal-400' :
                                    'bg-gradient-to-r from-indigo-500 to-blue-500'
                            }`}
                    >
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 h-full relative">
                            {/* Visual "Glow" behind card */}
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none -mr-10 -mt-10 ${rec.type === 'critical' ? 'bg-rose-500' :
                                rec.type === 'high' ? 'bg-orange-500' :
                                    rec.type === 'success' ? 'bg-emerald-500' :
                                        'bg-indigo-500'
                                }`} />

                            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between relative z-10">

                                {/* Left: Icon & Title */}
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl flex-shrink-0 ${rec.type === 'critical' ? 'bg-rose-500/10 text-rose-500' :
                                        rec.type === 'high' ? 'bg-orange-500/10 text-orange-500' :
                                            rec.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                                                'bg-indigo-500/10 text-indigo-500'
                                        }`}>
                                        {IconMap[rec.iconName] || <Zap className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight mb-1">
                                            {rec.action}
                                        </h4>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {rec.title} &middot; {rec.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Impact Metrics */}
                                <div className="flex items-center gap-2 sm:border-l sm:border-gray-100 dark:sm:border-gray-800 sm:pl-4">
                                    {rec.type !== 'success' && (
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md mb-1">
                                                <MoveDown className="w-3 h-3" />
                                                {Math.abs(rec.impact.riskReduction)}% Risk
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                                                <MoveUp className="w-3 h-3" />
                                                {rec.impact.stabilityGain}% Stability
                                            </div>
                                        </div>
                                    )}
                                    {rec.type === 'success' && (
                                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                                            <Sprout className="w-4 h-4" />
                                            Thriving
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={(e) => handleAskAI(rec, e)}
                                        disabled={loadingAnalysis[rec.id]}
                                        className="ml-4 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-sm border border-indigo-100 dark:border-indigo-500/20"
                                        title="Get AI Insights"
                                    >
                                        {loadingAnalysis[rec.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.dispatchEvent(new CustomEvent('open-chatbot', {
                                                detail: {
                                                    prompt: `I have a ${rec.title} alert (${rec.description}). The recommendation is to ${rec.action}. specific advice do you have for this situation?`
                                                }
                                            }));
                                        }}
                                        className="ml-4 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm"
                                        title="Open Chat"
                                    >
                                        <MessageSquarePlus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Inline AI Analysis */}
                            {(aiAnalysis[rec.id] || loadingAnalysis[rec.id]) && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                                <Sparkles className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">AI Insight</h5>
                                            {loadingAnalysis[rec.id] ? (
                                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            ) : (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {aiAnalysis[rec.id]}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActionAnalytics;
