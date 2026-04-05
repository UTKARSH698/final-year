
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History as HistoryIcon,
  Calendar,
  ArrowLeft,
  FileText,
  Trash2,
  Loader2,
  Droplets,
  Sprout,
  Search,
  Filter,
  BarChart2,
  TrendingUp,
  Award,
  Bug,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../AuthContext';

interface Report {
  id: string;
  type: string;
  title: string;
  summary: string;
  timestamp: string;
  data: any;
}

interface HistoryProps {
  onBack: () => void;
}

// ─── Analytics helpers ────────────────────────────────────────────────────────

const CropBarChart: React.FC<{ data: { name: string; count: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 w-28 truncate text-right">{d.name}</span>
          <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.count / max) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-gold"
            />
          </div>
          <span className="text-[11px] font-bold text-gold w-5 text-left">{d.count}</span>
        </div>
      ))}
    </div>
  );
};

const ConfidenceSparkline: React.FC<{ values: number[] }> = ({ values }) => {
  if (values.length < 2) return null;
  const W = 200, H = 48, pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const last = values[values.length - 1];
  const lx = pad + ((values.length - 1) / (values.length - 1)) * (W - pad * 2);
  const ly = H - pad - ((last - min) / range) * (H - pad * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12">
      <polyline points={pts} fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3" fill="#D4AF37" />
    </svg>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const History: React.FC<HistoryProps> = ({ onBack }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filter, setFilter] = useState<'all' | 'Crop Prediction' | 'Drone Scan' | 'Disease Detection'>('all');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const { user } = useAuth();

  // ── Derived analytics ──────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const cropReports = reports.filter(r => r.type === 'Crop Prediction' && r.data?.cropName);
    const cropFreq: Record<string, number> = {};
    cropReports.forEach(r => {
      cropFreq[r.data.cropName] = (cropFreq[r.data.cropName] || 0) + 1;
    });
    const topCrops = Object.entries(cropFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const confidences = cropReports
      .map(r => Number(r.data.confidence))
      .filter(c => !isNaN(c));
    const avgConf = confidences.length
      ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
      : null;

    const recentConf = cropReports
      .slice(-8)
      .map(r => Number(r.data.confidence))
      .filter(c => !isNaN(c));

    const topCrop = topCrops[0]?.name ?? null;

    const totalDiseaseReports = reports.filter(r => r.type === 'Disease Detection').length;
    const totalDroneReports = reports.filter(r => r.type === 'Drone Scan').length;

    return { topCrops, avgConf, recentConf, topCrop, totalCropReports: cropReports.length, totalDiseaseReports, totalDroneReports };
  }, [reports]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("[HISTORY] Fetching reports...");
      const res = await fetch('/api/reports', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        console.log(`[HISTORY] Received ${data.length} reports`);
        setReports(data);
      } else {
        const errData = await res.json();
        console.error("[HISTORY] Fetch failed:", errData);
        setError(errData.error || "Failed to load history");
      }
    } catch (err) {
      console.error("[HISTORY] Error fetching reports:", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      const res = await fetch(`/api/reports/${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id));
        if (selectedReport?.id === id) setSelectedReport(null);
      }
    } catch (err) {
      console.error("Failed to delete report", err);
    }
  };

  const filteredReports = reports.filter(r => filter === 'all' || r.type === filter);

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-12 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-6">
          <HistoryIcon className="text-gold w-10 h-10" />
        </div>
        <h2 className="text-3xl font-outfit font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-500 max-w-md mb-8">Please log in to view your analysis history and saved reports.</p>
        <button 
          onClick={onBack}
          className="px-8 py-3 rounded-xl bg-gold text-white font-bold tracking-widest uppercase hover:scale-105 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors group w-fit"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-jakarta font-bold text-xs tracking-widest uppercase">Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
            <HistoryIcon className="text-gold w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-outfit font-bold text-gray-900 dark:text-ivory">Analysis History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">Your personal archive of agricultural insights</p>
          </div>
        </div>
      </div>

      {/* ── Analytics Dashboard ─────────────────────────────────────── */}
      {!loading && reports.length > 0 && (
        <div className="mb-10">
          <button
            onClick={() => setShowAnalytics(v => !v)}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 hover:text-gold transition-colors"
          >
            <BarChart2 size={14} />
            Analytics Overview
            <span className="ml-1 text-gold">{showAnalytics ? '▲' : '▼'}</span>
          </button>

          <AnimatePresence>
            {showAnalytics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-5 rounded-2xl bg-white dark:bg-charcoal border border-black/5 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-gold" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Reports</span>
                    </div>
                    <div className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">{reports.length}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{analytics.totalCropReports} crop · {analytics.totalDroneReports} drone · {analytics.totalDiseaseReports} scan</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-charcoal border border-black/5 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg Confidence</span>
                    </div>
                    <div className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">
                      {analytics.avgConf !== null ? `${analytics.avgConf}%` : '—'}
                    </div>
                    {analytics.recentConf.length >= 2 && (
                      <ConfidenceSparkline values={analytics.recentConf} />
                    )}
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-charcoal border border-black/5 dark:border-white/5 shadow-sm col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Award size={14} className="text-gold" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top Crop</span>
                    </div>
                    <div className="text-2xl font-outfit font-bold text-gray-900 dark:text-white truncate">
                      {analytics.topCrop ?? '—'}
                    </div>
                    {analytics.topCrop && (
                      <div className="text-[10px] text-emerald-500 font-bold mt-1">
                        Recommended {analytics.topCrops[0]?.count}×
                      </div>
                    )}
                  </div>
                </div>

                {/* Crop frequency chart */}
                {analytics.topCrops.length > 0 && (
                  <div className="p-6 rounded-2xl bg-white dark:bg-charcoal border border-black/5 dark:border-white/5 shadow-sm">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Crop Recommendation Frequency</h5>
                    <CropBarChart data={analytics.topCrops} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Reports List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex flex-col gap-3 mb-4 px-2">
            <h3 className="text-sm font-jakarta font-bold text-gray-400 uppercase tracking-widest">Recent Reports</h3>
            <div className="flex flex-wrap gap-2">
              {(['all', 'Crop Prediction', 'Disease Detection', 'Drone Scan'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    filter === f
                      ? 'bg-gold text-black'
                      : 'bg-white/5 dark:bg-white/5 text-gray-500 border border-black/5 dark:border-white/10 hover:border-gold/30'
                  }`}
                >
                  {f === 'all' && <Filter size={10} />}
                  {f === 'Crop Prediction' && <Sprout size={10} />}
                  {f === 'Disease Detection' && <Bug size={10} />}
                  {f === 'Drone Scan' && <Droplets size={10} />}
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 className="animate-spin mb-4" />
              <p className="text-xs font-bold tracking-widest uppercase">Loading Archive...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center rounded-2xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button 
                onClick={fetchReports}
                className="text-xs font-bold text-gold uppercase tracking-widest hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-16 text-center rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 mb-6">
                <FileText size={32} className="text-gold" />
              </div>
              <h3 className="text-lg font-outfit font-bold text-gray-700 dark:text-gray-300 mb-2">No Reports Yet</h3>
              <p className="text-gray-400 text-sm max-w-sm mx-auto">Run your first crop analysis from the home page. All predictions, disease scans, and drone reports will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredReports.map((report) => (
                <motion.div
                  key={report.id}
                  layoutId={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all relative group ${
                    selectedReport?.id === report.id 
                      ? 'bg-gold/10 border-gold shadow-lg' 
                      : 'bg-white/5 border-black/5 dark:border-white/5 hover:border-gold/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {report.type === 'Crop Prediction' ? (
                        <Sprout className="w-4 h-4 text-emerald-500" />
                      ) : report.type === 'Disease Detection' ? (
                        <Bug className="w-4 h-4 text-red-400" />
                      ) : (
                        <Droplets className="w-4 h-4 text-blue-500" />
                      )}
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{report.type}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteReport(report.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h4 className="font-outfit font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{report.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                    <Calendar size={10} />
                    {new Date(report.timestamp).toLocaleDateString()} at {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Report Details */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div
                key={selectedReport.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      selectedReport.type === 'Crop Prediction' ? 'bg-emerald-500/10 text-emerald-500' :
                      selectedReport.type === 'Disease Detection' ? 'bg-red-500/10 text-red-400' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {selectedReport.type === 'Crop Prediction' ? <Sprout size={28} /> :
                       selectedReport.type === 'Disease Detection' ? <Bug size={28} /> :
                       <Droplets size={28} />}
                    </div>
                    <div>
                      <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">{selectedReport.title}</h2>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{selectedReport.type} Report</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Report ID</p>
                    <p className="text-xs font-mono text-gold font-bold">{selectedReport.id.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <h5 className="text-[10px] font-bold text-gold uppercase tracking-widest mb-3">Executive Summary</h5>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
                      "{selectedReport.summary}"
                    </p>
                  </div>

                  {selectedReport.type === 'Crop Prediction' && selectedReport.data && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                        <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-4">Recommendation</h5>
                        <div className="flex items-center gap-4">
                          <div className="text-4xl font-outfit font-bold text-gray-900 dark:text-white">{selectedReport.data.cropName}</div>
                          <div className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                            {selectedReport.data.confidence}% CONFIDENCE
                          </div>
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-gold/5 border border-gold/10">
                        <h5 className="text-[10px] font-bold text-gold uppercase tracking-widest mb-4">Market Outlook</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {selectedReport.data.marketAnalysis || "Market data not available for this period."}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedReport.type === 'Disease Detection' && selectedReport.data && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
                          <span className="block text-[10px] font-bold text-red-500 uppercase mb-1">Severity</span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">{selectedReport.data.severity ?? '—'}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10 text-center">
                          <span className="block text-[10px] font-bold text-gold uppercase mb-1">Confidence</span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">{selectedReport.data.confidence ?? '—'}%</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-center">
                          <span className="block text-[10px] font-bold text-purple-500 uppercase mb-1">Pathogen</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedReport.data.pathogenType ?? '—'}</span>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Treatment</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedReport.data.treatment}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Symptoms</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{selectedReport.data.symptoms}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Prevention</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">{selectedReport.data.prevention}</p>
                        </div>
                      </div>

                      {selectedReport.data.affectedCrops && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Affects:</span>
                          {selectedReport.data.affectedCrops.split(',').map((c: string, i: number) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20">
                              {c.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedReport.type === 'Drone Scan' && selectedReport.data && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-center">
                          <span className="block text-[10px] font-bold text-blue-500 uppercase mb-1">Moisture</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">{selectedReport.data.soilMoisture?.percentage}%</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                          <span className="block text-[10px] font-bold text-emerald-500 uppercase mb-1">Health</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">{selectedReport.data.vegetationIndex?.health}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10 text-center">
                          <span className="block text-[10px] font-bold text-gold uppercase mb-1">Sources</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">{selectedReport.data.sources?.length}</span>
                        </div>
                      </div>
                      
                      <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Detected Sources</h5>
                        <div className="space-y-3">
                          {selectedReport.data.sources?.map((s: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{s.name}</span>
                              <span className="text-[10px] font-bold text-gold uppercase">{s.distance}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-8 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                      <FileText size={14} />
                      Full Analysis Logged
                    </div>
                    <button className="text-gold font-bold text-xs tracking-widest uppercase hover:underline">
                      Download PDF Report
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-dashed border-gray-300 dark:border-gray-800 rounded-[3rem]">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
                  <Search className="text-gray-400 w-8 h-8" />
                </div>
                <h3 className="text-xl font-outfit font-bold text-gray-900 dark:text-white mb-2">Select a report</h3>
                <p className="text-gray-500 text-sm max-w-xs">Choose an analysis from your history to view detailed insights and recommendations.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
