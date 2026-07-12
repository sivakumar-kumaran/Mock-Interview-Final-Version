import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare, X, Send, Sparkles, Bot, User } from 'lucide-react';

const ChatBot = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Interview Coach. Ask me anything about coding topics, behavioral questions, or interview strategies!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Don't render ChatBot on the active interview page
  if (location.pathname === '/interview/active') {
    return null;
  }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to UI
    const updatedMessages = [
      ...messages,
      { role: 'user', text: userMessage, timestamp: new Date() }
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Map frontend history format to backend { role: 'user' | 'model', text: string } format
      const history = updatedMessages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await axios.post('/api/chat', {
        message: userMessage,
        history
      });

      if (res.data.success) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: res.data.reply, timestamp: new Date() }
        ]);
      } else {
        throw new Error(res.data.message || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I am having trouble connecting to my brain right now. Please verify your connection or try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-brand-purple dark:bg-dark-purple text-white flex items-center justify-center shadow-lg shadow-purple-glow hover:bg-brand-purpleHover dark:hover:bg-dark-purpleHover hover:scale-105 active:scale-95 transition-all duration-300 z-50 relative border border-white/10"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 sm:w-96 h-[480px] rounded-3xl bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border shadow-2xl overflow-hidden flex flex-col animate-slide-up glass-panel">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles size={16} className="text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-sm leading-tight text-white">AI Interview Coach</h3>
                <span className="text-[10px] text-brand-purple-light opacity-90">Ready to assist you</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((m, index) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex gap-2.5 max-w-[85%] ${
                    isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                      isAssistant ? 'bg-brand-purple' : 'bg-brand-blue'
                    }`}
                  >
                    {isAssistant ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isAssistant
                        ? 'bg-brand-surface dark:bg-dark-card text-brand-charcoal dark:text-dark-text border border-brand-border/60 dark:border-dark-border/50'
                        : 'bg-brand-purple text-white'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Loading Indicator */}
            {loading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
                <div className="w-7 h-7 rounded-full bg-brand-purple flex items-center justify-center flex-shrink-0 text-white">
                  <Bot size={14} />
                </div>
                <div className="bg-brand-surface dark:bg-dark-card border border-brand-border/60 dark:border-dark-border/50 rounded-2xl px-4 py-3 flex items-center gap-1">
                  <div className="ai-thinking-dots flex gap-1 items-center">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-brand-border dark:border-dark-border bg-white dark:bg-dark-surface flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for tips, concepts, practice help..."
              className="flex-grow px-4 py-2.5 rounded-xl border border-brand-border dark:border-dark-border text-xs bg-brand-surface dark:bg-dark-card text-brand-charcoal dark:text-dark-text focus:outline-none focus:border-brand-purple dark:focus:border-dark-purple transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-brand-purple hover:bg-brand-purpleHover text-white flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none hover:scale-105 active:scale-95 transition-all flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
