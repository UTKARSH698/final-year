
import React, { useState, useEffect } from 'react';
import { Plane, MapPin, Droplets, ArrowLeft, Navigation, ExternalLink, Radar, Search, Crosshair } from 'lucide-react';
import { getTerrainAnalysis, resolveLocation } from '../services/geminiService';
import { useAuth } from '../AuthContext';
import { DroneAnalysisResult, Coordinates } from '../types';

interface AgriDroneProps {
  onBack: () => void;
}

export const AgriDrone: React.FC<AgriDroneProps> = ({ onBack }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DroneAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('gps');
  const [manualQuery, setManualQuery] = useState('');
  const [resolving, setResolving] = useState(false);
  const [viewMode, setViewMode] = useState<'satellite' | 'thermal' | 'topographic'>('satellite');
  const { user } = useAuth();

  useEffect(() => {
    if (locationMode === 'gps') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            setError("Location access denied. Please enter location manually.");
            setLocationMode('manual');
          }
        );
      }
    }
  }, [locationMode]);

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
    setError(null);
    try {
      const data = await getTerrainAnalysis(coords);
      setResult(data);

      // Save to history if logged in
      console.log("[DRONE] User state:", user);
      if (user) {
        try {
          console.log("[DRONE] Attempting to save scan to history...");
          const saveRes = await fetch('/api/reports', {
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
          if (saveRes.ok) {
            console.log("[DRONE] Scan saved to history successfully");
          } else {
            const errData = await saveRes.json();
            console.error("[DRONE] Failed to save scan:", errData);
          }
        } catch (saveErr) {
          console.error("[DRONE] Error saving scan to history:", saveErr);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze terrain. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors group w-fit"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-jakarta font-bold text-xs tracking-widest uppercase">Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
            <Plane className="text-gold w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-outfit font-bold text-gray-900 dark:text-ivory">AgriDrone Terrain Analysis</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">Satellite-guided irrigation source detection</p>
          </div>
        </div>
      </div>

      {!result && !scanning ? (
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-sm">
              <h2 className="text-2xl font-outfit font-bold mb-4 text-gray-900 dark:text-white">Deploy AgriDrone V2</h2>
              
              {/* Location Mode Toggle */}
              <div className="flex p-1 bg-black/10 dark:bg-white/5 rounded-xl mb-8">
                <button 
                  onClick={() => setLocationMode('gps')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold tracking-widest transition-all ${locationMode === 'gps' ? 'bg-gold text-white shadow-lg' : 'text-gray-500 hover:text-gold'}`}
                >
                  <Crosshair size={14} />
                  GPS
                </button>
                <button 
                  onClick={() => setLocationMode('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold tracking-widest transition-all ${locationMode === 'manual' ? 'bg-gold text-white shadow-lg' : 'text-gray-500 hover:text-gold'}`}
                >
                  <Search size={14} />
                  MANUAL
                </button>
              </div>

              {locationMode === 'manual' ? (
                <form onSubmit={handleManualSearch} className="mb-8">
                  <label className="block text-[10px] font-bold text-gold uppercase tracking-[0.2em] mb-2">Farm Location</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      placeholder="Enter Village, District, or State..."
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                    />
                    <button 
                      type="submit"
                      disabled={resolving}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gold hover:bg-gold/10 rounded-lg transition-all"
                    >
                      {resolving ? <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin"></div> : <Search size={18} />}
                    </button>
                  </div>
                  {coords && !resolving && (
                    <p className="mt-2 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                      Target Locked: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </p>
                  )}
                </form>
              ) : (
                <div className="mb-8 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Crosshair className="text-emerald-500 w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Current GPS Status</span>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {coords ? `Coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Acquiring Signal...'}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-sm">
                AgriDrone uses satellite imagery to identify the most efficient water sources. 
                Analysis includes topography, distance, and historical water levels.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <Radar className="w-5 h-5 text-emerald-500 mb-2" />
                  <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Precision</span>
                  <span className="text-sm text-gray-500">98.4% Accuracy</span>
                </div>
                <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10">
                  <Navigation className="w-5 h-5 text-gold mb-2" />
                  <span className="block text-xs font-bold text-gold uppercase tracking-wider">Range</span>
                  <span className="text-sm text-gray-500">15km Radius</span>
                </div>
              </div>

              <button 
                onClick={handleScan}
                disabled={!coords || resolving}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold to-gold-dim text-white font-jakarta font-bold tracking-widest uppercase shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {coords ? 'Launch Drone Scan' : 'Waiting for Location...'}
              </button>
              {error && <p className="mt-4 text-red-500 text-sm text-center font-medium">{error}</p>}
            </div>
          </div>

          <div className="relative sticky top-24">
            <div className="aspect-square rounded-[40px] overflow-hidden border border-black/10 dark:border-white/10 shadow-2xl relative">
              <img 
                src={`https://picsum.photos/seed/${viewMode}/800/800${viewMode === 'thermal' ? '?grayscale' : viewMode === 'topographic' ? '?blur=2' : ''}`} 
                alt="Drone View" 
                className={`w-full h-full object-cover transition-all duration-1000 ${viewMode === 'thermal' ? 'sepia brightness-125 contrast-150' : viewMode === 'topographic' ? 'hue-rotate-90 saturate-200' : 'opacity-60'}`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent"></div>
              
              {/* View Mode Toggle Overlay */}
              <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
                {(['satellite', 'thermal', 'topographic'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-bold tracking-widest uppercase transition-all border ${
                      viewMode === mode 
                        ? 'bg-gold text-black border-gold shadow-lg' 
                        : 'bg-black/40 text-white/60 border-white/10 hover:bg-black/60'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Decorative HUD Elements */}
              <div className="absolute top-8 left-8 p-4 border-l-2 border-t-2 border-gold/50 w-24 h-24"></div>
              <div className="absolute bottom-8 right-8 p-4 border-r-2 border-b-2 border-gold/50 w-24 h-24"></div>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-48 h-48 border border-gold/30 rounded-full animate-ping"></div>
              </div>
              
              {/* Coordinate Overlay */}
              {coords && (
                <div className="absolute bottom-12 left-12 font-mono text-[10px] text-gold/80 space-y-1">
                  <p>LAT: {coords.lat.toFixed(6)}</p>
                  <p>LNG: {coords.lng.toFixed(6)}</p>
                  <p>ALT: 450m AGL</p>
                  <p>SAT: 12 LOCKED</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : scanning ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 border-4 border-gold/20 rounded-full"></div>
            <div className="absolute inset-0 border-t-4 border-gold rounded-full animate-spin"></div>
            <div className="absolute inset-8 border-2 border-emerald-500/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Radar className="w-12 h-12 text-gold animate-pulse" />
            </div>
            
            {/* Scanning Line */}
            <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-gold to-transparent origin-bottom animate-spin-slow"></div>
          </div>
          <h2 className="mt-12 text-2xl font-outfit font-bold text-gray-900 dark:text-white">Scanning Terrain...</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-inter">Analyzing satellite data for water signatures</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Terrain Intelligence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="p-6 rounded-[2rem] bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Droplets className="text-emerald-500 w-4 h-4" /></div>
                   <h4 className="text-sm font-outfit font-bold text-gray-900 dark:text-white">Soil Moisture</h4>
                </div>
                <div className="flex items-end gap-3 mb-2">
                   <div className="text-4xl font-outfit font-bold text-gray-900 dark:text-white">{result?.soilMoisture?.percentage}%</div>
                   <div className={`text-[10px] font-bold mb-1 px-2 py-0.5 rounded-md ${result?.soilMoisture?.status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {result?.soilMoisture?.status?.toUpperCase()}
                   </div>
                </div>
                <p className="text-xs text-gray-500 font-medium">{result?.soilMoisture?.level} hydration detected.</p>
             </div>

             <div className="p-6 rounded-[2rem] bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Radar className="text-blue-500 w-4 h-4" /></div>
                   <h4 className="text-sm font-outfit font-bold text-gray-900 dark:text-white">Topography</h4>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Slope</span>
                      <span className="text-gray-900 dark:text-white">{result?.topography?.slope}</span>
                   </div>
                   <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Elevation</span>
                      <span className="text-gray-900 dark:text-white">{result?.topography?.elevation}</span>
                   </div>
                   <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Drainage</span>
                      <span className="text-gray-900 dark:text-white">{result?.topography?.drainage}</span>
                   </div>
                </div>
             </div>

             <div className="p-6 rounded-[2rem] bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center"><Radar className="text-gold w-4 h-4" /></div>
                   <h4 className="text-sm font-outfit font-bold text-gray-900 dark:text-white">Vegetation Index</h4>
                </div>
                <div className="flex items-center gap-4 mb-2">
                   <div className="flex-1 h-2 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full" style={{ width: `${(result?.vegetationIndex?.score || 0.5) * 100}%` }}></div>
                   </div>
                   <div className="text-xl font-outfit font-bold text-gray-900 dark:text-white">{result?.vegetationIndex?.score}</div>
                </div>
                <p className="text-xs text-gray-500 font-medium">Health Status: <span className="text-emerald-500 font-bold">{result?.vegetationIndex?.health}</span></p>
             </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Summary Card */}
            <div className="lg:col-span-1 p-8 rounded-3xl bg-white/5 border border-black/5 dark:border-white/5 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6">
                <Droplets className="text-emerald-500 w-6 h-6" />
                <h3 className="text-xl font-outfit font-bold text-gray-900 dark:text-white">Water Analysis</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                {result?.summary}
              </p>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Recommendation</span>
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {result?.recommendation}
                </p>
              </div>
              
              <button 
                onClick={() => setResult(null)}
                className="w-full mt-8 py-3 rounded-xl border border-gold/20 text-gold font-jakarta font-bold text-xs tracking-widest uppercase hover:bg-gold/5 transition-colors"
              >
                New Scan
              </button>
            </div>

            {/* Sources List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-outfit font-bold text-gray-900 dark:text-white">
                  {result?.sources.some(s => s.name.includes('Regional')) ? 'AI-Guided Regional Strategy' : 'Detected Irrigation Sources'}
                </h3>
                {result?.sources.some(s => s.name.includes('Regional')) && (
                  <span className="text-[10px] font-bold text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20 animate-pulse">
                    SMART FALLBACK ACTIVE
                  </span>
                )}
              </div>
              
              {result?.sources.map((source, idx) => (
                <div 
                  key={idx}
                  className={`group p-6 rounded-2xl border transition-all flex items-center justify-between ${
                    source.name.includes('Regional') 
                      ? 'bg-gold/5 border-gold/20' 
                      : 'bg-white/5 border-black/5 dark:border-white/5 hover:border-gold/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="text-gold w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-outfit font-bold text-gray-900 dark:text-white">{source.name}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{source.type}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                        <span className="text-xs text-emerald-500 font-bold uppercase tracking-tighter">{source.distance}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                        <div className="px-2 py-0.5 rounded-md bg-gold/10 border border-gold/20">
                          <span className="text-[10px] font-bold text-gold uppercase">Est. Cost: {source.costEstimate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <a 
                    href={source.mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-black/5 dark:bg-white/5 text-gray-400 hover:text-gold hover:bg-gold/10 transition-all"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              ))}
              
              {result?.sources.length === 0 && (
                <div className="p-12 text-center rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
                  <p className="text-gray-500">No major irrigation sources detected in immediate vicinity.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
