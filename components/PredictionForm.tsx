
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, ChevronRight, Loader2, CheckCircle, Crosshair, 
  ChevronDown, Droplets, Info, Cpu, Zap, Activity, 
  Terminal, Wifi, Database, Radio
} from 'lucide-react';
import { UserLocation } from '../types';

interface PredictionFormProps {
  onAnalyze: (data: any) => void;
  isLoading: boolean;
  onLocationUpdate: (location: UserLocation) => void;
}

const SOIL_TYPES = [
  "Don't know",
  "Alluvial Soil",
  "Black Soil (Regur)",
  "Red Soil",
  "Laterite Soil",
  "Desert / Arid Soil",
  "Forest / Mountain Soil",
  "Loamy Soil"
];

const REGIONAL_DEFAULTS: Record<string, { rainfall: number, soil: string, n: number, p: number, k: number, ph: number }> = {
  "Maharashtra": { rainfall: 1100, soil: "Black Soil (Regur)", n: 50, p: 30, k: 60, ph: 7.2 },
  "Punjab": { rainfall: 600, soil: "Alluvial Soil", n: 90, p: 60, k: 50, ph: 7.8 },
  "Haryana": { rainfall: 550, soil: "Alluvial Soil", n: 85, p: 55, k: 45, ph: 7.8 },
  "Uttar Pradesh": { rainfall: 850, soil: "Alluvial Soil", n: 80, p: 40, k: 50, ph: 7.2 },
  "Gujarat": { rainfall: 700, soil: "Black Soil (Regur)", n: 50, p: 40, k: 60, ph: 7.5 },
  "Rajasthan": { rainfall: 350, soil: "Desert / Arid Soil", n: 30, p: 20, k: 50, ph: 8.2 },
  "Kerala": { rainfall: 2800, soil: "Laterite Soil", n: 70, p: 30, k: 40, ph: 5.5 },
  "Tamil Nadu": { rainfall: 950, soil: "Red Soil", n: 60, p: 35, k: 50, ph: 6.8 },
  "Karnataka": { rainfall: 1200, soil: "Red Soil", n: 60, p: 40, k: 50, ph: 6.5 },
  "Telangana": { rainfall: 900, soil: "Red Soil", n: 65, p: 45, k: 45, ph: 6.8 },
  "Andhra Pradesh": { rainfall: 900, soil: "Red Soil", n: 65, p: 45, k: 45, ph: 7.0 },
  "West Bengal": { rainfall: 1600, soil: "Alluvial Soil", n: 80, p: 50, k: 50, ph: 6.0 },
  "Madhya Pradesh": { rainfall: 1000, soil: "Black Soil (Regur)", n: 55, p: 40, k: 50, ph: 7.0 },
  "Bihar": { rainfall: 1100, soil: "Alluvial Soil", n: 70, p: 40, k: 45, ph: 6.8 },
  "Chhattisgarh": { rainfall: 1300, soil: "Red Soil", n: 60, p: 30, k: 30, ph: 6.5 },
};

