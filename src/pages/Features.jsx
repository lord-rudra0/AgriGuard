import React, { useState, useEffect } from 'react';
import { Thermometer, Brain, Satellite, Mic, Bone as Drone, MessageCircle, Award } from 'lucide-react';

const Features = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Thermometer,
      title: "Smart Soil Monitoring",
      description: "Advanced IoT sensors continuously monitor soil pH, moisture, and nutrients with real-time insights for optimal crop management.",
      gradient: "from-emerald-400 via-green-500 to-teal-600",
      bgGradient: "from-green-500/10 to-emerald-500/10",
      borderGradient: "from-green-500/50 to-emerald-500/50",
      delay: "0"
    },
    {
      icon: Brain,
      title: "Offline AI Assistant",
      description: "Powerful local AI provides intelligent crop recommendations, watering schedules, and farming advice without internet dependency.",
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-500/10 to-indigo-500/10",
      borderGradient: "from-blue-500/50 to-indigo-500/50",
      delay: "100"
    },
    {
      icon: Satellite,
      title: "Mesh Network",
      description: "Revolutionary LoRa-based mesh technology connects farmers across vast distances without mobile signals or internet.",
      gradient: "from-purple-400 via-violet-500 to-indigo-600",
      bgGradient: "from-purple-500/10 to-violet-500/10",
      borderGradient: "from-purple-500/50 to-violet-500/50",
      delay: "200"
    },
    {
      icon: Mic,
      title: "Voice Assistant",
      description: "Multilingual @AgroAI responds to voice commands in local languages, making technology accessible for all farmers.",
      gradient: "from-orange-400 via-red-500 to-pink-600",
      bgGradient: "from-orange-500/10 to-red-500/10",
      borderGradient: "from-orange-500/50 to-red-500/50",
      delay: "300"
    },
    {
      icon: Drone,
      title: "Drone Integration",
      description: "Optional drone support with AI-powered aerial monitoring for comprehensive crop health detection and field analysis.",
      gradient: "from-pink-400 via-rose-500 to-red-600",
      bgGradient: "from-pink-500/10 to-rose-500/10",
      borderGradient: "from-pink-500/50 to-rose-500/50",
      delay: "400"
    },
    {
      icon: MessageCircle,
      title: "Farmer Network",
      description: "Integrated chat system enables farmers to share knowledge, send alerts, and build communities across regions.",
      gradient: "from-teal-400 via-cyan-500 to-blue-600",
      bgGradient: "from-teal-500/10 to-cyan-500/10",
      borderGradient: "from-teal-500/50 to-cyan-500/50",
      delay: "500"
    }
  ];

  return (
    <div className="py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-20 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl px-6 py-3 rounded-full mb-6 border border-green-500/30">
            <Award className="h-5 w-5 text-green-400 animate-pulse" />
            <span className="text-sm font-bold text-green-300 tracking-wider">REVOLUTIONARY FEATURES</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Next-Gen
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              Smart Farming
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Cutting-edge technology designed for rural realities, bringing the future of agriculture to every farm.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className={`group relative bg-gradient-to-br ${feature.bgGradient} backdrop-blur-xl p-8 rounded-3xl border border-transparent hover:border-gradient transition-all duration-700 hover:scale-105 hover:shadow-2xl animate-fade-in-up hover:-translate-y-2 hover:rotate-1`}
              style={{ 
                animationDelay: `${feature.delay}ms`,
                borderImage: `linear-gradient(135deg, ${feature.borderGradient.replace('from-', '').replace('to-', ', ')}) 1`
              }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Animated Border */}
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.borderGradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-sm group-hover:animate-pulse`} />
              <div className="relative bg-black/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50 group-hover:border-gray-700/70 transition-all duration-500">
                
                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-700 group-hover:animate-pulse`} />
                  <div className={`relative bg-gradient-to-br ${feature.gradient} w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-700 shadow-2xl group-hover:rotate-12 ${hoveredCard === index ? 'animate-bounce' : ''}`}>
                    <feature.icon className="h-8 w-8 text-white group-hover:animate-pulse" />
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gray-100 transition-all duration-500 group-hover:tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-all duration-500 group-hover:translate-x-1">
                  {feature.description}
                </p>
                
                {/* Animated Accent Line */}
                <div className={`mt-6 h-1 bg-gradient-to-r ${feature.gradient} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 origin-left group-hover:animate-pulse`} />
                
                {/* Floating Particles on Hover */}
                {hoveredCard === index && (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-float opacity-60"
                        style={{
                          left: `${20 + Math.random() * 60}%`,
                          top: `${20 + Math.random() * 60}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${1 + Math.random() * 2}s`,
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
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

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }

        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Features;