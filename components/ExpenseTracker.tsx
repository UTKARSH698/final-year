
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, IndianRupee, TrendingUp, TrendingDown,
  Loader2, Wallet, Leaf, Droplets, Users, Wrench, Bug, Package, X, CheckCircle2,
  BarChart3, PieChart, Lightbulb, Calendar, Download
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { ExpenseEntry } from '../types';

const CATEGORIES: { label: ExpenseEntry['category']; icon: React.FC<any>; color: string }[] = [
  { label: 'Seeds',      icon: Leaf,        color: 'text-emerald-500 bg-emerald-500/10' },
  { label: 'Fertilizer', icon: Package,     color: 'text-blue-500 bg-blue-500/10' },
  { label: 'Labor',      icon: Users,       color: 'text-purple-500 bg-purple-500/10' },
  { label: 'Irrigation', icon: Droplets,    color: 'text-cyan-500 bg-cyan-500/10' },
  { label: 'Equipment',  icon: Wrench,      color: 'text-orange-500 bg-orange-500/10' },
  { label: 'Pesticide',  icon: Bug,         color: 'text-red-500 bg-red-500/10' },
  { label: 'Revenue',    icon: TrendingUp,  color: 'text-gold bg-gold/10' },
  { label: 'Other',      icon: Wallet,      color: 'text-gray-500 bg-gray-500/10' },
];

