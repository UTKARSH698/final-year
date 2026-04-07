
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Sparkles, Loader2, User, Bot, ChevronDown, Trash2,
  Leaf, Bug, CloudRain, TrendingUp, Building2, Droplets, Mic, MicOff,
  Copy, Check, RotateCcw, Maximize2, Minimize2, Search, Zap, Volume2
} from 'lucide-react';
import Markdown from 'react-markdown';
import { streamChatResponse } from '../services/geminiService';
import { ChatMessage, ThemeMode, Language } from '../types';

const MAX_HISTORY = 40;

const TOPIC_CATEGORIES = [
  { id: 'soil', label: 'Soil & Nutrients', icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'pest', label: 'Pest & Disease', icon: Bug, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  { id: 'weather', label: 'Weather & Water', icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { id: 'market', label: 'Market & Prices', icon: TrendingUp, color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/30' },
  { id: 'scheme', label: 'Govt. Schemes', icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { id: 'irrigation', label: 'Irrigation', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
];

const FAQ_BY_TOPIC: Record<string, string[]> = {
  soil: [
    "How to improve soil Nitrogen?",
    "Best fertilizer for low pH soil?",
    "How to read a soil health card?",
    "Organic alternatives to DAP?",
  ],
  pest: [
    "Paddy blast disease treatment?",
    "Cotton bollworm organic control?",
    "Tomato leaf curl virus remedy?",
    "Neem oil spray preparation guide",
  ],
  weather: [
    "Monsoon forecast 2026 India",
    "Protect crops from frost damage?",
    "Heat stress management for wheat",
    "Best sowing time after rainfall?",
  ],
  market: [
    "Current Wheat MSP 2026-27?",
    "Best time to sell cotton?",
    "eNAM registration process",
    "Soybean price forecast this month",
  ],
  scheme: [
    "PM-KISAN eligibility & apply",
    "PMFBY crop insurance details",
    "Kisan Credit Card interest rate?",
    "State subsidies for drip irrigation",
  ],
  irrigation: [
    "Drip vs flood irrigation pros cons",
    "Sprinkler system cost per acre?",
    "How to calculate crop water need?",
    "Micro-irrigation subsidy in MP",
  ],
};

const ALL_FAQS = [
  "How to improve soil Nitrogen?",
  "Best crop for Black Soil?",
  "Current Wheat MSP 2026-27?",
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('agri_chat_history');
      return saved ? JSON.parse(saved) : [
        { role: 'model', text: 'Namaste! I am your **AgriAssistant** — powered by Gemini AI. Ask me anything about crops, soil, pests, market prices, or government schemes. 🌾' }
      ];
    } catch {
      return [{ role: 'model', text: 'Namaste! I am your AgriAssistant. How can I help you grow better today?' }];
    }
  });
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Persist to localStorage
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

  // Auto-focus
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 100);
  }, [showSearch]);

  // Message stats
  const stats = useMemo(() => {
    const userMsgs = messages.filter(m => m.role === 'user').length;
    const botMsgs = messages.filter(m => m.role === 'model').length;
    return { user: userMsgs, bot: botMsgs, total: messages.length };
  }, [messages]);

  // Filtered messages for search
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return messages.map((m, i) => ({ ...m, _idx: i })).filter(m =>
      m.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev.slice(-(MAX_HISTORY - 1)), userMsg]);
    setInputValue('');
    setActiveTopic(null);
    setIsStreaming(true);

    try {
      const historyForApi = messages.slice(-MAX_HISTORY);
      const responseStream = await streamChatResponse(historyForApi, text, language);
      let fullText = '';

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
    const initial: ChatMessage[] = [{ role: 'model', text: 'Chat cleared. How can I help you now? 🌱' }];
    setMessages(initial);
    setActiveTopic(null);
    localStorage.removeItem('agri_chat_history');
  };

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const regenerateLastResponse = async () => {
    if (isStreaming || messages.length < 2) return;
    // Find last user message
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') { lastUserIdx = i; break; }
    }
    if (lastUserIdx === -1) return;
    const lastUserText = messages[lastUserIdx].text;
    // Remove the last bot response
    setMessages(prev => prev.slice(0, lastUserIdx + 1));
    // Re-send
    setIsStreaming(true);
    try {
      const historyForApi = messages.slice(0, lastUserIdx);
      const responseStream = await streamChatResponse(historyForApi, lastUserText, language);
      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      for await (const chunk of responseStream) {
        fullText += chunk.text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', text: fullText };
          return updated;
        });
      }
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't regenerate. Please try again." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const lastMsgIsStreaming = isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'model';

  const currentFaqs = activeTopic ? FAQ_BY_TOPIC[activeTopic] : ALL_FAQS;

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-inter no-print">
      {/* ── Toggle Button ──────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-emerald-600 shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <MessageSquare className="w-8 h-8 relative z-10" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-obsidian animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ──────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`flex flex-col overflow-hidden shadow-2xl border rounded-[2.5rem] ${
              isExpanded
                ? 'w-[95vw] md:w-[700px] h-[90vh]'
                : 'w-[90vw] md:w-[420px] h-[650px] max-h-[85vh]'
            } ${
              theme === ThemeMode.DARK ? 'bg-charcoal/95 border-white/10' : 'bg-white/95 border-black/5'
            }`}
          >

            {/* ── Header ─────────────────────────────────── */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-900 to-charcoal text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-base leading-tight">AgriAssistant</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-gold animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                    <span className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase">
                      {isStreaming ? 'Thinking...' : `Online • ${stats.total} messages`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  title="Search messages"
                >
                  <Search size={16} />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white hidden md:flex"
                  title={isExpanded ? 'Minimize' : 'Expand'}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button onClick={clearChat} title="Clear chat" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                  <Trash2 size={16} />
                </button>
                <button onClick={() => { setIsOpen(false); setIsExpanded(false); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── Search Bar ─────────────────────────────── */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pt-3 pb-2 border-b border-black/5 dark:border-white/5 overflow-hidden"
                >
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search in conversation..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full h-9 pl-9 pr-4 rounded-xl text-xs bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white border border-black/5 dark:border-white/10 outline-none focus:ring-1 focus:ring-gold/30"
                    />
                    {searchQuery && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400">
                        {filteredMessages?.length || 0} found
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Search Results ──────────────────────────── */}
            {filteredMessages && filteredMessages.length > 0 && showSearch && searchQuery && (
              <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 max-h-32 overflow-y-auto">
                {filteredMessages.slice(0, 5).map(m => (
                  <div
                    key={m._idx}
                    className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-2 transition-colors"
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                      // Scroll to message
                      const el = scrollRef.current?.children[m._idx];
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    {m.role === 'user' ? <User size={10} className="text-gold shrink-0" /> : <Bot size={10} className="text-emerald-500 shrink-0" />}
                    <span className="text-[10px] text-gray-600 dark:text-gray-300 truncate">{m.text.slice(0, 80)}...</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Messages ───────────────────────────────── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 group ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                    msg.role === 'user' ? 'bg-gold/20 text-gold' : 'bg-emerald-500/20 text-emerald-500'
                  }`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className="flex flex-col max-w-[82%]">
                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gold text-black rounded-tr-none'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none border border-black/5 dark:border-white/5'
                    }`}>
                      {msg.text ? (
                        <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      ) : (
                        <div className="flex gap-1 items-center h-5">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )}
                    </div>
                    {/* Message Actions */}
                    {msg.text && msg.role === 'model' && !isStreaming && (
                      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyMessage(msg.text, i)}
                          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                          title="Copy"
                        >
                          {copiedIdx === i ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                        {i === messages.length - 1 && (
                          <button
                            onClick={regenerateLastResponse}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            title="Regenerate"
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isStreaming && !lastMsgIsStreaming && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                  <div className="bg-gray-100 dark:bg-white/5 p-3.5 rounded-2xl rounded-tl-none border border-black/5 dark:border-white/5">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Topic Categories ────────────────────────── */}
            {messages.length < 6 && !isStreaming && (
              <div className="px-4 pb-2 shrink-0">
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {TOPIC_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTopic(activeTopic === cat.id ? null : cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold tracking-wider uppercase whitespace-nowrap transition-all border ${
                        activeTopic === cat.id
                          ? `${cat.bg} ${cat.color} ${cat.border} shadow-sm`
                          : 'border-transparent bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <cat.icon size={10} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── FAQ Chips ──────────────────────────────── */}
            {messages.length < 6 && !isStreaming && (
              <div className="px-4 pb-3 shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {currentFaqs.map((chip, i) => (
                    <button
                      key={chip}
                      onClick={() => handleSend(chip)}
                      className="px-2.5 py-1.5 rounded-full text-[9px] font-bold tracking-wider border border-gold/30 text-gold hover:bg-gold hover:text-black transition-all duration-200"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Suggested Follow-ups ───────────────────── */}
            {messages.length >= 6 && messages.length < 20 && !isStreaming && messages[messages.length - 1]?.role === 'model' && (
              <div className="px-4 pb-2 shrink-0">
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {['Tell me more', 'What about organic alternatives?', 'Cost estimate?'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="px-3 py-1.5 rounded-full text-[9px] font-bold tracking-wider whitespace-nowrap bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gold/10 hover:text-gold border border-black/5 dark:border-white/5 transition-all"
                    >
                      <Zap size={8} className="inline mr-1" />{s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Input ──────────────────────────────────── */}
            <div className="p-4 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about crops, soil, pests..."
                  disabled={isStreaming}
                  className="flex-1 h-11 px-4 rounded-2xl text-sm bg-white dark:bg-black/40 text-gray-900 dark:text-white outline-none border border-black/5 dark:border-white/5 focus:border-gold/50 transition-colors shadow-inner disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isStreaming}
                  className="w-11 h-11 rounded-2xl bg-gold text-black flex items-center justify-center shadow-lg shadow-gold/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
                >
                  {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
              <p className="mt-1.5 text-[9px] text-center text-gray-400 dark:text-gray-500 font-medium uppercase tracking-[0.2em]">
                Gemini AI • AgriFuture India
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
