import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Microscope,
  Camera,
  Bell,
  ChevronRight,
  ArrowRight,
  Zap,
  Mic,
  History,
  Activity,
  Server
} from 'lucide-react';

const features = [
  {
    title: 'Crop Health Monitoring',
    desc: 'Track humidity, temperature, and growth trends in real time so you can protect yield before losses happen.',
    icon: <Microscope className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />,
    gradient: 'from-emerald-500/20 to-lime-500/20'
  },
  {
    title: 'Visual Disease Detection',
    desc: 'Scan with your phone to detect contamination early and reduce the risk of batch failure.',
    icon: <Camera className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />,
    gradient: 'from-teal-500/20 to-emerald-500/20'
  },
  {
    title: 'Farmer AI Assistant',
    desc: 'Ask what to do next and get practical guidance for irrigation, room control, and harvest timing.',
    icon: <Mic className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />,
    gradient: 'from-emerald-500/20 to-cyan-500/20'
  },
  {
    title: 'IoT Farm Integration',
    desc: 'Connect Arduino and sensor devices to automate climate checks and receive instant action alerts.',
    icon: <Server className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />,
    gradient: 'from-amber-500/20 to-orange-500/20'
  },
  {
    title: 'Season Performance Logs',
    desc: 'Review every cycle with clear history so you can repeat successful conditions across seasons.',
    icon: <History className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />,
    gradient: 'from-amber-500/20 to-yellow-500/20'
  },
  {
    title: 'Actionable Alerts',
    desc: 'Get clear, priority-based notifications for climate drift, contamination risk, and harvest readiness.',
    icon: <Bell className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />,
    gradient: 'from-sky-500/20 to-cyan-500/20'
  }
];

export default function Landing() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-stone-50 dark:bg-slate-950 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-amber-500/10 dark:bg-amber-500/10 blur-[100px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-10 md:py-14 max-w-7xl min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] flex items-center">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Text Content */}
          <div className={`space-y-6 md:space-y-8 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] md:text-sm font-medium">
              <Zap className="w-3.5 h-3.5 fill-emerald-500/20" />
              <span>Built for Mushroom Farmers</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.2] md:leading-[1.1]">
              Protect Every Crop Cycle <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-500 bg-clip-text text-transparent">
                With Clear Daily Signals.
              </span>
            </h1>

            <p className="text-base md:text-xl text-gray-700 dark:text-gray-300 max-w-xl leading-relaxed">
              AgriGuard helps farmers monitor rooms, catch contamination early, and make faster decisions with sensor data and AI support.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto group relative px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-emerald-600 text-white font-bold text-base md:text-lg shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-1 transition-all flex justify-center"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Farming Smarter <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 flex justify-center"
              >
                Farmer Sign In
              </Link>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                <p className="text-[10px] md:text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider">
                  Practical Tools For Every Farm Size
                </p>
              </div>
            </div>
          </div>

          {/* Hero Image / Visualization */}
          <div className={`relative transition-all duration-1000 delay-300 ease-out ${mounted ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 -rotate-2'}`}>
            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 to-amber-500/20 blur-3xl opacity-50 rounded-[40px]" />
            <div className="relative rounded-[32px] overflow-hidden border border-white/20 dark:border-gray-800 shadow-2xl shadow-indigo-500/10">
              <img
                // src="/images/landing/hero_mushroom.png"
                // src="https://ibb.co/LXGtfJN3"
                src="https://i.ibb.co/LXGtfJN3/hero.jpg"
                alt="AgriGuard Mushroom Lab AI"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent pointer-events-none" />

              {/* Floating Badge */}
              <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/10 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 flex items-center gap-3 md:gap-4 animate-float">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs md:text-sm font-bold truncate">Climate Monitor</p>
                  <p className="text-white/70 text-[10px] md:text-xs truncate">Sensors online and stable</p>
                </div>
                <div className="ml-auto w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-7xl relative">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Everything Farmers Need <span className="text-emerald-700 dark:text-emerald-400">In One Place</span>
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg">
            Keep crop conditions, alerts, farm history, and AI guidance connected in one daily workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`group relative p-6 md:p-8 rounded-3xl md:rounded-[32px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-tr ${f.gradient} flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-500`}>
                {f.icon}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3 flex items-center gap-2">
                {f.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed mb-6 md:h-20">
                {f.desc}
              </p>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold group-hover:gap-3 transition-all cursor-pointer text-sm md:text-base">
                <span>Explore Feature</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Professional Safety Standard */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-7xl">
        <div className="relative rounded-3xl md:rounded-[40px] overflow-hidden bg-gray-900 p-6 md:p-16">
          <div className="absolute top-0 right-0 w-[60%] h-full bg-emerald-600/10 blur-[100px] rounded-full" />
          <div className="relative grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-2xl md:text-5xl font-bold text-white leading-tight">
                Reliable Decisions <br />
                <span className="text-emerald-400">For Safer Harvests.</span>
              </h2>
              <p className="text-gray-400 text-sm md:text-lg leading-relaxed max-w-md">
                Use consistent, data-backed recommendations to reduce guesswork and improve quality from pinning to harvest.
              </p>
              <div className="grid grid-cols-2 gap-4 md:gap-6 pt-2 md:pt-4">
                <div className="flex items-center gap-3 text-white">
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                  <span className="font-semibold text-xs md:text-sm">Early Risk Alerts</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                  <span className="font-semibold text-xs md:text-sm">Real-time Conditions</span>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-indigo-400" />
                <span className="text-white text-sm md:text-base font-medium">Recommendation Confidence</span>
              </div>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                AgriGuard combines sensor trends and scan history to suggest practical actions you can take in the next shift.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-24 text-center max-w-5xl">
        <div className="space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
            Ready for a <span className="italic font-light">Healthier</span> Harvest?
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Start with clear alerts, focused advice, and full visibility across your grow rooms.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-12 py-6 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3"
            >
              Get Started <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Secondary Trust Badges */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
            {['Self-Hosted Ready', 'Open-Source Core', 'IoT Hardware Support'].map(b => (
              <span key={b} className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
