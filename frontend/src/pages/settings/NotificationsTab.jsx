import { Loader2, Save } from 'lucide-react';
import { NOTIFICATION_OPTIONS } from './constants';

const NotificationsTab = ({
  notificationData,
  handleToggleNotification,
  handleSubscribePush,
  handleUnsubscribePush,
  handleSendTestPush,
  handleSaveNotificationPreferences,
  loading
}) => (
  <div className="space-y-6">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-shadow hover:shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>

      <div className="space-y-4">
        {NOTIFICATION_OPTIONS.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationData[key]}
                onChange={(e) => handleToggleNotification(key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-end">
        <div className="flex flex-wrap gap-4 justify-end">
          <button
            onClick={handleSubscribePush}
            disabled={loading || notificationData.pushNotifications}
            className="flex items-center px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all duration-300 disabled:opacity-50 uppercase tracking-widest"
          >
            Subscribe
          </button>

          <button
            onClick={handleUnsubscribePush}
            disabled={loading || !notificationData.pushNotifications}
            className="flex items-center px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all duration-300 disabled:opacity-50 uppercase tracking-widest"
          >
            Unsubscribe
          </button>

          <button
            onClick={handleSendTestPush}
            disabled={loading}
            className="flex items-center px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-gray-600 hover:bg-gray-700 shadow-lg shadow-gray-500/20 transition-all duration-300 disabled:opacity-50 uppercase tracking-widest"
          >
            Send Test
          </button>

          <button
            onClick={handleSaveNotificationPreferences}
            disabled={loading}
            className="flex items-center px-8 py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xl shadow-emerald-500/20 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus:outline-none disabled:opacity-50 uppercase tracking-widest"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default NotificationsTab;
