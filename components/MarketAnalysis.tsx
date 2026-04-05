
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, TrendingUp, TrendingDown, Calendar, 
  Info, Sparkles, Activity, Clock, ShieldCheck, 
  ChevronRight, BarChart3, Target, Loader2, Bell, Share2, Download
} from 'lucide-react';
import { getMarketForecast } from '../services/geminiService';
import { MarketForecast, PricePoint } from '../types';
import { MANDI_RATES } from '../constants';
import { useToast } from './Toast';

interface MarketAnalysisProps {
  onBack: () => void;
}

const PriceChart: React.FC<{ data: PricePoint[] }> = ({ data }) => {
  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));
  const range = maxPrice - minPrice;
  const padding = range * 0.2;

  const chartMin = minPrice - padding;
  const chartMax = maxPrice + padding;
  const chartRange = chartMax - chartMin;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.price - chartMin) / chartRange) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-64 relative group">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        {[0, 25, 50, 75, 100].map(val => (
          <line key={val} x1="0" y1={val} x2="100" y2={val} className="stroke-black/5 dark:stroke-white/5" strokeWidth="0.5" />
        ))}
        <polyline
          fill="none"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {data.map((d, i) => {
          if (i % 5 !== 0 && !d.isPeak) return null;
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d.price - chartMin) / chartRange) * 100;
          return <circle key={i} cx={x} cy={y} r={d.isPeak ? "2" : "1"} fill="#D4AF37" />;
        })}
      </svg>
      <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase">
         <span>Day 1</span>
         <span>Day 30</span>
      </div>
    </div>
  );
};

export const MarketAnalysis: React.FC<MarketAnalysisProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [selectedCrop, setSelectedCrop] = useState(MANDI_RATES[0].crop);
  const [forecast, setForecast] = useState<MarketForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [alertSet, setAlertSet] = useState(false);

  const fetchForecast = async (crop: string) => {
    setLoading(true);
    try {
      const data = await getMarketForecast(crop);
      setForecast(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(selectedCrop);
  }, []);

  const handleSetAlert = () => {
    setAlertSet(true);
    setTimeout(() => setAlertSet(false), 3000);
    toast(`Price alert set for ${selectedCrop}!`, 'success');
  };

  const handleShare = async () => {
    if (!forecast) return;
    const shareText = `Market Forecast for ${forecast.cropName}: Trend is ${forecast.predictedTrend}. #AgriFuture`;
    if (navigator.share) {
      try { await navigator.share({ title: `AgriFuture Market`, text: shareText, url: window.location.href }); }
      catch (err) { console.error(err); }
    } else { await navigator.clipboard.writeText(shareText); toast("Copied to clipboard!", 'success'); }
  };

  const handleWhatsApp = () => {
    if (!forecast) return;
    const text = `*AgriFuture Market Forecast*%0A%0A*Crop:* ${forecast.cropName}%0A*Trend:* ${forecast.predictedTrend}%0A*Current Price:* ₹${forecast.currentPrice}/qtl%0A*Best Selling Window:* ${forecast.bestSellingWindow}%0A%0A_via AgriFuture India_`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleExportPDF = async () => {
    if (!forecast) return;
    setIsExporting(true);
    const element = document.getElementById('market-report-content');
    if (!element) return;

    element.classList.add('pdf-export-mode');

    const opt = {
      margin: 0.2,
      filename: `AgriFuture_Market_${forecast.cropName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      await new Promise(r => setTimeout(r, 300));
      await (window as any).html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Export failed", err);
      window.print();
    } finally {
      element.classList.remove('pdf-export-mode');
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 bg-ivory dark:bg-obsidian">
      <div className="max-w-6xl mx-auto p-4 rounded-[3rem]" id="market-report-content">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 no-print">
          <div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-4 text-sm font-bold tracking-widest">
              <ArrowLeft size={16} /> DASHBOARD
            </button>
            <h1 className="text-5xl font-outfit font-bold text-gray-900 dark:text-white">Market Forecasting</h1>
          </div>
          <select value={selectedCrop} onChange={(e) => { setSelectedCrop(e.target.value); fetchForecast(e.target.value); }} aria-label="Select crop for market forecast" className="bg-black/5 dark:bg-white/5 px-6 py-3 rounded-xl text-sm font-bold">
            {MANDI_RATES.slice(0, 10).map(m => <option key={m.crop} value={m.crop}>{m.crop}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse" aria-label="Loading market forecast">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[3rem] p-10">
                <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded-xl mb-12" />
                <div className="h-[300px] bg-gray-100 dark:bg-white/5 rounded-2xl" />
              </div>
              <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[3rem] p-10">
                <div className="h-6 w-36 bg-gray-200 dark:bg-white/10 rounded-xl mb-6" />
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-xl" />)}
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[3rem] p-8">
                <div className="h-6 w-32 bg-gray-200 dark:bg-white/10 rounded-xl mb-6" />
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-white/5 rounded-xl" />)}
                </div>
              </div>
            </div>
          </div>
        ) : forecast && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-8 space-y-8">
                <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                   <div className="flex justify-between items-start mb-12">
                      <h2 className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">{forecast.cropName} Trend</h2>
                      <div className="flex gap-3 no-print">
                         <button onClick={handleExportPDF} disabled={isExporting} aria-label="Download market forecast as PDF" className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gold transition-colors">
                            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                         </button>
                         <button onClick={handleShare} aria-label="Copy market data to clipboard" className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gold transition-colors"><Share2 size={18} /></button>
                         <button onClick={handleWhatsApp} className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors" title="Share on WhatsApp" aria-label="Share market forecast on WhatsApp">
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                         </button>
                      </div>
                   </div>
                   <PriceChart data={forecast.forecastData} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[{ label: 'Rate', value: `₹${forecast.currentPrice}` }, { label: 'Best Window', value: forecast.bestSellingWindow }, { label: 'Volatility', value: `${(forecast.volatility * 100).toFixed(1)}%` }].map((item, i) => (
                      <div key={i} className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                         <div className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">{item.value}</div>
                         <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">{item.label}</div>
                      </div>
                   ))}
                </div>
             </div>
             <div className="lg:col-span-4">
                <div className="bg-obsidian dark:bg-black/40 border border-white/10 rounded-[3rem] p-10 text-white h-full flex flex-col">
                   <div className="flex items-center gap-3 mb-8"><Sparkles size={24} className="text-gold" /><h3 className="text-xl font-outfit font-bold">AI Advisor</h3></div>
                   <p className="text-sm font-inter text-gray-300 leading-relaxed mb-12">{forecast.advisoryNote}</p>
                   <button onClick={handleSetAlert} className="w-full py-5 rounded-2xl bg-white text-black font-bold no-print">SET PRICE ALERT</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
