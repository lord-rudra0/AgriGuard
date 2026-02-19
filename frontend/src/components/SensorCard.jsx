import { useState, useEffect } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Sprout,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

const SensorCard = ({ type, value, unit, status, threshold, lastReading }) => {
  const [trend, setTrend] = useState('stable');
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    if (prevValue !== null) {
      if (value > prevValue) {
        setTrend('up');
      } else if (value < prevValue) {
        setTrend('down');
      } else {
        setTrend('stable');
      }
    }
    setPrevValue(value);
  }, [value, prevValue]);

  const getIcon = () => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-8 h-8" />;
      case 'humidity':
        return <Droplets className="w-8 h-8" />;
      case 'co2':
        return <Wind className="w-8 h-8" />;
      case 'light':
        return <Sun className="w-8 h-8" />;
      case 'soilMoisture':
        return <Sprout className="w-8 h-8" />;
      default:
        return <Thermometer className="w-8 h-8" />;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-rose-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500 dark:text-gray-300" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'safe':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
      case 'danger':
        return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]';
      case 'inactive':
        return 'text-gray-500 dark:text-gray-400 bg-gray-500/10 border border-gray-500/20';
      default:
        return 'text-gray-500 dark:text-gray-400 bg-gray-500/10 border border-gray-500/20';
    }
  };

  const getValueColor = () => {
    switch (status) {
      case 'safe':
        return 'text-emerald-600 dark:text-emerald-300';
      case 'warning':
        return 'text-amber-600 dark:text-amber-300';
      case 'danger':
        return 'text-rose-600 dark:text-rose-300';
      default:
        return 'text-gray-900 dark:text-white';
    }
  };

  const formatTitle = (type) => {
    switch (type) {
      case 'temperature':
        return 'Temperature';
      case 'humidity':
        return 'Humidity';
      case 'co2':
        return 'CO₂ Level';
      case 'light':
        return 'Light Intensity';
      case 'soilMoisture':
        return 'Soil Moisture';
      default:
        return type;
    }
  };

  const formatTime = (date) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative p-6 rounded-[24px] bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-stone-200 dark:border-slate-700/60 hover:bg-white/90 dark:hover:bg-slate-900/70 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 shadow-xl shadow-stone-200/50 dark:shadow-black/20 group">
      {/* Header with icon and status */}
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-2xl ${getStatusColor()} transition-colors duration-300 group-hover:scale-110 transform`}>
          {getIcon()}
        </div>
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${getStatusColor()}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-widest mb-1 text-left">
        {formatTitle(type)}
      </h3>

      {/* Value */}
      <div className="mb-6 text-left">
        <div className={`text-4xl font-black tracking-tight flex items-baseline gap-1 ${getValueColor()}`}>
          {value !== undefined && value !== null ? value : '--'}
          <span className="text-lg font-bold text-gray-500 dark:text-gray-200">
            {unit}
          </span>
        </div>
      </div>

      {/* Threshold info */}
      {threshold && (
        <div className="mb-4 text-xs font-medium text-gray-700 dark:text-gray-300 text-left">
          <div className="flex justify-between items-center">
            <span>Safe Range</span>
            <span className="text-gray-700 dark:text-gray-200">
              {threshold.min} - {threshold.max} <span className="text-gray-600 dark:text-gray-300">{unit}</span>
            </span>
          </div>
        </div>
      )}

      {/* Last updated */}
      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest border-t border-gray-200 dark:border-white/10 pt-4">
        <span>Updated</span>
        <span className="text-emerald-500 dark:text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.4)] animate-pulse">{formatTime(lastReading)}</span>
      </div>

      {/* Status indicator bar (removed inline width style for cleaner look) */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

export default SensorCard;
