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
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'safe':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'danger':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
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
    return new Date(date).toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="sensor-card">
      {/* Header with icon and status */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${getStatusColor()}`}>
          {getIcon()}
        </div>
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {formatTitle(type)}
      </h3>

      {/* Value */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
          <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">
            {unit}
          </span>
        </div>
      </div>

      {/* Threshold info */}
      {threshold && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex justify-between">
            <span>Safe Range:</span>
            <span className="font-medium">
              {threshold.min} - {threshold.max} {unit}
            </span>
          </div>
        </div>
      )}

      {/* Last updated */}
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
        <span>Last Updated</span>
        <span className="font-medium">{formatTime(lastReading)}</span>
      </div>

      {/* Status indicator */}
      <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            status === 'safe' 
              ? 'bg-green-500' 
              : status === 'warning' 
              ? 'bg-yellow-500' 
              : 'bg-red-500'
          }`}
          style={{
            width: threshold 
              ? `${Math.min(100, (value / threshold.max) * 100)}%`
              : '100%'
          }}
        />
      </div>
    </div>
  );
};

export default SensorCard;