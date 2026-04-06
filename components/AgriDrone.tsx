
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, MapPin, Droplets, ArrowLeft, Navigation, ExternalLink, Radar, Search, Crosshair,
  Satellite, Wind, Thermometer, Eye, Layers, Activity, Radio, Compass, Target, Zap, Timer, Wifi,
  Download, Share2, History, Mic, MicOff, BarChart3, Clock, ChevronRight, X, CloudRain, Sun, Gauge,
  TrendingUp, RefreshCw
} from 'lucide-react';
import { getTerrainAnalysis, resolveLocation } from '../services/geminiService';
import { useAuth } from '../AuthContext';
import { DroneAnalysisResult, Coordinates } from '../types';

// Safely render any value from AI — handles objects returned instead of strings
const safeRender = (val: unknown): string => {
  if (val == null) return '';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') return Object.entries(val).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' | ');
  return String(val);
};

interface AgriDroneProps {
  onBack: () => void;
}

const SCAN_STEPS = [
  { label: 'Initializing satellite link', icon: Satellite },
  { label: 'Calibrating terrain sensors', icon: Radar },
  { label: 'Scanning water signatures', icon: Droplets },
  { label: 'Mapping vegetation index', icon: Layers },
  { label: 'Analyzing topography', icon: Compass },
  { label: 'Generating AI report', icon: Zap },
];

