
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, X, ShieldAlert, Sparkles, Loader2,
  ArrowLeft, Pill, Bug, Droplets, Share2, Download, AlertTriangle,
  Leaf, Zap, FlaskConical, Clock, History, ChevronRight,
  Smartphone, Upload, Target, Activity, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Shield, Microscope, Sprout, ThermometerSun,
  ImageIcon, BarChart3, AlertCircle, PartyPopper, Columns2
} from 'lucide-react';
import { detectDiseaseFromImage } from '../services/geminiService';
import { DiseaseDetectionResult } from '../types';
import { useAuth } from '../AuthContext';

interface DiseaseDetectorProps {
  onBack: () => void;
}

/* ── Rasterize an SVG path to a base64 JPEG via Canvas ── */
async function rasterizeSvg(svgUrl: string): Promise<string> {
  // Fetch SVG as text and convert to blob URL to avoid canvas taint
  const resp = await fetch(svgUrl);
  const svgText = await resp.text();
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const blobUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 600; c.height = 600;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(img, 0, 0, 600, 600);
      URL.revokeObjectURL(blobUrl);
      resolve(c.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject(new Error('Failed to load sample image')); };
    img.src = blobUrl;
  });
}

const SAMPLE_DISEASES = [
  { name: 'Rice Blast', emoji: '🌾', desc: 'Fungal leaf spots on paddy', file: '/samples/rice-blast.svg' },
  { name: 'Tomato Blight', emoji: '🍅', desc: 'Late blight on tomato leaves', file: '/samples/tomato-blight.svg' },
  { name: 'Wheat Rust', emoji: '🌿', desc: 'Rust pustules on wheat', file: '/samples/wheat-rust.svg' },
  { name: 'Cotton Wilt', emoji: '🧶', desc: 'Fusarium wilt symptoms', file: '/samples/cotton-wilt.svg' },
];

