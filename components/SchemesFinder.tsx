
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Loader2, Building2, IndianRupee,
  CheckCircle2, ChevronDown, ChevronUp, Sparkles, FileText,
  Bookmark, BookmarkCheck, Scale, X, TrendingUp, Clock,
  Star, Filter, Tag, Calculator, Shield, Sprout, Droplets,
  Banknote, Heart, Tractor, Award, BarChart3, ExternalLink,
  Share2, Copy, Check, Zap, ArrowRight
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

const CATEGORIES = [
  { id: 'all', label: 'All Schemes', icon: Sparkles, color: 'text-gold' },
  { id: 'income', label: 'Income Support', icon: Banknote, color: 'text-emerald-500' },
  { id: 'insurance', label: 'Insurance', icon: Shield, color: 'text-blue-500' },
  { id: 'credit', label: 'Credit & Loans', icon: TrendingUp, color: 'text-purple-500' },
  { id: 'subsidy', label: 'Subsidies', icon: Tag, color: 'text-orange-500' },
  { id: 'irrigation', label: 'Irrigation', icon: Droplets, color: 'text-cyan-500' },
  { id: 'equipment', label: 'Equipment', icon: Tractor, color: 'text-rose-500' },
];

const POPULAR_SCHEMES = [
  { name: 'PM-KISAN', amount: '₹6,000/yr', desc: 'Direct income support to farmers', category: 'income' },
  { name: 'PMFBY', amount: '2% premium', desc: 'Crop insurance against natural calamities', category: 'insurance' },
  { name: 'KCC', amount: '₹3L limit', desc: 'Low-interest credit card for farming', category: 'credit' },
  { name: 'PM-KUSUM', amount: '60% subsidy', desc: 'Solar pump & grid-connected energy', category: 'subsidy' },
  { name: 'SMAM', amount: '50-80%', desc: 'Farm mechanization subsidy', category: 'equipment' },
  { name: 'PMKSY', amount: 'Varies', desc: 'Micro-irrigation & water harvesting', category: 'irrigation' },
  { name: 'Soil Health Card', amount: 'Free', desc: 'Soil testing & nutrient recommendations', category: 'subsidy' },
  { name: 'eNAM', amount: 'Free', desc: 'Online trading on national agri market', category: 'income' },
];

function categorizeScheme(scheme: GovernmentScheme): string {
  const text = `${scheme.name} ${scheme.benefit} ${scheme.ministry}`.toLowerCase();
  if (text.includes('insurance') || text.includes('pmfby') || text.includes('fasal bima')) return 'insurance';
  if (text.includes('credit') || text.includes('loan') || text.includes('kcc') || text.includes('kisan credit')) return 'credit';
  if (text.includes('subsid') || text.includes('soil') || text.includes('nutrient') || text.includes('fertiliz')) return 'subsidy';
  if (text.includes('irrigat') || text.includes('water') || text.includes('drip') || text.includes('pmksy')) return 'irrigation';
  if (text.includes('equipment') || text.includes('mechani') || text.includes('tractor') || text.includes('smam')) return 'equipment';
  if (text.includes('income') || text.includes('pm-kisan') || text.includes('kisan samman') || text.includes('support')) return 'income';
  return 'subsidy';
}

function calcEligibilityScore(scheme: GovernmentScheme, landSize: number): number {
  let score = 70; // base
  const eligText = scheme.eligibility.toLowerCase();
  const benefitText = scheme.benefit.toLowerCase();

  if (eligText.includes('all farmer') || eligText.includes('all land')) score += 15;
  if (landSize <= 2 && (eligText.includes('small') || eligText.includes('marginal'))) score += 15;
  if (landSize <= 5 && eligText.includes('small and marginal')) score += 10;
  if (landSize > 5 && eligText.includes('large')) score += 10;
  if (benefitText.includes('direct') || benefitText.includes('cash')) score += 5;
  if (eligText.includes('no restriction') || eligText.includes('no limit')) score += 10;

  return Math.min(score, 98);
}

