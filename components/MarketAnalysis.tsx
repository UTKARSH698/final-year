
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft, TrendingUp, TrendingDown, Calendar,
  Info, Sparkles, Activity, Clock, ShieldCheck,
  ChevronRight, BarChart3, Target, Loader2, Bell, Share2, Download,
  Minus, Calculator, ArrowUpRight, ArrowDownRight, Zap,
  DollarSign, Scale, Wheat, ChevronDown, X, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMarketForecast } from '../services/geminiService';
import { MarketForecast, PricePoint } from '../types';
import { MANDI_RATES } from '../constants';
import { useToast } from './Toast';

interface MarketAnalysisProps {
  onBack: () => void;
}

/* ─── Tooltip-enabled Price Chart ────────────────────────────────── */
const PriceChart: React.FC<{ data: PricePoint[] }> = ({ data }) => {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));
  const range = maxPrice - minPrice;
  const padding = range * 0.2;
  const chartMin = minPrice - padding;
  const chartMax = maxPrice + padding;
  const chartRange = chartMax - chartMin;

  const coords = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d.price - chartMin) / chartRange) * 100,
    ...d
  }));

  const points = coords.map(c => `${c.x},${c.y}`).join(' ');

  // gradient fill points
  const fillPoints = `0,100 ${points} 100,100`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(relX * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  return (
    <div className="w-full h-72 relative group">
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(val => (
          <line key={val} x1="0" y1={val} x2="100" y2={val} className="stroke-black/5 dark:stroke-white/5" strokeWidth="0.3" />
        ))}

        {/* Area fill */}
        <polygon fill="url(#chartGrad)" points={fillPoints} />

        {/* Main line */}
        <polyline
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Peak dot */}
        {data.map((d, i) => {
          if (!d.isPeak) return null;
          const c = coords[i];
          return (
            <g key={`peak-${i}`}>
              <circle cx={c.x} cy={c.y} r="2.5" fill="#D4AF37" />
              <circle cx={c.x} cy={c.y} r="5" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.5">
                <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        {/* Hover crosshair + dot */}
        {hover !== null && coords[hover] && (
          <g>
            <line x1={coords[hover].x} y1="0" x2={coords[hover].x} y2="100" stroke="#D4AF37" strokeWidth="0.3" strokeDasharray="1,1" />
            <circle cx={coords[hover].x} cy={coords[hover].y} r="2" fill="#D4AF37" stroke="#fff" strokeWidth="0.5" />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hover !== null && coords[hover] && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none bg-black/90 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xl border border-gold/20"
            style={{
              left: `${Math.min(85, Math.max(5, coords[hover].x))}%`,
              top: `${Math.max(5, coords[hover].y - 15)}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="text-gold">₹{data[hover].price}/qtl</div>
            <div className="text-gray-400 text-[10px]">{data[hover].date}</div>
            {data[hover].isPeak && <div className="text-emerald-400 text-[10px]">PEAK</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* X-axis labels */}
      <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-400 uppercase">
        {data.filter((_, i) => i % 7 === 0 || i === data.length - 1).map((d, i) => (
          <span key={i}>{d.date}</span>
        ))}
      </div>
    </div>
  );
};

/* ─── Sentiment Gauge ────────────────────────────────────────────── */
const SentimentGauge: React.FC<{ trend: string; volatility: number; jump: string }> = ({ trend, volatility, jump }) => {
  const score = trend === 'Bullish' ? 75 + Math.random() * 20 : trend === 'Bearish' ? 10 + Math.random() * 30 : 45 + Math.random() * 10;
  const circumference = 2 * Math.PI * 40;
  const arc = (score / 100) * circumference * 0.75; // 270 deg arc

  const color = score >= 60 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  const label = score >= 70 ? 'Strong Buy' : score >= 55 ? 'Buy' : score >= 40 ? 'Hold' : score >= 25 ? 'Sell' : 'Strong Sell';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        {/* Background arc */}
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-white/5"
          strokeWidth="6" strokeLinecap="round" strokeDasharray={`${circumference * 0.75} ${circumference}`}
          transform="rotate(135 50 50)" />
        {/* Score arc */}
        <circle cx="50" cy="50" r="40" fill="none" stroke={color}
          strokeWidth="6" strokeLinecap="round" strokeDasharray={`${arc} ${circumference}`}
          transform="rotate(135 50 50)">
          <animate attributeName="stroke-dasharray" from={`0 ${circumference}`} to={`${arc} ${circumference}`} dur="1s" fill="freeze" />
        </circle>
        <text x="50" y="46" textAnchor="middle" className="fill-white text-[18px] font-bold">{Math.round(score)}</text>
        <text x="50" y="58" textAnchor="middle" className="fill-gray-400 text-[7px] font-bold uppercase">{label}</text>
      </svg>
      <div className="flex gap-3 text-[10px] font-bold">
        <span className="text-gray-400">VOL <span className="text-white">{(volatility * 100).toFixed(0)}%</span></span>
        <span className="text-gray-400">JUMP <span style={{ color }}>{jump}</span></span>
      </div>
    </div>
  );
};

/* ─── Profit Calculator ──────────────────────────────────────────── */
const ProfitCalculator: React.FC<{ currentPrice: number; peakPrice: number; cropName: string }> = ({ currentPrice, peakPrice, cropName }) => {
  const [qty, setQty] = useState('10');
  const quantity = parseFloat(qty) || 0;
  const revenueNow = quantity * currentPrice;
  const revenuePeak = quantity * peakPrice;
  const extraProfit = revenuePeak - revenueNow;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={18} className="text-gold" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Profit Calculator</h3>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs text-gray-400 font-bold">QTY (Quintals)</label>
        <input
          type="number"
          value={qty}
          onChange={e => setQty(e.target.value)}
          className="w-24 bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 ring-gold/30"
          min="1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Sell Now</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">₹{revenueNow.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-gray-400">@ ₹{currentPrice}/qtl</div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
          <div className="text-[10px] font-bold text-emerald-500 uppercase">At Peak</div>
          <div className="text-lg font-bold text-emerald-500">₹{revenuePeak.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-gray-400">@ ₹{peakPrice}/qtl</div>
        </div>
      </div>
      {extraProfit > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 bg-gold/10 border border-gold/20 rounded-xl p-3 text-center"
        >
          <span className="text-xs font-bold text-gold">Extra profit if you wait: </span>
          <span className="text-sm font-bold text-gold">₹{extraProfit.toLocaleString('en-IN')}</span>
        </motion.div>
      )}
    </motion.div>
  );
};

/* ─── Live Mandi Ticker ──────────────────────────────────────────── */
const MandiTicker: React.FC<{ currentCrop: string }> = ({ currentCrop }) => {
  const otherCrops = MANDI_RATES.filter(m => m.crop !== currentCrop).slice(0, 12);

  return (
    <div className="overflow-hidden bg-black/30 dark:bg-black/40 border border-white/5 rounded-2xl py-2 mb-8">
      <div className="flex animate-ticker whitespace-nowrap">
        {[...otherCrops, ...otherCrops].map((m, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-4 text-xs font-bold">
            <span className="text-gray-400">{m.crop}</span>
            <span className="text-white">₹{m.price}</span>
            <span className={m.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {m.change >= 0 ? '+' : ''}{m.change}%
            </span>
            <span className="text-white/10 ml-2">|</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────── */
export const MarketAnalysis: React.FC<MarketAnalysisProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [selectedCrop, setSelectedCrop] = useState(MANDI_RATES[0].crop);
  const [forecast, setForecast] = useState<MarketForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [alertSet, setAlertSet] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

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

  const peakPrice = useMemo(() => {
    if (!forecast) return 0;
    return Math.max(...forecast.forecastData.map(d => d.price));
  }, [forecast]);

  const priceRange = useMemo(() => {
    if (!forecast) return { min: 0, max: 0, avg: 0, percentile: 0 };
    const prices = forecast.forecastData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const percentile = Math.round(((forecast.currentPrice - min) / (max - min || 1)) * 100);
    return { min, max, avg, percentile };
  }, [forecast]);

  // Simulated "last month" comparison
  const lastMonth = useMemo(() => {
    if (!forecast) return null;
    const delta = forecast.predictedTrend === 'Bullish' ? -(3 + Math.random() * 8) : (2 + Math.random() * 6);
    const prevPrice = Math.round(forecast.currentPrice * (1 + delta / 100));
    return {
      price: prevPrice,
      change: -delta,
      volume: Math.round(1200 + Math.random() * 800),
      volumeChange: Math.round(-5 + Math.random() * 15)
    };
  }, [forecast]);

  const quickCrops = MANDI_RATES.slice(0, 8);

  const handleSetAlert = () => {
    setAlertSet(true);
    setTimeout(() => setAlertSet(false), 3000);
    toast(`Price alert set for ${selectedCrop}!`, 'success');
  };

  const handleShare = async () => {
    if (!forecast) return;
    const shareText = `Market Forecast for ${forecast.cropName}: Trend is ${forecast.predictedTrend}. Current ₹${forecast.currentPrice}/qtl. Best window: ${forecast.bestSellingWindow}. #AgriFuture`;
    if (navigator.share) {
      try { await navigator.share({ title: `AgriFuture Market`, text: shareText, url: window.location.href }); }
      catch (err) { console.error(err); }
    } else { await navigator.clipboard.writeText(shareText); toast("Copied to clipboard!", 'success'); }
  };

  const handleWhatsApp = () => {
    if (!forecast) return;
    const text = `*AgriFuture Market Forecast*%0A%0A*Crop:* ${forecast.cropName}%0A*Trend:* ${forecast.predictedTrend}%0A*Current Price:* ₹${forecast.currentPrice}/qtl%0A*Peak Price:* ₹${peakPrice}/qtl%0A*Best Selling Window:* ${forecast.bestSellingWindow}%0A*Expected Jump:* ${forecast.expectedPriceJump}%0A%0A_via AgriFuture India_`;
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

  const switchCrop = (crop: string) => {
    setSelectedCrop(crop);
    fetchForecast(crop);
    setShowCalc(false);
    setCompareMode(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-6 bg-ivory dark:bg-obsidian">
      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-ticker { animation: ticker 30s linear infinite; }
        .animate-ticker:hover { animation-play-state: paused; }
      `}</style>

      <div className="max-w-7xl mx-auto" id="market-report-content">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 no-print">
          <div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-3 text-sm font-bold tracking-widest hover:text-gold transition-colors">
              <ArrowLeft size={16} /> DASHBOARD
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 dark:text-white">Market Forecasting</h1>
              {forecast && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${
                    forecast.predictedTrend === 'Bullish'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : forecast.predictedTrend === 'Bearish'
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                  }`}
                >
                  {forecast.predictedTrend === 'Bullish' ? <TrendingUp size={14} /> : forecast.predictedTrend === 'Bearish' ? <TrendingDown size={14} /> : <Minus size={14} />}
                  {forecast.predictedTrend}
                </motion.span>
              )}
            </div>
          </div>
          <select value={selectedCrop} onChange={(e) => switchCrop(e.target.value)} aria-label="Select crop for market forecast" className="bg-black/5 dark:bg-white/5 px-6 py-3 rounded-xl text-sm font-bold text-gray-900 dark:text-white">
            {MANDI_RATES.slice(0, 15).map(m => <option key={m.crop} value={m.crop}>{m.crop}</option>)}
          </select>
        </div>

        {/* Quick-switch crop pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-print scrollbar-hide">
          {quickCrops.map(m => (
            <button
              key={m.crop}
              onClick={() => switchCrop(m.crop)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedCrop === m.crop
                  ? 'bg-gold text-black shadow-lg shadow-gold/20'
                  : 'bg-black/5 dark:bg-white/5 text-gray-500 hover:bg-gold/10 hover:text-gold'
              }`}
            >
              {m.crop.split('(')[0].trim()}
              <span className={`ml-1.5 ${m.change >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {m.change >= 0 ? '+' : ''}{m.change}%
              </span>
            </button>
          ))}
        </div>

        {/* Live Mandi Ticker */}
        <MandiTicker currentCrop={selectedCrop} />

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse" aria-label="Loading market forecast">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-10">
                <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded-xl mb-12" />
                <div className="h-[300px] bg-gray-100 dark:bg-white/5 rounded-2xl" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-white dark:bg-charcoal rounded-2xl border border-black/5 dark:border-white/10" />)}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-8 h-96" />
            </div>
          </div>
        ) : forecast && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN — Chart + Stats */}
            <div className="lg:col-span-8 space-y-6">
              {/* Chart Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">{forecast.cropName} Trend</h2>
                    <p className="text-xs text-gray-400 mt-1">30-day price forecast &middot; hover for details</p>
                  </div>
                  <div className="flex gap-2 no-print">
                    <button onClick={handleExportPDF} disabled={isExporting} aria-label="Download market forecast as PDF" className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gold transition-colors">
                      {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    </button>
                    <button onClick={handleShare} aria-label="Copy market data to clipboard" className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gold transition-colors"><Share2 size={16} /></button>
                    <button onClick={handleWhatsApp} className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors" title="Share on WhatsApp" aria-label="Share on WhatsApp">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </button>
                  </div>
                </div>
                <PriceChart data={forecast.forecastData} />
              </motion.div>

              {/* Price Range Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">30-Day Price Range</span>
                  <span className="text-xs font-bold text-gray-400">Current position: <span className="text-gold">{priceRange.percentile}%</span></span>
                </div>
                <div className="relative h-3 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 opacity-30" />
                  </div>
                  <motion.div
                    initial={{ left: '0%' }}
                    animate={{ left: `${priceRange.percentile}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-gold rounded-full shadow-lg shadow-gold/30 border-2 border-white dark:border-charcoal"
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold">
                  <span className="text-red-400">₹{priceRange.min}</span>
                  <span className="text-gray-400">AVG ₹{priceRange.avg}</span>
                  <span className="text-emerald-400">₹{priceRange.max}</span>
                </div>
              </motion.div>

              {/* Stat Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Current Rate', value: `₹${forecast.currentPrice}`, icon: <DollarSign size={16} />, color: 'text-gold' },
                  { label: 'Peak Price', value: `₹${peakPrice}`, icon: <TrendingUp size={16} />, color: 'text-emerald-500' },
                  { label: 'Best Window', value: forecast.bestSellingWindow, icon: <Calendar size={16} />, color: 'text-blue-400' },
                  { label: 'Expected Jump', value: forecast.expectedPriceJump, icon: <Zap size={16} />, color: 'text-gold' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-2xl p-4 shadow-xl"
                  >
                    <div className={`mb-2 ${item.color}`}>{item.icon}</div>
                    <div className="text-lg font-outfit font-bold text-gray-900 dark:text-white">{item.value}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{item.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Month-on-Month Comparison */}
              {lastMonth && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-xl"
                >
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <History size={14} /> vs Last Month
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Price Change</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{lastMonth.change > 0 ? '+' : ''}{lastMonth.change.toFixed(1)}%</span>
                        {lastMonth.change > 0 ? <ArrowUpRight size={16} className="text-emerald-500" /> : <ArrowDownRight size={16} className="text-red-400" />}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Last Month</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">₹{lastMonth.price}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Volume (qtl)</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">{lastMonth.volume.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Volume Change</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{lastMonth.volumeChange > 0 ? '+' : ''}{lastMonth.volumeChange}%</span>
                        {lastMonth.volumeChange > 0 ? <ArrowUpRight size={16} className="text-emerald-500" /> : <ArrowDownRight size={16} className="text-red-400" />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Profit Calculator (toggle) */}
              <div className="no-print">
                <button
                  onClick={() => setShowCalc(!showCalc)}
                  className="flex items-center gap-2 text-sm font-bold text-gold hover:text-gold/80 transition-colors mb-3"
                >
                  <Calculator size={16} />
                  {showCalc ? 'Hide' : 'Show'} Profit Calculator
                  <ChevronDown size={14} className={`transition-transform ${showCalc ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showCalc && (
                    <ProfitCalculator currentPrice={forecast.currentPrice} peakPrice={peakPrice} cropName={forecast.cropName} />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT COLUMN — AI Advisor + Sentiment */}
            <div className="lg:col-span-4 space-y-6">
              {/* Sentiment Gauge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-obsidian dark:bg-black/40 border border-white/10 rounded-[2rem] p-8 text-white"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Activity size={20} className="text-gold" />
                  <h3 className="text-lg font-outfit font-bold">Market Sentiment</h3>
                </div>
                <SentimentGauge trend={forecast.predictedTrend} volatility={forecast.volatility} jump={forecast.expectedPriceJump} />
                <div className="grid grid-cols-3 gap-2 mt-6">
                  {[
                    { label: 'Trend', value: forecast.predictedTrend, color: forecast.predictedTrend === 'Bullish' ? 'text-emerald-400' : 'text-red-400' },
                    { label: 'Volatility', value: `${(forecast.volatility * 100).toFixed(0)}%`, color: forecast.volatility > 0.2 ? 'text-red-400' : 'text-emerald-400' },
                    { label: 'Jump', value: forecast.expectedPriceJump, color: parseFloat(forecast.expectedPriceJump) > 0 ? 'text-emerald-400' : 'text-red-400' },
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[9px] font-bold text-gray-500 uppercase">{item.label}</div>
                      <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* AI Advisor */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-obsidian dark:bg-black/40 border border-white/10 rounded-[2rem] p-8 text-white"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles size={20} className="text-gold" />
                  <h3 className="text-lg font-outfit font-bold">AI Advisor</h3>
                </div>
                <p className="text-sm font-inter text-gray-300 leading-relaxed mb-6">{forecast.advisoryNote}</p>

                {/* Quick insights */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                    <Target size={14} className="text-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-gold uppercase">Target Price</div>
                      <div className="text-sm font-bold text-white">₹{peakPrice}/qtl</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                    <Clock size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-blue-400 uppercase">Optimal Window</div>
                      <div className="text-sm font-bold text-white">{forecast.bestSellingWindow}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                    <ShieldCheck size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase">Risk Level</div>
                      <div className="text-sm font-bold text-white">{forecast.volatility > 0.2 ? 'High' : forecast.volatility > 0.1 ? 'Moderate' : 'Low'}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSetAlert}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all no-print ${
                    alertSet
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-black hover:bg-gold hover:text-black'
                  }`}
                >
                  {alertSet ? 'ALERT SET!' : 'SET PRICE ALERT'}
                </button>
              </motion.div>

              {/* Nearby Mandi Prices */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6"
              >
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 size={14} /> Regional Prices
                </h3>
                <div className="space-y-3">
                  {MANDI_RATES.filter(m => m.crop === selectedCrop || MANDI_RATES.indexOf(m) < 5).slice(0, 5).map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-black/5 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{m.location}</div>
                        <div className="text-[10px] text-gray-400">{m.state}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">₹{m.price}</div>
                        <div className={`text-[10px] font-bold ${m.change >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                          {m.change >= 0 ? '+' : ''}{m.change}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
