import { NAVIGATION_AND_DEVICE_DECLARATIONS } from './toolDeclarations/navigationAndDevice.js';
import { ALERTS_AUTOMATION_DECLARATIONS } from './toolDeclarations/alertsAutomation.js';
import { REPORTING_NOTIFICATIONS_DECLARATIONS } from './toolDeclarations/reportingNotifications.js';
import { THRESHOLDS_CALENDAR_DECLARATIONS } from './toolDeclarations/thresholdsCalendar.js';

export const TALK_FUNCTION_DECLARATIONS = [
  ...NAVIGATION_AND_DEVICE_DECLARATIONS,
  ...ALERTS_AUTOMATION_DECLARATIONS,
  ...REPORTING_NOTIFICATIONS_DECLARATIONS,
  ...THRESHOLDS_CALENDAR_DECLARATIONS
];
