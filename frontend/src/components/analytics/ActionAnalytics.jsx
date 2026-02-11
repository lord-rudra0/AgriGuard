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
    MessageSquarePlus
} from 'lucide-react';

const ActionAnalytics = ({ chartData = [] }) => {
    const recommendations = useMemo(() => {
        if (!chartData || chartData.length === 0) return [];

        // Get the most recent data point for immediate status
        const latest = chartData[chartData.length - 1];
        const avgTemp = chartData.reduce((acc, d) => acc + (d.temperature || 0), 0) / chartData.length;
        const avgHum = chartData.reduce((acc, d) => acc + (d.humidity || 0), 0) / chartData.length;

        const actions = [];
        let idCounter = 1;

        // --- Recommendation Engine Logic ---

        // 1. Heat Stress (High Temp + High Humidity)
        if (latest.temperature > 25 && latest.humidity > 70) {
            actions.push({
                id: idCounter++,
                type: 'critical',
                title: 'Heat Stress Detected',
                action: 'Increase Ventilation Immediately',
                description: 'Temperature and humidity are critically high. Risk of bacterial blotch.',
                icon: <Wind className="w-5 h-5" />,
                impact: {
                    riskReduction: -25,
                    stabilityGain: +15,
                    targetMetric: 'Temp & Humidity'
                }
            });
        }

        // 2. High Humidity / Mold Risk
        else if (latest.humidity > 85) {
            actions.push({
                id: idCounter++,
                type: 'high',
                title: 'Mold Risk High',
                action: 'Dehumidify & Circulate Air',
                description: 'Humidity > 85% promotes mold growth. Run dehumidifiers.',
                icon: <Droplets className="w-5 h-5" />,
                impact: {
                    riskReduction: -20,
                    stabilityGain: +10,
                    targetMetric: 'Humidity'
                }
            });
        }

        // 3. Dryness / Desiccation
        else if (latest.humidity < 40) {
            actions.push({
                id: idCounter++,
                type: 'high',
                title: 'Air Too Dry',
                action: 'Activate Misting System',
                description: 'Humidity < 40% will dry out mycelium. Increase moisture.',
                icon: <Droplets className="w-5 h-5" />,
                impact: {
                    riskReduction: -15,
                    stabilityGain: +10,
                    targetMetric: 'Humidity'
                }
            });
        }

        // 4. Cold Stress
        if (latest.temperature < 18) {
            actions.push({
                id: idCounter++,
                type: 'medium',
                title: 'Low Temperature',
                action: 'Check Heating / Insulation',
                description: 'Temp < 18°C slows growth significantly.',
                icon: <ThermometerSnowflake className="w-5 h-5" />,
                impact: {
                    riskReduction: -10,
                    stabilityGain: +5,
                    targetMetric: 'Temperature'
                }
            });
        }

        // 5. High CO2
        if (latest.co2 > 800) {
            actions.push({
                id: idCounter++,
                type: 'medium',
                title: 'Poor Air Quality',
                action: 'Increase Fresh Air Intake',
                description: 'CO2 > 800ppm enables spindly growth.',
                icon: <Wind className="w-5 h-5" />,
                impact: {
                    riskReduction: -10,
                    stabilityGain: +5,
                    targetMetric: 'CO2'
                }
            });
        }

        // 6. Perfect Conditions (Positive Reinforcement)
        if (actions.length === 0) {
            actions.push({
                id: idCounter++,
                type: 'success',
                title: 'Optimal Conditions',
                action: 'Maintain Current Settings',
                description: 'All metrics are within the Goldilocks zone. Great job!',
                icon: <CheckCircle2 className="w-5 h-5" />,
                impact: {
                    riskReduction: 0,
                    stabilityGain: +2,
                    targetMetric: 'Overall'
                }
            });
        }

        return actions.sort((a, b) => {
            const priority = { critical: 0, high: 1, medium: 2, success: 3 };
            return priority[a.type] - priority[b.type];
        });

    }, [chartData]);

    if (!recommendations.length) return null;

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
                                        {rec.icon}
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
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.dispatchEvent(new CustomEvent('open-chatbot', {
                                            detail: {
                                                prompt: `I have a ${rec.title} alert (${rec.description}). The recommendation is to ${rec.action}. specific advice do you have for this situation?`
                                            }
                                        }));
                                    }}
                                    className="ml-4 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-sm"
                                    title="Ask AI for advice"
                                >
                                    <MessageSquarePlus className="w-5 h-5" />
                                </button>

                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActionAnalytics;
