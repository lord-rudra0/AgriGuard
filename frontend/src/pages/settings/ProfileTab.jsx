import { Mail, Phone, MapPin, Loader2, Save } from 'lucide-react';

const ProfileTab = ({ profileData, updateProfileField, handleProfileUpdate, loading }) => (
  <div className="space-y-6">
    <div className="bg-white/40 dark:bg-gray-800/40 rounded-3xl p-6 shadow-sm border border-white/20 dark:border-gray-700/50 backdrop-blur-md">
      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Personal Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-widest">
            Full Name
          </label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => updateProfileField('name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-widest">
            Username
          </label>
          <input
            type="text"
            value={profileData.username}
            onChange={(e) => updateProfileField('username', e.target.value.replace(/\s+/g, ''))}
            placeholder="letters, numbers, underscores"
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
          />
          <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium ml-1">3-30 chars, a-z, 0-9, _</p>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-widest">
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => updateProfileField('email', e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-widest">
            Phone Number
          </label>
          <div className="relative group">
            <Phone className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => updateProfileField('phone', e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-widest">
            Location
          </label>
          <div className="relative group">
            <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => updateProfileField('location', e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-widest">
          Bio
        </label>
        <textarea
          rows={4}
          value={profileData.bio}
          onChange={(e) => updateProfileField('bio', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleProfileUpdate}
          disabled={loading}
          className="flex items-center px-8 py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xl shadow-emerald-500/20 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus:outline-none disabled:opacity-50 uppercase tracking-widest"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Save Profile
        </button>
      </div>
    </div>
  </div>
);

export default ProfileTab;
