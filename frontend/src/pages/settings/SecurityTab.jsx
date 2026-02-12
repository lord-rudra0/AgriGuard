import { Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { getPushStatusLabel } from './constants';

const SecurityTab = ({
  securityData,
  updateSecurityField,
  handleSecurityUpdate,
  loading,
  showPassword,
  setShowPassword,
  pushStatus,
  showBlockedModal,
  setShowBlockedModal
}) => (
  <div className="space-y-6">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-shadow hover:shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={securityData.currentPassword}
              onChange={(e) => updateSecurityField('currentPassword', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={securityData.newPassword}
            onChange={(e) => updateSecurityField('newPassword', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm New Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={securityData.confirmPassword}
            onChange={(e) => updateSecurityField('confirmPassword', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Push status: <span className="font-medium">{getPushStatusLabel(pushStatus)}</span></p>
          {pushStatus === 'blocked' && (
            <button
              onClick={() => setShowBlockedModal(true)}
              className="text-sm px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 rounded-md ring-1 ring-black/5"
            >
              How to re-enable
            </button>
          )}
        </div>
      </div>

      {showBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Re-enable Notifications</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Your browser has blocked notifications for this site. Follow the steps below for common browsers to re-enable them.</p>

            <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <strong>Chrome (Desktop)</strong>
                <ol className="list-decimal list-inside ml-3">
                  <li>Click the padlock icon next to the URL in the address bar.</li>
                  <li>Find "Notifications" and set it to "Allow".</li>
                  <li>Reload the page and try subscribing again.</li>
                </ol>
              </div>

              <div>
                <strong>Firefox (Desktop)</strong>
                <ol className="list-decimal list-inside ml-3">
                  <li>Click the information icon (i) or padlock in the address bar.</li>
                  <li>Under Permissions, find Notifications and choose "Allow".</li>
                  <li>Reload the page.</li>
                </ol>
              </div>

              <div>
                <strong>Safari (macOS)</strong>
                <ol className="list-decimal list-inside ml-3">
                  <li>Open Safari, then Preferences, then Websites, then Notifications.</li>
                  <li>Find this site and change to "Allow".</li>
                  <li>Reload the page.</li>
                </ol>
              </div>

              <div>
                <strong>Mobile browsers</strong>
                <p className="mt-1">Push support varies on mobile. For Android Chrome, open site settings from the address bar and enable notifications. iOS Safari has limited Web Push support.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowBlockedModal(false)}
                className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white ring-1 ring-black/5 hover:brightness-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-shadow hover:shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Add an extra layer of security to your account
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={securityData.twoFactorEnabled}
            onChange={(e) => updateSecurityField('twoFactorEnabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSecurityUpdate}
          disabled={loading}
          className="flex items-center px-4 py-2 rounded-md text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Update Security
        </button>
      </div>
    </div>
  </div>
);

export default SecurityTab;
