
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, FileText, Receipt, TrendingUp, Shield, Code2, Activity } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MandiTicker } from './components/MandiTicker';
import { WeatherSection } from './components/WeatherSection';
import { PredictionForm } from './components/PredictionForm';
import { SupportSection } from './components/SupportSection';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { ScrollToTop } from './components/ScrollToTop';
import { CommandPalette } from './components/CommandPalette';
import NetworkStatus from './components/NetworkStatus';
import InstallPrompt from './components/InstallPrompt';

// Lazy-loaded: only downloaded when the user navigates to that view
const DigitalTwin     = lazy(() => import('./components/DigitalTwin').then(m => ({ default: m.DigitalTwin })));
const ResultsView     = lazy(() => import('./components/ResultsView').then(m => ({ default: m.ResultsView })));
const CropGuide       = lazy(() => import('./components/CropGuide').then(m => ({ default: m.CropGuide })));
const ChatBot         = lazy(() => import('./components/ChatBot').then(m => ({ default: m.ChatBot })));
const Shop            = lazy(() => import('./components/Shop').then(m => ({ default: m.Shop })));
const MarketAnalysis  = lazy(() => import('./components/MarketAnalysis').then(m => ({ default: m.MarketAnalysis })));
const DiseaseDetector = lazy(() => import('./components/DiseaseDetector').then(m => ({ default: m.DiseaseDetector })));
const AgriDrone       = lazy(() => import('./components/AgriDrone').then(m => ({ default: m.AgriDrone })));
const History         = lazy(() => import('./components/History').then(m => ({ default: m.History })));
const SchemesFinder   = lazy(() => import('./components/SchemesFinder').then(m => ({ default: m.SchemesFinder })));
const ExpenseTracker  = lazy(() => import('./components/ExpenseTracker').then(m => ({ default: m.ExpenseTracker })));
const AdminDashboard  = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AboutTechStack  = lazy(() => import('./components/AboutTechStack').then(m => ({ default: m.AboutTechStack })));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
        <Leaf className="w-8 h-8 text-emerald-500 animate-pulse" />
      </div>
      <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/20 animate-ping" />
    </div>
    <div className="space-y-3 w-64">
      <div className="h-3 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
        <div className="h-full w-2/3 bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent animate-[marquee_1.5s_linear_infinite]" />
      </div>
      <div className="h-3 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent animate-[marquee_1.5s_linear_infinite_0.3s]" />
      </div>
    </div>
  </div>
);
import { useAuth } from './AuthContext';
import { getCropPrediction } from './services/geminiService';
import { getCropRecommendation } from './services/predictionApi';
import { ThemeMode, PredictionResult, UserLocation, Language, WeatherData } from './types';

type ViewName = 'home' | 'crop-guide' | 'shop' | 'market' | 'disease-detect' | 'agri-drone' | 'history' | 'schemes' | 'expense' | 'admin' | 'tech-stack';

