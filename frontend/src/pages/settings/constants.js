export const DEFAULT_PROFILE_DATA = {
  name: '',
  username: '',
  email: '',
  phone: '',
  location: '',
  bio: '',
  avatar: ''
};

export const DEFAULT_SECURITY_DATA = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFactorEnabled: false
};

export const DEFAULT_NOTIFICATION_DATA = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  weatherAlerts: true,
  systemUpdates: true,
  marketingEmails: false,
  minPushSeverity: 'low',
  minReportSeverity: 'low',
  pushQuietHoursEnabled: true,
  pushQuietHoursStart: '22:00',
  pushQuietHoursEnd: '07:00',
  reportQuietHoursEnabled: true,
  reportQuietHoursStart: '22:00',
  reportQuietHoursEnd: '07:00'
};

export const DEFAULT_SYSTEM_DATA = {
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  temperatureUnit: 'celsius',
  alertDebounceMs: 5 * 60 * 1000,
  autoSave: true
};

export const NOTIFICATION_OPTIONS = [
  {
    key: 'emailNotifications',
    label: 'Email Notifications',
    description: 'Receive notifications via email'
  },
  {
    key: 'pushNotifications',
    label: 'Push Notifications',
    description: 'Receive push notifications in your browser'
  },
  {
    key: 'smsNotifications',
    label: 'SMS Notifications',
    description: 'Receive notifications via SMS'
  },
  {
    key: 'weatherAlerts',
    label: 'Weather Alerts',
    description: 'Get alerts about weather conditions'
  },
  {
    key: 'systemUpdates',
    label: 'System Updates',
    description: 'Notifications about system updates'
  },
  {
    key: 'marketingEmails',
    label: 'Marketing Emails',
    description: 'Promotional emails and newsletters'
  }
];

export const getPushStatusLabel = (status) => {
  if (status === 'unknown') return 'Checking...';
  if (status === 'subscribed') return 'Subscribed';
  if (status === 'blocked') return 'Blocked';
  return 'Not subscribed';
};
