
import React, { useState, useRef, useCallback } from 'react';
import {
  Camera, X, ShieldAlert, Sparkles, Loader2,
  ArrowLeft, Pill, Bug, Droplets, Share2, Download, AlertTriangle,
  Leaf, Zap, FlaskConical
} from 'lucide-react';
import { detectDiseaseFromImage } from '../services/geminiService';
import { DiseaseDetectionResult } from '../types';
import { useAuth } from '../AuthContext';

interface DiseaseDetectorProps {
  onBack: () => void;
}

const SEVERITY_CONFIG = {
  Low:      { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
  Moderate: { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-500/20',   bar: 'bg-amber-500' },
  High:     { bg: 'bg-red-500/10',     text: 'text-red-600 dark:text-red-500',         border: 'border-red-500/20',     bar: 'bg-red-500' },
};

const PATHOGEN_ICON_MAP: Record<string, React.ReactNode> = {
  Fungal:       <Bug size={18} />,
  Bacterial:    <FlaskConical size={18} />,
  Viral:        <Zap size={18} />,
  Pest:         <Bug size={18} />,
  Nematode:     <Droplets size={18} />,
  Environmental:<Leaf size={18} />,
  Deficiency:   <Pill size={18} />,
};

export const DiseaseDetector: React.FC<DiseaseDetectorProps> = ({ onBack }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [result, setResult] = useState<DiseaseDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

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

  // Drag-and-drop handlers
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

  const processImage = async (base64: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await detectDiseaseFromImage(base64);
      setResult(data);

      // Save to history if logged in and detection succeeded
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
        } catch { /* silent — history save is non-critical */ }
      }
    } catch (e) {
      console.error(e);
      setError('Analysis failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
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

  const sev = result?.severity ? SEVERITY_CONFIG[result.severity] ?? SEVERITY_CONFIG.Low : null;

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 bg-ivory dark:bg-obsidian">
      <div className="max-w-6xl mx-auto p-4 rounded-[3rem]">

        {/* Header */}
        <div className="mb-12">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gold transition-colors mb-4 text-sm font-bold tracking-widest">
            <ArrowLeft size={16} /> DASHBOARD
          </button>
          <h1 className="text-5xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">Disease Intelligence</h1>
          <p className="text-gray-500 mt-2 text-lg italic">Upload or drag-drop a leaf image for instant AI pathogen detection.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left — Image Upload */}
          <div className="space-y-6">
            {!image ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group aspect-square rounded-[3rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer no-print shadow-xl
                  ${isDragging
                    ? 'border-gold bg-gold/5 scale-[1.01]'
                    : 'border-black/10 dark:border-white/10 bg-white dark:bg-charcoal hover:border-gold/50'
                  }`}
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-colors ${isDragging ? 'bg-gold/20' : 'bg-gold/10 group-hover:bg-gold/20'}`}>
                  <Camera className="text-gold w-10 h-10" />
                </div>
                <h3 className="text-xl font-outfit font-bold text-gray-900 dark:text-white">
                  {isDragging ? 'Drop it here!' : 'Snap or Upload'}
                </h3>
                <p className="text-sm text-gray-400 mt-2 font-inter">
                  {isDragging ? '' : 'Drag & drop or click to browse'}
                </p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">JPG · PNG · WEBP</p>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" capture="environment" />
              </div>
            ) : (
              <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-black/5 shadow-2xl group">
                <img src={image} className="w-full h-full object-cover" alt="Leaf input" />
                {loading && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center no-print gap-4">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 border-2 border-gold/30 rounded-full animate-ping" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="text-gold animate-spin" size={32} />
                      </div>
                    </div>
                    <p className="text-white font-jakarta text-xs font-bold tracking-[0.3em] uppercase">Analysing Pathogen...</p>
                  </div>
                )}
                {!loading && (
                  <button onClick={reset} className="absolute top-6 right-6 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white no-print transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Inline error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Right — Results */}
          <div className="space-y-8">
            {result ? (
              <div className="animate-in fade-in slide-in-from-right-10 duration-700">
                {result.isValidImage ? (
                  <div className="bg-white dark:bg-charcoal border border-black/5 dark:border-white/10 rounded-[3rem] p-10 shadow-2xl">

                    {/* Title + Confidence */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="text-[10px] font-jakarta font-bold text-emerald-500 uppercase mb-1 tracking-widest">AI_DIAGNOSIS_VERIFIED</div>
                        <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white leading-tight">{result.diseaseName}</h2>
                        {result.affectedCrops && (
                          <p className="text-xs text-gray-400 mt-1 font-inter">Affects: {result.affectedCrops}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-3xl font-outfit font-bold text-gold">{result.confidence}%</div>
                        <div className="text-[10px] font-jakarta font-bold text-gray-400 uppercase">Confidence</div>
                      </div>
                    </div>

                    {/* Confidence Bar */}
                    <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-2 mb-8 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-gold transition-all duration-1000"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>

                    {/* Severity + Type + Pathogen */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                      <div className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border ${sev?.bg} ${sev?.border}`}>
                        <ShieldAlert size={18} className={sev?.text} />
                        <span className={`text-[10px] font-bold uppercase text-center ${sev?.text}`}>
                          {result.severity}<br/>Severity
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex flex-col items-center justify-center gap-2">
                        <Leaf size={18} />
                        <span className="text-[10px] font-bold uppercase text-center">{result.diseaseType || 'Biotic'}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex flex-col items-center justify-center gap-2">
                        {PATHOGEN_ICON_MAP[result.pathogenType] ?? <Bug size={18} />}
                        <span className="text-[10px] font-bold uppercase text-center">{result.pathogenType || 'Fungal'}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Symptoms Observed</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{result.symptoms}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2 tracking-wider">Recommended Treatment</h4>
                        <p className="text-sm text-gray-900 dark:text-white font-semibold leading-relaxed">{result.treatment}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Prevention</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">{result.prevention}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-10 flex items-center gap-3 no-print">
                      <button onClick={handleExportPDF} disabled={isExporting} className="flex-grow py-4 rounded-xl bg-charcoal dark:bg-white text-white dark:text-black font-bold tracking-widest shadow-xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50">
                        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <><Download size={18} /> EXPORT PDF</>}
                      </button>
                      <button onClick={handleShare} title="Share Report" className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gold transition-colors">
                        <Share2 size={20} />
                      </button>
                      <button onClick={handleWhatsApp} title="Share on WhatsApp" className="p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-500">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-charcoal border border-red-500/20 rounded-[3rem] p-10 shadow-2xl flex flex-col items-center text-center">
                    <AlertTriangle size={40} className="text-red-500 mb-6" />
                    <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white mb-3">Unsuitable Image</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs leading-relaxed">{result.errorMessage}</p>
                    <button onClick={reset} className="px-8 py-3 rounded-xl bg-charcoal dark:bg-white text-white dark:text-black font-bold no-print hover:opacity-90 transition-opacity">TRY AGAIN</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-black/5 dark:bg-white/5 rounded-[3rem] min-h-[400px]">
                <Sparkles className="text-gray-300 dark:text-gray-600 mb-6" size={36} />
                <h3 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white mb-2">Awaiting Analysis</h3>
                <p className="text-sm text-gray-400 font-inter">Upload a plant leaf image to begin AI diagnosis</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Hidden PDF Template (captured by html2pdf, invisible to user) ─────── */}
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
            {/* Image + Disease name row */}
            <div style={{ display: 'flex', gap: 28, marginBottom: 28, alignItems: 'flex-start' }}>
              {image && (
                <img
                  src={image}
                  alt="Analysed leaf"
                  style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 16, border: '2px solid #e5e7eb', flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#10b981', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>AI DIAGNOSIS VERIFIED</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: 6 }}>{result.diseaseName}</div>
                {result.affectedCrops && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>Affects: {result.affectedCrops}</div>
                )}
                {/* Confidence */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#d4af37' }}>{result.confidence}%</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Confidence</div>
                </div>
                <div style={{ width: '100%', height: 8, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${result.confidence}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#10b981,#d4af37)' }} />
                </div>
              </div>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
              {/* Severity */}
              <div style={{ padding: '16px 12px', borderRadius: 12, background: result.severity === 'High' ? '#fef2f2' : result.severity === 'Moderate' ? '#fffbeb' : '#f0fdf4', border: `1px solid ${result.severity === 'High' ? '#fca5a5' : result.severity === 'Moderate' ? '#fcd34d' : '#86efac'}`, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: result.severity === 'High' ? '#dc2626' : result.severity === 'Moderate' ? '#d97706' : '#16a34a', marginBottom: 4 }}>{result.severity}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>Severity</div>
              </div>
              {/* Disease type */}
              <div style={{ padding: '16px 12px', borderRadius: 12, background: '#eff6ff', border: '1px solid #93c5fd', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb', marginBottom: 4 }}>{result.diseaseType}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>Disease Type</div>
              </div>
              {/* Pathogen type */}
              <div style={{ padding: '16px 12px', borderRadius: 12, background: '#faf5ff', border: '1px solid #c4b5fd', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#7c3aed', marginBottom: 4 }}>{result.pathogenType}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>Pathogen</div>
              </div>
            </div>

            {/* Symptoms */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Symptoms Observed</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', margin: 0 }}>{result.symptoms}</p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#f3f4f6', marginBottom: 20 }} />

            {/* Treatment */}
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#16a34a', marginBottom: 8 }}>Recommended Treatment</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#111827', fontWeight: 600, margin: 0 }}>{result.treatment}</p>
            </div>

            {/* Prevention */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Prevention</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', fontStyle: 'italic', margin: 0 }}>{result.prevention}</p>
            </div>

            {/* Affected crops */}
            {result.affectedCrops && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '14px 20px', marginBottom: 28 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#d97706', marginBottom: 6 }}>Commonly Affected Crops</div>
                <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{result.affectedCrops}</div>
              </div>
            )}

            {/* Footer */}
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
