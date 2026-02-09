import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Sprout,
  Camera,
  Bell,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe,
  Lock
} from 'lucide-react';

const features = [
  {
    title: 'Smart Crop Insights',
    desc: 'Leverage Gemini AI to monitor crop health, detect issues early, and optimize yield with real-time data analysis.',
    icon: <Sprout className="w-6 h-6 text-primary-600 dark:text-indigo-400" />,
    gradient: 'from-emerald-500/20 to-teal-500/20'
  },
  {
    title: 'Visual Diagnosis',
    desc: 'Upload images of your crops and get instant AI-powered health assessments and treatment suggestions.',
    icon: <Camera className="w-6 h-6 text-primary-600 dark:text-indigo-400" />,
    gradient: 'from-blue-500/20 to-indigo-500/20'
  },
  {
    title: 'Intelligent Alerts',
    desc: 'Receive proactive notifications about weather risks, pest threats, and soil moisture anomalies.',
    icon: <Bell className="w-6 h-6 text-primary-600 dark:text-indigo-400" />,
    gradient: 'from-orange-500/20 to-red-500/20'
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
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-500/10 dark:bg-primary-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-12 pb-20 md:pt-20 md:pb-32 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className={`space-y-8 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm font-medium">
              <Zap className="w-4 h-4 fill-primary-500/20" />
              <span>Next-Gen Agriculture Platform</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]">
              Smart Farming <br />
              <span className="bg-gradient-to-r from-primary-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                Perfected by AI.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
              AgriGuard transforms traditional farming with the power of Gemini AI.
              Real-time scouting, visual diagnostics, and smart analytics—all in one place.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="group relative px-8 py-4 rounded-2xl bg-primary-600 text-white font-bold text-lg shadow-xl shadow-primary-600/20 hover:shadow-primary-600/40 hover:-translate-y-1 transition-all"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-950 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-500 opacity-20" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Trusted by <span className="text-gray-900 dark:text-white font-bold">500+</span> modern farms
              </p>
            </div>
          </div>

          {/* Hero Image / Visualization */}
          <div className={`relative transition-all duration-1000 delay-300 ease-out ${mounted ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 -rotate-2'}`}>
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500/20 to-emerald-500/20 blur-3xl opacity-50 rounded-[40px]" />
            <div className="relative rounded-[32px] overflow-hidden border border-white/20 dark:border-gray-800 shadow-2xl shadow-indigo-500/10">
              <img
                src="/images/landing/hero.png"
                alt="AgriGuard AI Visualization"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent pointer-events-none" />

              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/10 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 flex items-center gap-4 animate-float">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">Climate-Sync Active</p>
                  <p className="text-white/60 text-xs">Real-time weather integration enabled</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Markers */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60">
            {['Sensor Integration', 'Gemini 2.5', 'Data Security', 'Zero Downtime'].map(t => (
              <span key={t} className="text-lg font-bold tracking-tighter text-gray-900 dark:text-white uppercase italic">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-24 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Built for the <span className="italic font-light">New</span> Generation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Powerful tools designed to simplify complex data and put high-level agronomy in the palm of your hand.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`group relative p-8 rounded-[32px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${f.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {f.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                {f.desc}
              </p>
              <div className="flex items-center gap-2 text-primary-600 dark:text-indigo-400 font-bold group-hover:gap-3 transition-all cursor-pointer">
                <span>Learn more</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security Section (Glassmorphic) */}
      <section className="container mx-auto px-4 py-24 max-w-7xl">
        <div className="relative rounded-[40px] overflow-hidden bg-gray-900 p-8 md:p-16">
          <div className="absolute top-0 right-0 w-[60%] h-full bg-primary-600/10 blur-[100px] rounded-full" />
          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                Your data, <br />
                <span className="text-emerald-400">Safeguarded.</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                We use bank-level encryption and private cloud infrastructure to ensure your farm's
                data remains yours. Built-in compliance and secure handshakes come standard.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="flex items-center gap-3 text-white">
                  <Lock className="w-6 h-6 text-primary-500" />
                  <span className="font-semibold">End-to-End Encryption</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <span className="font-semibold">Local Compliance</span>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-white font-medium">Security Audit: PASS</span>
                <span className="ml-auto text-emerald-400 text-sm font-bold">100%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[100%] bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
              </div>
              <p className="text-gray-400 text-sm italic">
                AgriGuard adheres to ISO 27001 standards for data security and management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center max-w-5xl">
        <div className="space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
            Ready to <span className="italic font-light">Elevate</span> Your Yield?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of modern farmers using AgriGuard to optimize their daily operations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