const SEVERITY_CONFIG = {
  Low:      { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', bar: 'bg-emerald-500', color: '#22c55e', pct: 30 },
  Moderate: { bg: 'bg-amber-500/10',   text: 'text-amber-500',   border: 'border-amber-500/20',   bar: 'bg-amber-500',   color: '#f59e0b', pct: 60 },
  High:     { bg: 'bg-red-500/10',     text: 'text-red-500',     border: 'border-red-500/20',     bar: 'bg-red-500',     color: '#ef4444', pct: 90 },
};

const PATHOGEN_ICON_MAP: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  Fungal:        { icon: Bug,          color: 'text-purple-500',  bg: 'bg-purple-500/10' },
  Bacterial:     { icon: FlaskConical, color: 'text-blue-500',    bg: 'bg-blue-500/10' },
  Viral:         { icon: Zap,          color: 'text-red-500',     bg: 'bg-red-500/10' },
  Pest:          { icon: Bug,          color: 'text-orange-500',  bg: 'bg-orange-500/10' },
  Nematode:      { icon: Droplets,     color: 'text-cyan-500',    bg: 'bg-cyan-500/10' },
  Environmental: { icon: ThermometerSun, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  Deficiency:    { icon: Pill,         color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

const DISEASE_TYPE_META: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  Biotic:      { icon: Microscope, color: 'text-blue-500',    bg: 'bg-blue-500/10' },
  Abiotic:     { icon: ThermometerSun, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  Nutritional: { icon: Sprout,     color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

/* ── Animated Severity Ring ──────────────────── */
const SeverityRing: React.FC<{ severity: 'Low' | 'Moderate' | 'High' }> = ({ severity }) => {
  const config = SEVERITY_CONFIG[severity];
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progress = (config.pct / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className="text-gray-100 dark:text-white/5" />
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={config.color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${progress} ${circumference - progress}` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <ShieldAlert size={16} className={config.text} />
        <span className={`text-[10px] font-bold mt-0.5 ${config.text}`}>{severity}</span>
      </div>
    </div>
  );
};

/* ── Confidence Gauge ────────────────────────── */
const ConfidenceGauge: React.FC<{ value: number }> = ({ value }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="9" className="text-gray-100 dark:text-white/5" />
        <motion.circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="url(#confidenceGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${progress} ${circumference - progress}` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="confidenceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#d4af37" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-outfit font-bold text-gold">{value}%</span>
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Confidence</span>
      </div>
    </div>
  );
};

export const DiseaseDetector: React.FC<DiseaseDetectorProps> = ({ onBack }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<DiseaseDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [scanTime, setScanTime] = useState<number>(0);
  const [scanCount, setScanCount] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSlot, setCompareSlot] = useState<{ image: string; result: DiseaseDetectionResult } | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Fetch recent scans
  useEffect(() => {
    if (!user) return;
    fetch('/api/reports', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const diseaseScans = data.filter((r: any) => r.type === 'Disease Detection').slice(0, 6);
        setRecentScans(diseaseScans);
      })
      .catch(() => {});
  }, [user, result]);

  const compressImage = (base64: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = base64;
    });

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const raw = reader.result as string;
      const compressed = await compressImage(raw);
      setImage(compressed);
      setError(null);
      await processImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  /* Load a local sample SVG, rasterize to JPEG, then analyze */
  const loadSampleImage = async (sample: typeof SAMPLE_DISEASES[0]) => {
    setLoadingSample(sample.name);
    setError(null);
    try {
      const dataUrl = await rasterizeSvg(sample.file);
      setImage(dataUrl);
      setLoadingSample(null);
      await processImage(dataUrl);
    } catch {
      setLoadingSample(null);
      setError(`Couldn't load sample. Please upload your own image.`);
    }
  };

  const processImage = async (base64: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    const startTime = Date.now();
    try {
      const data = await detectDiseaseFromImage(base64);
      setScanTime(((Date.now() - startTime) / 1000));
      setResult(data);
      setScanCount(c => c + 1);

      if (user && data.isValidImage && data.diseaseName !== 'Healthy Plant — No Disease Detected') {
        try {
          await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              type: 'Disease Detection',
              title: `Disease Scan: ${data.diseaseName}`,
              summary: `${data.diseaseName} detected with ${data.confidence}% confidence. Severity: ${data.severity}.`,
              data,
            }),
          });
        } catch { /* silent */ }
      }
    } catch (e) {
      console.error(e);
      setError('Analysis failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveToCompare = () => {
    if (image && result?.isValidImage) {
      setCompareSlot({ image, result });
      reset();
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setScanTime(0);
  };

  const handleShare = async () => {
    if (!result) return;
    const shareText = `AgriFuture AI Diagnosis: Detected "${result.diseaseName}" with ${result.confidence}% confidence. Severity: ${result.severity}. #AgriFuture #PlantHealth`;
    if (navigator.share) {
      try { await navigator.share({ title: 'AgriFuture Disease Report', text: shareText, url: window.location.href }); }
      catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  };

  const handleWhatsApp = () => {
    if (!result) return;
    const text = `*AgriFuture Disease Report*%0A%0A*Disease:* ${result.diseaseName}%0A*Confidence:* ${result.confidence}%%0A*Severity:* ${result.severity}%0A*Treatment:* ${result.treatment}%0A%0A_via AgriFuture India_`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const pdfRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!result || !pdfRef.current) return;
    setIsExporting(true);
    const el = pdfRef.current;
    el.style.visibility = 'visible';
    await new Promise(r => setTimeout(r, 100));
    const opt = {
      margin: 0,
      filename: `AgriFuture_Disease_Report_${result.diseaseName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'px', format: 'a4', orientation: 'portrait', hotfixes: ['px_scaling'] },
    };
    try {
      await (window as any).html2pdf().set(opt).from(el).save();
    } catch { window.print(); }
    finally {
      el.style.visibility = 'hidden';
      setIsExporting(false);
    }
  };

  // Parse treatment into steps
  const treatmentSteps = useMemo(() => {
    if (!result?.treatment) return [];
    return result.treatment
      .split(/(?:\d+\.\s*|•\s*|\n+)/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }, [result?.treatment]);

  // Parse affected crops into array
  const cropTags = useMemo(() => {
    if (!result?.affectedCrops) return [];
    return result.affectedCrops.split(/[,;&]+/).map(c => c.trim()).filter(Boolean);
  }, [result?.affectedCrops]);

  const sev = result?.severity ? SEVERITY_CONFIG[result.severity] ?? SEVERITY_CONFIG.Low : null;
  const pathMeta = result?.pathogenType ? PATHOGEN_ICON_MAP[result.pathogenType] ?? PATHOGEN_ICON_MAP.Fungal : null;
  const typeMeta = result?.diseaseType ? DISEASE_TYPE_META[result.diseaseType] ?? DISEASE_TYPE_META.Biotic : null;

  const isHealthy = result?.isValidImage && result.diseaseName?.toLowerCase().includes('healthy');

  // Computed risk metrics
  const riskMetrics = useMemo(() => {
    if (!result?.isValidImage || isHealthy) return null;
    const spreadRisk = result.severity === 'High' ? 'High' : result.severity === 'Moderate' ? 'Medium' : 'Low';
    const cropLoss = result.severity === 'High' ? '30-60%' : result.severity === 'Moderate' ? '10-30%' : '5-10%';
    const urgency = result.severity === 'High' ? 'Treat within 24-48 hours' : result.severity === 'Moderate' ? 'Treat within 1 week' : 'Monitor and treat if spreading';
    return { spreadRisk, cropLoss, urgency };
  }, [result, isHealthy]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-6 bg-ivory dark:bg-obsidian">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ────────────────────────────────────── */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gold transition-colors mb-4 text-sm font-bold tracking-widest">
              <ArrowLeft size={16} /> DASHBOARD
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">Disease Intelligence</h1>
              {scanCount > 0 && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gold/10 text-gold border border-gold/20">
                  {scanCount} scan{scanCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-2 text-base">Upload or drag-drop a leaf image for instant AI pathogen detection</p>
          </div>
          <div className="flex items-center gap-2">
            {result?.isValidImage && !isHealthy && (
              <button
                onClick={saveToCompare}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs tracking-widest transition-all ${
                  compareSlot ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' : 'border-gold/30 text-gold hover:bg-gold/10'
                }`}
              >
                <Columns2 size={14} /> {compareSlot ? 'SLOT 1 SAVED' : 'SAVE TO COMPARE'}
              </button>
            )}
            {recentScans.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gold/30 text-gold font-bold text-xs tracking-widest hover:bg-gold/10 transition-all"
              >
                <History size={14} /> SCAN HISTORY ({recentScans.length})
              </button>
            )}
          </div>
        </div>

        {/* ── Recent Scans (collapsible) ────────────────── */}
        <AnimatePresence>
          {showHistory && recentScans.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {recentScans.map((scan, i) => (
                  <div key={scan.id || i} className="min-w-[200px] bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-2xl p-4 shrink-0">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{scan.created_at?.slice(0, 10)}</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{scan.title?.replace('Disease Scan: ', '')}</div>
                    <div className="text-[10px] text-gray-500 mt-1 truncate">{scan.summary?.slice(0, 60)}...</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* ── Left — Image Upload ─────────────────────── */}
          <div className="space-y-4">
            {!image ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group aspect-square rounded-[3rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer no-print shadow-xl relative overflow-hidden
                  ${isDragging
                    ? 'border-gold bg-gold/5 scale-[1.01]'
                    : 'border-black/10 dark:border-white/10 bg-white dark:bg-charcoal hover:border-gold/50'
                  }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                  backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />

                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-colors relative z-10 ${isDragging ? 'bg-gold/20' : 'bg-gold/10 group-hover:bg-gold/20'}`}>
                  <Camera className="text-gold w-10 h-10" />
                </div>
                <h3 className="text-xl font-outfit font-bold text-gray-900 dark:text-white relative z-10">
                  {isDragging ? 'Drop it here!' : 'Snap or Upload'}
                </h3>
                <p className="text-sm text-gray-400 mt-2 font-inter relative z-10">
                  {isDragging ? '' : 'Drag & drop or click to browse'}
                </p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1 relative z-10">JPG · PNG · WEBP</p>

                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                <input type="file" ref={cameraInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" capture="environment" />
              </div>
            ) : (
              <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-black/5 dark:border-white/10 shadow-2xl group">
                <img src={image} className="w-full h-full object-cover" alt="Leaf input" />
                {loading && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center no-print gap-4">
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 border-2 border-gold/30 rounded-full animate-ping" />
                      <div className="absolute inset-2 border-2 border-emerald-500/20 rounded-full animate-ping [animation-delay:0.3s]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="text-gold animate-spin" size={36} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-outfit text-sm font-bold tracking-wider">Analysing Pathogen...</p>
                      <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mt-1">Gemini AI Processing</p>
                    </div>
                  </div>
                )}
                {!loading && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={reset} className="p-3 bg-black/50 hover:bg-black/70 rounded-full text-white no-print transition-colors backdrop-blur-sm">
                      <X size={18} />
                    </button>
                  </div>
                )}
                {/* Scan time badge */}
                {!loading && scanTime > 0 && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white">
                    <Clock size={11} />
                    <span className="text-[10px] font-bold">{scanTime.toFixed(1)}s scan</span>
                  </div>
                )}
              </div>
            )}

            {/* Upload buttons (shown when no image) */}
            {!image && (
              <div className="flex gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-bold text-xs tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-gold/20"
                >
                  <Smartphone size={15} /> TAKE PHOTO
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white dark:bg-charcoal border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs tracking-widest hover:border-gold/30 transition-all shadow-lg"
                >
                  <Upload size={15} /> UPLOAD FILE
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Sample Images Gallery (for demo/presentation) */}
            {!image && !loading && (
              <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-lg">
                <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ImageIcon size={11} /> Try Sample Images
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_DISEASES.map(sample => (
                    <button
                      key={sample.name}
                      onClick={() => loadSampleImage(sample)}
                      disabled={!!loadingSample}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-gold/30 hover:bg-gold/5 transition-all text-left group disabled:opacity-50"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shrink-0 bg-[#1a2e1a]">
                        <img src={sample.file} alt={sample.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-gold transition-colors">{sample.name}</div>
                        <div className="text-[9px] text-gray-400 truncate">{sample.desc}</div>
                      </div>
                      {loadingSample === sample.name && <Loader2 size={12} className="animate-spin text-gold ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick tips (shown when no result) */}
            {!result && !loading && !image && (
              <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-lg">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tips for Best Results</h4>
                <div className="space-y-2.5">
                  {[
                    { icon: Target, text: 'Focus on the affected area of the leaf' },
                    { icon: Activity, text: 'Good lighting improves detection accuracy' },
                    { icon: Leaf, text: 'Include both healthy and diseased parts' },
                    { icon: Camera, text: 'Avoid blurry images — hold the camera steady' },
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                        <tip.icon size={12} className="text-gold" />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{tip.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right — Results ──────────────────────────── */}
          <div className="space-y-6">
            {result ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                {result.isValidImage ? (
                  <div className="space-y-4">

                    {/* ── Healthy Plant Celebration ────────── */}
                    {isHealthy ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                          className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5"
                        >
                          <CheckCircle2 size={48} className="text-emerald-500" />
                        </motion.div>
                        <h2 className="text-3xl font-outfit font-bold text-emerald-600 dark:text-emerald-400 mb-2">Healthy Plant!</h2>
                        <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">No diseases detected. Your plant looks healthy and thriving. Keep up the good agricultural practices!</p>
                        <div className="flex items-center justify-center gap-4 mb-6">
                          <div className="text-center">
                            <div className="text-2xl font-outfit font-bold text-gold">{result.confidence}%</div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Confidence</span>
                          </div>
                          {scanTime > 0 && (
                            <div className="text-center">
                              <div className="text-2xl font-outfit font-bold text-emerald-500">{scanTime.toFixed(1)}s</div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">Scan Time</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={reset} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-bold text-xs tracking-widest hover:scale-105 transition-all shadow-lg shadow-gold/20">
                            SCAN ANOTHER
                          </button>
                          <button onClick={handleShare} className="p-3 rounded-2xl bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 text-gray-400 hover:text-gold transition-colors">
                            <Share2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                    <>
                    {/* ── Main Result Card ──────────────────── */}
                    <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2.5rem] p-7 md:p-8 shadow-2xl">

                      {/* Disease Name + Confidence Gauge */}
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex-1">
                          <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <CheckCircle2 size={10} /> AI DIAGNOSIS VERIFIED
                          </div>
                          <h2 className="text-2xl md:text-3xl font-outfit font-bold text-gray-900 dark:text-white leading-tight">{result.diseaseName}</h2>
                          {scanTime > 0 && (
                            <span className="text-[10px] text-gray-400 mt-1 block">Detected in {scanTime.toFixed(1)} seconds</span>
                          )}
                        </div>
                        <ConfidenceGauge value={result.confidence} />
                      </div>

                      {/* ── Stat Cards Row ──────────────────── */}
                      <div className="grid grid-cols-3 gap-2.5 mb-6">
                        {/* Severity */}
                        <div className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 border ${sev?.bg} ${sev?.border}`}>
                          <SeverityRing severity={result.severity} />
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Severity</span>
                        </div>
                        {/* Disease Type */}
                        <div className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border ${typeMeta?.bg} border-black/5 dark:border-white/5`}>
                          {typeMeta && <typeMeta.icon size={20} className={typeMeta.color} />}
                          <div className="text-center">
                            <div className={`text-xs font-bold ${typeMeta?.color}`}>{result.diseaseType}</div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Type</span>
                          </div>
                        </div>
                        {/* Pathogen */}
                        <div className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border ${pathMeta?.bg} border-black/5 dark:border-white/5`}>
                          {pathMeta && <pathMeta.icon size={20} className={pathMeta.color} />}
                          <div className="text-center">
                            <div className={`text-xs font-bold ${pathMeta?.color}`}>{result.pathogenType}</div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Pathogen</span>
                          </div>
                        </div>
                      </div>

                      {/* ── Symptoms ─────────────────────────── */}
                      <div className="mb-5">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Microscope size={11} /> Symptoms Observed
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{result.symptoms}</p>
                      </div>

                      {/* ── Affected Crops Tags ──────────────── */}
                      {cropTags.length > 0 && (
                        <div className="mb-5">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Sprout size={11} /> Commonly Affected Crops
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {cropTags.map((crop, i) => (
                              <span key={i} className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {crop}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Risk & Impact Cards ─────────────────── */}
                    {riskMetrics && (
                      <div className="grid grid-cols-3 gap-2.5">
                        <div className={`p-4 rounded-2xl border text-center ${
                          riskMetrics.spreadRisk === 'High' ? 'bg-red-500/10 border-red-500/20' :
                          riskMetrics.spreadRisk === 'Medium' ? 'bg-amber-500/10 border-amber-500/20' :
                          'bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                          <TrendingUp size={18} className={`mx-auto mb-1.5 ${
                            riskMetrics.spreadRisk === 'High' ? 'text-red-500' :
                            riskMetrics.spreadRisk === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                          }`} />
                          <div className={`text-sm font-bold ${
                            riskMetrics.spreadRisk === 'High' ? 'text-red-500' :
                            riskMetrics.spreadRisk === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                          }`}>{riskMetrics.spreadRisk}</div>
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Spread Risk</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
                          <TrendingDown size={18} className="text-red-400 mx-auto mb-1.5" />
                          <div className="text-sm font-bold text-red-500">{riskMetrics.cropLoss}</div>
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Est. Crop Loss</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10 text-center">
                          <AlertCircle size={18} className="text-gold mx-auto mb-1.5" />
                          <div className="text-[10px] font-bold text-gold leading-tight">{riskMetrics.urgency}</div>
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-1 block">Action Needed</span>
                        </div>
                      </div>
                    )}

                    {/* ── Treatment Card ─────────────────────── */}
                    <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 dark:from-emerald-500/10 dark:to-emerald-600/5 border border-emerald-500/15 rounded-[2rem] p-6 shadow-lg">
                      <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                        <Shield size={12} /> Recommended Treatment
                      </h4>
                      {treatmentSteps.length > 1 ? (
                        <div className="space-y-3">
                          {treatmentSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{i + 1}</span>
                              </div>
                              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold leading-relaxed">{result.treatment}</p>
                      )}
                    </div>

                    {/* ── Prevention Card ───────────────────── */}
                    <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[2rem] p-6 shadow-lg">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <XCircle size={11} /> Prevention Tips
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{result.prevention}</p>
                    </div>

                    {/* ── Actions ──────────────────────────── */}
                    <div className="flex items-center gap-2 no-print">
                      <button onClick={handleExportPDF} disabled={isExporting} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-charcoal to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-black font-bold text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <><Download size={15} /> EXPORT PDF</>}
                      </button>
                      <button onClick={handleShare} title="Share" className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gold hover:bg-gold/10 transition-all border border-black/5 dark:border-white/10">
                        <Share2 size={16} />
                      </button>
                      <button onClick={handleWhatsApp} title="WhatsApp" className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-emerald-500">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                      <button onClick={reset} title="New Scan" className="p-3.5 rounded-2xl bg-gold/10 hover:bg-gold/20 text-gold transition-all border border-gold/20">
                        <Camera size={16} />
                      </button>
                    </div>

                    {/* ── Comparison View ────────────────────── */}
                    {compareSlot && (
                      <div className="bg-white dark:bg-charcoal border border-gold/20 rounded-[2rem] p-5 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest flex items-center gap-1.5">
                            <Columns2 size={12} /> Comparison
                          </h4>
                          <button onClick={() => setCompareSlot(null)} className="text-[9px] font-bold text-gray-400 hover:text-red-500 transition-colors">CLEAR</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Slot 1 — saved */}
                          <div className="rounded-xl border border-black/5 dark:border-white/5 p-3 bg-gray-50 dark:bg-white/5">
                            <img src={compareSlot.image} className="w-full h-24 object-cover rounded-lg mb-2" alt="Compare 1" />
                            <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{compareSlot.result.diseaseName}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold text-gold">{compareSlot.result.confidence}%</span>
                              <span className={`text-[9px] font-bold ${SEVERITY_CONFIG[compareSlot.result.severity]?.text}`}>{compareSlot.result.severity}</span>
                            </div>
                          </div>
                          {/* Slot 2 — current */}
                          <div className="rounded-xl border border-gold/20 p-3 bg-gold/5">
                            {image && <img src={image} className="w-full h-24 object-cover rounded-lg mb-2" alt="Compare 2" />}
                            <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{result.diseaseName}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold text-gold">{result.confidence}%</span>
                              <span className={`text-[9px] font-bold ${sev?.text}`}>{result.severity}</span>
                            </div>
                          </div>
                        </div>
                        {compareSlot.result.diseaseName === result.diseaseName ? (
                          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-500">
                            <AlertCircle size={12} />
                            <span className="text-[10px] font-bold">Same disease detected in both samples</span>
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <BarChart3 size={12} />
                            <span className="text-[10px] font-bold">Different diseases — may need multiple treatments</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                  )}
                  </div>
                ) : (
                  /* Invalid image */
                  <div className="bg-white dark:bg-charcoal border border-red-500/20 rounded-[3rem] p-10 shadow-2xl flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                      <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white mb-3">Unsuitable Image</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs leading-relaxed">{result.errorMessage}</p>
                    <button onClick={reset} className="px-8 py-3 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-bold text-xs tracking-widest no-print hover:scale-105 transition-all shadow-lg shadow-gold/20">
                      TRY AGAIN
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Awaiting analysis */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[3rem] min-h-[400px] shadow-lg"
              >
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-6">
                  <Sparkles className="text-gold" size={32} />
                </div>
                <h3 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white mb-2">Awaiting Analysis</h3>
                <p className="text-sm text-gray-400 font-inter mb-6">Upload a plant leaf image to begin AI diagnosis</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Leaf Spot', 'Blight', 'Rust', 'Wilt', 'Mildew', 'Rot'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-[9px] font-bold bg-gray-50 dark:bg-white/5 text-gray-400 border border-black/5 dark:border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Hidden PDF Template ──────────────────────────── */}
      {result?.isValidImage && (
        <div
          ref={pdfRef}
          style={{
            position: 'fixed',
            top: 0,
            left: '-9999px',
            width: '794px',
            visibility: 'hidden',
            backgroundColor: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#111827',
          }}
        >
          {/* Header bar */}
          <div style={{ background: 'linear-gradient(135deg,#14532d,#1c1917)', padding: '28px 40px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" style={{ width: 24, height: 24 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.5px' }}>AgriFuture AI Diagnosis</div>
              <div style={{ fontSize: 10, color: '#d4af37', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>Pathogen Detection Report</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>GENERATED</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          <div style={{ padding: '36px 40px' }}>
            <div style={{ display: 'flex', gap: 28, marginBottom: 28, alignItems: 'flex-start' }}>
              {image && (
                <img src={image} alt="Analysed leaf" style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 16, border: '2px solid #e5e7eb', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#10b981', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>AI DIAGNOSIS VERIFIED</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: 6 }}>{result.diseaseName}</div>
                {result.affectedCrops && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>Affects: {result.affectedCrops}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#d4af37' }}>{result.confidence}%</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Confidence</div>
                </div>
                <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${result.confidence}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#10b981,#d4af37)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
              <div style={{ padding: '16px 12px', borderRadius: 12, background: result.severity === 'High' ? '#fef2f2' : result.severity === 'Moderate' ? '#fffbeb' : '#f0fdf4', border: `1px solid ${result.severity === 'High' ? '#fca5a5' : result.severity === 'Moderate' ? '#fcd34d' : '#86efac'}`, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: result.severity === 'High' ? '#dc2626' : result.severity === 'Moderate' ? '#d97706' : '#16a34a', marginBottom: 4 }}>{result.severity}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>Severity</div>
              </div>
              <div style={{ padding: '16px 12px', borderRadius: 12, background: '#eff6ff', border: '1px solid #93c5fd', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb', marginBottom: 4 }}>{result.diseaseType}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>Disease Type</div>
              </div>
              <div style={{ padding: '16px 12px', borderRadius: 12, background: '#faf5ff', border: '1px solid #c4b5fd', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#7c3aed', marginBottom: 4 }}>{result.pathogenType}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>Pathogen</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Symptoms Observed</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', margin: 0 }}>{result.symptoms}</p>
            </div>

            <div style={{ height: 1, background: '#f3f4f6', marginBottom: 20 }} />

            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#16a34a', marginBottom: 8 }}>Recommended Treatment</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#111827', fontWeight: 600, margin: 0 }}>{result.treatment}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Prevention</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', fontStyle: 'italic', margin: 0 }}>{result.prevention}</p>
            </div>

            {result.affectedCrops && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '14px 20px', marginBottom: 28 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#d97706', marginBottom: 6 }}>Commonly Affected Crops</div>
                <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{result.affectedCrops}</div>
              </div>
            )}

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>AgriFuture India</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>AI-powered precision agriculture platform</div>
              </div>
              <div style={{ fontSize: 10, color: '#d1d5db', letterSpacing: '0.1em' }}>Powered by Gemini AI</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
