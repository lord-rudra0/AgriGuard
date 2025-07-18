import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, Sparkles, TrendingUp, Droplets, Users, Target, Heart } from 'lucide-react';

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Hero Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
          <div className="absolute inset-0 bg-gradient-to-t from-green-900/20 via-transparent to-blue-900/20" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Floating Badge */}
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl px-6 py-3 rounded-full mb-8 border border-green-500/30 hover:border-green-400/50 transition-all duration-500 group">
                <div className="relative">
                  <Star className="h-5 w-5 text-yellow-400 animate-spin" />
                  <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50 animate-ping" />
                </div>
                <span className="text-sm font-semibold text-green-300 group-hover:text-green-200 transition-colors duration-300">
                  Trusted by 10,000+ farmers worldwide
                </span>
                <Sparkles className="h-4 w-4 text-green-400 animate-pulse" />
              </div>
            </div>
            
            {/* Main Headline */}
            <div className={`transform transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-none">
                <span className="block bg-gradient-to-r from-white via-green-200 to-white bg-clip-text text-transparent animate-pulse">
                  Smart Farming
                </span>
                <span className="block bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 bg-clip-text text-transparent animate-gradient-x">
                  for Every Village
                </span>
              </h1>
            </div>
            
            {/* Subtitle */}
            <p className={`text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              Revolutionary IoT sensors, offline AI, and mesh networking that transforms agriculture 
              in remote areas—<span className="text-green-400 font-semibold">with or without internet</span>
            </p>
            
            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-8 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <button className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-5 rounded-2xl text-lg font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-center space-x-3">
                  <span>Start Growing Smarter</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
                <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </button>
              
              <button className="group relative border-2 border-green-500 text-green-400 px-10 py-5 rounded-2xl text-lg font-bold hover:bg-green-500 hover:text-white transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/30 overflow-hidden">
                <div className="absolute inset-0 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                <span className="relative z-10">Watch Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: TrendingUp,
                value: "45%",
                label: "Average increase in crop yield",
                gradient: "from-green-400 to-emerald-500",
                delay: "0"
              },
              {
                icon: Droplets,
                value: "60%",
                label: "Reduction in water usage",
                gradient: "from-blue-400 to-cyan-500",
                delay: "200"
              },
              {
                icon: Users,
                value: "25,000+",
                label: "Connected farmers globally",
                gradient: "from-purple-400 to-violet-500",
                delay: "400"
              },
              {
                icon: Target,
                value: "99.9%",
                label: "System uptime reliability",
                gradient: "from-orange-400 to-red-500",
                delay: "600"
              }
            ].map((stat, index) => (
              <div 
                key={stat.label}
                className={`text-center group animate-scale-in`}
                style={{ animationDelay: `${stat.delay}ms` }}
              >
                <div className="relative mb-8">
                  <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />
                  <div className={`relative bg-gradient-to-r ${stat.gradient} w-24 h-24 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-500 shadow-2xl`}>
                    <stat.icon className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-5xl font-black text-white mb-3 group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </h3>
                <p className="text-gray-400 font-semibold group-hover:text-gray-300 transition-colors duration-300">
                  {stat.label}
                </p>
                <div className={`mt-4 h-1 bg-gradient-to-r ${stat.gradient} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-center mx-auto w-20`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600" />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-fade-in-up">
            <h2 className="text-6xl md:text-7xl font-black text-white mb-8">
              Ready to Revolutionize
              <br />
              <span className="bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent">
                Your Farm?
              </span>
            </h2>
            <p className="text-2xl text-green-100 mb-12 max-w-4xl mx-auto leading-relaxed">
              Join the smart farming revolution today. Transform your agriculture with cutting-edge technology 
              designed for real-world farming challenges.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-6 sm:space-y-0 sm:space-x-8">
              <button className="group relative bg-white text-green-600 px-12 py-6 rounded-2xl text-xl font-bold hover:bg-gray-100 transition-all duration-500 hover:scale-110 hover:shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center space-x-3">
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </button>
              
              <button className="group relative border-2 border-white text-white px-12 py-6 rounded-2xl text-xl font-bold hover:bg-white hover:text-green-600 transition-all duration-500 hover:scale-110 hover:shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                <span className="relative z-10">Schedule Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.8s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Home;