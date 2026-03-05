
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, Loader2, Building2, IndianRupee,
  CheckCircle2, ChevronDown, ChevronUp, Sparkles, FileText
} from 'lucide-react';
import { getGovernmentSchemes } from '../services/geminiService';
import { GovernmentScheme } from '../types';
import { MANDI_RATES } from '../constants';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal'
];

const CROPS = [...new Set(MANDI_RATES.map(r => r.crop.split(' ')[0]))];

interface SchemeFinderProps {
  onBack: () => void;
}

export const SchemesFinder: React.FC<SchemeFinderProps> = ({ onBack }) => {
  const [state, setState] = useState('');
  const [crop, setCrop] = useState('');
  const [landSize, setLandSize] = useState(2);
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!state || !crop) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await getGovernmentSchemes(state, crop, landSize);
      setSchemes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 bg-ivory dark:bg-obsidian">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-4 text-sm font-bold tracking-widest hover:text-gold transition-colors">
            <ArrowLeft size={16} /> DASHBOARD
          </button>
          <h1 className="text-5xl font-outfit font-bold text-gray-900 dark:text-white mb-2">Govt. Scheme Finder</h1>
          <p className="text-gray-500 font-medium">Discover PM-KISAN, PMFBY, KCC and all eligible schemes for your farm.</p>
        </div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2.5rem] p-8 mb-8 shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your State</label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-sm font-bold text-gray-900 dark:text-white"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Primary Crop</label>
              <input
                type="text"
                value={crop}
                onChange={e => setCrop(e.target.value)}
                placeholder="e.g. Wheat, Rice, Cotton"
                className="w-full h-14 px-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-sm font-bold text-gray-900 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Land Size: {landSize} acres</label>
              <input
                type="range"
                min={0.5} max={50} step={0.5}
                value={landSize}
                onChange={e => setLandSize(Number(e.target.value))}
                className="w-full h-14 accent-gold"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={!state || !crop || loading}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-charcoal dark:bg-gold text-white dark:text-black font-bold tracking-widest uppercase hover:scale-105 transition-all disabled:opacity-50 shadow-xl"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            Find My Schemes
          </button>
        </motion.div>

        {/* Results */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-16 h-16">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} className="absolute inset-0 border-t-2 border-gold rounded-full" />
            </div>
            <p className="text-gray-500 font-bold">AI is matching schemes for your farm...</p>
          </div>
        )}

        {!loading && searched && schemes.length === 0 && (
          <div className="text-center py-12 text-gray-400 font-bold">No schemes found. Try again.</div>
        )}

        {!loading && schemes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles size={20} className="text-gold" />
              <span className="font-outfit font-bold text-xl text-gray-900 dark:text-white">{schemes.length} Schemes Found for {state}</span>
            </div>
            {schemes.map((scheme, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-lg"
              >
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="font-outfit font-bold text-gray-900 dark:text-white text-lg">{scheme.name}</div>
                      <div className="text-xs text-gray-500 font-medium">{scheme.ministry}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <div className="text-xs font-bold text-emerald-500 flex items-center gap-1"><IndianRupee size={12} />{scheme.amount}</div>
                    </div>
                    {expanded === i ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                  </div>
                </button>

                {expanded === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-black/5 dark:border-white/5"
                  >
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Benefit</div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{scheme.benefit}</p>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Eligibility</div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{scheme.eligibility}</p>
                      </div>
                      <div className="md:col-span-2 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">
                          <CheckCircle2 size={12} /> How to Apply
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{scheme.howToApply}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {!searched && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            {['PM-KISAN: ₹6,000/year income support', 'PMFBY: Crop insurance at 2% premium', 'KCC: Low-interest farming credit'].map((tip, i) => (
              <div key={i} className="p-6 rounded-[2rem] bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
                  <Building2 size={20} />
                </div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
