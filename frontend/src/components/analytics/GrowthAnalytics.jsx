import React, { useState } from 'react';
import {
    Sprout,
    Leaf,
    Target,
    Sparkles,
    Loader2,
    MessageSquarePlus
} from 'lucide-react';
import axios from 'axios';

const STAGE_VISUALS = {
    spawnRun: {
        id: 'spawnRun',
        icon: Sprout,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20'
    },
    fruiting: {
        id: 'fruiting',
        icon: Leaf,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20'
    }
};

const buildTargetLabel = (range, metric) => {
    if (!range || typeof range.min !== 'number' || typeof range.max !== 'number') return 'N/A';
    const unit = metric === 'temperature' ? 'C' : metric === 'humidity' ? '%' : metric === 'co2' ? 'ppm' : '';
    return `${range.min}-${range.max}${unit}`;
};

const GrowthAnalytics = ({ growthProfile, selectedStage = 'fruiting', onStageChange }) => {
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');

    // --- AI Integration ---
    const handleAskAI = async (metrics, e) => {
        e.stopPropagation();
        if (aiAnalysis) return;
        const stageLabel = metrics?.meta?.stageLabel || selectedStage;

        setLoadingAnalysis(true);
        try {
            const prompt = `I am in the ${stageLabel} stage. My environmental compliance is ${metrics.complianceScore}%. 
            Temperature Compliance: ${metrics.details.temperature.compliance}%.
            Humidity Compliance: ${metrics.details.humidity.compliance}%.
            CO2 Compliance: ${metrics.details.co2.compliance}%.
            Identify the biggest bottleneck preventing optimal growth for this stage and suggest a fix.`;

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

    if (!growthProfile) return null;
    const metrics = growthProfile;
    if (!metrics) return null;
    const stageId = metrics?.meta?.stageId || selectedStage;
    const stageLabel = metrics?.meta?.stageLabel || selectedStage;
    const stageIdeal = metrics?.meta?.ideal || {};
    const stageVisual = STAGE_VISUALS[stageId] || STAGE_VISUALS.fruiting;

    return (
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 shadow-lg relative overflow-hidden transition-all duration-500">

            {/* Header with Stage Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                <h3 className="text-base font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stageVisual.bg}`}>
                        <stageVisual.icon className={`w-5 h-5 ${stageVisual.color}`} />
                    </div>
                    Growth Analytics
                </h3>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {Object.values(STAGE_VISUALS).map(stage => (
                        <button
                            key={stage.id}
                            onClick={() => {
                                if (onStageChange) onStageChange(stage.id);
                                setAiAnalysis(''); // Clear old analysis
                            }}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${selectedStage === stage.id
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            {stage.id === 'spawnRun' ? 'Spawn' : 'Fruiting'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Compliance Score */}
            <div className="flex items-center justify-center py-6 mb-6 relative">
                {/* Decorative background ring */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className={`w-48 h-48 rounded-full border-8 ${stageVisual.border}`} />
                </div>

                <div className="text-center">
                    <div className="text-5xl font-black text-gray-900 dark:text-white mb-1">
                        {metrics.complianceScore}%
                    </div>
                    <div className={`text-xs font-bold uppercase tracking-widest ${stageVisual.color} mb-2`}>
                        {stageLabel} Compliance
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                        <Target className="w-3 h-3" />
                        Target: 100%
                    </div>
                </div>
            </div>

            {/* Metric Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {['temperature', 'humidity', 'co2'].map(key => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase text-gray-400">{key}</span>
                            <span className={`text-xs font-bold ${metrics.details[key].compliance > 80 ? 'text-emerald-500' : 'text-rose-500'
                                }`}>{metrics.details[key].compliance}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden mb-1">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${metrics.details[key].compliance > 80 ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                                style={{ width: `${metrics.details[key].compliance}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            Target: {buildTargetLabel(stageIdeal[key], key)}
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Insight Section */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-amber-500/5 rounded-2xl p-4 border border-emerald-500/10">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            Growth Intelligence
                        </h4>
                    </div>
                    {!aiAnalysis && (
                        <button
                            onClick={(e) => handleAskAI(metrics, e)}
                            disabled={loadingAnalysis}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold"
                        >
                            {loadingAnalysis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Analyze Stage
                        </button>
                    )}
                </div>

                {aiAnalysis ? (
                    <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                            {aiAnalysis}
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('open-chatbot', {
                                        detail: {
                                            prompt: `Regarding the ${stageLabel} stage analysis: ${aiAnalysis}. Can you elaborate on the specific steps?`
                                        }
                                    }));
                                }}
                                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-emerald-500 transition-colors"
                            >
                                <MessageSquarePlus className="w-3 h-3" />
                                Discuss Strategy
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Compare your current metrics against the strict biological requirements for {stageLabel} to optimize yield.
                    </p>
                )}
            </div>

        </div>
    );
};

export default GrowthAnalytics;