function parseAmount(amount: string): number {
  if (!amount) return 0;
  const text = amount.replace(/,/g, '').toLowerCase();
  const match = text.match(/[\d.]+/);
  if (!match) return 0;
  const num = parseFloat(match[0]);
  if (isNaN(num)) return 0;
  if (text.includes('lakh') || text.includes('lac')) return num * 100000;
  if (text.includes('crore')) return num * 10000000;
  if (text.includes('k')) return num * 1000;
  return num;
}

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
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState('all');
  const [compareList, setCompareList] = useState<number[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Array<{ state: string; crop: string; count: number }>>([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'amount'>('relevance');
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!state || !crop) return;
    setLoading(true);
    setSearched(true);
    setActiveCategory('all');
    setShowBookmarksOnly(false);
    setBookmarked(new Set());
    setCompareList([]);
    try {
      const data = await getGovernmentSchemes(state, crop, landSize);
      setSchemes(data);
      setSearchHistory(prev => {
        const exists = prev.find(h => h.state === state && h.crop === crop);
        if (exists) return prev.map(h => h === exists ? { ...h, count: h.count + 1 } : h);
        return [{ state, crop, count: 1 }, ...prev].slice(0, 5);
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (idx: number) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      const wasBookmarked = next.has(idx);
      wasBookmarked ? next.delete(idx) : next.add(idx);
      const schemeName = schemes[idx]?.name || 'Scheme';
      setBookmarkToast(wasBookmarked ? `${schemeName} removed` : `${schemeName} saved!`);
      setTimeout(() => setBookmarkToast(null), 1500);
      return next;
    });
  };

  const toggleCompare = (idx: number) => {
    setCompareList(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : prev.length < 3 ? [...prev, idx] : prev
    );
  };

  const copySchemeInfo = (scheme: GovernmentScheme, idx: number) => {
    const text = `${scheme.name}\nMinistry: ${scheme.ministry}\nAmount: ${scheme.amount}\nBenefit: ${scheme.benefit}\nEligibility: ${scheme.eligibility}\nHow to Apply: ${scheme.howToApply}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Filtered & sorted schemes
  const filteredSchemes = useMemo(() => {
    let list = schemes.map((s, i) => ({ ...s, _idx: i }));

    if (showBookmarksOnly) {
      list = list.filter(s => bookmarked.has(s._idx));
    }

    if (activeCategory !== 'all') {
      list = list.filter(s => categorizeScheme(s) === activeCategory);
    }

    if (sortBy === 'amount') {
      list.sort((a, b) => parseAmount(b.amount) - parseAmount(a.amount));
    }

    return list;
  }, [schemes, activeCategory, showBookmarksOnly, bookmarked, sortBy]);

  // Total benefit calculation
  const totalBenefit = useMemo(() => {
    if (schemes.length === 0) return null;
    const bookmarkedSchemes = bookmarked.size > 0
      ? schemes.filter((_, i) => bookmarked.has(i))
      : schemes;
    const total = bookmarkedSchemes.reduce((sum, s) => sum + parseAmount(s.amount), 0);
    if (!total || isNaN(total) || total === 0) return null;
    if (total >= 100000) return `₹${(total / 100000).toFixed(1)}L`;
    if (total >= 1000) return `₹${(total / 1000).toFixed(0)}K`;
    return `₹${total.toFixed(0)}`;
  }, [schemes, bookmarked]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 bg-ivory dark:bg-obsidian">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-4 text-sm font-bold tracking-widest hover:text-gold transition-colors">
            <ArrowLeft size={16} /> DASHBOARD
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-emerald-500/20 border border-gold/30 flex items-center justify-center">
              <Building2 size={28} className="text-gold" />
            </div>
            <div>
              <h1 className="text-5xl font-outfit font-bold text-gray-900 dark:text-white">Scheme Finder</h1>
              <p className="text-gray-500 font-medium">AI-powered discovery of PM-KISAN, PMFBY, KCC & 100+ schemes</p>
            </div>
          </div>
        </div>

        {/* ── Popular Schemes Ticker ─────────────────────────────── */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 shadow-lg">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5 dark:border-white/5">
            <Zap size={14} className="text-gold" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Popular Schemes</span>
          </div>
          <div className="overflow-hidden py-3">
            <div className="flex gap-4 animate-ticker">
              {[...POPULAR_SCHEMES, ...POPULAR_SCHEMES].map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 shrink-0 min-w-[220px]">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Award size={14} className="text-gold" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">{s.name}</div>
                    <div className="text-[10px] text-gray-400">{s.amount} — {s.desc.slice(0, 30)}...</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Input Form ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2.5rem] p-8 mb-8 shadow-xl"
        >
          {/* Quick Crop Pills */}
          <div className="mb-6">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Quick Select Crop</label>
            <div className="flex flex-wrap gap-2">
              {CROPS.slice(0, 12).map(c => (
                <button
                  key={c}
                  onClick={() => setCrop(c)}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all ${
                    crop === c
                      ? 'bg-gold text-white shadow-lg shadow-gold/30 scale-105'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gold/10 hover:text-gold'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

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
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Land Size: <span className="text-gold">{landSize} acres</span>
              </label>
              <div className="relative pt-2">
                <input
                  type="range"
                  min={0.5} max={50} step={0.5}
                  value={landSize}
                  onChange={e => setLandSize(Number(e.target.value))}
                  className="w-full h-10 accent-gold"
                />
                <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-1">
                  <span>0.5 ac</span>
                  <span>{landSize <= 2 ? 'Small' : landSize <= 5 ? 'Medium' : 'Large'} Farmer</span>
                  <span>50 ac</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <Clock size={14} className="text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent:</span>
              {searchHistory.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setState(h.state); setCrop(h.crop); }}
                  className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-[10px] font-bold text-gray-500 hover:bg-gold/10 hover:text-gold transition-all"
                >
                  {h.crop} in {h.state}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={!state || !crop || loading}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-charcoal dark:bg-gold text-white dark:text-black font-bold tracking-widest uppercase hover:scale-105 transition-all disabled:opacity-50 shadow-xl"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            Find My Schemes
          </button>
        </motion.div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse" aria-label="Searching government schemes">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-5 h-5 bg-gold/30 rounded-full" />
              <div className="h-6 w-56 bg-gray-200 dark:bg-white/10 rounded-xl" />
            </div>
            {[1,2,3].map(i => (
              <div key={i} className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gold/20 rounded-xl" />
                  <div className="h-5 w-48 bg-gray-200 dark:bg-white/10 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded" />
                  <div className="h-3 w-3/4 bg-gray-100 dark:bg-white/5 rounded" />
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="h-6 w-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full" />
                  <div className="h-6 w-24 bg-blue-100 dark:bg-blue-900/20 rounded-full" />
                </div>
              </div>
            ))}
            <p className="text-center text-gray-500 font-bold text-sm mt-4">AI is matching schemes for your farm...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && searched && schemes.length === 0 && (
          <div className="text-center py-16">
            <Search size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-500 font-bold mb-2">No schemes matched your criteria</p>
            <p className="text-gray-400 text-sm">Try changing the state, crop, or land size and search again.</p>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────── */}
        {!loading && schemes.length > 0 && (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Schemes Found', value: schemes.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Bookmarked', value: bookmarked.size, icon: Bookmark, color: 'text-gold', bg: 'bg-gold/10' },
                { label: 'Comparing', value: compareList.length, icon: Scale, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: 'Est. Benefit', value: totalBenefit || '—', icon: Calculator, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-2xl p-4 shadow-lg"
                >
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                    <stat.icon size={14} className={stat.color} />
                  </div>
                  <div className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-gold text-white shadow-lg shadow-gold/20'
                      : 'bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 text-gray-500 hover:text-gold'
                  }`}
                >
                  <cat.icon size={12} />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="font-outfit font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={20} className="text-gold" />
                  {filteredSchemes.length} Schemes {activeCategory !== 'all' ? `in ${CATEGORIES.find(c => c.id === activeCategory)?.label}` : `for ${state}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    showBookmarksOnly
                      ? 'bg-gold/20 text-gold border border-gold/30'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gold'
                  }`}
                >
                  <BookmarkCheck size={12} /> Saved Only
                </button>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'relevance' | 'amount')}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-500 border-0 outline-none"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="amount">Sort: Amount</option>
                </select>
                {compareList.length >= 2 && (
                  <button
                    onClick={() => setShowCompare(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 text-purple-500 text-xs font-bold border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                  >
                    <Scale size={12} /> Compare ({compareList.length})
                  </button>
                )}
              </div>
            </div>

            {/* Scheme Cards */}
            <div className="space-y-4">
              {filteredSchemes.map((scheme, i) => {
                const idx = scheme._idx;
                const eligScore = calcEligibilityScore(scheme, landSize);
                const category = categorizeScheme(scheme);
                const catInfo = CATEGORIES.find(c => c.id === category);

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-white dark:bg-charcoal border rounded-[2rem] overflow-hidden shadow-lg transition-all ${
                      compareList.includes(idx)
                        ? 'border-purple-500/40 ring-2 ring-purple-500/20'
                        : 'border-black/5 dark:border-white/10'
                    }`}
                  >
                    <button
                      onClick={() => setExpanded(expanded === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Eligibility Score Circle */}
                        <div className="relative w-12 h-12 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none" stroke="currentColor" strokeWidth="2.5"
                              className="text-gray-100 dark:text-white/10"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none" strokeWidth="2.5"
                              strokeDasharray={`${eligScore}, 100`}
                              className={eligScore >= 85 ? 'stroke-emerald-500' : eligScore >= 70 ? 'stroke-gold' : 'stroke-orange-500'}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-[10px] font-bold ${eligScore >= 85 ? 'text-emerald-500' : eligScore >= 70 ? 'text-gold' : 'text-orange-500'}`}>
                              {eligScore}%
                            </span>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="font-outfit font-bold text-gray-900 dark:text-white text-lg truncate">{scheme.name}</div>
                          <div className="text-xs text-gray-500 font-medium">{scheme.ministry}</div>
                          <div className="flex items-center gap-2 mt-2">
                            {catInfo && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/5 ${catInfo.color}`}>
                                <catInfo.icon size={9} /> {catInfo.label}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600">
                              <IndianRupee size={9} /> {scheme.amount}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        {expanded === idx ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </button>

                    {/* Quick Actions Row */}
                    <div className="flex items-center gap-1 px-6 pb-4 -mt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(idx); }}
                        className={`p-2 rounded-xl transition-all ${bookmarked.has(idx) ? 'bg-gold/20 text-gold' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gold'}`}
                        title="Bookmark"
                      >
                        {bookmarked.has(idx) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCompare(idx); }}
                        className={`p-2 rounded-xl transition-all ${compareList.includes(idx) ? 'bg-purple-500/20 text-purple-500' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-purple-500'}`}
                        title="Add to compare"
                      >
                        <Scale size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); copySchemeInfo(scheme, idx); }}
                        className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-blue-500 transition-all"
                        title="Copy details"
                      >
                        {copiedIdx === idx ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expanded === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-black/5 dark:border-white/5 overflow-hidden"
                        >
                          <div className="p-6">
                            {/* Eligibility Match Bar */}
                            <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Eligibility Match</span>
                                <span className={`text-sm font-bold ${eligScore >= 85 ? 'text-emerald-500' : eligScore >= 70 ? 'text-gold' : 'text-orange-500'}`}>
                                  {eligScore >= 85 ? 'Excellent Match' : eligScore >= 70 ? 'Good Match' : 'Partial Match'}
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${eligScore}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className={`h-full rounded-full ${eligScore >= 85 ? 'bg-emerald-500' : eligScore >= 70 ? 'bg-gold' : 'bg-orange-500'}`}
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                                <Star size={10} /> Based on your land size ({landSize} acres) and crop ({crop})
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <Heart size={10} /> Benefit
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{scheme.benefit}</p>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <CheckCircle2 size={10} /> Eligibility
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{scheme.eligibility}</p>
                              </div>
                              <div className="md:col-span-2 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">
                                  <ArrowRight size={12} /> How to Apply
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{scheme.howToApply}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Compare Panel (Overlay) ───────────────────────────── */}
        <AnimatePresence>
          {showCompare && compareList.length >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
              onClick={() => setShowCompare(false)}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-charcoal rounded-[2rem] w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10 sticky top-0 bg-white dark:bg-charcoal rounded-t-[2rem] z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Scale size={18} className="text-purple-500" />
                    </div>
                    <div>
                      <h2 className="font-outfit font-bold text-lg text-gray-900 dark:text-white">Compare Schemes</h2>
                      <p className="text-xs text-gray-400">Side-by-side comparison</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCompare(false)} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-black/5 dark:border-white/10">
                          <th className="pb-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24">Feature</th>
                          {compareList.map(idx => (
                            <th key={idx} className="pb-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{schemes[idx]?.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Ministry', key: 'ministry' },
                          { label: 'Amount', key: 'amount' },
                          { label: 'Benefit', key: 'benefit' },
                          { label: 'Eligibility', key: 'eligibility' },
                          { label: 'How to Apply', key: 'howToApply' },
                        ].map(row => (
                          <tr key={row.key} className="border-b border-black/5 dark:border-white/5">
                            <td className="py-4 pr-4 text-xs font-bold text-gray-500 align-top">{row.label}</td>
                            {compareList.map(idx => (
                              <td key={idx} className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300 align-top">
                                {row.key === 'amount' ? (
                                  <span className="font-bold text-emerald-500">{(schemes[idx] as any)[row.key]}</span>
                                ) : (
                                  (schemes[idx] as any)[row.key]
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr>
                          <td className="py-4 pr-4 text-xs font-bold text-gray-500 align-top">Match Score</td>
                          {compareList.map(idx => {
                            const score = calcEligibilityScore(schemes[idx], landSize);
                            return (
                              <td key={idx} className="py-4 pr-4 align-top">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-gold' : 'bg-orange-500'}`}
                                      style={{ width: `${score}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-gray-900 dark:text-white">{score}%</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pre-Search: Tips + Popular Cards ──────────────────── */}
        {!searched && (
          <div className="space-y-8 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'PM-KISAN', amount: '₹6,000/year', desc: 'Direct income support in 3 installments to all landholding farmers', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { title: 'PMFBY', amount: '2% premium', desc: 'Comprehensive crop insurance against natural calamities & pests', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { title: 'KCC', amount: '₹3L credit', desc: 'Kisan Credit Card with low 4% interest for farming needs', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              ].map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="p-6 rounded-[2rem] bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 shadow-lg"
                >
                  <div className={`w-12 h-12 rounded-xl ${tip.bg} flex items-center justify-center mb-4`}>
                    <tip.icon size={22} className={tip.color} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-outfit font-bold text-gray-900 dark:text-white">{tip.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-gold/10 text-[9px] font-bold text-gold">{tip.amount}</span>
                  </div>
                  <p className="text-sm text-gray-500">{tip.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-8 rounded-[2rem] bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 shadow-lg"
            >
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: '01', label: 'Select State', desc: 'Choose your state for region-specific schemes' },
                  { step: '02', label: 'Enter Crop', desc: 'Pick or type your primary crop' },
                  { step: '03', label: 'Set Land Size', desc: 'Adjust for small/marginal farmer benefits' },
                  { step: '04', label: 'Get Matches', desc: 'AI finds all eligible schemes with match scores' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-gold/10 text-gold text-sm font-bold flex items-center justify-center mx-auto mb-3">
                      {s.step}
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">{s.label}</div>
                    <div className="text-xs text-gray-400">{s.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Bookmark Toast */}
      <AnimatePresence>
        {bookmarkToast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-charcoal dark:bg-white text-white dark:text-charcoal font-bold text-sm shadow-2xl"
          >
            <BookmarkCheck size={16} className="text-gold" />
            {bookmarkToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticker Animation */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 25s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
