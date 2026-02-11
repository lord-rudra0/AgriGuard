import React, { useMemo } from 'react';
import {
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Tooltip
} from 'recharts';
import { ShieldCheck, AlertTriangle, CloudRain, Wind, ThermometerSun, Droplets, Sparkles, Loader2, MessageSquarePlus } from 'lucide-react';
import axios from 'axios';

const RiskAnalytics = ({ riskProfile }) => {
    const [loadingAnalysis, setLoadingAnalysis] = React.useState({});
    const [aiAnalysis, setAiAnalysis] = React.useState({});

    if (!riskProfile) return null;

    const {
        overallScore: overallRisk,
        factors: riskFactors,
        signals: indicators,
        confidence
    } = riskProfile;

    const handleAskAI = async (risk, e) => {
        e.stopPropagation();
        if (aiAnalysis[risk.subject]) return;

        setLoadingAnalysis(prev => ({ ...prev, [risk.subject]: true }));
        try {
            const prompt = `I have a calculated ${risk.subject} risk score of ${risk.A}%. The threat level is ${risk.A < 30 ? 'Low' : risk.A < 70 ? 'Moderate' : 'Critical'}. What are the specific environmental drivers for this risk and how can I mitigate it?`;
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/chat/ai', { message: prompt }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const text = res.data?.message || res.data?.reply || res.data?.text || 'Could not generate advice.';
            setAiAnalysis(prev => ({ ...prev, [risk.subject]: text }));
        } catch (err) {
            console.error(err);
            setAiAnalysis(prev => ({ ...prev, [risk.subject]: 'Failed to contact AI.' }));
        } finally {
            setLoadingAnalysis(prev => ({ ...prev, [risk.subject]: false }));
        }
    };

    const getRiskVariant = (score) => {
        if (score < 30) return {
            color: 'emerald',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-500/20',
            label: 'Minimal'
        };
        if (score < 60) return {
            color: 'orange',
            bg: 'bg-orange-50 dark:bg-orange-500/10',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-500/20',
            label: 'Moderate'
        };
        return {
            color: 'rose',
            bg: 'bg-rose-50 dark:bg-rose-500/10',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-500/20',
            label: 'CRITICAL'
        };
    };

    const variant = getRiskVariant(overallRisk);
    const threatLevel = variant.label;
    const threatColor = variant.text;

    return (
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 shadow-lg relative overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${threatLevel === 'Critical' ? 'bg-rose-500/10 text-rose-500' :
                        threatLevel === 'Moderate' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-emerald-500/10 text-emerald-500'
                        }`}>
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white leading-none">Ecosystem Health</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${threatColor}`}>
                                {threatLevel} Risk Detected
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-2xl font-black ${threatColor}`}>{overallRisk}%</span>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Overall Risk</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Radar Chart */}
                <div className="h-64 w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskFactors.map(f => ({ subject: f.name, A: f.value }))}>
                            <PolarGrid stroke="#333" strokeOpacity={0.2} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Risk Level"
                                dataKey="A"
                                stroke={overallRisk > 50 ? "#f43f5e" : "#10b981"}
                                fill={overallRisk > 50 ? "#f43f5e" : "#10b981"}
                                fillOpacity={0.4}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontSize: '10px' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Risk Breakdown Cards */}
                <div className="grid grid-cols-2 gap-3">
                    {riskFactors.map((risk) => (
                        <div key={risk.name} className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                            {risk.name === 'Heat Stress' && <ThermometerSun className="w-5 h-5 text-orange-500 mb-2" />}
                            {risk.name === 'Mold Risk' && <Droplets className="w-5 h-5 text-blue-500 mb-2" />}
                            {risk.name === 'Dryness' && <Wind className="w-5 h-5 text-yellow-500 mb-2" />}
                            {risk.name === 'Air Quality' && <CloudRain className="w-5 h-5 text-gray-400 mb-2" />}
                            {risk.name === 'Instability' && <Activity className="w-5 h-5 text-pink-500 mb-2" />}

                            <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500 mb-1">{risk.name}</span>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full`}
                                    style={{ width: `${risk.value}%`, backgroundColor: risk.color }}
                                ></div>
                            </div>
                            <span className="text-xs font-bold text-gray-900 dark:text-white mt-1">{risk.value}%</span>

                            {/* Actions */}
                            < div className="flex gap-2 mt-2 w-full justify-center" >
                                <button
                                    onClick={(e) => handleAskAI({ subject: risk.name, A: risk.value }, e)}
                                    disabled={loadingAnalysis[risk.name]}
                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-emerald-500 hover:text-white transition-all text-gray-400"
                                    title="Get AI Risk Insights"
                                >
                                    {loadingAnalysis[risk.name] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.dispatchEvent(new CustomEvent('open-chatbot', {
                                            detail: {
                                                prompt: `My ${risk.name} is at ${risk.value}% (${risk.value < 30 ? 'Low' : risk.value < 70 ? 'Moderate' : 'Critical'}). What steps should I take to reduce this?`
                                            }
                                        }));
                                    }}
                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-indigo-500 hover:text-white transition-all text-gray-400"
                                    title="Open Chat"
                                >
                                    <MessageSquarePlus className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Inline AI Analysis */}
                            {(aiAnalysis[risk.name] || loadingAnalysis[risk.name]) && (
                                <div className="mt-2 text-left w-full bg-white dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Sparkles className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">AI Risk Analysis</span>
                                    </div>
                                    {loadingAnalysis[risk.name] ? (
                                        <div className="space-y-1">
                                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            <div className="h-2 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-snug">
                                            {aiAnalysis[risk.name]}
                                        </p>
                                    )}
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            </div >

        </div >
    );
};

const paramsToColor = (val) => {
    if (val < 30) return 'bg-emerald-500';
    if (val < 70) return 'bg-yellow-500';
    return 'bg-rose-500';
};

export default RiskAnalytics;
