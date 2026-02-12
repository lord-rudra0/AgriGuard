const mountIfExists = (app, basePath, routeModule) => {
  if (routeModule) app.use(basePath, routeModule);
};

const importRoute = async (routePath, routeName) => {
  try {
    let routeModule;
    const paths = [
      routePath,
      routePath.replace('../routes/', '../src/routes/'),
      routePath.replace('../routes/', '/var/task/backend/src/routes/')
    ];

    for (const p of paths) {
      try {
        routeModule = await import(p);
        console.log(`✅ ${routeName} routes imported successfully from: ${p}`);
        break;
      } catch (pathError) {
        console.log(`   Trying path: ${p} - ${pathError.code || 'failed'}`);
      }
    }

    if (!routeModule) throw new Error(`All import paths failed for ${routeName}`);
    return routeModule.default;
  } catch (error) {
    console.error(`❌ Failed to import ${routeName} routes:`, error.message);
    return null;
  }
};

export const loadRoutes = async (app) => {
  let sensorRoutes;
  let chatRoutes;
  let chatSystemRoutes;
  let settingsRoutes;
  let alertsRoutes;
  let geminiRoutes;
  let mushroomAnalysisRoutes;
  let analyticsViewsRoutes;
  let reportsRoutes;
  let recipesRoutes;
  let phasesRoutes;
  let thresholdsRoutes;
  let calendarRoutes;
  let iotRoutes;
  let notificationsRoutes;
  let talkAgentRoutes;

  try {
    console.log('🚀 Starting route loading...');
    try {
      const routesIndex = await import('../routes/index.js');
      sensorRoutes = routesIndex.sensorRoutes;
      chatRoutes = routesIndex.chatRoutes;
      chatSystemRoutes = routesIndex.chatSystemRoutes;
      settingsRoutes = routesIndex.settingsRoutes;
      alertsRoutes = routesIndex.alertsRoutes;
      geminiRoutes = routesIndex.geminiRoutes;
      analyticsViewsRoutes = routesIndex.analyticsViewsRoutes;
      reportsRoutes = routesIndex.reportsRoutes;
      recipesRoutes = routesIndex.recipesRoutes;
      phasesRoutes = routesIndex.phasesRoutes;
      thresholdsRoutes = routesIndex.thresholdsRoutes;
      calendarRoutes = routesIndex.calendarRoutes;
      notificationsRoutes = routesIndex.notificationsRoutes;
      mushroomAnalysisRoutes = routesIndex.mushroomAnalysisRoutes;
      iotRoutes = routesIndex.iotRoutes;
      talkAgentRoutes = routesIndex.talkAgentRoutes;
      console.log('✅ All routes loaded from index');
    } catch (indexError) {
      console.log('⚠️ Routes index failed, trying individual imports...');
      console.log('   Index error:', indexError.message);

      sensorRoutes = await importRoute('../routes/sensors.js', 'Sensors');
      chatRoutes = await importRoute('../routes/chat.js', 'Chat');
      chatSystemRoutes = await importRoute('../routes/chatSystem.js', 'ChatSystem');
      settingsRoutes = await importRoute('../routes/settings.js', 'Settings');
      alertsRoutes = await importRoute('../routes/alerts.js', 'Alerts');
      geminiRoutes = await importRoute('../routes/gemini.js', 'Gemini');
      mushroomAnalysisRoutes = await importRoute('../routes/mushroomAnalysis.js', 'MushroomAnalysis');
      analyticsViewsRoutes = await importRoute('../routes/analyticsViews.js', 'AnalyticsViews');
      reportsRoutes = await importRoute('../routes/reports.js', 'Reports');
      recipesRoutes = await importRoute('../routes/recipes.js', 'Recipes');
      phasesRoutes = await importRoute('../routes/phases.js', 'Phases');
      thresholdsRoutes = await importRoute('../routes/thresholds.js', 'Thresholds');
      calendarRoutes = await importRoute('../routes/calendar.js', 'Calendar');
      notificationsRoutes = await importRoute('../routes/notifications.js', 'Notifications');
      iotRoutes = await importRoute('../routes/iot.js', 'IoT');
      talkAgentRoutes = await importRoute('../routes/talkAgent.js', 'TalkAgent');
    }

    mountIfExists(app, '/api/sensors', sensorRoutes);
    mountIfExists(app, '/api/chat', chatRoutes);
    mountIfExists(app, '/api/chat-system', chatSystemRoutes);
    mountIfExists(app, '/api/chatSystem', chatSystemRoutes);
    mountIfExists(app, '/api/settings', settingsRoutes);
    mountIfExists(app, '/api/alerts', alertsRoutes);
    mountIfExists(app, '/api/gemini', geminiRoutes);
    mountIfExists(app, '/api/analytics-views', analyticsViewsRoutes);
    mountIfExists(app, '/api/reports', reportsRoutes);
    mountIfExists(app, '/api/recipes', recipesRoutes);
    mountIfExists(app, '/api/phases', phasesRoutes);
    mountIfExists(app, '/api/thresholds', thresholdsRoutes);
    mountIfExists(app, '/api/calendar', calendarRoutes);
    mountIfExists(app, '/api/notifications', notificationsRoutes);
    mountIfExists(app, '/api/analyze/mushroom', mushroomAnalysisRoutes);
    mountIfExists(app, '/api/iot', iotRoutes);
    mountIfExists(app, '/api/talk', talkAgentRoutes);

    console.log('✅ All routes configured');
  } catch (error) {
    console.error('❌ Error during route loading:', error);
  }
};
