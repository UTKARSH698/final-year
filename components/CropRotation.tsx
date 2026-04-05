import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, RefreshCw, Leaf, Sprout, Coins, Sun, Shield,
  ArrowRight, Clock, Sparkles, ChevronDown
} from 'lucide-react';
import { CropRotationPlan, CropRotationStep } from '../types';
import { getCropRotationPlan } from '../services/geminiService';

interface CropRotationProps {
  cropName: string;
  soilType?: string;
  state?: string;
  onClose: () => void;
}

const ICON_MAP: Record<string, { icon: React.FC<any>; color: string; bg: string; label: string }> = {
  nitrogen: { icon: Sprout, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Nitrogen Fixer' },
  cash:     { icon: Coins, color: 'text-gold', bg: 'bg-gold/10 border-gold/20', label: 'Cash Crop' },
  organic:  { icon: Leaf, color: 'text-green-600', bg: 'bg-green-500/10 border-green-500/20', label: 'Green Manure' },
  rest:     { icon: Sun, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Fallow Period' },
  cover:    { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Cover Crop' },
};

const StepCard: React.FC<{ step: CropRotationStep; index: number; total: number }> = ({ step, index, total }) => {
  const [expanded, setExpanded] = useState(false);
  const config = ICON_MAP[step.icon] || ICON_MAP.cash;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
      className="relative"
    >
      {/* Connector line */}
      {index < total - 1 && (
        <div className="absolute left-7 top-[4.5rem] bottom-0 w-px bg-gradient-to-b from-gold/40 to-transparent z-0" />
      )}

      <div
        onClick={() => setExpanded(!expanded)}
        className={`relative z-10 flex gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-lg ${
          expanded
            ? 'bg-white dark:bg-charcoal border-gold/30 shadow-xl'
            : 'bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/5 hover:border-gold/20'
        }`}
      >
        {/* Step number + Icon */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${config.bg}`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <span className="text-[9px] font-jakarta font-bold text-gray-400 uppercase tracking-widest">
            Step {index + 1}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-jakarta font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
              {config.label}
            </span>
            <span className="text-[9px] font-jakarta text-gray-400 font-bold">{step.season}</span>
          </div>

          <h4 className="text-lg font-outfit font-bold text-gray-900 dark:text-white mb-0.5">
            {step.cropName}
          </h4>
          <p className="text-xs font-inter text-gray-500 dark:text-gray-400 italic">{step.cropHindi}</p>

          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span className="font-bold">{step.duration}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3 pt-4 border-t border-black/5 dark:border-white/5">
                  <div>
                    <span className="text-[9px] font-jakarta font-bold text-gold uppercase tracking-widest">Why this crop?</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-1">{step.reason}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-[9px] font-jakarta font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Soil Benefit</span>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300 font-bold mt-1">{step.soilBenefit}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export const CropRotation: React.FC<CropRotationProps> = ({ cropName, soilType, state, onClose }) => {
  const [plan, setPlan] = useState<CropRotationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCropRotationPlan(cropName, soilType || '', state || '');
      setPlan(result);
    } catch (e) {
      console.error('[CropRotation] Failed:', e);
      setError('Failed to generate rotation plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlan(); }, [cropName]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-ivory dark:bg-obsidian border border-black/5 dark:border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-ivory/95 dark:bg-obsidian/95 backdrop-blur-xl px-8 py-6 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-outfit font-bold text-gray-900 dark:text-white">Smart Crop Rotation</h2>
                <p className="text-xs font-inter text-gray-500">AI-optimized cycle after <span className="font-bold text-gold">{cropName}</span></p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close crop rotation"
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <RefreshCw className="w-5 h-5 text-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm font-inter text-gray-500 dark:text-gray-400">Analysing soil nutrient cycles...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <button
                onClick={fetchPlan}
                className="px-6 py-2 rounded-xl bg-gold text-black font-jakarta font-bold text-sm hover:bg-gold/90 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : plan && (
            <div className="space-y-6">
              {/* Current crop indicator */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gold/5 border border-gold/20">
                <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-jakarta font-bold text-gold uppercase tracking-widest">Current Harvest</p>
                  <p className="text-sm font-outfit font-bold text-gray-900 dark:text-white">{plan.currentCrop}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gold" />
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {plan.steps.map((step, i) => (
                  <StepCard key={i} step={step} index={i} total={plan.steps.length} />
                ))}
              </div>

              {/* Summary */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/90 to-obsidian border border-emerald-500/20 mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-jakarta font-bold text-emerald-400 uppercase tracking-widest">
                    {plan.totalCycleMonths}-Month Cycle Benefit
                  </span>
                </div>
                <p className="text-sm font-inter text-white/90 leading-relaxed font-medium">
                  {plan.overallBenefit}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
