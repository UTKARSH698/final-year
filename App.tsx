
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MandiTicker } from './components/MandiTicker';
import { DigitalTwin } from './components/DigitalTwin';
import { WeatherSection } from './components/WeatherSection';
import { PredictionForm } from './components/PredictionForm';
import { ResultsView } from './components/ResultsView';
import { SupportSection } from './components/SupportSection';
import { CropGuide } from './components/CropGuide';
import { ChatBot } from './components/ChatBot';
import { Shop } from './components/Shop';
import { MarketAnalysis } from './components/MarketAnalysis';
import { DiseaseDetector } from './components/DiseaseDetector';
import { AgriDrone } from './components/AgriDrone';
import { History } from './components/History';
import { SchemesFinder } from './components/SchemesFinder';
import { ExpenseTracker } from './components/ExpenseTracker';
import { LoginModal } from './components/LoginModal';
import { useAuth } from './AuthContext';
import { getCropPrediction } from './services/geminiService';
import { ThemeMode, PredictionResult, UserLocation, Language, WeatherData } from './types';

function App() {
  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.DARK);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  // Navigation State
  const [view, setView] = useState<'home' | 'crop-guide' | 'shop' | 'market' | 'disease-detect' | 'agri-drone' | 'history' | 'schemes' | 'expense'>('home');

  // Lifted States
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { user } = useAuth();

  const toggleTheme = () => {
    const newTheme = theme === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
    setTheme(newTheme);
  };

  const handleAnalysis = async (formData: any) => {
    setLoading(true);
    setScanning(true);

    try {
      const result = await getCropPrediction(
        { lat: userLocation?.lat || 0, lng: userLocation?.lng || 0 }, 
        { 
          n: formData.n, 
          p: formData.p, 
          k: formData.k, 
          ph: formData.ph,
          soilType: formData.soilType,
          rainfall: formData.rainfall
        },
        currentWeather || undefined
      );
      setPrediction(result);

      // Save to history if logged in
      console.log("[PREDICTION] User state:", user);
      if (user) {
        try {
          console.log("[PREDICTION] Attempting to save prediction to history...");
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
          if (saveRes.ok) {
            console.log("[PREDICTION] Prediction saved to history successfully");
          } else {
            const errData = await saveRes.json();
            console.error("[PREDICTION] Failed to save prediction:", errData);
          }
        } catch (saveErr) {
          console.error("[PREDICTION] Error saving prediction to history:", saveErr);
        }
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleNavigateHome = () => {
    setView('home');
    setPrediction(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    if (theme === ThemeMode.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={`min-h-screen relative font-inter transition-colors duration-700 ease-in-out ${theme === ThemeMode.DARK ? 'bg-obsidian text-white' : 'bg-ivory text-light-body'}`}>
      <div className="fixed inset-0 pointer-events-none z-[60] bg-noise opacity-[0.03] mix-blend-overlay"></div>

      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        language={language}
        setLanguage={setLanguage}
        onNavigateToHome={handleNavigateHome}
        onNavigateToCropGuide={() => setView('crop-guide')}
        onNavigateToShop={() => setView('shop')}
        onNavigateToMarket={() => setView('market')}
        onNavigateToDiseaseDetect={() => setView('disease-detect')}
        onNavigateToAgriDrone={() => setView('agri-drone')}
        onNavigateToHistory={() => setView('history')}
        onNavigateToSchemes={() => setView('schemes')}
        onNavigateToExpenses={() => setView('expense')}
        onOpenLogin={() => setIsLoginOpen(true)}
      />
      
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      
      <main>
        <AnimatePresence mode="wait">
          {view === 'crop-guide' ? (
            <motion.div
              key="crop-guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <CropGuide onBack={() => setView('home')} />
            </motion.div>
          ) : view === 'shop' ? (
            <motion.div
              key="shop"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5, ease: "circOut" }}
            >
              <Shop theme={theme} onBack={() => setView('home')} />
            </motion.div>
          ) : view === 'market' ? (
            <motion.div
              key="market"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <MarketAnalysis onBack={() => setView('home')} />
            </motion.div>
          ) : view === 'disease-detect' ? (
            <motion.div
              key="disease-detect"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.6 }}
            >
              <DiseaseDetector onBack={() => setView('home')} />
            </motion.div>
          ) : view === 'agri-drone' ? (
            <motion.div
              key="agri-drone"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.7, ease: "anticipate" }}
            >
              <AgriDrone onBack={() => setView('home')} />
            </motion.div>
          ) : view === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              <History onBack={() => setView('home')} />
            </motion.div>
          ) : view === 'schemes' ? (
            <motion.div
              key="schemes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <SchemesFinder onBack={() => setView('home')} />
            </motion.div>
          ) : view === 'expense' ? (
            <motion.div
              key="expense"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5 }}
            >
              <ExpenseTracker onBack={() => setView('home')} />
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
              <MandiTicker userLocation={userLocation} />
              <WeatherSection userLocation={userLocation} onWeatherDataFetch={setCurrentWeather} />
              <DigitalTwin />
              <PredictionForm onAnalyze={handleAnalysis} isLoading={loading} onLocationUpdate={setUserLocation} />
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
      </main>
      <ChatBot theme={theme} language={language} />
    </div>
  );
}

export default App;
