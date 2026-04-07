
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Droplets, Calendar, Sprout, IndianRupee, X, Scale, Check, Plus,
  BookOpen, Search, Thermometer, Leaf, Beaker, Sun, CloudRain, TrendingUp,
  ChevronDown, ChevronUp, Info, Wheat, Zap, BarChart3, Star, Filter,
  ArrowUpDown, Grid3X3, List, Copy, Heart
} from 'lucide-react';
import { CROP_DATABASE, CropData } from '../services/geminiService';
import { useToast } from './Toast';

interface CropGuideProps {
  onBack: () => void;
}

type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'price' | 'yield' | 'duration' | 'water';

const SEASON_MAP: Record<string, { label: string; color: string; bg: string }> = {
  kharif: { label: 'Kharif', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  rabi: { label: 'Rabi', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  zaid: { label: 'Zaid', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  both: { label: 'Both', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  perennial: { label: 'Perennial', color: 'text-rose-500', bg: 'bg-rose-500/10' },
};

function getSeason(crop: CropData): string {
  const note = crop.note.toLowerCase();
  if (note.includes('kharif') && note.includes('rabi')) return 'both';
  if (note.includes('perennial') || note.includes('year-round') || note.includes('all year')) return 'perennial';
  if (note.includes('kharif')) return 'kharif';
  if (note.includes('rabi')) return 'rabi';
  if (note.includes('zaid') || note.includes('summer')) return 'zaid';
  return 'kharif';
}

function getCategory(name: string): string {
  const n = name.toLowerCase();
  if (['rice', 'wheat', 'maize', 'barley', 'millet', 'sorghum', 'jowar', 'bajra', 'ragi'].some(c => n.includes(c))) return 'Cereal';
  if (['dal', 'gram', 'lentil', 'pea', 'soybean', 'moong', 'urad', 'arhar', 'masoor'].some(c => n.includes(c))) return 'Pulse';
  if (['cotton', 'sugarcane', 'tobacco', 'jute', 'sunflower', 'mustard', 'sesame', 'castor', 'guar', 'groundnut', 'flax', 'hemp'].some(c => n.includes(c))) return 'Cash Crop';
  if (['potato', 'onion', 'tomato', 'garlic', 'ginger', 'chili', 'cauliflower', 'cabbage', 'brinjal', 'okra', 'carrot', 'radish', 'spinach', 'pumpkin', 'bottle', 'bitter'].some(c => n.includes(c))) return 'Vegetable';
  if (['banana', 'mango', 'grape', 'pomegranate', 'papaya', 'watermelon', 'muskmelon', 'guava', 'apple', 'orange', 'litchi'].some(c => n.includes(c))) return 'Fruit';
  if (['turmeric', 'pepper', 'cardamom', 'coffee', 'tea', 'coriander', 'jeera', 'cumin', 'fennel', 'saunf', 'fenugreek', 'clove', 'cinnamon'].some(c => n.includes(c))) return 'Spice';
  return 'Cash Crop';
}

function parsePrice(price: string): number {
  const match = price.replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function parseDuration(dur: string): number {
  const match = dur.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function parseYield(y: string): number {
  const match = y.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function getWaterLevel(crop: CropData): 'Low' | 'Medium' | 'High' {
  if (crop.minRain >= 1000) return 'High';
  if (crop.minRain >= 500) return 'Medium';
  return 'Low';
}

const CATEGORY_ICONS: Record<string, { icon: typeof Wheat; color: string; bg: string }> = {
  Cereal: { icon: Wheat, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  Pulse: { icon: Leaf, color: 'text-green-500', bg: 'bg-green-500/10' },
  'Cash Crop': { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  Vegetable: { icon: Sprout, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  Fruit: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  Spice: { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

// ── Crop Detail Modal ──────────────────────────────────────
const CropDetailModal: React.FC<{
  crop: CropData;
  onClose: () => void;
  isSelected: boolean;
  onToggle: (crop: CropData) => void;
}> = ({ crop, onClose, isSelected, onToggle }) => {
  const season = getSeason(crop);
  const seasonInfo = SEASON_MAP[season];
  const category = getCategory(crop.name);
  const catInfo = CATEGORY_ICONS[category];
  const waterLevel = getWaterLevel(crop);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-charcoal rounded-[2rem] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-charcoal rounded-t-[2rem] z-10 p-6 pb-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${seasonInfo.bg} ${seasonInfo.color}`}>
                  {seasonInfo.label}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${catInfo.bg} ${catInfo.color}`}>
                  <catInfo.icon size={9} /> {category}
                </span>
              </div>
              <h2 className="font-outfit font-bold text-2xl text-gray-900 dark:text-white">{crop.name}</h2>
              <p className="text-sm text-gray-500">{crop.hindi}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Sprout size={13} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Yield</span>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">{crop.yield}</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee size={13} className="text-gold" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">MSP Rate</span>
              </div>
              <div className="text-sm font-bold text-gold">{crop.price}</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={13} className="text-orange-500" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Duration</span>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">{crop.duration}</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Beaker size={13} className="text-purple-500" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Ideal pH</span>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">{crop.idealPh}</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Droplets size={13} className="text-blue-500" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Water</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-1.5 h-3 rounded-full ${
                        (waterLevel === 'High' || (waterLevel === 'Medium' && i <= 2) || (waterLevel === 'Low' && i <= 1))
                          ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{waterLevel}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <CloudRain size={13} className="text-cyan-500" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Rainfall</span>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {crop.minRain}{crop.maxRain ? ` - ${crop.maxRain}` : '+'} mm
              </div>
            </div>
          </div>

          {/* NPK Bar */}
          {crop.targetNPK && (
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">NPK Demand</div>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10">
                <div className="bg-emerald-500 rounded-full" style={{ width: `${Math.min(crop.targetNPK.n / 1.5, 100)}%` }} />
                <div className="bg-blue-500 rounded-full" style={{ width: `${Math.min(crop.targetNPK.p / 0.8, 100)}%` }} />
                <div className="bg-orange-500 rounded-full" style={{ width: `${Math.min(crop.targetNPK.k / 0.8, 100)}%` }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-bold text-emerald-500">Nitrogen: {crop.targetNPK.n}</span>
                <span className="text-[10px] font-bold text-blue-500">Phosphorus: {crop.targetNPK.p}</span>
                <span className="text-[10px] font-bold text-orange-500">Potassium: {crop.targetNPK.k}</span>
              </div>
            </div>
          )}

          {/* Nitrogen Demand */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nitrogen Requirement</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {crop.highN ? '⬆ High Demand — needs nitrogen-rich fertilizers' : '⬇ Low Demand — moderate fertilization sufficient'}
            </div>
          </div>

          {/* Soil Types */}
          <div>
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ideal Soil Types</div>
            <div className="flex flex-wrap gap-2">
              {crop.soilTypes.map(s => (
                <span key={s} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Growing Note */}
          <div className="p-4 rounded-2xl bg-gold/5 border border-gold/20">
            <div className="flex items-center gap-2 text-[9px] font-bold text-gold uppercase tracking-widest mb-2">
              <Info size={12} /> Growing Tips
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{crop.note}</p>
          </div>

          {/* Action */}
          <button
            onClick={() => onToggle(crop)}
            className={`w-full py-3 rounded-2xl font-bold text-sm tracking-widest transition-all ${
              isSelected
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'bg-charcoal dark:bg-gold text-white dark:text-black hover:scale-[1.02]'
            }`}
          >
            {isSelected ? '✓ SELECTED FOR COMPARISON' : '+ ADD TO COMPARISON'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Crop Card ──────────────────────────────────────────────
const CropCard: React.FC<{
  crop: CropData;
  isSelected: boolean;
  onToggle: (crop: CropData) => void;
  disabled: boolean;
  onExpand: () => void;
}> = ({ crop, isSelected, onToggle, disabled, onExpand }) => {
  const season = getSeason(crop);
  const seasonInfo = SEASON_MAP[season];
  const category = getCategory(crop.name);
  const catInfo = CATEGORY_ICONS[category];
  const waterLevel = getWaterLevel(crop);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white dark:bg-charcoal border rounded-[2rem] overflow-hidden transition-all duration-300 flex flex-col h-full group ${
        isSelected
          ? 'border-gold ring-1 ring-gold shadow-2xl scale-[1.01] bg-gold/5 dark:bg-gold/5'
          : 'border-black/5 dark:border-white/10 hover:border-gold/50 hover:shadow-xl'
      }`}
    >
      {/* Top Bar with Season + Category */}
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${seasonInfo.bg} ${seasonInfo.color}`}>
            {seasonInfo.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${catInfo.bg} ${catInfo.color}`}>
            <catInfo.icon size={9} /> {category}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); if (!disabled) onToggle(crop); }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSelected
              ? 'bg-gold text-black shadow-lg scale-100'
              : 'bg-black/5 dark:bg-white/10 text-gray-500 hover:bg-gold/20 scale-90'
          }`}
        >
          {isSelected ? <Check size={13} strokeWidth={3} /> : <Plus size={13} />}
        </button>
      </div>

      <div className="p-6 pt-4 flex flex-col h-full">
        {/* Header */}
        <div className="mb-4">
          <h3 className="font-outfit font-bold text-xl text-gray-900 dark:text-white leading-tight group-hover:text-gold transition-colors">
            {crop.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{crop.hindi}</p>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3 flex-grow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Sprout size={13} className="text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Yield</span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{crop.yield}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Droplets size={13} className="text-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Water</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-1.5 h-3 rounded-full ${
                      (waterLevel === 'High' || (waterLevel === 'Medium' && i <= 2) || (waterLevel === 'Low' && i <= 1))
                        ? 'bg-blue-500' : 'bg-gray-200 dark:bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{waterLevel}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar size={13} className="text-orange-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Cycle</span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{crop.duration}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Beaker size={13} className="text-purple-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">pH</span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{crop.idealPh}</span>
          </div>
        </div>

        {/* NPK Bar */}
        {crop.targetNPK && (
          <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">NPK Demand</span>
            </div>
            <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
              <div className="bg-emerald-500 rounded-full" style={{ width: `${Math.min(crop.targetNPK.n / 1.5, 100)}%` }} title={`N: ${crop.targetNPK.n}`} />
              <div className="bg-blue-500 rounded-full" style={{ width: `${Math.min(crop.targetNPK.p / 0.8, 100)}%` }} title={`P: ${crop.targetNPK.p}`} />
              <div className="bg-orange-500 rounded-full" style={{ width: `${Math.min(crop.targetNPK.k / 0.8, 100)}%` }} title={`K: ${crop.targetNPK.k}`} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[8px] font-bold text-emerald-500">N:{crop.targetNPK.n}</span>
              <span className="text-[8px] font-bold text-blue-500">P:{crop.targetNPK.p}</span>
              <span className="text-[8px] font-bold text-orange-500">K:{crop.targetNPK.k}</span>
            </div>
          </div>
        )}

        {/* Footer Price */}
        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MSP Rate</span>
          <div className="flex items-center gap-1 text-gold font-bold font-mono text-lg">
            <IndianRupee size={14} /> {crop.price.split(' ')[0].replace('₹', '')}
          </div>
        </div>

        {/* View Details button */}
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onExpand(); }}
          className="mt-3 w-full py-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gold/10 text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1 hover:text-gold transition-colors"
        >
          <Info size={10} /> View Details
        </button>
      </div>
    </motion.div>
  );
};

// ── List View Row ──────────────────────────────────────────
const CropListRow: React.FC<{
  crop: CropData;
  isSelected: boolean;
  onToggle: (crop: CropData) => void;
  disabled: boolean;
}> = ({ crop, isSelected, onToggle, disabled }) => {
  const season = getSeason(crop);
  const seasonInfo = SEASON_MAP[season];
  const category = getCategory(crop.name);
  const waterLevel = getWaterLevel(crop);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
        isSelected
          ? 'bg-gold/5 border border-gold/30 shadow-lg'
          : 'bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 hover:border-gold/30'
      }`}
    >
      <button
        onClick={() => !disabled && onToggle(crop)}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
          isSelected ? 'bg-gold text-black' : 'bg-gray-100 dark:bg-white/10 text-gray-400 hover:bg-gold/20'
        }`}
      >
        {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-outfit font-bold text-gray-900 dark:text-white truncate">{crop.name}</span>
          <span className="text-xs text-gray-400">{crop.hindi}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${seasonInfo.bg} ${seasonInfo.color}`}>{seasonInfo.label}</span>
          <span className="text-[10px] text-gray-400">{category}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6 text-xs">
        <div className="text-center w-20">
          <div className="text-[9px] text-gray-400 font-bold uppercase">Yield</div>
          <div className="font-bold text-gray-900 dark:text-white">{crop.yield.split(' ')[0]}</div>
        </div>
        <div className="text-center w-16">
          <div className="text-[9px] text-gray-400 font-bold uppercase">Water</div>
          <div className="font-bold text-blue-500">{waterLevel}</div>
        </div>
        <div className="text-center w-20">
          <div className="text-[9px] text-gray-400 font-bold uppercase">Cycle</div>
          <div className="font-bold text-gray-900 dark:text-white">{crop.duration.split(' ')[0]}</div>
        </div>
        <div className="text-center w-16">
          <div className="text-[9px] text-gray-400 font-bold uppercase">pH</div>
          <div className="font-bold text-purple-500">{crop.idealPh}</div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="flex items-center gap-1 text-gold font-bold font-mono">
          <IndianRupee size={12} /> {crop.price.split(' ')[0].replace('₹', '')}
        </div>
        <div className="text-[9px] text-gray-400">per quintal</div>
      </div>
    </motion.div>
  );
};

// ── Comparison View ────────────────────────────────────────
const ComparisonView: React.FC<{ crops: CropData[]; onBack: () => void }> = ({ crops, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gold transition-colors mb-4 text-sm font-bold tracking-widest"
          >
            <ArrowLeft size={16} /> BACK TO GRID
          </button>
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Scale className="text-gold" size={32} />
            Crop Comparison
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto pb-6">
        <div className={`min-w-[700px] grid gap-4`} style={{ gridTemplateColumns: `200px repeat(${crops.length}, 1fr)` }}>
          {/* Labels */}
          <div className="space-y-3 pt-24">
            {['Category', 'Season', 'Yield', 'Market Rate', 'Water Needs', 'Duration', 'Ideal Soil', 'Nitrogen', 'pH Level', 'NPK'].map((label) => (
              <div key={label} className="h-14 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider px-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                {label}
              </div>
            ))}
          </div>

          {/* Crop Columns */}
          {crops.map(crop => {
            const season = getSeason(crop);
            const seasonInfo = SEASON_MAP[season];
            const category = getCategory(crop.name);
            return (
              <div key={crop.name} className="space-y-3">
                <div className="h-24 p-5 bg-white dark:bg-charcoal border border-gold/30 rounded-2xl flex flex-col justify-center shadow-lg">
                  <div className="text-xl font-outfit font-bold text-gray-900 dark:text-white">{crop.name}</div>
                  <div className="text-sm text-gray-500">{crop.hindi}</div>
                </div>

                <div className="h-14 flex items-center px-5 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 text-sm font-bold text-gray-900 dark:text-white">
                  {category}
                </div>
                <div className="h-14 flex items-center px-5 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${seasonInfo.bg} ${seasonInfo.color}`}>{seasonInfo.label}</span>
                </div>
                <div className="h-14 flex items-center px-5 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 text-sm font-bold text-emerald-500">
                  {crop.yield}
                </div>
                <div className="h-14 flex items-center px-5 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 text-sm font-bold text-gold">
                  {crop.price}
                </div>
                <div className="h-14 flex items-center px-5 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 text-sm font-bold text-blue-500">
                  {crop.minRain}{crop.maxRain ? ` - ${crop.maxRain}` : '+'} mm
                </div>
                <div className="h-14 flex items-center px-5 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 text-sm font-bold text-gray-900 dark:text-white">
                  {crop.duration}
                </div>
                <div className="h-14 flex items-center px-5 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {crop.soilTypes.slice(0, 2).join(", ")}
                </div>
                <div className="h-14 flex items-center px-5 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 text-sm font-bold text-gray-900 dark:text-white">
                  {crop.highN ? '⬆ High' : '⬇ Low'}
                </div>
                <div className="h-14 flex items-center px-5 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10 text-sm font-bold text-gray-900 dark:text-white">
                  {crop.idealPh} pH
                </div>
                <div className="h-14 flex items-center px-5 bg-white dark:bg-charcoal rounded-xl border border-black/5 dark:border-white/10">
                  {crop.targetNPK ? (
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-emerald-500">N:{crop.targetNPK.n}</span>
                      <span className="text-blue-500">P:{crop.targetNPK.p}</span>
                      <span className="text-orange-500">K:{crop.targetNPK.k}</span>
                    </div>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────
export const CropGuide: React.FC<CropGuideProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [selectedCrops, setSelectedCrops] = useState<CropData[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSeason, setActiveSeason] = useState<string>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [detailCrop, setDetailCrop] = useState<CropData | null>(null);

  const categoryOptions = ['All', 'Cereal', 'Pulse', 'Cash Crop', 'Vegetable', 'Fruit', 'Spice'];
  const seasonOptions = ['All', 'Kharif', 'Rabi', 'Zaid', 'Both', 'Perennial'];

  const filteredCrops = useMemo(() => {
    let list = CROP_DATABASE.filter(crop => {
      const matchesSearch = crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crop.hindi.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeCategory !== 'All') {
        if (getCategory(crop.name) !== activeCategory) return false;
      }

      if (activeSeason !== 'All') {
        if (getSeason(crop) !== activeSeason.toLowerCase()) return false;
      }

      return true;
    });

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'price': return parsePrice(b.price) - parsePrice(a.price);
        case 'yield': return parseYield(b.yield) - parseYield(a.yield);
        case 'duration': return parseDuration(a.duration) - parseDuration(b.duration);
        case 'water': return a.minRain - b.minRain;
        default: return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [searchQuery, activeCategory, activeSeason, sortBy]);

  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    CROP_DATABASE.forEach(c => {
      const cat = getCategory(c.name);
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return stats;
  }, []);

  const handleToggleSelect = (crop: CropData) => {
    if (selectedCrops.find(c => c.name === crop.name)) {
      setSelectedCrops(prev => prev.filter(c => c.name !== crop.name));
    } else {
      if (selectedCrops.length >= 3) {
        toast("You can compare up to 3 crops at a time.", 'info');
        return;
      }
      setSelectedCrops(prev => [...prev, crop]);
    }
  };

  if (showCompare) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-6 bg-ivory dark:bg-obsidian">
        <div className="max-w-7xl mx-auto">
          <ComparisonView crops={selectedCrops} onBack={() => setShowCompare(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 bg-ivory dark:bg-obsidian">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-4 text-sm font-bold tracking-widest hover:text-gold transition-colors">
              <ArrowLeft size={16} /> DASHBOARD
            </button>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-gold/20 border border-emerald-500/30 flex items-center justify-center">
                <BookOpen size={28} className="text-emerald-500" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 dark:text-white">Crop Encyclopedia</h1>
                <p className="text-gray-500 font-medium">59 crop varieties with NPK data, seasons, soil & pricing</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <div className="text-center px-5 py-3 rounded-2xl bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 shadow-lg">
              <div className="text-3xl font-bold font-outfit text-emerald-500">{CROP_DATABASE.length}</div>
              <div className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Varieties</div>
            </div>
            <div className="text-center px-5 py-3 rounded-2xl bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 shadow-lg">
              <div className="text-3xl font-bold font-outfit text-gold">{filteredCrops.length}</div>
              <div className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Showing</div>
            </div>
          </div>
        </div>

        {/* Category Quick Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {Object.entries(CATEGORY_ICONS).map(([cat, info]) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? 'All' : cat)}
              className={`p-3 rounded-2xl transition-all text-center ${
                activeCategory === cat
                  ? 'bg-gold/10 border border-gold/30 shadow-lg scale-105'
                  : 'bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 hover:border-gold/30'
              }`}
            >
              <info.icon size={18} className={`mx-auto mb-1.5 ${activeCategory === cat ? 'text-gold' : info.color}`} />
              <div className="text-[10px] font-bold text-gray-900 dark:text-white">{cat}</div>
              <div className="text-[9px] text-gray-400 font-bold">{categoryStats[cat] || 0}</div>
            </button>
          ))}
        </div>

        {/* Search + Filters Bar */}
        <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or Hindi name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-6 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-sm font-bold text-gray-900 dark:text-white"
              />
            </div>

            {/* Season Filter */}
            <div className="flex items-center gap-2">
              <CloudRain size={14} className="text-gray-400" />
              <select
                value={activeSeason}
                onChange={e => setActiveSeason(e.target.value)}
                className="h-12 px-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none"
              >
                {seasonOptions.map(s => <option key={s} value={s}>{s} Season</option>)}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortKey)}
                className="h-12 px-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none"
              >
                <option value="name">Sort: Name</option>
                <option value="price">Sort: Price ↓</option>
                <option value="yield">Sort: Yield ↓</option>
                <option value="duration">Sort: Duration ↑</option>
                <option value="water">Sort: Water ↑</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-black/20 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-charcoal shadow text-gold' : 'text-gray-400'}`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-charcoal shadow text-gold' : 'text-gray-400'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(activeCategory !== 'All' || activeSeason !== 'All' || searchQuery) && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active:</span>
              {activeCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold/10 text-gold text-[10px] font-bold">
                  {activeCategory} <button onClick={() => setActiveCategory('All')}><X size={10} /></button>
                </span>
              )}
              {activeSeason !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold">
                  {activeSeason} <button onClick={() => setActiveSeason('All')}><X size={10} /></button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-[10px] font-bold">
                  "{searchQuery}" <button onClick={() => setSearchQuery('')}><X size={10} /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-24">
            {filteredCrops.map((crop) => {
              const isSelected = !!selectedCrops.find(c => c.name === crop.name);
              const isMaxed = selectedCrops.length >= 3 && !isSelected;
              return (
                <div key={crop.name} className={isMaxed ? 'opacity-50 transition-all' : ''}>
                  <CropCard
                    crop={crop}
                    isSelected={isSelected}
                    onToggle={handleToggleSelect}
                    disabled={isMaxed}
                    onExpand={() => setDetailCrop(crop)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3 pb-24">
            {filteredCrops.map((crop) => {
              const isSelected = !!selectedCrops.find(c => c.name === crop.name);
              const isMaxed = selectedCrops.length >= 3 && !isSelected;
              return (
                <div key={crop.name} className={isMaxed ? 'opacity-50 transition-all' : ''}>
                  <CropListRow
                    crop={crop}
                    isSelected={isSelected}
                    onToggle={handleToggleSelect}
                    disabled={isMaxed}
                  />
                </div>
              );
            })}
          </div>
        )}

        {filteredCrops.length === 0 && (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No varieties found</h3>
            <p className="text-gray-500">Try adjusting your search, category, or season filter.</p>
          </div>
        )}
      </div>

      {/* Crop Detail Modal */}
      <AnimatePresence>
        {detailCrop && (
          <CropDetailModal
            crop={detailCrop}
            onClose={() => setDetailCrop(null)}
            isSelected={!!selectedCrops.find(c => c.name === detailCrop.name)}
            onToggle={handleToggleSelect}
          />
        )}
      </AnimatePresence>

      {/* Floating Compare Bar */}
      <AnimatePresence>
        {selectedCrops.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-8 left-0 right-0 z-50"
          >
            <div className="max-w-lg mx-auto bg-charcoal/95 dark:bg-white/10 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="bg-gold text-black font-bold w-7 h-7 rounded-full flex items-center justify-center text-xs">
                  {selectedCrops.length}
                </span>
                <div className="hidden sm:flex items-center gap-1.5">
                  {selectedCrops.map(c => (
                    <span key={c.name} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white">
                      {c.name.split(' ')[0]}
                    </span>
                  ))}
                </div>
                <span className="sm:hidden text-white text-xs font-bold">SELECTED</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCrops([])}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => setShowCompare(true)}
                  className="bg-white dark:bg-gold text-black px-6 py-2.5 rounded-full text-xs font-bold tracking-widest hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
                >
                  COMPARE <Scale size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