function App() {
  // Theme — persist in localStorage
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('agrifuture_theme');
      return saved === ThemeMode.LIGHT ? ThemeMode.LIGHT : ThemeMode.DARK;
    } catch { return ThemeMode.DARK; }
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Navigation State
  const [view, setView] = useState<ViewName>('home');
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  // Lifted States
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user } = useAuth();

  const toggleTheme = () => {
    const newTheme = theme === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
    setTheme(newTheme);
    try { localStorage.setItem('agrifuture_theme', newTheme); } catch {}
  };

  // Dynamic page title
  const VIEW_TITLES: Record<ViewName, string> = {
    'home': 'AgriFuture India — AI Crop Intelligence',
    'crop-guide': 'Crop Guide — AgriFuture India',
    'shop': 'Agri Store — AgriFuture India',
    'market': 'Market Forecasting — AgriFuture India',
    'disease-detect': 'Disease Scanner — AgriFuture India',
    'agri-drone': 'Drone Analytics — AgriFuture India',
    'history': 'Report History — AgriFuture India',
    'schemes': 'Government Schemes — AgriFuture India',
    'expense': 'Expense Tracker — AgriFuture India',
    'admin': 'Admin Panel — AgriFuture India',
    'tech-stack': 'Tech Stack — AgriFuture India',
  };

  useEffect(() => {
    document.title = VIEW_TITLES[view] || 'AgriFuture India — AI Crop Intelligence';
  }, [view]);

  // Protected views require login
  const PROTECTED_VIEWS: ViewName[] = ['crop-guide', 'shop', 'market', 'disease-detect', 'agri-drone', 'history', 'schemes', 'expense', 'admin'];

  // Navigate with scroll-to-top + auth guard
  const navigateTo = useCallback((v: string) => {
    if (v === 'home') {
      setView('home');
      setPrediction(null);
    } else if (PROTECTED_VIEWS.includes(v as ViewName) && !user) {
      setIsLoginOpen(true);
      return;
    } else {
      setView(v as ViewName);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user]);

  // Ctrl+K to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAnalysis = async (formData: any) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    setLoading(true);
    setScanning(true);

    try {
      // Try custom ML model first, fall back to Gemini if unavailable
      let result: PredictionResult;
      try {
        const mlResult = await getCropRecommendation({
          N: formData.n,
          P: formData.p,
          K: formData.k,
          temperature: currentWeather?.temp || 25,
          humidity: currentWeather?.humidity || 70,
          ph: formData.ph,
          rainfall: formData.rainfall,
        });
        result = {
        cropName: mlResult.predicted_crop.charAt(0).toUpperCase() + mlResult.predicted_crop.slice(1),
        cropHindi: mlResult.predicted_crop,
        confidence: Math.round(mlResult.confidence * 100),
        yieldEstimate: "Varies by region",
        marketPriceEstimate: "Check local mandi rates",
        duration: "90–180 days",
        agronomistNote: `ML model recommends ${mlResult.predicted_crop} with ${(mlResult.confidence * 100).toFixed(1)}% confidence based on your soil and climate data.`,
        imageUrl: "",
        reasons: [
          { feature: "Soil Nutrients", impact: "positive", description: `N:${formData.n}, P:${formData.p}, K:${formData.k} — suitable for this crop` },
          { feature: "Soil pH", impact: "positive", description: `pH ${formData.ph} — within optimal range` },
          { feature: "Rainfall", impact: "positive", description: `${formData.rainfall}mm annual estimate` },
        ],
        alternatives: mlResult.top_3.slice(1).map(t => ({
          cropName: t.crop.charAt(0).toUpperCase() + t.crop.slice(1),
          cropHindi: t.crop,
          confidence: Math.round(t.confidence * 100),
        })),
        profitability: {
          expectedYieldPerAcre: "Contact local KVK",
          costOfCultivation: "Varies by region",
          marketValue: "Check mandi rates",
          netProfit: "Depends on market",
          riskLevel: mlResult.confidence > 0.8 ? "Low" : mlResult.confidence > 0.5 ? "Moderate" : "High",
          riskColor: mlResult.confidence > 0.8 ? "green" : mlResult.confidence > 0.5 ? "yellow" : "red",
        },
        diseaseRisk: { level: "Moderate", type: "General", symptoms: "Monitor regularly", treatment: "Consult agronomist", prevention: "Crop rotation recommended" },
        fertilizerNeeds: {
          chemical: [],
          organic: [],
          summary: `Maintain N:${formData.n}, P:${formData.p}, K:${formData.k} levels for optimal yield.`,
          savingWithOrganic: "Consult local agronomist",
        },
        };
      } catch {
        // ML service unavailable — fall back to Gemini
        console.warn("[PREDICTION] ML service unavailable, falling back to Gemini");
        result = await getCropPrediction(
          { lat: userLocation?.lat || 0, lng: userLocation?.lng || 0 },
          { n: formData.n, p: formData.p, k: formData.k, ph: formData.ph, soilType: formData.soilType, rainfall: formData.rainfall },
          currentWeather || undefined
        );
      }
      setPrediction(result);

      // Save to history if logged in
      if (user) {
        try {
          const saveRes = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              type: 'Crop Prediction',
              title: `Analysis for ${formData.city || 'Current Location'}`,
              summary: `Recommended Crop: ${result.cropName}. Confidence: ${result.confidence}%`,
              data: result
            })
          });
          if (!saveRes.ok) {
            const errData = await saveRes.json();
            console.error("[PREDICTION] Failed to save:", errData);
          }
        } catch (saveErr) {
          console.error("[PREDICTION] Save error:", saveErr);
        }
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleNavigateHome = () => navigateTo('home');

  React.useEffect(() => {
    if (theme === ThemeMode.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ErrorBoundary>
    <ToastProvider>
    <div className={`min-h-screen relative font-inter transition-colors duration-700 ease-in-out ${theme === ThemeMode.DARK ? 'bg-obsidian text-white' : 'bg-ivory text-light-body'}`}>
      <div className="fixed inset-0 pointer-events-none z-[60] bg-noise opacity-[0.03] mix-blend-overlay"></div>

      <NetworkStatus />

      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        language={language}
        setLanguage={setLanguage}
        onNavigateToHome={handleNavigateHome}
        onNavigateToCropGuide={() => navigateTo('crop-guide')}
        onNavigateToShop={() => navigateTo('shop')}
        onNavigateToMarket={() => navigateTo('market')}
        onNavigateToDiseaseDetect={() => navigateTo('disease-detect')}
        onNavigateToAgriDrone={() => navigateTo('agri-drone')}
        onNavigateToHistory={() => navigateTo('history')}
        onNavigateToSchemes={() => navigateTo('schemes')}
        onNavigateToExpenses={() => navigateTo('expense')}
        onNavigateToAdmin={() => navigateTo('admin')}
        onNavigateToTechStack={() => navigateTo('tech-stack')}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <CommandPalette isOpen={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} onNavigate={navigateTo} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      
      <main id="main-content">
        <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          {view === 'crop-guide' ? (
            <motion.div
              key="crop-guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <CropGuide onBack={handleNavigateHome} />
            </motion.div>
          ) : view === 'shop' ? (
            <motion.div
              key="shop"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5, ease: "circOut" }}
            >
              <Shop theme={theme} onBack={handleNavigateHome} />
            </motion.div>
          ) : view === 'market' ? (
            <motion.div
              key="market"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <MarketAnalysis onBack={handleNavigateHome} />
            </motion.div>
          ) : view === 'disease-detect' ? (
            <motion.div
              key="disease-detect"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.6 }}
            >
              <DiseaseDetector onBack={handleNavigateHome} />
            </motion.div>
          ) : view === 'agri-drone' ? (
            <motion.div
              key="agri-drone"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.7, ease: "anticipate" }}
            >
              <AgriDrone onBack={handleNavigateHome} />
            </motion.div>
          ) : view === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              <History onBack={handleNavigateHome} />
            </motion.div>
          ) : view === 'schemes' ? (
            <motion.div
              key="schemes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <SchemesFinder onBack={handleNavigateHome} />
            </motion.div>
          ) : view === 'expense' ? (
            <motion.div
              key="expense"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5 }}
            >
              <ExpenseTracker onBack={handleNavigateHome} />
            </motion.div>
          ) : view === 'admin' ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <AdminDashboard onBack={handleNavigateHome} />
            </motion.div>
          ) : view === 'tech-stack' ? (
            <motion.div
              key="tech-stack"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <AboutTechStack onBack={handleNavigateHome} />
            </motion.div>
          ) : !prediction && !scanning ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Hero language={language} />
              {!user && (
                <section className="max-w-4xl mx-auto px-6 py-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold/10 via-emerald-500/5 to-transparent border border-gold/20 p-10 text-center"
                  >
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-gold/10 rounded-full blur-3xl" />
                    <h2 className="text-3xl font-outfit font-bold text-gray-900 dark:text-white mb-3">Login to Unlock All Features</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-6">
                      Access AI crop predictions, disease detection, market forecasting, drone analytics, government schemes, expense tracking, and more.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsLoginOpen(true)}
                      className="px-10 py-4 bg-gold text-black font-bold font-jakarta tracking-wider rounded-xl shadow-xl shadow-gold/20 hover:shadow-gold/40 transition-all"
                    >
                      LOGIN / REGISTER
                    </motion.button>
                    <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                      {['Crop AI', 'Disease Scan', 'Market Forecast', 'Drone Analytics', 'Gov Schemes', 'Expense Tracker'].map(f => (
                        <span key={f} className="px-3 py-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10">{f}</span>
                      ))}
                    </div>
                  </motion.div>
                </section>
              )}
              {user && (
                <section className="max-w-5xl mx-auto px-6 py-10">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white mb-1">Welcome back, {user.name}!</h2>
                    <p className="text-sm text-gray-500 mb-6">Quick access to your farm tools {user.role === 'admin' && <span className="text-gold font-bold">• Admin</span>}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Reports', icon: FileText, view: 'history', color: 'from-blue-500/10 to-blue-600/5', iconColor: 'text-blue-500' },
                        { label: 'Expenses', icon: Receipt, view: 'expense', color: 'from-orange-500/10 to-orange-600/5', iconColor: 'text-orange-500' },
                        { label: 'Market', icon: TrendingUp, view: 'market', color: 'from-emerald-500/10 to-emerald-600/5', iconColor: 'text-emerald-500' },
                        { label: 'Tech Stack', icon: Code2, view: 'tech-stack', color: 'from-cyan-500/10 to-cyan-600/5', iconColor: 'text-cyan-500' },
                      ].map(item => (
                        <motion.button
                          key={item.label}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigateTo(item.view)}
                          className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${item.color} border border-black/5 dark:border-white/10 text-left hover:shadow-lg transition-all`}
                        >
                          <item.icon size={20} className={item.iconColor} />
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</span>
                        </motion.button>
                      ))}
                    </div>
                    {user.role === 'admin' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigateTo('admin')}
                        className="mt-3 w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 hover:shadow-lg transition-all"
                      >
                        <Shield size={18} className="text-gold" />
                        <span className="text-sm font-bold text-gold tracking-wider">ADMIN DASHBOARD</span>
                      </motion.button>
                    )}
                  </motion.div>
                </section>
              )}
              <MandiTicker userLocation={userLocation} />
              <WeatherSection userLocation={userLocation} onWeatherDataFetch={setCurrentWeather} />
              {user && (
                <>
                  <DigitalTwin />
                  <PredictionForm onAnalyze={handleAnalysis} isLoading={loading} onLocationUpdate={setUserLocation} />
                </>
              )}
              <SupportSection />
            </motion.div>
          ) : scanning ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-40 flex flex-col items-center justify-center ${theme === ThemeMode.DARK ? 'bg-obsidian' : 'bg-ivory'}`}
            >
               <div className="relative w-64 h-64">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-emerald-500 rounded-full"
                  ></motion.div>
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border-r-2 border-gold rounded-full"
                  ></motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-emerald-700 dark:text-emerald-400 font-jakarta text-xs tracking-[0.3em] animate-pulse font-bold">MODELLING</span>
                  </div>
               </div>
               <p className="mt-8 text-espresso dark:text-gold-light font-outfit text-lg tracking-wide">Analysing Weather & Disease risks...</p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6, type: "spring", damping: 20 }}
              className="pt-20"
            >
               <ResultsView result={prediction!} onReset={() => setPrediction(null)} onOpenLogin={() => setIsLoginOpen(true)} />
            </motion.div>
          )}
        </AnimatePresence>
        </Suspense>
      </main>
      <Footer />
      <ScrollToTop />
      <InstallPrompt />
      {user && (
        <Suspense fallback={null}>
          <ChatBot theme={theme} language={language} />
        </Suspense>
      )}
    </div>
    </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