const MISSION_SPECS = [
  { icon: Radar, label: 'Precision', value: '98.4%', desc: 'Detection accuracy', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { icon: Navigation, label: 'Range', value: '15 km', desc: 'Scan radius', color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20' },
  { icon: Satellite, label: 'Altitude', value: '450m', desc: 'AGL orbit height', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { icon: Timer, label: 'Speed', value: '<60s', desc: 'Analysis time', color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
];

interface ScanRecord {
  id: string;
  coords: Coordinates;
  result: DroneAnalysisResult;
  timestamp: number;
  locationName?: string;
  healthScore: number;
}

interface WeatherInfo {
  temp: number;
  humidity: number;
  wind: number;
  condition: string;
  icon: string;
}

// Compute composite health score (0-100)
const computeHealthScore = (r: DroneAnalysisResult): number => {
  let score = 50;
  const moisture = r.soilMoisture?.percentage ?? 50;
  // Optimal moisture 30-60
  if (moisture >= 30 && moisture <= 60) score += 20;
  else if (moisture >= 20 && moisture <= 70) score += 10;
  else score -= 10;
  // Vegetation
  const ndvi = r.vegetationIndex?.score ?? 0.5;
  score += Math.round(ndvi * 30);
  // Sources bonus
  score += Math.min(r.sources.length * 3, 15);
  return Math.max(0, Math.min(100, score));
};

const getScoreColor = (s: number) => s >= 70 ? 'text-emerald-500' : s >= 45 ? 'text-amber-500' : 'text-red-500';
const getScoreLabel = (s: number) => s >= 70 ? 'Excellent' : s >= 45 ? 'Moderate' : 'Poor';
const getScoreBg = (s: number) => s >= 70 ? 'from-emerald-500' : s >= 45 ? 'from-amber-500' : 'from-red-500';

export const AgriDrone: React.FC<AgriDroneProps> = ({ onBack }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DroneAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('gps');
  const [manualQuery, setManualQuery] = useState('');
  const [resolving, setResolving] = useState(false);
  const [viewMode, setViewMode] = useState<'satellite' | 'thermal' | 'topographic'>('satellite');
  const [scanStep, setScanStep] = useState(0);
  const { user } = useAuth();

  // New state for upgrades
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showCostTable, setShowCostTable] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareScan, setCompareScan] = useState<ScanRecord | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load scan history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('agridrone_history');
      if (saved) setScanHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // GPS / IP fallback
  useEffect(() => {
    if (locationMode === 'gps') {
      setError(null);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          async () => {
            try {
              const res = await fetch('http://ip-api.com/json/?fields=status,lat,lon,city,regionName');
              if (res.ok) {
                const data = await res.json();
                if (data.status === 'success' && data.lat && data.lon) {
                  setCoords({ lat: data.lat, lng: data.lon });
                  return;
                }
              }
            } catch {}
            setError("Location access denied. Please enter location manually.");
            setLocationMode('manual');
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      } else {
        setError("Geolocation not supported. Please enter location manually.");
        setLocationMode('manual');
      }
    }
  }, [locationMode]);

  // Scan step auto-advance
  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => {
      setScanStep(prev => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [scanning]);

  // Fetch weather when coords change
  useEffect(() => {
    if (!coords) return;
    (async () => {
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`);
        if (r.ok) {
          const d = await r.json();
          const c = d.current;
          const wc = c.weather_code;
          const condition = wc <= 3 ? 'Clear' : wc <= 48 ? 'Cloudy' : wc <= 67 ? 'Rain' : wc <= 77 ? 'Snow' : 'Storm';
          const icon = wc <= 3 ? 'sun' : wc <= 48 ? 'cloud' : 'rain';
          setWeather({
            temp: Math.round(c.temperature_2m),
            humidity: Math.round(c.relative_humidity_2m),
            wind: Math.round(c.wind_speed_10m),
            condition,
            icon
          });
        }
      } catch {}
    })();
  }, [coords]);

  const healthScore = useMemo(() => result ? computeHealthScore(result) : 0, [result]);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;
    setResolving(true);
    setError(null);
    try {
      const resolved = await resolveLocation(manualQuery);
      setCoords(resolved);
    } catch (err) {
      setError("Could not find that location. Please be more specific.");
    } finally {
      setResolving(false);
    }
  };

  const handleScan = async () => {
    if (!coords) return;
    setScanning(true);
    setScanStep(0);
    setError(null);
    try {
      const data = await getTerrainAnalysis(coords);
      setResult(data);

      // Save to history
      const record: ScanRecord = {
        id: Date.now().toString(),
        coords: { ...coords },
        result: data,
        timestamp: Date.now(),
        locationName: manualQuery || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        healthScore: computeHealthScore(data)
      };
      const updated = [record, ...scanHistory].slice(0, 20);
      setScanHistory(updated);
      localStorage.setItem('agridrone_history', JSON.stringify(updated));

      if (user) {
        try {
          await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              type: 'Drone Scan',
              title: `Terrain Analysis at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
              summary: data.summary,
              data: data
            })
          });
        } catch {}
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze terrain. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  // Voice command
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Voice input not supported in this browser."); return; }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setManualQuery(transcript);
      setIsListening(false);
      // Auto-search after voice
      setLocationMode('manual');
      setTimeout(async () => {
        setResolving(true);
        try {
          const resolved = await resolveLocation(transcript);
          setCoords(resolved);
        } catch {
          setError("Could not find that location.");
        } finally {
          setResolving(false);
        }
      }, 300);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Download report as text
  const downloadReport = () => {
    if (!result) return;
    const lines = [
      '═══════════════════════════════════════════',
      '       AGRIDRONE V2 — TERRAIN REPORT       ',
      '═══════════════════════════════════════════',
      '',
      `Date: ${new Date().toLocaleString('en-IN')}`,
      `Coordinates: ${coords?.lat.toFixed(6)}, ${coords?.lng.toFixed(6)}`,
      `Soil Health Score: ${healthScore}/100 (${getScoreLabel(healthScore)})`,
      '',
      '── SOIL MOISTURE ──────────────────────────',
      `Level: ${result.soilMoisture?.percentage}% (${result.soilMoisture?.status})`,
      `Hydration: ${result.soilMoisture?.level}`,
      '',
      '── TOPOGRAPHY ────────────────────────────',
      `Slope: ${safeRender(result.topography?.slope)}`,
      `Elevation: ${safeRender(result.topography?.elevation)}`,
      `Drainage: ${safeRender(result.topography?.drainage)}`,
      '',
      '── VEGETATION INDEX ──────────────────────',
      `NDVI Score: ${result.vegetationIndex?.score}`,
      `Health: ${result.vegetationIndex?.health}`,
      '',
      weather ? `── WEATHER ──────────────────────────────\nTemp: ${weather.temp}°C | Humidity: ${weather.humidity}% | Wind: ${weather.wind} km/h | ${weather.condition}\n` : '',
      '── WATER ANALYSIS ───────────────────────',
      result.summary,
      '',
      '── AI RECOMMENDATION ────────────────────',
      result.recommendation,
      '',
      '── IRRIGATION SOURCES ───────────────────',
      ...result.sources.map((s, i) => `${i + 1}. ${s.name} — ${safeRender(s.type)} — ${safeRender(s.distance)} — Est. ${safeRender(s.costEstimate)}`),
      '',
      '═══════════════════════════════════════════',
      '  Generated by AgriFuture India AgriDrone  ',
      '═══════════════════════════════════════════',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgriDrone_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Share report
  const shareReport = async () => {
    if (!result || !navigator.share) {
      // Fallback: copy to clipboard
      const text = `AgriDrone Scan Report\nLocation: ${coords?.lat.toFixed(4)}, ${coords?.lng.toFixed(4)}\nHealth Score: ${healthScore}/100\nSoil Moisture: ${result?.soilMoisture?.percentage}%\nSources Found: ${result?.sources.length}\n\nRecommendation: ${result?.recommendation}`;
      await navigator.clipboard.writeText(text);
      setError("Report copied to clipboard!");
      setTimeout(() => setError(null), 2000);
      return;
    }
    try {
      await navigator.share({
        title: 'AgriDrone Terrain Report',
        text: `Soil Health: ${healthScore}/100 | Moisture: ${result.soilMoisture?.percentage}% | ${result.sources.length} water sources found`,
        url: window.location.href
      });
    } catch {}
  };

  // Load a historical scan
  const loadHistoryScan = (record: ScanRecord) => {
    if (compareMode) {
      setCompareScan(record);
      setCompareMode(false);
      setShowHistory(false);
    } else {
      setCoords(record.coords);
      setResult(record.result);
      setManualQuery(record.locationName || '');
      setShowHistory(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gold transition-colors group w-fit text-[10px] font-bold tracking-[0.3em] uppercase"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> DASHBOARD
        </button>
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-amber-500/10 border border-gold/20 flex items-center justify-center"
          >
            <Plane className="text-gold w-7 h-7" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-outfit font-bold text-gray-900 dark:text-ivory tracking-tight">AgriDrone V2</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-inter flex items-center gap-2">
              Satellite-guided terrain intelligence
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Wifi size={8} /> ONLINE
              </span>
            </p>
          </div>
        </div>
        {/* History + Voice buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`p-3 rounded-xl border transition-all ${isListening ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-400 hover:text-gold hover:border-gold/30'}`}
            title="Voice command"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="relative p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-400 hover:text-gold hover:border-gold/30 transition-all"
            title="Scan history"
          >
            <History size={18} />
            {scanHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-black text-[9px] font-bold rounded-full flex items-center justify-center">{scanHistory.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-white dark:bg-obsidian z-50 shadow-2xl border-l border-black/10 dark:border-white/10 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-outfit font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <History size={18} className="text-gold" /> Scan History
                </h3>
                <button onClick={() => setShowHistory(false)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-400"><X size={18} /></button>
              </div>
              {scanHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-12">No scans yet. Launch your first drone scan!</p>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map(record => (
                    <button
                      key={record.id}
                      onClick={() => loadHistoryScan(record)}
                      className="w-full text-left p-4 rounded-2xl border border-black/5 dark:border-white/5 hover:border-gold/30 hover:bg-gold/5 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock size={10} /> {new Date(record.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`text-xs font-bold ${getScoreColor(record.healthScore)}`}>{record.healthScore}/100</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{record.locationName}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                        <span>💧 {record.result.soilMoisture?.percentage}%</span>
                        <span>🌿 {record.result.vegetationIndex?.score}</span>
                        <span>📍 {record.result.sources.length} sources</span>
                      </div>
                      <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-gold transition-colors opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weather Bar */}
      {weather && coords && !scanning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-emerald-500/10 border border-blue-500/15 flex flex-wrap items-center gap-6"
        >
          <div className="flex items-center gap-2">
            {weather.icon === 'sun' ? <Sun size={18} className="text-amber-500" /> : weather.icon === 'rain' ? <CloudRain size={18} className="text-blue-500" /> : <Layers size={18} className="text-gray-400" />}
            <span className="text-sm font-bold text-gray-900 dark:text-white">{weather.condition}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <Thermometer size={13} className="text-red-400" /> {weather.temp}°C
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <Droplets size={13} className="text-blue-400" /> {weather.humidity}%
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <Wind size={13} className="text-cyan-400" /> {weather.wind} km/h
          </div>
          <span className="ml-auto text-[9px] font-bold text-blue-500/60 uppercase tracking-widest">Live Weather</span>
        </motion.div>
      )}

      {/* Voice Listening Indicator */}
      {isListening && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <Mic className="text-red-500 w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-red-500 uppercase tracking-widest">Listening...</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">Say a location — e.g. "Indore Madhya Pradesh"</p>
          </div>
          <button onClick={toggleVoice} className="ml-auto px-4 py-2 text-xs font-bold text-red-500 bg-red-500/10 rounded-xl border border-red-500/20 hover:bg-red-500/20">Stop</button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!result && !scanning ? (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {/* Mission Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {MISSION_SPECS.map((spec, i) => (
                <motion.div
                  key={spec.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-5 rounded-2xl ${spec.bg} border ${spec.border} group hover:scale-[1.03] transition-transform`}
                >
                  <spec.icon size={18} className={`${spec.color} mb-2`} />
                  <div className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">{spec.value}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{spec.desc}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-10 items-start">
              {/* Control Panel */}
              <div className="space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <Target size={20} className="text-gold" />
                    <h2 className="text-xl font-outfit font-bold text-gray-900 dark:text-white">Mission Control</h2>
                  </div>

                  {/* Location Mode Toggle */}
                  <div className="flex p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl mb-6">
                    <button
                      onClick={() => setLocationMode('gps')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold tracking-[0.2em] transition-all ${locationMode === 'gps' ? 'bg-gold text-black shadow-lg' : 'text-gray-500 hover:text-gold'}`}
                    >
                      <Crosshair size={14} /> AUTO GPS
                    </button>
                    <button
                      onClick={() => setLocationMode('manual')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold tracking-[0.2em] transition-all ${locationMode === 'manual' ? 'bg-gold text-black shadow-lg' : 'text-gray-500 hover:text-gold'}`}
                    >
                      <Search size={14} /> MANUAL
                    </button>
                  </div>

                  {locationMode === 'manual' ? (
                    <form onSubmit={handleManualSearch} className="mb-6">
                      <label className="block text-[10px] font-bold text-gold uppercase tracking-[0.2em] mb-2 ml-1">Target Location</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={manualQuery}
                          onChange={(e) => setManualQuery(e.target.value)}
                          placeholder="Enter Village, District, or State..."
                          className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-5 py-4 pr-20 text-sm focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20 transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={toggleVoice}
                            className={`p-2 rounded-lg transition-all ${isListening ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-gold hover:bg-gold/10'}`}
                          >
                            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                          </button>
                          <button
                            type="submit"
                            disabled={resolving}
                            className="p-2 text-gold hover:bg-gold/10 rounded-lg transition-all"
                          >
                            {resolving ? <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" /> : <Search size={16} />}
                          </button>
                        </div>
                      </div>
                      {coords && !resolving && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-2">
                          <Radio size={10} className="animate-pulse" /> Target Locked: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                        </motion.p>
                      )}
                    </form>
                  ) : (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Crosshair className="text-emerald-500 w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">GPS Signal</span>
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Acquiring...'}
                        </p>
                      </div>
                      {coords && <div className="ml-auto w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>
                  )}

                  <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed text-sm">
                    Deploy the AgriDrone to scan terrain, detect water sources, analyze soil moisture, and generate an AI-powered irrigation strategy for your farm.
                  </p>

                  <button
                    onClick={handleScan}
                    disabled={!coords || resolving}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-gold to-amber-600 text-white font-jakarta font-bold tracking-[0.3em] uppercase shadow-xl shadow-gold/20 hover:shadow-gold/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-3"
                  >
                    <Plane size={18} />
                    {coords ? 'LAUNCH DRONE SCAN' : 'WAITING FOR LOCATION...'}
                  </button>
                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-500 text-sm text-center font-medium">
                      {error}
                    </motion.p>
                  )}
                </div>

                {/* Analysis Capabilities */}
                <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-4">Analysis Modules</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Droplets, label: 'Soil Moisture', color: 'text-blue-500' },
                      { icon: Layers, label: 'Topography', color: 'text-emerald-500' },
                      { icon: Eye, label: 'Vegetation NDVI', color: 'text-green-500' },
                      { icon: MapPin, label: 'Water Sources', color: 'text-cyan-500' },
                      { icon: Thermometer, label: 'Thermal Map', color: 'text-orange-500' },
                      { icon: Wind, label: 'Drainage Flow', color: 'text-violet-500' },
                    ].map((mod) => (
                      <div key={mod.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-black/5 dark:bg-white/5">
                        <mod.icon size={14} className={mod.color} />
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{mod.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview / HUD */}
              <div className="relative sticky top-24">
                <div className="aspect-square rounded-[2.5rem] overflow-hidden border-2 border-black/10 dark:border-white/10 shadow-2xl relative group">
                  <img
                    src="/drone-satellite-view.svg"
                    alt="Drone View"
                    className={`w-full h-full object-cover transition-all duration-1000 ${viewMode === 'thermal' ? 'sepia brightness-125 contrast-150 hue-rotate-[340deg]' : viewMode === 'topographic' ? 'hue-rotate-90 saturate-200' : 'opacity-60'}`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent" />

                  {/* View Mode Toggle */}
                  <div className="absolute top-5 right-5 flex gap-2 z-20">
                    {(['satellite', 'thermal', 'topographic'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-2 rounded-xl text-[8px] font-bold tracking-widest uppercase transition-all border backdrop-blur-md ${
                          viewMode === mode
                            ? 'bg-gold text-black border-gold shadow-lg shadow-gold/30'
                            : 'bg-black/30 text-white/70 border-white/10 hover:bg-black/50 hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {/* HUD corners */}
                  <div className="absolute top-6 left-6 w-16 h-16 border-l-2 border-t-2 border-gold/60 rounded-tl-lg" />
                  <div className="absolute top-6 right-6 w-16 h-16 border-r-2 border-t-2 border-gold/60 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-6 left-6 w-16 h-16 border-l-2 border-b-2 border-gold/60 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-6 right-6 w-16 h-16 border-r-2 border-b-2 border-gold/60 rounded-br-lg" />

                  {/* Scanning crosshair */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-40 h-40 border border-gold/20 rounded-full animate-ping" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 border border-gold/30 rounded-full" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1 h-8 bg-gold/30" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-1 w-8 bg-gold/30" />
                    </div>
                  </div>

                  {/* Telemetry overlay */}
                  <div className="absolute top-6 left-6 space-y-1.5">
                    <div className="flex items-center gap-2 text-[9px] font-mono text-gold/80">
                      <Activity size={10} className="animate-pulse" /> LIVE FEED
                    </div>
                    <div className="text-[9px] font-mono text-emerald-500/80">MODE: {viewMode.toUpperCase()}</div>
                  </div>

                  {/* Coordinates */}
                  {coords && (
                    <div className="absolute bottom-8 left-8 font-mono text-[10px] text-gold/80 space-y-1 bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-gold/10">
                      <p className="flex items-center gap-2"><Compass size={10} /> LAT: {coords.lat.toFixed(6)}</p>
                      <p className="flex items-center gap-2"><Compass size={10} /> LNG: {coords.lng.toFixed(6)}</p>
                      <p className="flex items-center gap-2"><Satellite size={10} /> ALT: 450m AGL</p>
                      <p className="flex items-center gap-2"><Radio size={10} /> SAT: 12 LOCKED</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

        ) : scanning ? (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            {/* Scanning animation */}
            <div className="relative w-72 h-72 mb-12">
              <div className="absolute inset-0 border-2 border-gold/10 rounded-full" />
              <div className="absolute inset-4 border-2 border-gold/15 rounded-full" />
              <div className="absolute inset-8 border-2 border-emerald-500/20 rounded-full animate-pulse" />
              <motion.div
                className="absolute inset-0 border-t-4 border-gold rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-6 border-t-2 border-emerald-500 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Plane className="w-14 h-14 text-gold" />
                </motion.div>
              </div>
              {/* Radar sweep */}
              <motion.div
                className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-gradient-to-b from-gold/80 to-transparent origin-bottom"
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            <h2 className="text-3xl font-outfit font-bold text-gray-900 dark:text-white mb-3">Scanning Terrain</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-10">Analyzing satellite data for irrigation intelligence</p>

            {/* Step Progress */}
            <div className="w-full max-w-md space-y-3">
              {SCAN_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === scanStep;
                const isDone = i < scanStep;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                      isActive ? 'bg-gold/10 border border-gold/20' : isDone ? 'opacity-50' : 'opacity-30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-gold/20 text-gold' : isDone ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-500'
                    }`}>
                      {isDone ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.div> : <StepIcon size={14} className={isActive ? 'animate-pulse' : ''} />}
                    </div>
                    <span className={`text-sm font-bold ${isActive ? 'text-gold' : isDone ? 'text-gray-500' : 'text-gray-600 dark:text-gray-500'}`}>
                      {step.label}
                    </span>
                    {isActive && <div className="ml-auto w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

        ) : (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* Mission Complete Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-gold/5 to-blue-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <Plane className="text-emerald-500 w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-outfit font-bold text-gray-900 dark:text-white">Mission Complete</h2>
                  <p className="text-sm text-gray-500">
                    Scanned at {coords?.lat.toFixed(4)}, {coords?.lng.toFixed(4)} &bull; {result?.sources.length} sources detected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={downloadReport} className="px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 font-bold text-[10px] tracking-[0.15em] uppercase hover:bg-blue-500/20 transition-all flex items-center gap-2">
                  <Download size={14} /> Download
                </button>
                <button onClick={shareReport} className="px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500 font-bold text-[10px] tracking-[0.15em] uppercase hover:bg-violet-500/20 transition-all flex items-center gap-2">
                  <Share2 size={14} /> Share
                </button>
                <button
                  onClick={() => { setCompareMode(true); setShowHistory(true); }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-[10px] tracking-[0.15em] uppercase hover:bg-amber-500/20 transition-all flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Compare
                </button>
                <button
                  onClick={() => { setResult(null); setCompareScan(null); }}
                  className="px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/20 text-gold font-bold text-[10px] tracking-[0.15em] uppercase hover:bg-gold/20 transition-all flex items-center gap-2"
                >
                  <Plane size={14} /> New Scan
                </button>
              </div>
            </motion.div>

            {/* Soil Health Score Gauge + Before/After Compare */}
            <div className={`grid ${compareScan ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
              {/* Current Score */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-lg flex flex-col md:flex-row items-center gap-8"
              >
                {/* Gauge */}
                <div className="relative w-40 h-40 shrink-0">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-black/5 dark:text-white/5" />
                    <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" strokeLinecap="round"
                      className={getScoreColor(healthScore).replace('text-', 'stroke-')}
                      strokeDasharray={`${(healthScore / 100) * 327} 327`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-outfit font-bold ${getScoreColor(healthScore)}`}>{healthScore}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">/ 100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge size={18} className="text-gold" />
                    <h3 className="text-lg font-outfit font-bold text-gray-900 dark:text-white">Soil Health Score</h3>
                  </div>
                  <p className={`text-2xl font-bold mb-1 ${getScoreColor(healthScore)}`}>{getScoreLabel(healthScore)}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Composite score based on soil moisture ({result?.soilMoisture?.percentage}%), vegetation index ({result?.vegetationIndex?.score}), and {result?.sources.length} water source{result?.sources.length !== 1 ? 's' : ''} detected.
                  </p>
                  <div className="mt-3 w-full h-2.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} transition={{ duration: 1.2, delay: 0.2 }}
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(healthScore)} to-transparent`}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Before/After Compare */}
              {compareScan && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-amber-500/20 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-outfit font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={18} className="text-amber-500" /> Comparison
                    </h3>
                    <button onClick={() => setCompareScan(null)} className="text-gray-400 hover:text-red-500 p-1"><X size={16} /></button>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">
                    vs. {compareScan.locationName} — {new Date(compareScan.timestamp).toLocaleDateString('en-IN')}
                  </p>
                  <div className="space-y-3">
                    {[
                      { label: 'Health Score', current: `${healthScore}/100`, prev: `${compareScan.healthScore}/100`, diff: healthScore - compareScan.healthScore },
                      { label: 'Soil Moisture', current: `${result?.soilMoisture?.percentage}%`, prev: `${compareScan.result.soilMoisture?.percentage}%`, diff: (result?.soilMoisture?.percentage || 0) - (compareScan.result.soilMoisture?.percentage || 0) },
                      { label: 'NDVI Score', current: `${result?.vegetationIndex?.score}`, prev: `${compareScan.result.vegetationIndex?.score}`, diff: (result?.vegetationIndex?.score || 0) - (compareScan.result.vegetationIndex?.score || 0) },
                      { label: 'Sources', current: `${result?.sources.length}`, prev: `${compareScan.result.sources.length}`, diff: (result?.sources.length || 0) - compareScan.result.sources.length },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{row.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{row.prev}</span>
                          <span className="text-[9px] text-gray-400">→</span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{row.current}</span>
                          <span className={`text-[10px] font-bold ${row.diff > 0 ? 'text-emerald-500' : row.diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {row.diff > 0 ? `+${row.diff.toFixed(1)}` : row.diff < 0 ? row.diff.toFixed(1) : '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Terrain Intelligence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Droplets className="text-emerald-500 w-5 h-5" /></div>
                  <h4 className="text-sm font-outfit font-bold text-gray-900 dark:text-white">Soil Moisture</h4>
                </div>
                <div className="flex items-end gap-3 mb-3">
                  <div className="text-5xl font-outfit font-bold text-gray-900 dark:text-white">{result?.soilMoisture?.percentage}<span className="text-2xl text-gray-400">%</span></div>
                  <div className={`text-[10px] font-bold mb-2 px-2.5 py-1 rounded-lg ${result?.soilMoisture?.status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {result?.soilMoisture?.status?.toUpperCase()}
                  </div>
                </div>
                <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result?.soilMoisture?.percentage || 0}%` }} transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                  />
                </div>
                <p className="text-xs text-gray-500 font-medium mt-2">{result?.soilMoisture?.level} hydration detected</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Compass className="text-blue-500 w-5 h-5" /></div>
                  <h4 className="text-sm font-outfit font-bold text-gray-900 dark:text-white">Topography</h4>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Slope', value: result?.topography?.slope },
                    { label: 'Elevation', value: result?.topography?.elevation },
                    { label: 'Drainage', value: result?.topography?.drainage },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{safeRender(item.value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center"><Eye className="text-gold w-5 h-5" /></div>
                  <h4 className="text-sm font-outfit font-bold text-gray-900 dark:text-white">Vegetation Index</h4>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1 h-3 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(result?.vegetationIndex?.score || 0.5) * 100}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-gold to-emerald-500 rounded-full"
                    />
                  </div>
                  <div className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">{result?.vegetationIndex?.score}</div>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  Health: <span className="text-emerald-500 font-bold">{result?.vegetationIndex?.health}</span>
                </p>
              </motion.div>
            </div>

            {/* Mini Map with Source Pins */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <MapPin size={18} className="text-gold" />
                <h3 className="text-lg font-outfit font-bold text-gray-900 dark:text-white">Source Map</h3>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-2">{result?.sources.length} pins</span>
              </div>
              <div className="relative aspect-[3/1] rounded-2xl bg-gradient-to-br from-emerald-900/30 via-emerald-800/20 to-blue-900/30 border border-emerald-500/10 overflow-hidden">
                {/* Grid */}
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'linear-gradient(rgba(255,215,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />
                {/* Center marker (scanned location) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-4 h-4 bg-gold rounded-full border-2 border-white shadow-lg shadow-gold/50" />
                  <div className="absolute -inset-2 border-2 border-gold/30 rounded-full animate-ping" />
                </div>
                {/* Source pins distributed around center */}
                {result?.sources.map((source, idx) => {
                  const angle = (idx / (result.sources.length || 1)) * Math.PI * 2 - Math.PI / 2;
                  const radius = 25 + (idx % 3) * 10;
                  const x = 50 + Math.cos(angle) * radius;
                  const y = 50 + Math.sin(angle) * radius;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + idx * 0.15 }}
                      className="absolute group/pin cursor-pointer"
                      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <div className="w-3 h-3 bg-cyan-400 rounded-full border border-white/80 shadow-lg shadow-cyan-400/40" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 backdrop-blur rounded-lg text-[9px] font-bold text-white whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none">
                        {source.name} — {safeRender(source.distance)}
                      </div>
                    </motion.div>
                  );
                })}
                {/* Label */}
                <div className="absolute bottom-3 right-4 text-[8px] font-mono text-gold/50 uppercase tracking-widest">
                  {coords?.lat.toFixed(4)}, {coords?.lng.toFixed(4)}
                </div>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Water Analysis & Recommendation */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                className="lg:col-span-1 p-8 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Droplets className="text-emerald-500 w-6 h-6" />
                  <h3 className="text-xl font-outfit font-bold text-gray-900 dark:text-white">Water Analysis</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6 text-sm">
                  {result?.summary}
                </p>
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">AI Recommendation</span>
                  <p className="text-sm text-gray-900 dark:text-white font-medium leading-relaxed">
                    {result?.recommendation}
                  </p>
                </div>
              </motion.div>

              {/* Detected Sources */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                className="lg:col-span-2 space-y-4"
              >
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-outfit font-bold text-gray-900 dark:text-white">
                    {result?.sources.some(s => s.name.includes('Regional')) ? 'AI-Guided Regional Strategy' : 'Detected Irrigation Sources'}
                  </h3>
                  <div className="flex items-center gap-2">
                    {result?.sources.some(s => s.name.includes('Regional')) && (
                      <span className="text-[10px] font-bold text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20 animate-pulse">
                        SMART FALLBACK
                      </span>
                    )}
                    <button
                      onClick={() => setShowCostTable(!showCostTable)}
                      className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${showCostTable ? 'bg-gold/10 text-gold border-gold/20' : 'text-gray-400 border-gray-300 dark:border-gray-700 hover:text-gold hover:border-gold/20'}`}
                    >
                      <BarChart3 size={11} /> {showCostTable ? 'Cards' : 'Cost Table'}
                    </button>
                  </div>
                </div>

                {/* Cost Comparison Table View */}
                {showCostTable ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/5"
                  >
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-black/5 dark:bg-white/5">
                          <th className="text-left p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Source</th>
                          <th className="text-left p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="text-left p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distance</th>
                          <th className="text-left p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cost Estimate</th>
                          <th className="p-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {result?.sources.map((source, idx) => (
                          <tr key={idx} className="border-t border-black/5 dark:border-white/5 hover:bg-gold/5 transition-colors">
                            <td className="p-4 font-bold text-gray-900 dark:text-white">{source.name}</td>
                            <td className="p-4 text-gray-500">{safeRender(source.type)}</td>
                            <td className="p-4 text-emerald-500 font-bold">{safeRender(source.distance)}</td>
                            <td className="p-4 text-[11px] text-gold font-medium">{safeRender(source.costEstimate)}</td>
                            <td className="p-4">
                              <a href={source.mapUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gold"><ExternalLink size={14} /></a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                ) : (
                  <>
                    {result?.sources.map((source, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className={`group p-5 rounded-2xl border transition-all flex items-center justify-between hover:-translate-y-0.5 ${
                          source.name.includes('Regional')
                            ? 'bg-gold/5 border-gold/20 shadow-lg shadow-gold/5'
                            : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/5 hover:border-gold/30 hover:shadow-lg'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MapPin className="text-gold w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-outfit font-bold text-gray-900 dark:text-white">{source.name}</h4>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{safeRender(source.type)}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                              <span className="text-xs text-emerald-500 font-bold">{safeRender(source.distance)}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                              <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-lg border border-gold/20">
                                Est. {safeRender(source.costEstimate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={source.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-gray-400 hover:text-gold hover:bg-gold/10 transition-all"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </motion.div>
                    ))}

                    {result?.sources.length === 0 && (
                      <div className="p-12 text-center rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
                        <p className="text-gray-500">No major irrigation sources detected in immediate vicinity.</p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
