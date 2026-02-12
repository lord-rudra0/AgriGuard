import { User } from 'lucide-react';

const SettingsShell = ({ tabs, activeTab, setActiveTab, user, tabName, children }) => (
  <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full" />
      <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-600/10 dark:bg-emerald-600/5 blur-[100px] rounded-full" />
      <div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
    </div>

    <div className="relative z-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-4 shadow-xl border border-white/20 dark:border-gray-800">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all duration-300 group ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === tab.id ? 'text-white' : ''}`} />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-6 shadow-xl text-white overflow-hidden relative group">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wider">{user?.name}</h4>
                  <p className="text-emerald-100/70 text-xs">@{user?.username}</p>
                </div>
              </div>
              <div className="h-px bg-white/10 my-4" />
              <p className="text-xs text-emerald-50/80 leading-relaxed italic">{user?.bio || 'Grow something wonderful today.'}</p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 blur-2xl rounded-full group-hover:bg-white/20 transition-all duration-500"></div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-gray-800 p-6 md:p-10 min-h-[600px] flex flex-col">
            <div className="mb-8">
              <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 uppercase tracking-tight">
                {tabName} Settings
              </h2>
              <div className="h-1 w-12 bg-emerald-500 rounded-full mt-2" />
            </div>
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SettingsShell;
