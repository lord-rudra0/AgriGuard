import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Microscope,
  Camera,
  Bell,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Zap,
  Framer,
  Lock,
  Thermometer,
  Mic,
  History,
  Activity,
  Skull,
  Server
} from 'lucide-react';

const features = [
  {
    title: 'Precision Mycology',
    desc: 'Leverage AgriGuard AI to monitor mycelium health, detect contamination early, and optimize fruiting conditions with real-time data.',
    icon: <Microscope className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
    gradient: 'from-indigo-500/20 to-purple-500/20'
  },
  {
    title: 'Visual ID & Safety',
    desc: 'Instant visual analysis of mushroom species. Our AI identifies varieties and flags toxic look-alikes to ensure total harvest safety.',
    icon: <Camera className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
    gradient: 'from-blue-500/20 to-indigo-500/20'
  },
  {
    title: 'Conversational AI',
    desc: 'Talk directly to your mycology assistant. Get real-time advice on growing, troubleshooting, and identification through voice.',
    icon: <Mic className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
    gradient: 'from-emerald-500/20 to-teal-500/20'
  },
  {
    title: 'IoT Ecosystem',
    desc: 'Seamlessly connect your Arduino and sensor hardware to monitor CO2, humidity, and temperature automatically.',
    icon: <Server className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
    gradient: 'from-orange-500/20 to-red-500/20'
  },
  {
    title: 'Historical Insights',
    desc: 'Track every scan, harvest, and growth cycle with detailed historical analytics and visual logs of your facility.',
    icon: <History className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
    gradient: 'from-purple-500/20 to-pink-500/20'
  },
  {
    title: 'Adaptive Alerts',
    desc: 'Receive proactive notifications for contamination risks, climate drift, or when your mushrooms are ready for harvest.',
    icon: <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
    gradient: 'from-cyan-500/20 to-blue-500/20'
  }
];

export default function Landing() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-purple-500/10 dark:bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-12 pb-20 md:pt-20 md:pb-32 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className={`space-y-8 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
              <Zap className="w-4 h-4 fill-indigo-500/20" />
              <span>Professional Mycology Intelligence</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]">
              The Gold Standard <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                in Fungi Analysis.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
              AgriGuard provides a comprehensive suite of AI tools designed for professional mushroom cultivators.
              Real-time monitoring, expert voice AI, and precise species identification.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="group relative px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1 transition-all"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Monitoring <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
              >
                Sign In
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-950 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=myco${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Used by <span className="text-gray-900 dark:text-white font-bold">1,200+</span> mycologists globally
              </p>
            </div>
          </div>

          {/* Hero Image / Visualization */}
          <div className={`relative transition-all duration-1000 delay-300 ease-out ${mounted ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 -rotate-2'}`}>
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-3xl opacity-50 rounded-[40px]" />
            <div className="relative rounded-[32px] overflow-hidden border border-white/20 dark:border-gray-800 shadow-2xl shadow-indigo-500/10">
              <img
                src="/images/landing/hero_mushroom.png"
                alt="AgriGuard Mushroom Lab AI"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent pointer-events-none" />

              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/10 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 flex items-center gap-4 animate-float">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Framer className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Live Lab Analysis</p>
                  <p className="text-white/60 text-xs">Vigor: Peak Performance | Contam: 0%</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="container mx-auto px-4 py-24 max-w-7xl relative">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Comprehensive <span className="text-indigo-600 dark:text-indigo-400">Toolkit</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Everything you need to scale your mycology operations with AI-driven precision and professional automation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`group relative p-8 rounded-[32px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-indigo-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${f.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                {f.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6 h-20">
                {f.desc}
              </p>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold group-hover:gap-3 transition-all cursor-pointer">
                <span>Configure Feature</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Professional Safety Standard */}
      <section className="container mx-auto px-4 py-24 max-w-7xl">
        <div className="relative rounded-[40px] overflow-hidden bg-gray-900 p-8 md:p-16">
          <div className="absolute top-0 right-0 w-[60%] h-full bg-indigo-600/10 blur-[100px] rounded-full" />
          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                Enterprise-Grade <br />
                <span className="text-emerald-400">Biosafety Protocol.</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Our AI uses multi-layered datasets to eliminate guesswork. We prioritize safety and regulatory compliance in every scan.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="flex items-center gap-3 text-white">
                  <Skull className="w-6 h-6 text-red-500" />
                  <span className="font-semibold text-sm">Toxin Alert System</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Activity className="w-6 h-6 text-emerald-500" />
                  <span className="font-semibold text-sm">Real-time Biometrics</span>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-white font-medium">Model Precision Level</span>
                <span className="ml-auto text-emerald-400 text-sm font-bold">99.9%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[99.9%] bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              </div>
              <p className="text-gray-400 text-xs italic">
                Verified against 50,000+ mycological samples and laboratory datasets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-24 text-center max-w-5xl">
        <div className="space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
            Ready for <span className="italic font-light">Industry-Level</span> Growth?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join the elite circle of mycologists leveraging AgriGuard's full power.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-12 py-6 rounded-2xl bg-indigo-600 dark:bg-white text-white dark:text-indigo-900 font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3"
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
            {['ISO 27001', 'GDPR Compliant', 'Bank-Grade SSL', 'AgriGuard AI Tier 1'].map(b => (
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
