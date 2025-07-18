import React, { useState, useEffect } from 'react';
import { TrendingUp, Droplets, Users, Target, BarChart3, Award, CheckCircle, ArrowRight } from 'lucide-react';

const Benefits = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-20 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl px-6 py-3 rounded-full mb-6 border border-purple-500/30">
            <BarChart3 className="h-5 w-5 text-purple-400 animate-pulse" />
            <span className="text-sm font-bold text-purple-300 tracking-wider">PROVEN RESULTS</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6">
            Transform Your
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Farming Future
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Join thousands of farmers worldwide who have revolutionized their agriculture with AgroMesh technology.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
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

        {/* Benefits List */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div className="space-y-8">
            <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Why Farmers Choose
                <br />
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  AgroMesh
                </span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed">
                Real benefits that make a difference in your daily farming operations and long-term success.
              </p>
            </div>

            <div className="space-y-6">
              {[
                "Increase crop yields by up to 45% with data-driven insights",
                "Reduce water consumption by 60% through smart irrigation",
                "Connect with 25,000+ farmers in your region",
                "Access offline AI recommendations anytime, anywhere",
                "Monitor soil health in real-time with IoT sensors",
                "Get multilingual support in your local language"
              ].map((benefit, index) => (
                <div 
                  key={benefit}
                  className={`flex items-center space-x-4 group animate-slide-in-left`}
                  style={{ animationDelay: `${index * 100 + 500}ms` }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                    <div className="relative bg-gradient-to-r from-green-400 to-emerald-500 w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <span className="text-gray-300 font-semibold group-hover:text-white transition-colors duration-300">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Success Story Card */}
          <div className={`relative animate-slide-in-right`}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl p-10 rounded-3xl border border-gray-700/50 shadow-2xl">
              
              {/* Header */}
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">Success Story</h3>
                <p className="text-gray-400">Real results from real farmers</p>
              </div>
              
              {/* Testimonial */}
              <div className="space-y-6">
                <blockquote className="text-lg text-gray-300 italic leading-relaxed">
                  "AgroMesh transformed my 50-acre farm. The AI recommendations helped me increase my wheat yield by 40% while using 50% less water. The mesh network keeps me connected with other farmers even in remote areas."
                </blockquote>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    R
                  </div>
                  <div>
                    <div className="text-white font-semibold">Rajesh Kumar</div>
                    <div className="text-gray-400 text-sm">Wheat Farmer, Punjab</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">40%</div>
                    <div className="text-sm text-gray-400">Yield Increase</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">50%</div>
                    <div className="text-sm text-gray-400">Water Saved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className={`text-center transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl p-12 rounded-3xl border border-gray-700/50 shadow-2xl">
            <h3 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Farm?
            </h3>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of farmers who are already benefiting from smart agriculture technology.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-4 rounded-2xl text-lg font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center space-x-3">
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </button>
              
              <button className="group relative border-2 border-green-500 text-green-400 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-green-500 hover:text-white transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/30 overflow-hidden">
                <div className="absolute inset-0 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                <span className="relative z-10">Learn More</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
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

        .animate-scale-in {
          animation: scale-in 0.8s ease-out forwards;
        }

        .animate-slide-in-left {
          animation: slide-in-left 1s ease-out forwards;
        }

        .animate-slide-in-right {
          animation: slide-in-right 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Benefits;