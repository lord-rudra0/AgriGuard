import React, { useState } from 'react';
import { Mail, User, MessageCircle, Send } from 'lucide-react';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder for actual submission logic
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="py-32 relative min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-black to-emerald-900" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl px-6 py-3 rounded-full mb-6 border border-green-500/30">
            <Mail className="h-5 w-5 text-green-400 animate-pulse" />
            <span className="text-sm font-bold text-green-300 tracking-wider">CONTACT US</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Have questions or want to learn more? Fill out the form below and our team will get back to you soon.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-black/70 rounded-2xl shadow-2xl p-8 space-y-8 border border-green-500/10"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-gray-300 font-semibold mb-2" htmlFor="name">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-green-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900 text-white border border-green-500/20 focus:border-green-400 outline-none transition-all"
                  placeholder="Your Name"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-gray-300 font-semibold mb-2" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-green-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900 text-white border border-green-500/20 focus:border-green-400 outline-none transition-all"
                  placeholder="you@email.com"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-gray-300 font-semibold mb-2" htmlFor="message">
              Message
            </label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-3 h-5 w-5 text-green-400" />
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900 text-white border border-green-500/20 focus:border-green-400 outline-none transition-all resize-none"
                placeholder="How can we help you?"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Send className="h-5 w-5" />
            Send Message
          </button>
          {submitted && (
            <div className="text-green-400 text-center font-semibold mt-4">
              Thank you! Your message has been sent.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Contact;