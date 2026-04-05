
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Globe, Sun, Moon, Type, BookOpen, ShoppingBag, TrendingUp, Scan, Plane, User as UserIcon, LogOut, History, Receipt, FileText, Shield } from 'lucide-react';
import { LANGUAGES } from '../constants';
import { ThemeMode, Language } from '../types';
import { useAuth } from '../AuthContext';

interface NavbarProps {
  theme: ThemeMode;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onNavigateToHome: () => void;
  onNavigateToCropGuide: () => void;
  onNavigateToShop: () => void;
  onNavigateToMarket: () => void;
  onNavigateToDiseaseDetect: () => void;
  onNavigateToAgriDrone: () => void;
  onNavigateToHistory: () => void;
  onNavigateToSchemes: () => void;
  onNavigateToExpenses: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToTechStack?: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme, toggleTheme, language, setLanguage,
  onNavigateToHome, onNavigateToCropGuide, onNavigateToShop, onNavigateToMarket,
  onNavigateToDiseaseDetect, onNavigateToAgriDrone, onNavigateToHistory,
  onNavigateToSchemes, onNavigateToExpenses, onNavigateToAdmin, onNavigateToTechStack, onOpenLogin
}) => {
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav aria-label="Main navigation" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b no-print ${
      isScrolled 
        ? 'backdrop-blur-xl bg-ivory/90 border-black/5 dark:bg-obsidian/80 dark:border-white/5 py-3 shadow-lg shadow-black/5' 
        : 'bg-transparent border-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Logo */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 group cursor-pointer" 
          onClick={onNavigateToHome}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:rotate-12 transition-transform">
            <Leaf className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-outfit font-bold text-xl tracking-tight text-gray-900 dark:text-ivory transition-colors">AgriFuture</span>
            <span className="font-jakarta text-[10px] tracking-[0.2em] text-gold-dim dark:text-gold uppercase">India</span>
          </div>
        </motion.div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Navigation Buttons (Desktop) — only shown when logged in */}
          {user && <div className="hidden lg:flex items-center gap-2 mr-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToAgriDrone}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-gold/10 hover:bg-gold/20 transition-all group shadow-sm"
            >
              <Plane className="w-4 h-4 text-gold group-hover:rotate-12 transition-transform" />
              <span className="font-jakarta text-[10px] font-bold text-gray-900 dark:text-white tracking-widest uppercase">DRONE</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToDiseaseDetect}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all group shadow-sm"
            >
              <Scan className="w-4 h-4 text-emerald-500 group-hover:rotate-12 transition-transform" />
              <span className="font-jakarta text-[10px] font-bold text-gray-900 dark:text-white tracking-widest uppercase">SCAN</span>
            </motion.button>

            <motion.button 
              whileHover={{ y: -2 }}
              onClick={onNavigateToMarket}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 hover:bg-gold/10 transition-colors group"
            >
              <TrendingUp className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
              <span className="font-jakarta text-[10px] font-bold text-gray-900 dark:text-white tracking-widest uppercase">MARKET</span>
            </motion.button>

            <motion.button 
              whileHover={{ y: -2 }}
              onClick={onNavigateToCropGuide}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-jakarta text-[10px] font-bold text-gray-900 dark:text-white tracking-widest uppercase">GUIDE</span>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              onClick={onNavigateToShop}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
            >
              <ShoppingBag className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform" />
              <span className="font-jakarta text-[10px] font-bold text-gray-900 dark:text-white tracking-widest uppercase">STORE</span>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              onClick={onNavigateToSchemes}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
            >
              <FileText className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="font-jakarta text-[10px] font-bold text-gray-900 dark:text-white tracking-widest uppercase">SCHEMES</span>
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              onClick={onNavigateToExpenses}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 hover:bg-gold/10 transition-colors group"
            >
              <Receipt className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
              <span className="font-jakarta text-[10px] font-bold text-gray-900 dark:text-white tracking-widest uppercase">EXPENSES</span>
            </motion.button>
          </div>}

          {/* Navigation Buttons (Mobile - Icons Only) — only shown when logged in */}
          {user && <div className="flex lg:hidden items-center gap-2" role="navigation" aria-label="Quick actions">
            <button onClick={onNavigateToAgriDrone} aria-label="Drone analytics" className="p-2 rounded-full bg-gold/10 text-gold">
              <Plane size={18} />
            </button>
            <button onClick={onNavigateToDiseaseDetect} aria-label="Disease scanner" className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
              <Scan size={18} />
            </button>
            <button onClick={onNavigateToMarket} aria-label="Market analysis" className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-gold">
              <TrendingUp size={18} />
            </button>
            <button onClick={onNavigateToCropGuide} aria-label="Crop guide" className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-emerald-600 dark:text-emerald-400">
              <BookOpen size={18} />
            </button>
            <button onClick={onNavigateToShop} aria-label="Agri store" className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-gray-500">
              <ShoppingBag size={18} />
            </button>
            <button onClick={onNavigateToSchemes} aria-label="Government schemes" className="p-2 rounded-full bg-blue-500/10 text-blue-500">
              <FileText size={18} />
            </button>
            <button onClick={onNavigateToExpenses} aria-label="Expense tracker" className="p-2 rounded-full bg-gold/10 text-gold">
              <Receipt size={18} />
            </button>
          </div>}

          {/* Language Selector */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLangOpen(!langOpen)}
              aria-label="Select language"
              aria-expanded={langOpen}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-jakarta text-[10px] text-gray-900 dark:text-gray-300 hidden md:block font-bold uppercase">{language}</span>
            </motion.button>

            <AnimatePresence>
              {langOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 z-[60]"
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors font-inter font-medium ${
                        language === l.code 
                          ? 'text-gold bg-gold/5 font-bold' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gold dark:hover:text-gold hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileTap={{ rotate: 180 }}
            onClick={toggleTheme}
            aria-label={theme === ThemeMode.DARK ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-black/5 dark:border-white/10"
          >
            {theme === ThemeMode.DARK ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>

          {/* User Profile / Login */}
          <div className="relative ml-2">
            {user ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-gold/30 bg-gold/10 hover:bg-gold/20 transition-all"
                >
                  <div className="relative w-6 h-6 rounded-full bg-gold flex items-center justify-center text-[10px] font-bold text-black">
                    {user.name.charAt(0).toUpperCase()}
                    {user.role === 'admin' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-charcoal flex items-center justify-center">
                        <Shield size={6} className="text-white" />
                      </div>
                    )}
                  </div>
                  <span className="font-jakarta text-[10px] text-gray-900 dark:text-gray-300 hidden md:block font-bold uppercase truncate max-w-[80px]">
                    {user.name.split(' ')[0]}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {userOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 z-[60]"
                    >
                      <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</div>
                          {user.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-gold/20 text-[8px] font-bold text-gold uppercase tracking-wider">Admin</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{user.email || user.phone}</div>
                        <div className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wider font-bold flex items-center gap-1">
                          <Shield size={8} /> Role: {user.role || 'user'}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onNavigateToHistory();
                          setUserOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-bold flex items-center gap-2"
                      >
                        <History size={14} /> MY HISTORY
                      </button>
                      <button
                        onClick={() => {
                          onNavigateToExpenses();
                          setUserOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-bold flex items-center gap-2"
                      >
                        <Receipt size={14} /> MY EXPENSES
                      </button>
                      {onNavigateToTechStack && (
                        <button
                          onClick={() => { onNavigateToTechStack(); setUserOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-bold flex items-center gap-2"
                        >
                          <FileText size={14} /> TECH STACK
                        </button>
                      )}
                      {user.role === 'admin' && onNavigateToAdmin && (
                        <button
                          onClick={() => { onNavigateToAdmin(); setUserOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gold hover:bg-gold/5 transition-colors font-bold flex items-center gap-2"
                        >
                          <Shield size={14} /> ADMIN PANEL
                        </button>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setUserOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/5 transition-colors font-bold flex items-center gap-2"
                      >
                        <LogOut size={14} /> LOGOUT
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-charcoal dark:bg-white text-white dark:text-black font-jakarta text-[10px] font-bold tracking-widest uppercase shadow-lg shadow-black/20"
              >
                <UserIcon size={14} /> LOGIN
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
