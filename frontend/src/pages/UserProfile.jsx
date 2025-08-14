import { useAuth } from '../context/AuthContext';
import { Mail, Phone, MapPin, Calendar, User as UserIcon, Edit3 } from 'lucide-react';

const UserProfile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-300">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Your account information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Avatar and basics */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-primary-600 text-white flex items-center justify-center text-3xl font-semibold overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name || user.email} className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    (user.name || user.email || '?').slice(0,1).toUpperCase()
                  )}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{user.name || '—'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Member</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm break-all">{user.email || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{user.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{user.location || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{user.bio || 'No bio provided.'}</p>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Name:</span>
                  <span className="font-medium">{user.name || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Joined:</span>
                  <span className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
                </div>
              </div>

              <div className="mt-6">
                <a href="/settings" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white">
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
