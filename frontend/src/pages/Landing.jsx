import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Smart Crop Insights',
    desc: 'Leverage AI to monitor crop health, detect issues early, and optimize yield with data-driven decisions.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
      </svg>
    ),
  },
  {
    title: 'Image-based Diagnosis',
    desc: 'Upload field images and get instant AI-powered analysis directly within the chat.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 17h18M7 3v18" />
      </svg>
    ),
  },
  {
    title: 'Real-time Alerts',
    desc: 'Get notified about weather risks, pests, and anomalies so you can act quickly.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M5.07 19h13.86L12 4 5.07 19z" />
      </svg>
    ),
  },
];

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Nav rendered by AppLayout for public routes */}

      {/* Hero */}
      <section className="container mx-auto px-4 py-10 md:py-20 grid md:grid-cols-2 items-center gap-10">
        <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Modern Agriculture. Powered by AI.
          </h1>
          <p className={`mt-5 text-lg text-gray-600 dark:text-gray-300 max-w-xl transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            Monitor your fields, chat with an agronomy AI assistant, and make faster, smarter decisions. Upload images, get instant insights, and stay ahead of risks.
          </p>
          <div className={`mt-8 flex items-center gap-3 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <Link to="/register" className="px-5 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 shadow transform transition-transform duration-300 hover:scale-[1.02]">
              Get Started
            </Link>
            <Link to="/login" className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transform transition-transform duration-300 hover:scale-[1.02]">
              I have an account
            </Link>
          </div>
          <div className={`mt-6 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 transition-opacity duration-700 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-2">
              <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-green-100 text-green-700">✓</span>
              Fast setup
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-green-100 text-green-700">✓</span>
              Secure by design
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-green-100 text-green-700">✓</span>
              Free tier available
            </div>
          </div>
        </div>
        <div className={`relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div className="absolute inset-0 -z-10 bg-primary-600/20 blur-3xl rounded-full animate-pulse" />
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur transform transition-transform duration-500 hover:scale-[1.02]">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-primary-600/25 to-emerald-500/25 flex items-center justify-center text-primary-700 dark:text-primary-300">
              <div className="text-center">
                <div className="text-5xl">🌾🤖</div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">AI Agronomy Assistant</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-300">
              {['Chat & Insights','Image Diagnosis','Real-time Alerts'].map((t, i) => (
                <div
                  key={t}
                  style={{ transitionDelay: `${150 + i * 100}ms` }}
                  className={`rounded-lg border border-gray-200 dark:border-gray-800 p-3 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} hover:shadow-sm`}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <h2 className={`text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>Why AgriGuard</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              style={{ transitionDelay: `${i * 120}ms` }}
              className={`rounded-2xl p-6 border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} hover:shadow-lg hover:-translate-y-0.5`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary-600/10 text-primary-700 dark:text-primary-300 flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-12">
        <div className={`rounded-2xl p-8 md:p-10 bg-gradient-to-br from-primary-600 to-emerald-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div>
            <h3 className="text-2xl font-bold">Start transforming your farm today</h3>
            <p className="mt-1 text-white/90">Join AgroNex and unlock AI-driven agronomy tools designed for real impact.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/register" className="px-5 py-3 rounded-xl bg-white text-primary-700 hover:bg-gray-100 transform transition-transform duration-300 hover:scale-[1.02]">Create Account</Link>
            <Link to="/login" className="px-5 py-3 rounded-xl ring-1 ring-white/60 hover:bg-white/10 transform transition-transform duration-300 hover:scale-[1.02]">Sign In</Link>
          </div>
        </div>
      </section>

      {/* Footer rendered by AppLayout for public routes */}
    </div>
  );
}
