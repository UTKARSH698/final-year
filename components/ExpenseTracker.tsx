
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, IndianRupee, TrendingUp, TrendingDown,
  Loader2, Wallet, Leaf, Droplets, Users, Wrench, Bug, Package, X, CheckCircle2,
  BarChart3, PieChart, Lightbulb, Calendar, Download, Search, Filter,
  ArrowUpRight, ArrowDownRight, Zap, Target, Clock, Repeat, Edit3, Check,
  ChevronRight, Sparkles, Receipt
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { ExpenseEntry } from '../types';

const CATEGORIES: { label: ExpenseEntry['category']; icon: React.FC<any>; color: string; gradient: string }[] = [
  { label: 'Seeds',      icon: Leaf,        color: 'text-emerald-500 bg-emerald-500/10', gradient: 'from-emerald-500 to-emerald-600' },
  { label: 'Fertilizer', icon: Package,     color: 'text-blue-500 bg-blue-500/10', gradient: 'from-blue-500 to-blue-600' },
  { label: 'Labor',      icon: Users,       color: 'text-purple-500 bg-purple-500/10', gradient: 'from-purple-500 to-purple-600' },
  { label: 'Irrigation', icon: Droplets,    color: 'text-cyan-500 bg-cyan-500/10', gradient: 'from-cyan-500 to-cyan-600' },
  { label: 'Equipment',  icon: Wrench,      color: 'text-orange-500 bg-orange-500/10', gradient: 'from-orange-500 to-orange-600' },
  { label: 'Pesticide',  icon: Bug,         color: 'text-red-500 bg-red-500/10', gradient: 'from-red-500 to-red-600' },
  { label: 'Revenue',    icon: TrendingUp,  color: 'text-gold bg-gold/10', gradient: 'from-gold to-yellow-600' },
  { label: 'Other',      icon: Wallet,      color: 'text-gray-500 bg-gray-500/10', gradient: 'from-gray-500 to-gray-600' },
];

