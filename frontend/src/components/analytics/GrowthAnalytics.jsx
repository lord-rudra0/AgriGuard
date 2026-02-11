import React, { useState, useMemo } from 'react';
import {
    Sprout,
    Leaf,
    Thermometer,
    Droplets,
    Wind,
    CheckCircle2,
    AlertTriangle,
    Target,
    ArrowRight,
    Sparkles,
    Loader2,
    MessageSquarePlus
} from 'lucide-react';
import axios from 'axios';

// --- Stage Definitions ---
const STAGES = {
    spawnRun: {
        id: 'spawnRun',
        label: 'Spawn Run (Colonization)',
        icon: Sprout,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        ideal: {
            temperature: { min: 24, max: 27, ideal: 25.5, label: 'Warm (24-27°C)' },
            humidity: { min: 90, max: 100, ideal: 95, label: 'High (90-95%)' },
            co2: { min: 5000, max: 20000, ideal: 10000, label: 'High (>5k ppm)' }, // High CO2 is GOOD here
        },
        durationDays: 14 // Expected duration
    },
    fruiting: {
        id: 'fruiting',
        label: 'Fruiting (Development)',
        icon: Leaf,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        ideal: {
            temperature: { min: 20, max: 24, ideal: 22, label: 'Cool (20-24°C)' },
            humidity: { min: 85, max: 95, ideal: 90, label: 'High (85-95%)' },
            co2: { min: 400, max: 1000, ideal: 600, label: 'Low (<1000 ppm)' }, // Low CO2 is CRITICAL here
        },
        durationDays: 7
    }
};

const GrowthAnalytics = ({ growthProfile }) => {
    const [currentStage, setCurrentStage] = useState('fruiting'); // Keeping state for visual toggle, but data is from backend
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');

    const stageConfig = STAGES[currentStage];

    // --- AI Integration ---
    const handleAskAI = async (metrics, e) => {
        e.stopPropagation();
        if (aiAnalysis) return;

        setLoadingAnalysis(true);
        try {
            const prompt = `I am in the ${stageConfig.label} stage. My environmental compliance is ${metrics.complianceScore}%. 
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

    return (
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 shadow-lg relative overflow-hidden transition-all duration-500">

            {/* Header with Stage Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                <h3 className="text-base font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stageConfig.bg}`}>
                        <stageConfig.icon className={`w-5 h-5 ${stageConfig.color}`} />
                    </div>
                    Growth Analytics
                </h3>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {Object.values(STAGES).map(stage => (
                        <button
                            key={stage.id}
                            onClick={() => {
                                setCurrentStage(stage.id);
                                setAiAnalysis(''); // Clear old analysis
                            }}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${currentStage === stage.id
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            {stage.label.split(' ')[0]} {/* Show short name */}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Compliance Score */}
            <div className="flex items-center justify-center py-6 mb-6 relative">
                {/* Decorative background ring */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className={`w-48 h-48 rounded-full border-8 ${stageConfig.border}`} />
                </div>

                <div className="text-center">
                    <div className="text-5xl font-black text-gray-900 dark:text-white mb-1">
                        {metrics.complianceScore}%
                    </div>
                    <div className={`text-xs font-bold uppercase tracking-widest ${stageConfig.color} mb-2`}>
                        {stageConfig.label} Compliance
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
                            Target: {stageConfig.ideal[key].label}
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Insight Section */}
            <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl p-4 border border-indigo-500/10">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Growth Intelligence
                        </h4>
                    </div>
                    {!aiAnalysis && (
                        <button
                            onClick={(e) => handleAskAI(metrics, e)}
                            disabled={loadingAnalysis}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all text-xs font-bold"
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
                                            prompt: `Regarding the ${stageConfig.label} stage analysis: ${aiAnalysis}. Can you elaborate on the specific steps?`
                                        }
                                    }));
                                }}
                                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-indigo-500 transition-colors"
                            >
                                <MessageSquarePlus className="w-3 h-3" />
                                Discuss Strategy
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Compare your current metrics against the strict biological requirements for {stageConfig.label} to optimize yield.
                    </p>
                )}
            </div>

        </div>
    );
};

export default GrowthAnalytics;
