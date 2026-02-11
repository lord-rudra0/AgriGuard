import { useState, useRef, useEffect } from 'react';
import { Bot, MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: 'Hi! I\'m your AgriGuard AI assistant. Ask me anything about your sensors, alerts, or best practices.' }
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Listen for external open commands
  useEffect(() => {
    const handleOpen = (e) => {
      setOpen(true);
      if (e.detail?.prompt) {
        setInput(e.detail.prompt);
      }
    };
    window.addEventListener('open-chatbot', handleOpen);
    return () => window.removeEventListener('open-chatbot', handleOpen);
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      // Use existing backend AI route, sending only the latest user message
      const res = await axios.post('/api/chat/ai', { message: trimmed }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const botText = res.data?.message || res.data?.reply || res.data?.text || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'model', content: botText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: 'Error contacting assistant. Please try again.' }]);
      // console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) return; // allow multiline if desired in future
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed right-5 z-50 select-none bottom-24 md:bottom-5">
      {/* Toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-lg ring-1 ring-black/5 hover:brightness-110 active:scale-[0.99] transition-all"
          aria-label="Open chatbot"
        >
          <Bot className="w-5 h-5" />
          Chat
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="w-[340px] sm:w-[380px] h-[520px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">AgriGuard Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 space-y-3 overflow-y-auto bg-gray-50/60 dark:bg-gray-900">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role === 'user'
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ring-1 ring-black/5 dark:ring-white/10'}
                  max-w-[85%] px-3 py-2 rounded-xl shadow-sm text-sm whitespace-pre-wrap`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about sensors, alerts, tips..."
                className="flex-1 resize-none px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="inline-flex items-center justify-center h-10 w-10 rounded-md text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5 disabled:opacity-50 hover:brightness-110 active:scale-[0.99] transition-all"
                aria-label="Send"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