const DATE_RANGES = [
  { label: 'This Week', days: 7 },
  { label: 'This Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: 'All Time', days: 0 },
];

const QUICK_TEMPLATES = [
  { desc: 'Daily labor wages', category: 'Labor' as const, icon: Users },
  { desc: 'Fertilizer purchase', category: 'Fertilizer' as const, icon: Package },
  { desc: 'Irrigation water bill', category: 'Irrigation' as const, icon: Droplets },
  { desc: 'Crop sale revenue', category: 'Revenue' as const, icon: TrendingUp },
  { desc: 'Pesticide spray', category: 'Pesticide' as const, icon: Bug },
  { desc: 'Seed purchase', category: 'Seeds' as const, icon: Leaf },
];

type EntryFilter = 'all' | 'expense' | 'revenue';

interface ExpenseTrackerProps {
  onBack: () => void;
}

/* ── SVG Donut Chart ─────────────────────────── */
const DonutChart: React.FC<{ segments: { label: string; value: number; color: string }[]; total: number }> = ({ segments, total }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="currentColor" strokeWidth="20" className="text-gray-100 dark:text-white/5" />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dash = pct * circumference;
          const el = (
            <circle
              key={seg.label}
              cx="90" cy="90" r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
        <span className="text-xl font-outfit font-bold text-gray-900 dark:text-white">₹{total > 99999 ? `${(total / 1000).toFixed(0)}K` : total.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
};

/* ── Profit Gauge Ring ────────────────────────── */
const ProfitGauge: React.FC<{ profit: number; revenue: number }> = ({ profit, revenue }) => {
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const clampedMargin = Math.max(-100, Math.min(100, margin));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (Math.abs(clampedMargin) / 100) * circumference;
  const isPositive = profit >= 0;

  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-white/5" />
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth="8"
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${progress} ${circumference - progress}` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-outfit font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {clampedMargin}%
        </span>
      </div>
    </div>
  );
};

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateRange, setDateRange] = useState(3); // index in DATE_RANGES — "All Time"
  const [entryFilter, setEntryFilter] = useState<EntryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: 'Seeds' as ExpenseEntry['category'],
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch('/api/expenses', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setEntries(data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [user]);

  // Filter entries by date range
  const filteredByDate = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    if (range.days === 0) return entries;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range.days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return entries.filter(e => e.date >= cutoffStr);
  }, [entries, dateRange]);

  // Filter by type + search
  const displayEntries = useMemo(() => {
    let list = filteredByDate;
    if (entryFilter === 'expense') list = list.filter(e => e.category !== 'Revenue');
    else if (entryFilter === 'revenue') list = list.filter(e => e.category === 'Revenue');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }
    return list;
  }, [filteredByDate, entryFilter, searchQuery]);

  const analytics = useMemo(() => {
    const data = filteredByDate;
    const totalRevenue = data.filter(e => e.category === 'Revenue').reduce((s, e) => s + e.amount, 0);
    const totalExpense = data.filter(e => e.category !== 'Revenue').reduce((s, e) => s + e.amount, 0);
    const profit = totalRevenue - totalExpense;
    const byCategory: Record<string, number> = {};
    data.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + (e.category === 'Revenue' ? 0 : e.amount); });

    // Monthly aggregation
    const monthMap: Record<string, { expense: number; revenue: number }> = {};
    data.forEach(e => {
      const m = e.date.slice(0, 7);
      if (!monthMap[m]) monthMap[m] = { expense: 0, revenue: 0 };
      if (e.category === 'Revenue') monthMap[m].revenue += e.amount;
      else monthMap[m].expense += e.amount;
    });
    const monthlyData = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, d]) => ({
        label: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        ...d,
      }));

    // Category % breakdown
    const catEntries = Object.entries(byCategory).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const categoryPct = catEntries.map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      pct: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0,
    }));

    // Donut segments
    const DONUT_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#06b6d4', '#f97316', '#ef4444', '#6b7280'];
    const donutSegments = catEntries.map(([cat, amt], i) => ({
      label: cat,
      value: amt,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }));

    // Daily average
    const uniqueDays = new Set(data.filter(e => e.category !== 'Revenue').map(e => e.date)).size;
    const dailyAvg = uniqueDays > 0 ? Math.round(totalExpense / uniqueDays) : 0;

    // Count by type
    const expenseCount = data.filter(e => e.category !== 'Revenue').length;
    const revenueCount = data.filter(e => e.category === 'Revenue').length;

    // Top single expense
    const expenseEntries = data.filter(e => e.category !== 'Revenue');
    const topExpense = expenseEntries.length > 0 ? expenseEntries.reduce((a, b) => a.amount > b.amount ? a : b) : null;

    // Smart insights
    const insights: string[] = [];
    if (catEntries.length > 0) {
      insights.push(`Highest spend: **${catEntries[0][0]}** at ₹${catEntries[0][1].toLocaleString('en-IN')} (${totalExpense > 0 ? Math.round((catEntries[0][1] / totalExpense) * 100) : 0}% of total)`);
    }
    if (totalRevenue > 0 && totalExpense > 0) {
      const margin = Math.round((profit / totalRevenue) * 100);
      insights.push(`Profit margin: **${margin}%** — ${margin >= 30 ? 'Healthy farm economics' : margin >= 10 ? 'Moderate returns, optimize costs' : 'Low margin — review high-cost areas'}`);
    }
    if (monthlyData.length >= 2) {
      const last = monthlyData[monthlyData.length - 1];
      const prev = monthlyData[monthlyData.length - 2];
      if (prev.expense > 0) {
        const change = Math.round(((last.expense - prev.expense) / prev.expense) * 100);
        insights.push(`Month-over-month: expenses **${change >= 0 ? `up ${change}%` : `down ${Math.abs(change)}%`}** vs previous`);
      }
    }
    if (dailyAvg > 0) {
      insights.push(`Daily average spend: **₹${dailyAvg.toLocaleString('en-IN')}** across ${uniqueDays} active days`);
    }
    if (topExpense) {
      insights.push(`Largest single expense: **${topExpense.description}** — ₹${topExpense.amount.toLocaleString('en-IN')}`);
    }

    return { totalExpense, totalRevenue, profit, byCategory, monthlyData, categoryPct, donutSegments, insights, dailyAvg, expenseCount, revenueCount, topExpense };
  }, [filteredByDate]);

  const handleAdd = useCallback(async () => {
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      if (editingId) {
        // For edit, delete old + create new
        await fetch(`/api/expenses/${editingId}`, { method: 'DELETE', credentials: 'include' });
        setEntries(prev => prev.filter(e => e.id !== editingId));
      }
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category: form.category,
          description: form.description,
          amount: parseFloat(form.amount),
          date: form.date,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setEntries(prev => [saved, ...prev]);
        setForm({ category: 'Seeds', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
        setShowForm(false);
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }, [form, editingId]);

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const startEdit = useCallback((entry: ExpenseEntry) => {
    setForm({
      category: entry.category,
      description: entry.description,
      amount: String(entry.amount),
      date: entry.date,
    });
    setEditingId(entry.id);
    setShowForm(true);
  }, []);

  const useTemplate = useCallback((tpl: typeof QUICK_TEMPLATES[0]) => {
    setForm(f => ({ ...f, category: tpl.category, description: tpl.desc }));
    setShowTemplates(false);
  }, []);

  const exportCSV = useCallback(() => {
    const header = 'Date,Category,Description,Amount,Type\n';
    const rows = entries.map(e =>
      `${e.date},${e.category},"${e.description.replace(/"/g, '""')}",${e.amount},${e.category === 'Revenue' ? 'Revenue' : 'Expense'}`
    ).join('\n');
    const summary = `\n\nSummary\nTotal Expenses,${analytics.totalExpense}\nTotal Revenue,${analytics.totalRevenue}\nNet ${analytics.profit >= 0 ? 'Profit' : 'Loss'},${Math.abs(analytics.profit)}`;
    const blob = new Blob([header + rows + summary], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries, analytics]);

  const getCatMeta = (cat: string) => CATEGORIES.find(c => c.label === cat) || CATEGORIES[7];

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Wallet size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">Please log in to use the Expense Tracker.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-6 bg-ivory dark:bg-obsidian">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ────────────────────────────────────── */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-4 text-sm font-bold tracking-widest hover:text-gold transition-colors">
              <ArrowLeft size={16} /> DASHBOARD
            </button>
            <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 dark:text-white mb-1">Expense Tracker</h1>
            <p className="text-gray-500 font-medium text-sm">Track farm income & costs per crop cycle</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {entries.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gold/30 text-gold font-bold text-xs tracking-widest hover:bg-gold/10 transition-all"
              >
                <Download size={13} /> EXPORT CSV
              </button>
            )}
            <button
              onClick={() => { setEditingId(null); setForm({ category: 'Seeds', description: '', amount: '', date: new Date().toISOString().split('T')[0] }); setShowForm(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-bold text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-gold/20"
            >
              <Plus size={15} /> ADD ENTRY
            </button>
          </div>
        </div>

        {/* ── Date Range Pills ──────────────────────────── */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
          <Calendar size={14} className="text-gray-400 shrink-0" />
          {DATE_RANGES.map((range, i) => (
            <button
              key={range.label}
              onClick={() => setDateRange(i)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase whitespace-nowrap transition-all border ${
                dateRange === i
                  ? 'bg-gold/10 text-gold border-gold/30'
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              {range.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden md:inline">
              {filteredByDate.length} entries
            </span>
          </div>
        </div>

        {/* ── Summary Cards (4 cards) ──────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          {[
            { label: 'Expenses', value: analytics.totalExpense, color: 'text-red-500', icon: ArrowDownRight, iconBg: 'bg-red-500/10', count: analytics.expenseCount },
            { label: 'Revenue', value: analytics.totalRevenue, color: 'text-emerald-500', icon: ArrowUpRight, iconBg: 'bg-emerald-500/10', count: analytics.revenueCount },
            { label: analytics.profit >= 0 ? 'Net Profit' : 'Net Loss', value: Math.abs(analytics.profit), color: analytics.profit >= 0 ? 'text-emerald-500' : 'text-red-500', icon: analytics.profit >= 0 ? TrendingUp : TrendingDown, iconBg: analytics.profit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
            { label: 'Daily Avg', value: analytics.dailyAvg, color: 'text-gold', icon: Clock, iconBg: 'bg-gold/10' },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{card.label}</span>
                <div className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <card.icon size={13} className={card.color} />
                </div>
              </div>
              <div className={`text-xl md:text-2xl font-outfit font-bold ${card.color} flex items-center gap-0.5`}>
                <IndianRupee size={16} />{card.value.toLocaleString('en-IN')}
              </div>
              {'count' in card && card.count !== undefined && (
                <span className="text-[9px] font-bold text-gray-400 mt-1 block">{card.count} transactions</span>
              )}
            </motion.div>
          ))}
        </div>

        {entries.length > 0 && (
          <>
            {/* ── Donut + Profit Gauge Row ──────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Donut Chart */}
              {analytics.donutSegments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    <PieChart size={14} className="text-gold" /> Expense Distribution
                  </div>
                  <DonutChart segments={analytics.donutSegments} total={analytics.totalExpense} />
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {analytics.donutSegments.map((seg, i) => (
                      <div key={seg.label} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className="text-[9px] font-bold text-gray-500">{seg.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Profit Gauge + Category Bars */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  <Target size={14} className="text-gold" /> Profit Margin
                </div>
                <div className="flex items-center justify-center mb-6">
                  <ProfitGauge profit={analytics.profit} revenue={analytics.totalRevenue} />
                  <div className="ml-6">
                    <div className={`text-2xl font-outfit font-bold ${analytics.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {analytics.profit >= 0 ? '+' : '-'}₹{Math.abs(analytics.profit).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {analytics.profit >= 0 ? 'Net Profit' : 'Net Loss'}
                    </span>
                  </div>
                </div>
                {/* Top 3 categories mini bars */}
                <div className="space-y-2.5">
                  {analytics.categoryPct.slice(0, 4).map(({ category, amount, pct }) => {
                    const meta = getCatMeta(category);
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <meta.icon size={11} className={meta.color.split(' ')[0]} />
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{category}</span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={`h-full rounded-full bg-gradient-to-r ${meta.gradient}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* ── Monthly Trend Chart ──────────────────── */}
            {analytics.monthlyData.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg mb-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <BarChart3 size={14} className="text-gold" /> Monthly Trend
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gradient-to-t from-red-500 to-red-400" /><span className="text-[9px] font-bold text-gray-400">Expense</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-500 to-emerald-400" /><span className="text-[9px] font-bold text-gray-400">Revenue</span></div>
                  </div>
                </div>
                <div className="flex items-end gap-2 md:gap-4 h-48">
                  {(() => {
                    const maxVal = Math.max(...analytics.monthlyData.map(m => Math.max(m.expense, m.revenue)), 1);
                    return analytics.monthlyData.map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-1 items-end justify-center h-36">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max((m.expense / maxVal) * 100, 4)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="w-4 md:w-6 rounded-t-lg bg-gradient-to-t from-red-500 to-red-400 relative group cursor-pointer"
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal text-white text-[8px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              ₹{m.expense.toLocaleString('en-IN')}
                            </div>
                          </motion.div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max((m.revenue / maxVal) * 100, 4)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1 + 0.05 }}
                            className="w-4 md:w-6 rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400 relative group cursor-pointer"
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal text-white text-[8px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              ₹{m.revenue.toLocaleString('en-IN')}
                            </div>
                          </motion.div>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400">{m.label}</span>
                      </div>
                    ));
                  })()}
                </div>
              </motion.div>
            )}

            {/* ── Smart Insights ───────────────────────── */}
            {analytics.insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-gold/5 to-emerald-500/5 dark:from-gold/10 dark:to-emerald-500/5 border border-gold/10 rounded-[2rem] p-6 shadow-lg mb-8"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  <Sparkles size={14} className="text-gold" /> AI Insights
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analytics.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm">
                      <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Lightbulb size={11} className="text-gold" />
                      </div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-white">$1</strong>') }}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* ── Entries Section ──────────────────────────── */}
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Type filter tabs */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
              {([
                { key: 'all' as const, label: 'All', count: filteredByDate.length },
                { key: 'expense' as const, label: 'Expenses', count: analytics.expenseCount },
                { key: 'revenue' as const, label: 'Revenue', count: analytics.revenueCount },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setEntryFilter(tab.key)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                    entryFilter === tab.key
                      ? 'bg-white dark:bg-charcoal text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label} <span className="ml-1 text-gray-400">{tab.count}</span>
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-4 rounded-xl text-xs bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white border border-black/5 dark:border-white/10 outline-none focus:ring-1 focus:ring-gold/30 w-full md:w-56"
              />
            </div>
          </div>
        </div>

        {/* ── Entries List ─────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gold" /></div>
        ) : displayEntries.length === 0 && entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-gold/10 to-emerald-500/10 mb-6">
              <Receipt size={36} className="text-gold" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No Entries Yet</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">Start tracking your farm finances. Add seeds, fertilizer, labor costs or record crop revenue.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-bold text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-gold/20"
            >
              <Plus size={14} className="inline mr-2" /> ADD FIRST ENTRY
            </button>
          </motion.div>
        ) : displayEntries.length === 0 ? (
          <div className="text-center py-12">
            <Search size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-bold">No entries match your filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayEntries.map((entry, i) => {
              const meta = getCatMeta(entry.category);
              const isRevenue = entry.category === 'Revenue';
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className={`flex items-center gap-3 md:gap-4 bg-white dark:bg-charcoal border rounded-2xl p-3 md:p-4 shadow-sm group hover:shadow-md transition-all ${
                    isRevenue ? 'border-emerald-500/20' : 'border-black/5 dark:border-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${meta.gradient} text-white`}>
                    <meta.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{entry.description}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${meta.color}`}>
                        {entry.category}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400">{entry.date}</span>
                    </div>
                  </div>
                  <div className={`text-base md:text-lg font-outfit font-bold shrink-0 ${isRevenue ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                    {isRevenue ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(entry)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gold hover:bg-gold/10 transition-all"
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add/Edit Form Modal ─────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-xl" onClick={() => { setShowForm(false); setEditingId(null); }} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-charcoal rounded-[2.5rem] p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-outfit font-bold text-gray-900 dark:text-white">
                  {editingId ? 'Edit Entry' : 'Add Entry'}
                </h3>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400"><X size={18} /></button>
              </div>

              {/* Quick Templates */}
              {!editingId && (
                <div className="mb-5">
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center gap-2 text-[10px] font-bold text-gold uppercase tracking-widest mb-2 hover:opacity-70 transition-opacity"
                  >
                    <Zap size={11} /> Quick Templates <ChevronRight size={11} className={`transition-transform ${showTemplates ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-1.5 pb-2">
                          {QUICK_TEMPLATES.map(tpl => (
                            <button
                              key={tpl.desc}
                              onClick={() => useTemplate(tpl)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold tracking-wider border border-black/5 dark:border-white/10 text-gray-500 hover:border-gold/30 hover:text-gold transition-all"
                            >
                              <tpl.icon size={10} /> {tpl.desc}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.label}
                        onClick={() => setForm(f => ({ ...f, category: cat.label }))}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-center ${form.category === cat.label ? `${cat.color} border-current shadow-sm` : 'border-black/5 dark:border-white/10 text-gray-400 hover:border-gray-300'}`}
                      >
                        <cat.icon size={14} />
                        <span className="text-[8px] font-bold">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Hybrid wheat seeds 5kg"
                    className="w-full h-12 px-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-sm font-bold text-gray-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Amount (₹)</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0"
                      className="w-full h-12 px-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-sm font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full h-12 px-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-gold/30 text-sm font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAdd}
                  disabled={!form.description || !form.amount || saving}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-bold tracking-widest uppercase hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-gold/20"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : editingId ? <Check size={18} /> : <Plus size={18} />}
                  {editingId ? 'UPDATE ENTRY' : 'ADD ENTRY'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
