
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, ChevronRight, Loader2, CheckCircle, Crosshair,
  ChevronDown, Droplets, Info, Cpu, Zap, Activity,
  Terminal, Wifi, Database, Radio,
  FileUp, Camera, X, FileText, Sparkles, AlertTriangle
} from 'lucide-react';
import { UserLocation } from '../types';
import { useToast } from './Toast';
import { extractSoilReport, SoilReportData } from '../services/geminiService';

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
  const { toast } = useToast();
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
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number; altitude: number | null } | null>(null);
  const [showSoilInfo, setShowSoilInfo] = useState(false);

  const [iotMode, setIotMode] = useState(false);
  const [telemetry, setTelemetry] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Soil Report Upload
  const [soilReportImage, setSoilReportImage] = useState<string | null>(null);
  const [soilReportData, setSoilReportData] = useState<SoilReportData | null>(null);
  const [soilReportLoading, setSoilReportLoading] = useState(false);
  const [soilReportError, setSoilReportError] = useState<string | null>(null);
  const soilReportInputRef = useRef<HTMLInputElement>(null);
  const soilCameraRef = useRef<HTMLInputElement>(null);

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

  const validateField = (key: string, value: any): string => {
    if (key === 'city' && (!value || !value.trim())) return 'Location is required — type or detect via GPS';
    if (key === 'soilType' && value === "Don't know") return 'Select a soil type or detect location';
    if (key === 'n' && (value < 1 || value > 140)) return 'Nitrogen should be 1-140 mg/kg';
    if (key === 'p' && (value < 1 || value > 100)) return 'Phosphorus should be 1-100 mg/kg';
    if (key === 'k' && (value < 1 || value > 100)) return 'Potassium should be 1-100 mg/kg';
    if (key === 'ph' && (value < 4 || value > 10)) return 'pH should be between 4.0 and 10.0';
    if (key === 'rainfall' && (value < 200 || value > 4000)) return 'Rainfall should be 200-4000 mm';
    return '';
  };

  const validateAll = (): boolean => {
    const errors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    for (const key of ['city', 'soilType', 'n', 'p', 'k', 'ph', 'rainfall']) {
      const err = validateField(key, (formData as any)[key]);
      if (err) errors[key] = err;
      allTouched[key] = true;
    }
    setFieldErrors(errors);
    setTouched(allTouched);
    return Object.keys(errors).length === 0;
  };

  const handleAnalyze = () => {
    if (validateAll()) {
      onAnalyze({ ...formData, soilReport: soilReportData || undefined });
    } else {
      toast('Please fix the highlighted fields before analyzing.', 'error');
    }
  };

  /* ── Soil Report Upload ── */
  const compressSoilImage = (dataUrl: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        const maxDim = 1200;
        // For SVGs that report 0 dimensions, use a sensible default
        const w = img.naturalWidth || 800;
        const h = img.naturalHeight || 1100;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        c.width = w * scale;
        c.height = h * scale;
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });

  const handleSoilReportUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast('Please upload an image (JPG/PNG) or photo of your soil report.', 'error');
      return;
    }
    // SVG files can't be sent to Gemini Vision — ask for a photo instead
    if (file.type === 'image/svg+xml') {
      toast('Please upload a JPG/PNG photo of your soil report, not an SVG file.', 'error');
      return;
    }
    setSoilReportError(null);
    setSoilReportLoading(true);
    setSoilReportData(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressSoilImage(raw);
        setSoilReportImage(compressed);

        const data = await extractSoilReport(compressed);
        if (!data.isValid) {
          setSoilReportError(data.errorMessage || 'This doesn\'t look like a soil report. Please upload a Soil Health Card or lab test result.');
          setSoilReportLoading(false);
          return;
        }

        setSoilReportData(data);
        // Auto-fill form with extracted values
        setFormData(prev => ({
          ...prev,
          n: Math.round(data.n),
          p: Math.round(data.p),
          k: Math.round(data.k),
          ph: Math.round(data.ph * 10) / 10,
          ...(data.soilType ? { soilType: data.soilType } : {}),
        }));
        toast('Soil report analyzed! Parameters auto-filled.', 'success');
      } catch {
        setSoilReportError('Failed to analyze the report. Please try a clearer image.');
      } finally {
        setSoilReportLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const clearSoilReport = () => {
    setSoilReportImage(null);
    setSoilReportData(null);
    setSoilReportError(null);
  };

  const handleManualLocation = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, city: e.target.value });
    setTouched(t => ({ ...t, city: true }));
    const err = validateField('city', e.target.value);
    setFieldErrors(prev => err ? { ...prev, city: err } : (({ city: _, ...rest }) => rest)(prev));
  };

  const handleSoilChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "Don't know") {
      if (detectedState && REGIONAL_DEFAULTS[detectedState]) {
        const suggestedSoil = REGIONAL_DEFAULTS[detectedState].soil;
        setFormData(prev => ({ ...prev, soilType: suggestedSoil }));
        toast(`Based on your location (${detectedState}), soil set to ${suggestedSoil}.`, 'success');
      } else {
        toast("Detect location first to auto-determine soil.", 'info');
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
    setGpsCoords(null);
    if (!navigator.geolocation) {
      toast("Geolocation is not supported by your browser.", 'error');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy, altitude } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy), altitude: altitude ? Math.round(altitude) : null });
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
          const data = await response.json();
          const address = data.address;
          const state = address.state || "Unknown";
          const district = address.county || address.state_district || "";
          const city = address.city || address.town || address.village || state;
          setDetectedState(state);
          onLocationUpdate({ city, state, lat: latitude, lng: longitude });
          if (REGIONAL_DEFAULTS[state]) {
            const d = REGIONAL_DEFAULTS[state];
            setFormData(prev => ({ ...prev, city, rainfall: d.rainfall, soilType: d.soil, n: d.n, p: d.p, k: d.k, ph: d.ph }));
          } else {
            setFormData(prev => ({ ...prev, city }));
          }
          setDetectedAddress(`${city}${district ? `, ${district}` : ''}, ${state}`);
          toast(`Location locked: ${city}, ${state} (±${Math.round(accuracy)}m)`, 'success');
        } catch {
          setDetectedAddress(`${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
          setFormData(prev => ({ ...prev, city: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        toast(err.code === 1 ? "Location access denied. Please allow GPS." : "Could not detect location. Try again.", 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Upload your Soil Health Card, use IoT sensors, or enter parameters manually.</p>
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
          {touched.city && fieldErrors.city && (
            <p className="text-red-500 text-xs font-bold mt-1 ml-2">{fieldErrors.city}</p>
          )}

          {/* Precise GPS Coordinates Panel */}
          <AnimatePresence>
            {gpsCoords && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 mt-2 mb-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">Precise GPS Lock</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2">
                    <div className="text-gray-400 font-bold text-[9px] tracking-widest mb-0.5">LATITUDE</div>
                    <div className="font-mono font-bold text-gray-900 dark:text-white">{gpsCoords.lat.toFixed(6)}°</div>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2">
                    <div className="text-gray-400 font-bold text-[9px] tracking-widest mb-0.5">LONGITUDE</div>
                    <div className="font-mono font-bold text-gray-900 dark:text-white">{gpsCoords.lng.toFixed(6)}°</div>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2">
                    <div className="text-gray-400 font-bold text-[9px] tracking-widest mb-0.5">ACCURACY</div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">±{gpsCoords.accuracy}m</div>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 rounded-lg px-3 py-2">
                    <div className="text-gray-400 font-bold text-[9px] tracking-widest mb-0.5">ALTITUDE</div>
                    <div className="font-mono font-bold text-gray-900 dark:text-white">{gpsCoords.altitude !== null ? `${gpsCoords.altitude}m` : 'N/A'}</div>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-gold transition-colors uppercase"
                >
                  <MapPin className="w-3 h-3" /> View on Google Maps
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Soil Report Upload ──────────────────────────── */}
          <div className="mb-10 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <FileText size={18} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-outfit font-bold text-gray-900 dark:text-white">Have a Soil Health Card?</h3>
                <p className="text-[10px] text-gray-400 font-medium">Upload your soil report and we'll auto-fill all parameters with AI.</p>
              </div>
            </div>

            {!soilReportImage ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="file" ref={soilReportInputRef} accept="image/jpeg,image/png,image/webp,.pdf" className="hidden" onChange={e => e.target.files?.[0] && handleSoilReportUpload(e.target.files[0])} />
                <input type="file" ref={soilCameraRef} accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files?.[0] && handleSoilReportUpload(e.target.files[0])} />
                <button
                  type="button"
                  onClick={() => soilReportInputRef.current?.click()}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all text-sm font-bold text-amber-700 dark:text-amber-400 flex-1"
                >
                  <FileUp size={18} /> Upload Soil Report
                </button>
                <button
                  type="button"
                  onClick={() => soilCameraRef.current?.click()}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all text-sm font-bold text-amber-700 dark:text-amber-400"
                >
                  <Camera size={18} /> Take Photo
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
                {/* Report preview + status */}
                <div className="flex items-start gap-4 p-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-amber-500/20 shrink-0 bg-white dark:bg-black/20">
                    <img src={soilReportImage} alt="Soil Report" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {soilReportLoading && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm font-bold">AI is reading your soil report...</span>
                      </div>
                    )}
                    {soilReportError && (
                      <div className="flex items-start gap-2 text-red-500">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{soilReportError}</span>
                      </div>
                    )}
                    {soilReportData && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={14} className="text-emerald-500" />
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Report Analyzed Successfully</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{soilReportData.summary}</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: 'N', value: soilReportData.n, unit: 'mg/kg' },
                            { label: 'P', value: soilReportData.p, unit: 'mg/kg' },
                            { label: 'K', value: soilReportData.k, unit: 'mg/kg' },
                            { label: 'pH', value: soilReportData.ph, unit: '' },
                            ...(soilReportData.organicCarbon ? [{ label: 'OC', value: soilReportData.organicCarbon, unit: '%' }] : []),
                          ].map(p => (
                            <span key={p.label} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/10 text-[10px] font-bold">
                              <span className="text-amber-600 dark:text-amber-400">{p.label}:</span>
                              <span className="text-gray-900 dark:text-white">{typeof p.value === 'number' ? Math.round(p.value * 10) / 10 : p.value}{p.unit}</span>
                            </span>
                          ))}
                          {soilReportData.soilType && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {soilReportData.soilType}
                            </span>
                          )}
                        </div>
                        {/* Micronutrients row */}
                        {(soilReportData.zinc || soilReportData.iron || soilReportData.sulphur) ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {[
                              { label: 'Zn', value: soilReportData.zinc },
                              { label: 'Fe', value: soilReportData.iron },
                              { label: 'Mn', value: soilReportData.manganese },
                              { label: 'Cu', value: soilReportData.copper },
                              { label: 'S', value: soilReportData.sulphur },
                              { label: 'B', value: soilReportData.boron },
                            ].filter(m => m.value && m.value > 0).map(m => (
                              <span key={m.label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/40 dark:bg-black/10 text-[9px] font-bold text-gray-500">
                                {m.label}: {Math.round((m.value || 0) * 10) / 10}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearSoilReport}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
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
                      aria-label={field.label}
                    />
                    {touched[field.key] && fieldErrors[field.key] && (
                      <p className="text-red-500 text-[10px] font-bold mt-1">{fieldErrors[field.key]}</p>
                    )}
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
                      aria-label="Select soil type"
                      className="w-full appearance-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none cursor-pointer shadow-sm hover:bg-white dark:hover:bg-white/10"
                    >
                      {SOIL_TYPES.map(type => (
                        <option key={type} value={type} className="bg-white dark:bg-charcoal">{type}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {touched.soilType && fieldErrors.soilType && (
                    <p className="text-red-500 text-[10px] font-bold mt-1">{fieldErrors.soilType}</p>
                  )}
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
                  onClick={handleAnalyze}
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