interface ExpenseTrackerProps {
  onBack: () => void;
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const handleAdd = async () => {
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
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
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) setEntries(prev => prev.filter(e => e.id !== id));
  };

  const { totalExpense, totalRevenue, profit, byCategory, monthlyData, categoryPct, insights } = useMemo(() => {
    const totalRevenue = entries.filter(e => e.category === 'Revenue').reduce((s, e) => s + e.amount, 0);
    const totalExpense = entries.filter(e => e.category !== 'Revenue').reduce((s, e) => s + e.amount, 0);
    const profit = totalRevenue - totalExpense;
    const byCategory: Record<string, number> = {};
    entries.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + (e.category === 'Revenue' ? 0 : e.amount); });

    // Monthly aggregation (last 6 months)
    const monthMap: Record<string, { expense: number; revenue: number }> = {};
    entries.forEach(e => {
      const m = e.date.slice(0, 7); // "YYYY-MM"
      if (!monthMap[m]) monthMap[m] = { expense: 0, revenue: 0 };
      if (e.category === 'Revenue') monthMap[m].revenue += e.amount;
      else monthMap[m].expense += e.amount;
    });
    const monthlyData = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        label: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        ...data,
      }));

    // Category percentage breakdown
    const catEntries = Object.entries(byCategory).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const categoryPct = catEntries.map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      pct: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0,
    }));

    // Smart insights
    const insights: string[] = [];
    if (catEntries.length > 0) {
      insights.push(`Highest spend: ${catEntries[0][0]} at ₹${catEntries[0][1].toLocaleString('en-IN')} (${totalExpense > 0 ? Math.round((catEntries[0][1] / totalExpense) * 100) : 0}% of total)`);
    }
    if (totalRevenue > 0 && totalExpense > 0) {
      const margin = Math.round((profit / totalRevenue) * 100);
      insights.push(`Profit margin: ${margin}% — ${margin >= 30 ? 'Healthy farm economics' : margin >= 10 ? 'Moderate returns, look to optimize costs' : 'Low margin — review high-cost categories'}`);
    }
    if (monthlyData.length >= 2) {
      const last = monthlyData[monthlyData.length - 1];
      const prev = monthlyData[monthlyData.length - 2];
      if (prev.expense > 0) {
        const change = Math.round(((last.expense - prev.expense) / prev.expense) * 100);
        insights.push(`Month-over-month: expenses ${change >= 0 ? `up ${change}%` : `down ${Math.abs(change)}%`} vs previous month`);
      }
    }
    if (totalExpense > 0 && entries.filter(e => e.category !== 'Revenue').length > 0) {
      const avgPerEntry = Math.round(totalExpense / entries.filter(e => e.category !== 'Revenue').length);
      insights.push(`Average transaction: ₹${avgPerEntry.toLocaleString('en-IN')} per expense entry`);
    }

    return { totalExpense, totalRevenue, profit, byCategory, monthlyData, categoryPct, insights };
  }, [entries]);

  const exportCSV = () => {
    const header = 'Date,Category,Description,Amount,Type\n';
    const rows = entries.map(e =>
      `${e.date},${e.category},"${e.description.replace(/"/g, '""')}",${e.amount},${e.category === 'Revenue' ? 'Revenue' : 'Expense'}`
    ).join('\n');
    const summary = `\n\nSummary\nTotal Expenses,${totalExpense}\nTotal Revenue,${totalRevenue}\nNet ${profit >= 0 ? 'Profit' : 'Loss'},${Math.abs(profit)}`;
    const blob = new Blob([header + rows + summary], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
    <div className="min-h-screen pt-24 pb-20 px-6 bg-ivory dark:bg-obsidian">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 mb-4 text-sm font-bold tracking-widest hover:text-gold transition-colors">
              <ArrowLeft size={16} /> DASHBOARD
            </button>
            <h1 className="text-5xl font-outfit font-bold text-gray-900 dark:text-white mb-2">Expense Tracker</h1>
            <p className="text-gray-500 font-medium">Track your farm income and costs per crop cycle.</p>
          </div>
          <div className="flex items-center gap-3 mt-12">
          {entries.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-gold/30 text-gold font-bold text-sm tracking-widest hover:bg-gold/10 transition-all"
            >
              <Download size={14} /> CSV
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-charcoal dark:bg-gold text-white dark:text-black font-bold text-sm tracking-widest hover:scale-105 transition-all shadow-xl"
          >
            <Plus size={16} /> ADD ENTRY
          </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Expenses', value: totalExpense, color: 'text-red-500', icon: TrendingDown },
            { label: 'Total Revenue', value: totalRevenue, color: 'text-emerald-500', icon: TrendingUp },
            { label: profit >= 0 ? 'Net Profit' : 'Net Loss', value: Math.abs(profit), color: profit >= 0 ? 'text-gold' : 'text-red-500', icon: profit >= 0 ? CheckCircle2 : TrendingDown },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                <card.icon size={14} className={card.color} /> {card.label}
              </div>
              <div className={`text-3xl font-outfit font-bold ${card.color} flex items-center gap-1`}>
                <IndianRupee size={20} />{card.value.toLocaleString('en-IN')}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Category Breakdown */}
        {Object.keys(byCategory).length > 0 && (
          <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg mb-8">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Expense by Category</div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(byCategory).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                const meta = getCatMeta(cat);
                return (
                  <div key={cat} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${meta.color}`}>
                    <meta.icon size={14} />
                    <span className="text-xs font-bold">{cat}</span>
                    <span className="text-xs font-bold">₹{amt.toLocaleString('en-IN')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Expenses Analyser ─────────────────────────────────────────── */}
        {entries.length > 0 && (
          <>
            {/* Monthly Trend Chart */}
            {monthlyData.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg mb-8"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                  <BarChart3 size={14} className="text-gold" /> Monthly Trend
                </div>
                <div className="flex items-end gap-3 h-44">
                  {(() => {
                    const maxVal = Math.max(...monthlyData.map(m => Math.max(m.expense, m.revenue)), 1);
                    return monthlyData.map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-1 items-end justify-center h-32">
                          <div
                            className="w-5 rounded-t-lg bg-red-400/80 transition-all duration-500"
                            style={{ height: `${Math.max((m.expense / maxVal) * 100, 4)}%` }}
                            title={`Expense: ₹${m.expense.toLocaleString('en-IN')}`}
                          />
                          <div
                            className="w-5 rounded-t-lg bg-emerald-400/80 transition-all duration-500"
                            style={{ height: `${Math.max((m.revenue / maxVal) * 100, 4)}%` }}
                            title={`Revenue: ₹${m.revenue.toLocaleString('en-IN')}`}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{m.label}</span>
                      </div>
                    ));
                  })()}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-400/80" /><span className="text-[10px] font-bold text-gray-400">Expenses</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-400/80" /><span className="text-[10px] font-bold text-gray-400">Revenue</span></div>
                </div>
              </motion.div>
            )}

            {/* Category % Breakdown with Progress Bars */}
            {categoryPct.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg mb-8"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
                  <PieChart size={14} className="text-gold" /> Category Analysis
                </div>
                <div className="space-y-3">
                  {categoryPct.map(({ category, amount, pct }) => {
                    const meta = getCatMeta(category);
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <meta.icon size={14} className={meta.color.split(' ')[0]} />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-500">₹{amount.toLocaleString('en-IN')}</span>
                            <span className="text-xs font-bold text-gold w-10 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Smart Insights */}
            {insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg mb-8"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  <Lightbulb size={14} className="text-gold" /> Smart Insights
                </div>
                <div className="space-y-3">
                  {insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gold/5 dark:bg-gold/10">
                      <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-gold">{i + 1}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{insight}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Entries List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gold" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 mb-6">
              <Wallet size={32} className="text-gold" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No Entries Yet</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">Start tracking your farm finances. Add seeds, fertilizer, labor, irrigation costs or record your crop revenue above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => {
              const meta = getCatMeta(entry.category);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-2xl p-4 shadow-sm group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                    <meta.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{entry.description}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{entry.category} · {entry.date}</div>
                  </div>
                  <div className={`text-lg font-outfit font-bold shrink-0 ${entry.category === 'Revenue' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                    {entry.category === 'Revenue' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-xl" onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-charcoal rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-outfit font-bold text-gray-900 dark:text-white">Add Entry</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.label}
                        onClick={() => setForm(f => ({ ...f, category: cat.label }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center ${form.category === cat.label ? `${cat.color} border-current` : 'border-black/5 dark:border-white/10 text-gray-400 hover:border-gray-300'}`}
                      >
                        <cat.icon size={14} />
                        <span className="text-[9px] font-bold">{cat.label}</span>
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
                  className="w-full py-4 rounded-2xl bg-charcoal dark:bg-gold text-white dark:text-black font-bold tracking-widest uppercase hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} ADD ENTRY
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
