import { Link } from 'react-router-dom';
import { Clock, FlaskConical, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const DashboardHeader = ({
  mounted,
  isIotActive,
  hasSensorData,
  sensorData,
  onGenerateDummyData,
  isGeneratingDummy
}) => (
  <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
    <div className="flex items-center justify-between gap-8 md:gap-14">
      <div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-500 bg-clip-text text-transparent filter drop-shadow-lg">
          Farm Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-800 dark:text-gray-100 font-medium">
          Real-time monitoring of your <span className="text-emerald-700 dark:text-emerald-400 font-medium">grow rooms</span>
        </p>
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <button
          type="button"
          onClick={onGenerateDummyData}
          disabled={isGeneratingDummy}
          className="group relative flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/15 border border-amber-100 dark:border-amber-500/20 transition-all duration-300 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <FlaskConical className={`w-4 h-4 ${isGeneratingDummy ? 'animate-pulse' : ''}`} />
          </div>
          <div className="flex flex-col items-start pr-1">
            <span className="text-[11px] font-bold text-gray-900 dark:text-white">
              {isGeneratingDummy ? 'Adding...' : 'Add Dummy Data'}
            </span>
          </div>
        </button>

        <Link
          to="/analytics"
          className="group relative flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 border border-emerald-100 dark:border-emerald-500/20 transition-all duration-300 shadow-sm"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex flex-col items-start pr-1">
            <span className="text-[11px] font-bold text-gray-900 dark:text-white">Farm Insights</span>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          <span className="relative inline-flex items-center">
            <span className={`h-2.5 w-2.5 rounded-full ${isIotActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {isIotActive && (
              <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            )}
          </span>
          {isIotActive ? <Wifi className="w-5 h-5 text-emerald-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
          <span className={`text-sm font-semibold ${isIotActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
            {isIotActive ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {hasSensorData && (
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{formatDistanceToNow(sensorData.lastUpdated)} ago</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default DashboardHeader;
