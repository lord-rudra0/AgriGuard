import React, { useState, useEffect } from 'react';
import { WifiOff, Zap, Globe, Shield, Cpu, Radio, Cloud, MapPin, BarChart3, Lightbulb, Users } from 'lucide-react';

const Technology = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className={`text-center mb-20 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl px-6 py-3 rounded-full mb-6 border border-blue-500/30">
            <Cpu className="h-5 w-5 text-blue-400 animate-pulse" />
            <span className="text-sm font-bold text-blue-300 tracking-wider">ADVANCED TECHNOLOGY</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6">
            Built for
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Rural Realities
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Our technology adapts to your environment, delivering powerful solutions that work seamlessly anywhere.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Technology Features */}
          <div className="space-y-8">
            {[
              {
                icon: WifiOff,
                title: "Offline-First Architecture",
                description: "Core functionality operates independently of internet connectivity. Cloud AI enhances capabilities when available.",
                color: "green",
                gradient: "from-green-400 to-emerald-500"
              },
              {
                icon: Zap,
                title: "Ultra Low Power Design",
                description: "Energy-efficient sensors and devices engineered for extended deployment in challenging rural environments.",
                color: "blue",
                gradient: "from-blue-400 to-cyan-500"
              },
              {
                icon: Globe,
                title: "Multilingual Intelligence",
                description: "Voice and text interfaces support regional languages, ensuring accessibility for farmers of all literacy levels.",
                color: "purple",
                gradient: "from-purple-400 to-violet-500"
              },
              {
                icon: Shield,
                title: "Military-Grade Security",
                description: "Robust mesh networking with end-to-end encryption ensures secure communication in any condition.",
                color: "orange",
                gradient: "from-orange-400 to-red-500"
              }
            ].map((item, index) => (
              <div 
                key={item.title}
                className={`flex items-start space-x-6 group animate-slide-in-left`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />
                  <div className={`relative bg-gradient-to-r ${item.gradient} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-2xl`}>
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-100 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Demo Card */}
          <div className={`relative animate-slide-in-right`}>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl p-10 rounded-3xl border border-gray-700/50 shadow-2xl">
              
              {/* Header */}
              <div className="text-center mb-10">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">How It Works</h3>
                <p className="text-gray-400">Simple deployment, revolutionary results</p>
              </div>
              
              {/* Steps */}
              <div className="space-y-6">
                {[
                  { icon: MapPin, text: "Install sensors in your fields", color: "from-green-400 to-emerald-500" },
                  { icon: Radio, text: "Connect to local mesh network", color: "from-blue-400 to-cyan-500" },
                  { icon: Lightbulb, text: "Receive AI-powered recommendations", color: "from-purple-400 to-violet-500" },
                  { icon: Users, text: "Share insights with farmer community", color: "from-orange-400 to-red-500" }
                ].map((step, index) => (
                  <div 
                    key={step.text}
                    className={`flex items-center space-x-4 group animate-fade-in`}
                    style={{ animationDelay: `${index * 300 + 1000}ms` }}
                  >
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300`} />
                      <div className={`relative bg-gradient-to-r ${step.color} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                        <step.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <span className="text-gray-300 font-semibold group-hover:text-white transition-colors duration-300 flex-1">
                      {step.text}
                    </span>
                    <div className={`w-2 h-2 bg-gradient-to-r ${step.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 1s ease-out forwards;
        }

        .animate-slide-in-right {
          animation: slide-in-right 1s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Technology;