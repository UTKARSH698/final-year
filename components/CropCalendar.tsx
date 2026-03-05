
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Loader2, Sprout, Droplets, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { getCropCalendar } from '../services/geminiService';
import { CropCalendarWeek } from '../types';

interface CropCalendarProps {
  cropName: string;
  duration: string;
  state: string;
  onClose: () => void;
}

const STAGE_COLORS = [
  'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
  'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
  'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400',
  'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400',
  'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
  'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
];

export const CropCalendar: React.FC<CropCalendarProps> = ({ cropName, duration, state, onClose }) => {
  const [calendar, setCalendar] = useState<CropCalendarWeek[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);

  const load = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const data = await getCropCalendar(cropName, duration, state || 'India');
      setCalendar(data);
      setLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-xl" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl bg-white dark:bg-charcoal rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">{cropName} Schedule</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{duration} · {state || 'India'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={36} className="animate-spin text-emerald-500" />
              <p className="text-sm text-gray-500 font-bold">Generating your crop schedule with AI...</p>
            </div>
          )}

          {!loading && calendar.length === 0 && (
            <div className="text-center py-12 text-gray-400">Failed to load schedule. Try again.</div>
          )}

          {!loading && calendar.length > 0 && (
            <div className="space-y-3">
              {calendar.map((week, i) => (
                <motion.div
                  key={week.week}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border ${STAGE_COLORS[i % STAGE_COLORS.length].split(' ').slice(0,2).join(' ')} overflow-hidden`}
                >
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${STAGE_COLORS[i % STAGE_COLORS.length].split(' ').slice(0,3).join(' ')}`}>
                        {week.week}
                      </div>
                      <div>
                        <div className="font-outfit font-bold text-gray-900 dark:text-white">{week.label}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Week {week.week}</div>
                      </div>
                    </div>
                    {expanded === i ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  <AnimatePresence>
                    {expanded === i && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-4 border-t border-black/5 dark:border-white/5 pt-4">
                          <div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                              <Sprout size={12} /> Activities
                            </div>
                            <ul className="space-y-1">
                              {week.activities.map((a, j) => (
                                <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <span className="text-emerald-500 mt-0.5">•</span> {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1"><Droplets size={10} /> Inputs</div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{week.inputs}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1"><ShieldAlert size={10} /> Watch Out</div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{week.watchOut}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
