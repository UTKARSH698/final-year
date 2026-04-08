
import React, { useEffect, useState, useCallback } from 'react';
import { CloudRain, Wind, Droplets, Sun, Calendar, MapPin, Cloud, CloudLightning, CloudSnow, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { UserLocation, WeatherData } from '../types';

interface WeatherSectionProps {
  userLocation: UserLocation | null;
  onWeatherDataFetch?: (data: WeatherData) => void;
}

const getWeatherCondition = (code: number) => {
  if (code === 0) return { label: 'Clear Sky', icon: Sun, color: 'text-yellow-400' };
  if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: Cloud, color: 'text-gray-300' };
  if (code >= 61 && code <= 67) return { label: 'Rain', icon: CloudRain, color: 'text-blue-500' };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: CloudLightning, color: 'text-purple-400' };
  return { label: 'Clear Sky', icon: Sun, color: 'text-yellow-400' };
};

export const WeatherSection: React.FC<WeatherSectionProps> = ({ userLocation, onWeatherDataFetch }) => {
  const [loading, setLoading] = useState(false);
  const [realWeather, setRealWeather] = useState<any>(null);
  const [error, setError] = useState(false);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(false);
    const lat = userLocation?.lat || 22.3072;
    const lng = userLocation?.lng || 73.1812;

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=relativehumidity_2m&daily=precipitation_probability_max&timezone=auto`
      );
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setRealWeather(data);

      if (onWeatherDataFetch) {
        onWeatherDataFetch({
          temp: data.current_weather.temperature,
          condition: getWeatherCondition(data.current_weather.weathercode).label,
          humidity: data.hourly.relativehumidity_2m[0],
          windSpeed: data.current_weather.windspeed,
          rainProbability: data.daily.precipitation_probability_max[0]
        });
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userLocation, onWeatherDataFetch]);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  const current = realWeather?.current_weather;
  const condition = error
    ? { label: 'Offline', icon: WifiOff, color: 'text-red-400' }
    : current
      ? getWeatherCondition(current.weathercode)
      : { label: 'Syncing...', icon: Loader2, color: 'text-white' };
  const TempIcon = condition.icon;

  return (
    <section id="weather-section" className="py-20 px-6 bg-ivory dark:bg-charcoal transition-colors duration-500 scroll-mt-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-md mb-4">
               <CloudRain className="w-3 h-3 text-blue-600 dark:text-blue-400" />
               <span className="text-[10px] font-jakarta tracking-widest text-blue-800 dark:text-blue-400 font-bold uppercase">Met-Station Sync</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-outfit font-bold text-gray-900 dark:text-white">Regional Intelligence</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="relative z-10 h-full flex flex-col justify-between">
               <div className="flex items-start justify-between mb-8">
                 <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20">
                   <TempIcon className={`w-10 h-10 ${condition.color} ${loading ? 'animate-spin' : 'animate-pulse-slow'}`} />
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="font-jakarta text-xs font-bold tracking-widest bg-emerald-500 px-3 py-1 rounded-full">MET_DATA_LIVE</span>
                    <span className="text-[10px] text-blue-200 mt-2 font-bold uppercase">{userLocation?.city || 'Default Location'}</span>
                 </div>
               </div>
               <div className="mb-2">
                 <span className="text-7xl font-outfit font-bold tracking-tighter">{current ? Math.round(current.temperature) : '--'}°</span>
                 <span className="text-2xl font-outfit text-blue-100 ml-1">C</span>
               </div>
               <div className="text-lg font-medium text-blue-100 mb-8">{condition.label}</div>
               {error ? (
                 <button onClick={fetchWeather} className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold transition-all mt-2">
                   <RefreshCw size={14} /> Retry Connection
                 </button>
               ) : (
                 <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
                    <div>
                      <div className="text-xs text-blue-200 mb-1 uppercase tracking-wider">Humidity</div>
                      <div className="text-xl font-bold font-outfit">{realWeather?.hourly?.relativehumidity_2m?.[0] || '--'}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-200 mb-1 uppercase tracking-wider">Wind</div>
                      <div className="text-xl font-bold font-outfit">{current ? current.windspeed : '--'} km/h</div>
                    </div>
                 </div>
               )}
             </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
             {[
               { icon: Droplets, label: 'Rain Risk', value: realWeather?.daily?.precipitation_probability_max?.[0] ? `${realWeather.daily.precipitation_probability_max[0]}%` : '0%', sub: 'Satellite Data', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/10' },
               { icon: Wind, label: 'Atm. Pressure', value: '1012 hPa', sub: 'Stable', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/10' },
               { icon: Sun, label: 'Photosynthesis', value: 'Optimum', sub: 'Light Saturation', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
             ].map((item, i) => (
               <div key={i} className={`rounded-3xl p-6 border border-black/5 dark:border-white/5 ${item.bg} flex flex-col justify-between hover:-translate-y-1 transition-all`}>
                  <div className={`w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-sm mb-4 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-outfit font-bold text-gray-900 dark:text-white mb-1">{item.value}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{item.label}</div>
                  </div>
               </div>
             ))}
             <div className="md:col-span-3 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-6 mt-2 flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                   <Calendar className="text-white w-6 h-6" />
                </div>
                <div>
                   <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Disease Vulnerability Check</h4>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Our AI correlates these metrics in real-time during crop analysis to predict pathogen surges.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};
