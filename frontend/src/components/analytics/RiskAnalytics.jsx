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

const RiskAnalytics = ({ chartData = [] }) => {
    const [loadingAnalysis, setLoadingAnalysis] = React.useState({});
    const [aiAnalysis, setAiAnalysis] = React.useState({});

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

    const riskScores = useMemo(() => {
        if (!chartData || chartData.length === 0) return null;

        let maxHeatStress = 0;
        let maxMold = 0;
        let maxDryness = 0;
        let maxAirQuality = 0;

        // Iterate through data to find peak risks
        chartData.forEach(d => {
            const temp = d.temperature || 0;
            const hum = d.humidity || 0;
            const co2 = d.co2 || 0;

            // 1. Heat Stress (High Temp + High Humidity)
            // Danger Zone: Temp > 25°C AND Humidity > 70%
            if (temp > 25 && hum > 70) {
                const score = Math.min(100, ((temp - 25) * 5) + ((hum - 70) * 2));
                maxHeatStress = Math.max(maxHeatStress, score);
            }

            // 2. Mold Risk (Warm + Wet)
            // Danger Zone: Temp > 22°C AND Humidity > 80%
            if (temp > 22 && hum > 80) {
                const score = Math.min(100, ((temp - 22) * 4) + ((hum - 80) * 4));
                maxMold = Math.max(maxMold, score);
            }

            // 3. Dryness Risk (Hot + Dry)
            // Danger Zone: Temp > 25°C AND Humidity < 40%
            if (temp > 25 && hum < 40) {
                const score = Math.min(100, ((temp - 25) * 4) + ((40 - hum) * 3));
                maxDryness = Math.max(maxDryness, score);
            }

            // 4. Air Quality Risk (High CO2)
            // Danger Zone: CO2 > 800ppm
            if (co2 > 800) {
                const score = Math.min(100, (co2 - 600) / 10);
                maxAirQuality = Math.max(maxAirQuality, score);
            }
        });

        return [
            { subject: 'Heat Stress', A: Math.round(maxHeatStress), fullMark: 100 },
            { subject: 'Mold Risk', A: Math.round(maxMold), fullMark: 100 },
            { subject: 'Dryness', A: Math.round(maxDryness), fullMark: 100 },
            { subject: 'Poor Air', A: Math.round(maxAirQuality), fullMark: 100 },
        ];
    }, [chartData]);

    if (!riskScores) return null;

    // Calculate overall threat level (max of individual risks)
    const maxRisk = Math.max(...riskScores.map(r => r.A));
    const threatLevel = maxRisk < 30 ? 'Low' : maxRisk < 70 ? 'Moderate' : 'Critical';
    const threatColor = maxRisk < 30 ? 'text-emerald-500' : maxRisk < 70 ? 'text-yellow-500' : 'text-rose-500';

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
                    <span className={`text-2xl font-black ${threatColor}`}>{maxRisk}%</span>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Max Threat</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Radar Chart */}
                <div className="h-64 w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskScores}>
                            <PolarGrid stroke="#333" strokeOpacity={0.2} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Risk Level"
                                dataKey="A"
                                stroke={maxRisk > 50 ? "#f43f5e" : "#10b981"}
                                fill={maxRisk > 50 ? "#f43f5e" : "#10b981"}
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
                    {riskScores.map((risk) => (
                        <div key={risk.subject} className="p-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                            {risk.subject === 'Heat Stress' && <ThermometerSun className="w-5 h-5 text-orange-500 mb-2" />}
                            {risk.subject === 'Mold Risk' && <Droplets className="w-5 h-5 text-blue-500 mb-2" />}
                            {risk.subject === 'Dryness' && <Wind className="w-5 h-5 text-yellow-500 mb-2" />}
                            {risk.subject === 'Poor Air' && <CloudRain className="w-5 h-5 text-gray-400 mb-2" />}

                            <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500 mb-1">{risk.subject}</span>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${paramsToColor(risk.A)}`}
                                    style={{ width: `${risk.A}%` }}
                                ></div>
                            </div>
                            <span className="text-xs font-bold text-gray-900 dark:text-white mt-1">{risk.A}%</span>

                            {/* Actions */}
                            < div className="flex gap-2 mt-2 w-full justify-center" >
                                <button
                                    onClick={(e) => handleAskAI(risk, e)}
                                    disabled={loadingAnalysis[risk.subject]}
                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-emerald-500 hover:text-white transition-all text-gray-400"
                                    title="Get AI Risk Insights"
                                >
                                    {loadingAnalysis[risk.subject] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.dispatchEvent(new CustomEvent('open-chatbot', {
                                            detail: {
                                                prompt: `My ${risk.subject} is at ${risk.A}% (${risk.A < 30 ? 'Low' : risk.A < 70 ? 'Moderate' : 'Critical'}). What steps should I take to reduce this?`
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
                            {(aiAnalysis[risk.subject] || loadingAnalysis[risk.subject]) && (
                                <div className="mt-2 text-left w-full bg-white dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Sparkles className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">AI Risk Analysis</span>
                                    </div>
                                    {loadingAnalysis[risk.subject] ? (
                                        <div className="space-y-1">
                                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            <div className="h-2 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-snug">
                                            {aiAnalysis[risk.subject]}
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
