
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, User, Bot, ChevronDown, Trash2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { streamChatResponse } from '../services/geminiService';
import { ChatMessage, ThemeMode, Language } from '../types';

const MAX_HISTORY = 40;

const FAQ_CHIPS = [
  "How to improve soil Nitrogen?",
  "Best crop for Black Soil?",
  "Current Wheat MSP 2024-25?",
  "Paddy blast disease treatment?",
  "PM-KISAN eligibility & apply",
  "Drip vs flood irrigation pros cons",
  "Organic fertiliser for tomato?",
  "How to read a soil health card?",
];

interface ChatBotProps {
  theme: ThemeMode;
  language: Language;
}

export const ChatBot: React.FC<ChatBotProps> = ({ theme, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('agri_chat_history');
      return saved ? JSON.parse(saved) : [
        { role: 'model', text: 'Namaste! I am your AgriAssistant — powered by Gemini AI. Ask me anything about crops, soil, pests, market prices, or government schemes.' }
      ];
    } catch {
      return [{ role: 'model', text: 'Namaste! I am your AgriAssistant. How can I help you grow better today?' }];
    }
  });
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist to localStorage (capped at MAX_HISTORY)
  useEffect(() => {
    const toSave = messages.slice(-MAX_HISTORY);
    localStorage.setItem('agri_chat_history', JSON.stringify(toSave));
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', text };
    // Keep only last MAX_HISTORY-1 + new user msg
    setMessages(prev => [...prev.slice(-(MAX_HISTORY - 1)), userMsg]);
    setInputValue('');
    setIsStreaming(true);

    try {
      const historyForApi = messages.slice(-MAX_HISTORY);
      const responseStream = await streamChatResponse(historyForApi, text, language);
      let fullText = '';

      // Add empty model message to start filling
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of responseStream) {
        fullText += chunk.text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', text: fullText };
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'model', text: "Sorry, I couldn't reach the AI service right now. Please check your connection and try again." }
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const clearChat = () => {
    const initial: ChatMessage[] = [{ role: 'model', text: 'Chat cleared. How can I help you now?' }];
    setMessages(initial);
    localStorage.removeItem('agri_chat_history');
  };

  // The last message is currently streaming (empty or partial)
  const lastMsgIsStreaming = isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'model';

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-inter no-print">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-emerald-600 shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <MessageSquare className="w-8 h-8 relative z-10" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-obsidian animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className={`w-[90vw] md:w-[420px] h-[650px] max-h-[85vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border animate-in slide-in-from-bottom-10 fade-in duration-500 ${
          theme === ThemeMode.DARK ? 'bg-charcoal/95 border-white/10' : 'bg-white/95 border-black/5'
        }`}>

          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-emerald-900 to-charcoal text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-outfit font-bold text-base leading-tight">AgriAssistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-gold animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
                    {isStreaming ? 'Thinking...' : 'Live AI Expert'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} title="Clear chat" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                <Trash2 size={18} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-gold/20 text-gold' : 'bg-emerald-500/20 text-emerald-500'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[82%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gold text-black rounded-tr-none'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none border border-black/5 dark:border-white/5'
                }`}>
                  {msg.text ? (
                    <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  ) : (
                    // Streaming skeleton (empty model message)
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Show typing dots ONLY before first chunk arrives (isStreaming but no empty model msg yet) */}
            {isStreaming && !lastMsgIsStreaming && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-2xl rounded-tl-none border border-black/5 dark:border-white/5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FAQ Chips — always shown when chat is short */}
          {messages.length < 5 && !isStreaming && (
            <div className="px-5 pb-3 shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Questions</p>
              <div className="flex flex-wrap gap-2">
                {FAQ_CHIPS.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(chip)}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-gold/30 text-gold hover:bg-gold hover:text-black transition-all duration-200"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-5 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about crops, soil, pests..."
                disabled={isStreaming}
                className="flex-1 h-12 px-4 rounded-2xl text-sm bg-white dark:bg-black/40 text-gray-900 dark:text-white outline-none border border-black/5 dark:border-white/5 focus:border-gold/50 transition-colors shadow-inner disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isStreaming}
                className="w-12 h-12 rounded-2xl bg-gold text-black flex items-center justify-center shadow-lg shadow-gold/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
              >
                {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
            <p className="mt-2 text-[10px] text-center text-gray-400 dark:text-gray-500 font-medium uppercase tracking-[0.2em]">
              Powered by Gemini AI • AgriFuture Luxe
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