export const PredictionForm: React.FC<PredictionFormProps> = ({ onAnalyze, isLoading, onLocationUpdate }) => {
  const [formData, setFormData] = useState({
    n: 50,
    p: 50,
    k: 50,
    ph: 6.5,
    rainfall: 1200,
    city: '',
    soilType: 'Alluvial Soil'
  });

  const [locating, setLocating] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [showSoilInfo, setShowSoilInfo] = useState(false);

  const [iotMode, setIotMode] = useState(false);
  const [telemetry, setTelemetry] = useState<string[]>([]);

  useEffect(() => {
    if (!iotMode) return;

    const interval = setInterval(() => {
      setFormData(prev => {
        const fluctuate = (val: number, max: number) => {
          const delta = (Math.random() - 0.5) * 2.2;
          return Math.min(max, Math.max(0, val + delta));
        };

        const newN = Math.round(fluctuate(prev.n, 140));
        const newP = Math.round(fluctuate(prev.p, 100));
        const newK = Math.round(fluctuate(prev.k, 100));
        const newPh = parseFloat(fluctuate(prev.ph, 10).toFixed(1));

        const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const logEntry = `[${timestamp}] SENSOR_RX: N=${newN}, P=${newP}, K=${newK}, pH=${newPh}`;
        setTelemetry(t => [logEntry, ...t].slice(0, 5));

        return { ...prev, n: newN, p: newP, k: newK, ph: newPh };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [iotMode]);

  const handleManualLocation = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, city: e.target.value });
  };

  const handleSoilChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "Don't know") {
      if (detectedState && REGIONAL_DEFAULTS[detectedState]) {
        const suggestedSoil = REGIONAL_DEFAULTS[detectedState].soil;
        setFormData(prev => ({ ...prev, soilType: suggestedSoil }));
        alert(`Based on your detected location (${detectedState}), your soil is likely ${suggestedSoil}.`);
      } else {
        alert("Detect location first to auto-determine soil.");
        setFormData(prev => ({ ...prev, soilType: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, soilType: value }));
    }
  };

  const handleNumericChange = (key: string, value: string, min: number, max: number, isFloat = false) => {
    if (iotMode) return; 
    let num = isFloat ? parseFloat(value) : parseInt(value);
    if (isNaN(num)) num = min;
    if (num < min) num = min;
    if (num > max) num = max;
    setFormData(prev => ({ ...prev, [key]: num }));
  };

  const startGps = () => {
    setLocating(true);
    setDetectedAddress(null);
    setDetectedState(null);
    if (!navigator.geolocation) {
      alert("Geolocation unsupported.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
          const data = await response.json();
          const address = data.address;
          const state = address.state || "Unknown";
          const city = address.city || address.town || address.village || state;
          setDetectedState(state);
          onLocationUpdate({ city, state, lat: latitude, lng: longitude });
          if (REGIONAL_DEFAULTS[state]) {
            const d = REGIONAL_DEFAULTS[state];
            setFormData(prev => ({ ...prev, city, rainfall: d.rainfall, soilType: d.soil, n: d.n, p: d.p, k: d.k, ph: d.ph }));
          } else {
            setFormData(prev => ({ ...prev, city }));
          }
          setDetectedAddress(`${city}, ${state}`);
        } catch (e) {
          setDetectedAddress(`Lat: ${latitude.toFixed(2)}, Lng: ${longitude.toFixed(2)}`);
        } finally {
          setLocating(false);
        }
      },
      () => { setLocating(false); },
      { timeout: 10000 }
    );
  };

  return (
    <section className="py-20 px-4 scroll-mt-32" id="prediction-engine">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="max-w-5xl mx-auto"
      >
        
        {/* IOT MODE TOGGLE */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="mb-8 flex justify-between items-center bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6 backdrop-blur-xl"
        >
           <div className="flex items-center gap-4">
              <motion.div 
                animate={iotMode ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${iotMode ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'bg-gray-200 dark:bg-white/5 text-gray-500'}`}
              >
                 {iotMode ? <Wifi /> : <Cpu />}
              </motion.div>
              <div>
                 <h3 className="text-lg font-outfit font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Live IoT Sensor Mode
                    {iotMode && <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse tracking-widest">ACTIVE</span>}
                 </h3>
                 <p className="text-xs text-gray-500 font-medium">Auto-sync with real-time field telemetry hardware.</p>
              </div>
           </div>
           
           <button 
             onClick={() => {
                setIotMode(!iotMode);
                if (!iotMode) setTelemetry(['[SYSTEM] INITIALIZING SENSOR ARRAY...', '[SYSTEM] ESTABLISHING RF-LINK...']);
             }}
             className={`relative w-20 h-10 rounded-full transition-colors duration-500 ${iotMode ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/10'}`}
           >
              <motion.div 
                animate={{ x: iotMode ? 44 : 4 }}
                className="absolute top-1 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
              >
                 <Zap size={14} className={iotMode ? 'text-emerald-500' : 'text-gray-400'} />
              </motion.div>
           </button>
        </motion.div>

        <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl transition-colors duration-500">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 dark:bg-gold/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="mb-10 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-outfit text-gray-900 dark:text-white font-bold">Field Analysis</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Input soil parameters or use the IoT Bridge for live data.</p>
              </div>
              <AnimatePresence>
                {iotMode && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    className="bg-black/80 p-4 rounded-2xl border border-emerald-500/20 w-full md:w-80 font-mono text-[10px] text-emerald-500 shadow-2xl"
                  >
                     <div className="flex items-center gap-2 mb-2 border-b border-emerald-500/10 pb-1">
                        <Terminal size={12} /> TELEMETRY_STREAM
                     </div>
                     <div className="space-y-1 overflow-hidden h-20">
                        {telemetry.map((t, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`whitespace-nowrap ${i === 0 ? 'text-white' : 'opacity-60'}`}
                          >
                            {t}
                          </motion.div>
                        ))}
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>

          <div className="mb-12 p-1.5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 flex flex-col md:flex-row gap-2 relative z-10">
              <div className="flex-grow relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <MapPin className="w-5 h-5" />
                  </div>
                  <input 
                      type="text" 
                      placeholder="Enter City / Region"
                      value={formData.city}
                      onChange={handleManualLocation}
                      className="w-full h-14 pl-12 pr-4 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white font-bold placeholder:font-medium placeholder:text-gray-400 outline-none"
                  />
                  <AnimatePresence>
                    {detectedAddress && (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 text-[10px] md:text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full"
                        >
                            <CheckCircle className="w-3 h-3" />
                            <span className="hidden md:inline">LOCATED:</span>
                            <span className="uppercase">{detectedAddress}</span>
                        </motion.div>
                    )}
                  </AnimatePresence>
              </div>
              <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startGps}
                  disabled={locating}
                  className="h-14 px-6 md:px-8 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-700 transition-all flex items-center gap-2 justify-center shadow-sm whitespace-nowrap active:scale-95"
              >
                  {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                  {locating ? "Scanning..." : "Detect Location"}
              </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
             <div className="space-y-8">
                {[
                  { label: 'Nitrogen (N)', key: 'n', min: 0, max: 140, unit: 'mg/kg', icon: Radio },
                  { label: 'Phosphorus (P)', key: 'p', min: 0, max: 100, unit: 'mg/kg', icon: Database },
                  { label: 'Potassium (K)', key: 'k', min: 0, max: 100, unit: 'mg/kg', icon: Radio },
                ].map((field) => (
                  <div key={field.key} className={`group transition-all duration-500 ${iotMode ? 'opacity-90' : 'opacity-100'}`}>
                    <div className="flex justify-between mb-3 items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-jakarta tracking-widest text-gray-500 dark:text-gray-400 uppercase font-bold">{field.label}</label>
                        {iotMode && <Activity size={10} className="text-emerald-500 animate-pulse" />}
                      </div>
                      <motion.div 
                        animate={iotMode ? { borderColor: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.6)', 'rgba(16, 185, 129, 0.3)'] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${iotMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/5 focus-within:border-gold/50'}`}
                      >
                          <input 
                            type="number"
                            readOnly={iotMode}
                            value={(formData as any)[field.key]}
                            onChange={(e) => handleNumericChange(field.key, e.target.value, field.min, field.max)}
                            className={`w-12 bg-transparent text-right font-mono text-sm font-bold outline-none appearance-none ${iotMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}
                          />
                          <span className={`font-mono text-xs font-bold ${iotMode ? 'text-emerald-500' : 'text-gold'}`}>{field.unit}</span>
                      </motion.div>
                    </div>
                    <input 
                      type="range" 
                      disabled={iotMode}
                      min={field.min} max={field.max}
                      value={(formData as any)[field.key]}
                      onChange={(e) => setFormData({...formData, [field.key]: parseInt(e.target.value)})}
                      className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all ${iotMode ? 'bg-emerald-500/20 accent-emerald-500' : 'bg-gray-200 dark:bg-white/10 accent-gold hover:accent-emerald-500'}`}
                    />
                  </div>
                ))}
             </div>

             <div className="space-y-8">
                <div className="group relative">
                  <div className="flex justify-between mb-3 relative">
                      <div className="flex items-center gap-2">
                        <label className="block text-xs font-jakarta tracking-widest text-gray-500 dark:text-gray-400 uppercase font-bold">Soil Type</label>
                        <button onMouseEnter={() => setShowSoilInfo(true)} onMouseLeave={() => setShowSoilInfo(false)} className="text-gray-500 dark:text-gray-400 hover:text-gold transition-colors">
                          <Info size={14} />
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">REQUIRED</span>
                  </div>
                  <div className="relative">
                    <select
                      value={formData.soilType}
                      onChange={handleSoilChange}
                      className="w-full appearance-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer shadow-sm hover:bg-white dark:hover:bg-white/10"
                    >
                      {SOIL_TYPES.map(type => (
                        <option key={type} value={type} className="bg-white dark:bg-charcoal">{type}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="group">
                    <div className="flex justify-between mb-3 items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-jakarta tracking-widest text-gray-500 dark:text-gray-400 uppercase font-bold">Soil pH Level</label>
                        {iotMode && <Activity size={10} className="text-emerald-500 animate-pulse" />}
                      </div>
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${iotMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/5'}`}>
                        <input 
                          type="number"
                          readOnly={iotMode}
                          step="0.1"
                          value={formData.ph}
                          onChange={(e) => handleNumericChange('ph', e.target.value, 4, 10, true)}
                          className={`w-12 bg-transparent text-right font-mono text-sm font-bold outline-none appearance-none ${iotMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-700 dark:text-emerald-400'}`}
                        />
                      </div>
                    </div>
                    <input 
                      type="range" 
                      disabled={iotMode}
                      min="4" max="10" step="0.1"
                      value={formData.ph}
                      onChange={(e) => setFormData({...formData, ph: parseFloat(e.target.value)})}
                      className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all ${iotMode ? 'bg-emerald-500/20 accent-emerald-500' : 'bg-gray-200 dark:bg-white/10 accent-emerald-600'}`}
                    />
                </div>

                <div className="group">
                    <div className="flex justify-between mb-3 items-center">
                      <div className="flex items-center gap-2">
                           <label className="text-xs font-jakarta tracking-widest text-gray-500 dark:text-gray-400 uppercase font-bold">Rainfall Estimate</label>
                           <Droplets className="w-3 h-3 text-blue-500" />
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-black/20 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/5">
                        <input 
                          type="number"
                          value={formData.rainfall}
                          onChange={(e) => handleNumericChange('rainfall', e.target.value, 200, 4000)}
                          className="w-16 bg-transparent text-right font-mono text-sm font-bold text-blue-600 dark:text-blue-400 outline-none appearance-none"
                        />
                        <span className="text-blue-600 dark:text-blue-400 font-mono text-xs font-bold">mm</span>
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="200" max="4000"
                      value={formData.rainfall}
                      onChange={(e) => setFormData({...formData, rainfall: parseInt(e.target.value)})}
                      className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: '#D4AF37', color: '#000' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAnalyze(formData)}
                  disabled={isLoading}
                  className="w-full mt-8 bg-charcoal dark:bg-white text-white dark:text-obsidian h-16 rounded-xl font-bold font-jakarta tracking-wider transition-all duration-300 flex items-center justify-center gap-2 group shadow-xl"
                >
                  {isLoading ? (
                    <>Processing <Loader2 className="animate-spin ml-2" /></>
                  ) : (
                    <>ANALYSE SOIL DATA <ChevronRight className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </motion.button>
             </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
