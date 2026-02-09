// Routes index - central export for all routes
// This makes imports more reliable in Vercel's serverless environment

export { default as authRoutes } from './auth.js';
export { default as sensorRoutes } from './sensors.js';
export { default as chatRoutes } from './chat.js';
export { default as chatSystemRoutes } from './chatSystem.js';
export { default as settingsRoutes } from './settings.js';
export { default as alertsRoutes } from './alerts.js';
export { default as geminiRoutes } from './gemini.js';
export { default as mushroomAnalysisRoutes } from './mushroomAnalysis.js';
export { default as analyticsViewsRoutes } from './analyticsViews.js';
export { default as reportsRoutes } from './reports.js';
export { default as recipesRoutes } from './recipes.js';
export { default as phasesRoutes } from './phases.js';
export { default as thresholdsRoutes } from './thresholds.js';
export { default as calendarRoutes } from './calendar.js';
export { default as notificationsRoutes } from './notifications.js';
export { default as iotRoutes } from './iot.js';
export { default as devicesRoutes } from './devices.js';
export { default as talkAgentRoutes } from './talkAgent.js';
