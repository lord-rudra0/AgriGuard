export const severityColors = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
};

export const severityGlows = {
  info: 'group-hover:shadow-blue-500/10',
  warning: 'group-hover:shadow-yellow-500/10',
  low: 'group-hover:shadow-blue-500/10',
  medium: 'group-hover:shadow-yellow-500/10',
  high: 'group-hover:shadow-orange-500/10',
  critical: 'shadow-red-500/20 group-hover:shadow-red-500/30 animate-pulse-slow',
};

export const severityOrder = { info: 0, low: 0, warning: 1, medium: 1, high: 2, critical: 3 };

export const ALERTS_PAGE_LIMIT = 20;
