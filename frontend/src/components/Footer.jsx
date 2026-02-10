import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, MapPin, Github, Twitter, Linkedin, ExternalLink, ArrowRight } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: 'Platform',
      links: [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Analytics', href: '/analytics' },
        { name: 'Mushroom Scan', href: '/scan' },
        { name: 'Community Chat', href: '/chat' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Growth Recipes', href: '/recipes' },
        { name: 'Threshold Guide', href: '/thresholds' },
        { name: 'Fleet Manager', href: '/devices' },
        { name: 'Alert Console', href: '/alerts' },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Support Deck', href: '/support' },
        { name: 'Documentation', href: '#' },
      ]
    }
  ];

  return (
    <footer className="relative bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-white/5 pt-16 pb-32 md:pb-12 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">

          {/* Brand Identity */}
          <div className="md:col-span-4 space-y-6">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent uppercase tracking-tight">
                AgriGuard
              </span>
            </Link>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm uppercase tracking-tight">
              Empowering modern mycology through AI-driven insights, real-time sensing, and precision environmental control.
            </p>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Github].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-emerald-500/30 hover:bg-white dark:hover:bg-gray-800 text-gray-400 hover:text-emerald-500 transition-all shadow-sm"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Grid */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {sections.map((section) => (
              <div key={section.title} className="space-y-5">
                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                  {section.title}
                </h3>
                <nav className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      className="group flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors uppercase tracking-widest"
                    >
                      {link.name}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter / Contact Row */}
        <div className="mt-16 py-8 border-t border-gray-100 dark:border-white/5 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-10">
            {[
              { icon: Mail, label: 'Ops Support', value: 'ops@agriguard.com' },
              { icon: Phone, label: 'Direct Line', value: '+91 98765 43210' },
              { icon: MapPin, label: 'HQ Location', value: 'Kochi, India' }
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-tight">{value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-80 relative group">
            <input
              type="email"
              placeholder="Newsletter Subscription"
              className="w-full pl-5 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-500/50 rounded-2xl text-xs font-bold text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400 placeholder:uppercase"
            />
            <button className="absolute right-2 top-1.2 inset-y-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Legal Bottom */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span>© {currentYear} AgriGuard Mycology</span>
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            <span>Built by the DeepMind Nexus Team</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Nodes</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;